if (typeof importScripts !== 'undefined') {
    try { importScripts('jszip.min.js'); } catch (e) { console.log('JSZip not found, ZIP mode may fail.'); }
}

const MAX_NAME_LENGTH = 110;
const PLACEHOLDER_TITLE = 'Gallery_no_title';

const generateBase36Hash = () => Math.random().toString(36).substring(2, 10);
const cleanName = (str) => str.replace(/[<>:"/\\|?*]/g, '-').trim();
const cleanPath = (str) => str.replace(/[<>:"|?*]/g, '-').trim();

const formatDateFromDate = (d, format, sep) => {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    const yy = yyyy.toString().slice(-2);

    if (format === 'dd-mm-yyyy' || format === 'uk') return `${dd}${sep}${mm}${sep}${yyyy}`;
    if (format === 'dd-mm-yy') return `${dd}${sep}${mm}${sep}${yy}`;
    if (format === 'mm-dd-yyyy' || format === 'us') return `${mm}${sep}${dd}${sep}${yyyy}`;
    if (format === 'mm-dd-yy') return `${mm}${sep}${dd}${sep}${yy}`;
    return `${yyyy}${sep}${mm}${sep}${dd}`;
};

const formatTimeFromDate = (d, format, sep) => {
    let hh = d.getHours();
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');

    if (format === '12h') {
        const ampm = hh >= 12 ? 'PM' : 'AM';
        hh = hh % 12 || 12;
        return `${String(hh).padStart(2, '0')}${sep}${mm}${sep}${ss}_${ampm}`;
    }
    return `${String(hh).padStart(2, '0')}${sep}${mm}${sep}${ss}`;
};

const formatIndex = (index, format) => {
    const padded = String(index).padStart(2, '0');
    if (format === 'parentheses') return `(${padded})`;
    if (format === 'brackets') return `[${padded}]`;
    return padded;
};

const generateUniqueId = (format) => {
    if (format === 'numeric') return Math.floor(100000 + Math.random() * 900000).toString();
    return Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};

const applyTitleCase = (str, format) => {
    if (!str) return str;
    if (format === 'lower')    return str.toLowerCase();
    if (format === 'upper')    return str.toUpperCase();
    if (format === 'title')    return str.split(/(\s+)/).map(t => /\s/.test(t) ? t : (t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())).join('');
    if (format === 'sentence') return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    return str;
};

const buildNameString = (pills, data, sepChar, missingTitleRule, customPlaceholder) => {
    if (!pills || pills.length === 0) return data.fallbackHash;

    const effectivePlaceholder = (customPlaceholder && customPlaceholder.trim()) || PLACEHOLDER_TITLE;

    const effectivePills = pills.filter(pill => {
        if (pill.type === 'title' && (!data.title || data.title === '') && missingTitleRule === 'omit') {
            return false;
        }
        return true;
    });

    if (effectivePills.length === 0) return data.fallbackHash;

    let result = '';
    let prevWasUserText = false;
    let isFirstEmitted = true;

    effectivePills.forEach((pill) => {
        const isUserText = (pill.type === 'user_text');

        let value = '';
        if (isUserText) value = pill.generatedText || '';
        else if (pill.type === 'title') value = data.title || (missingTitleRule === 'placeholder' ? effectivePlaceholder : '');
        else if (pill.type === 'index') value = data.index;
        else if (pill.type === 'subreddit') value = data.subreddit;
        else if (pill.type === 'author') value = data.author;
        else if (pill.type === 'upload_date') value = data.uploadDate;
        else if (pill.type === 'dl_date') value = data.dlDate;
        else if (pill.type === 'time') value = data.time;
        else if (pill.type === 'unique_id') value = data.uniqueId;

        if (value === '' || value === undefined || value === null) return;

        if (!isFirstEmitted) {
            if (!isUserText && !prevWasUserText) {
                result += sepChar;
            }
        }
        result += value;
        prevWasUserText = isUserText;
        isFirstEmitted = false;
    });

    let finalStr = cleanName(result) || data.fallbackHash;
    return finalStr.substring(0, MAX_NAME_LENGTH).trim();
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchAndDownload") {
        executeGalleryDownload(request.url, request.title, sendResponse);
        return true;
    }
});

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({ url: 'welcome.html' });
    } else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        console.log("Extension Updated!");
    }
});

async function executeGalleryDownload(redditUrl, cleanPromptTitle, sendResponse) {
    try {
        const response = await fetch(redditUrl + '.json');
        const json = await response.json();
        const post = json[0].data.children[0].data;

        let imageUrls = [];
        if (post.is_gallery && post.media_metadata) {
            const galleryItems = post.gallery_data.items;
            for (let item of galleryItems) {
                let media = post.media_metadata[item.media_id];
                if (media && media.s && media.s.u) {
                    imageUrls.push(media.s.u.replace(/&amp;/g, '&'));
                }
            }
        } else if (post.url && post.url.match(/\.(jpeg|jpg|png|gif)$/i)) {
            imageUrls.push(post.url.replace(/&amp;/g, '&'));
        }

        if (imageUrls.length === 0) {
            sendResponse({ success: false, count: 0 });
            return;
        }

        chrome.storage.sync.get(['globalPrefs', 'modeState', 'downloadMode', 'preferredFolder'], async (storage) => {
            const prefs = storage.globalPrefs || {};
            const modeState = storage.modeState || {};

            const activeMode = storage.downloadMode || prefs.activeMode || 'folder';
            const baseFolder = storage.preferredFolder ? cleanPath(storage.preferredFolder) : 'reddit_downloads';

            const getSep = (val) => val === 'dash' ? '-' : val === 'space' ? ' ' : val === 'none' ? '' : '_';
            const folderSep = getSep(prefs.folderSeparatorFormat || prefs.separatorFormat || 'space');
            const fileSep = getSep(prefs.fileSeparatorFormat || prefs.separatorFormat || 'space');

            // Title-space behavior: 'default' inherits the active separator; otherwise an explicit char.
            const resolveTitleSep = (val, fallback) => {
                if (!val || val === 'default') return fallback;
                if (val === 'keep') return ' ';
                return getSep(val);
            };
            const titleSepFolder = resolveTitleSep(prefs.titleSpaceFormat, folderSep);
            const titleSepFile = resolveTitleSep(prefs.titleSpaceFormat, fileSep);

            const getDateSep = (val) => {
                if (val === 'underscore') return '_';
                if (val === 'space') return ' ';
                if (val === 'dot') return '.';
                if (val === 'none') return '';
                return '-';
            };
            const dateSep = getDateSep(prefs.dateSeparatorFormat || 'dash');

            const indexFormat = prefs.indexFormat || 'standard';
            const uniqueId = generateUniqueId(prefs.idFormat || 'hex');
            const fallbackHash = generateBase36Hash();

            const dateFormat = prefs.dateFormat || 'yyyy-mm-dd';
            const timeFormat = prefs.timeFormat || '24h';
            const titleCaseFormat = prefs.titleCaseFormat || 'original';

            const now = new Date();
            const uploadDateObj = post.created_utc ? new Date(post.created_utc * 1000) : now;

            const cleanTitle = applyTitleCase(cleanPromptTitle || '', titleCaseFormat);

            const buildData = (sep, titleSep) => ({
                title: cleanTitle ? cleanTitle.split(/\s+/).join(titleSep) : '',
                subreddit: cleanName(post.subreddit || 'unknown_sub').split(/\s+/).join(sep),
                author: cleanName(post.author || 'unknown_user').split(/\s+/).join(sep),
                uploadDate: formatDateFromDate(uploadDateObj, dateFormat, dateSep),
                dlDate: formatDateFromDate(now, dateFormat, dateSep),
                time: formatTimeFromDate(now, timeFormat, sep),
                uniqueId: uniqueId,
                fallbackHash: fallbackHash
            });

            const folderData = buildData(folderSep, titleSepFolder);
            const fileData = buildData(fileSep, titleSepFile);

            let count = 0;
            try {
                if (activeMode === 'zip') {
                    count = await downloadAsZip(imageUrls, folderData, fileData, modeState.zip, folderSep, fileSep, indexFormat, baseFolder);
                } else if (activeMode === 'individual') {
                    count = await downloadAsIndividual(imageUrls, fileData, modeState.individual, fileSep, indexFormat, baseFolder);
                } else {
                    count = await downloadAsFolder(imageUrls, folderData, fileData, modeState.folder, folderSep, fileSep, indexFormat, baseFolder);
                }
                sendResponse({ success: count > 0, count: count, total: imageUrls.length });
            } catch (err) {
                console.error("Download orchestration failed:", err);
                sendResponse({ success: false, count: 0, total: imageUrls.length });
            }
        });

    } catch (error) {
        console.error("Reddit Downloader Error:", error);
        sendResponse({ success: false, count: 0 });
    }
}

const startDownload = (options) => new Promise((resolve) => {
    try {
        chrome.downloads.download(options, (downloadId) => {
            if (chrome.runtime.lastError || !downloadId) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    } catch (e) {
        resolve(false);
    }
});

const shouldAddTrailingIndex = (totalUrls, hasIndex, singleFileRule) => {
    if (hasIndex) return false;
    if (totalUrls > 1) return true;
    return singleFileRule === 'always';
};

async function downloadAsFolder(urls, folderData, fileData, folderSettings, folderSep, fileSep, indexFormat, baseFolder) {
    const folderPills = folderSettings?.folder || [{ type: 'subreddit' }];
    const imagePills = folderSettings?.image || [{ type: 'title' }, { type: 'index' }];
    const missingTitleRule = folderSettings?.fallbacks?.missingTitle || 'placeholder';
    const customPlaceholder = folderSettings?.fallbacks?.placeholderText || '';
    const singleFileRule = folderSettings?.fallbacks?.singleFileIndex || 'never';

    const folderName = buildNameString(folderPills, folderData, folderSep, missingTitleRule, customPlaceholder);
    const hasIndex = imagePills.some(pill => pill.type === 'index');
    const addTrailing = shouldAddTrailingIndex(urls.length, hasIndex, singleFileRule);

    let success = 0;
    for (let i = 0; i < urls.length; i++) {
        const indexStr = formatIndex(i + 1, indexFormat);
        let currentFileData = { ...fileData, index: indexStr };
        let fileName = buildNameString(imagePills, currentFileData, fileSep, missingTitleRule, customPlaceholder);

        if (addTrailing) fileName += `${fileSep}${indexStr}`;

        let ext = urls[i].split('?')[0].split('.').pop() || 'jpg';
        let fullPath = `${baseFolder}/${folderName}/${fileName}.${ext}`;

        const ok = await startDownload({ url: urls[i], filename: fullPath, conflictAction: 'uniquify', saveAs: false });
        if (ok) success++;
    }
    return success;
}

async function downloadAsIndividual(urls, fileData, indSettings, fileSep, indexFormat, baseFolder) {
    const formulaPills = indSettings?.formula || [{ type: 'title' }, { type: 'index' }];
    const missingTitleRule = indSettings?.fallbacks?.missingTitle || 'placeholder';
    const customPlaceholder = indSettings?.fallbacks?.placeholderText || '';
    const singleFileRule = indSettings?.fallbacks?.singleFileIndex || 'never';

    const hasIndex = formulaPills.some(pill => pill.type === 'index');
    const addTrailing = shouldAddTrailingIndex(urls.length, hasIndex, singleFileRule);

    let success = 0;
    for (let i = 0; i < urls.length; i++) {
        const indexStr = formatIndex(i + 1, indexFormat);
        let currentFileData = { ...fileData, index: indexStr };
        let fileName = buildNameString(formulaPills, currentFileData, fileSep, missingTitleRule, customPlaceholder);

        if (addTrailing) fileName += `${fileSep}${indexStr}`;

        let ext = urls[i].split('?')[0].split('.').pop() || 'jpg';
        let fullPath = `${baseFolder}/${fileName}.${ext}`;

        const ok = await startDownload({ url: urls[i], filename: fullPath, conflictAction: 'uniquify', saveAs: false });
        if (ok) success++;
    }
    return success;
}

async function downloadAsZip(urls, folderData, fileData, zipSettings, folderSep, fileSep, indexFormat, baseFolder) {
    if (typeof JSZip === 'undefined') {
        console.error("JSZip is required for ZIP mode but is not loaded.");
        return 0;
    }

    const archivePills = zipSettings?.archive || [{ type: 'title' }];
    const imagePills = zipSettings?.image || [{ type: 'index' }];
    const missingTitleRule = zipSettings?.fallbacks?.missingTitle || 'placeholder';
    const customPlaceholder = zipSettings?.fallbacks?.placeholderText || '';
    const singleFileRule = zipSettings?.fallbacks?.singleFileIndex || 'never';

    const zipName = buildNameString(archivePills, folderData, folderSep, missingTitleRule, customPlaceholder);
    const zip = new JSZip();
    const hasIndex = imagePills.some(pill => pill.type === 'index');
    const addTrailing = shouldAddTrailingIndex(urls.length, hasIndex, singleFileRule);

    let added = 0;
    for (let i = 0; i < urls.length; i++) {
        try {
            let res = await fetch(urls[i]);
            let blob = await res.blob();

            const indexStr = formatIndex(i + 1, indexFormat);
            let currentFileData = { ...fileData, index: indexStr };
            let fileName = buildNameString(imagePills, currentFileData, fileSep, missingTitleRule, customPlaceholder);

            if (addTrailing) fileName += `${fileSep}${indexStr}`;

            let ext = urls[i].split('?')[0].split('.').pop() || 'jpg';
            zip.file(`${fileName}.${ext}`, blob);
            added++;
        } catch (err) {
            console.error("Failed to fetch image for ZIP:", urls[i]);
        }
    }

    if (added === 0) return 0;

    const zipBlob = await zip.generateAsync({ type: "blob" });
    // Service workers can't use URL.createObjectURL — fall back to data URL.
    const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(zipBlob);
    });

    const ok = await startDownload({
        url: dataUrl,
        filename: `${baseFolder}/${zipName}.zip`,
        conflictAction: 'uniquify',
        saveAs: false
    });
    return ok ? added : 0;
}
