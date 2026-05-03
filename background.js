if (typeof importScripts !== 'undefined') {
    try { importScripts('jszip.min.js'); } catch (e) { console.log('JSZip not found, ZIP mode may fail.'); }
}

const generateBase36Hash = () => Math.random().toString(36).substring(2, 10);
const cleanName = (str) => str.replace(/[<>:"/\\|?*]/g, '-').trim();
const cleanPath = (str) => str.replace(/[<>:"|?*]/g, '-').trim(); 

const formatDate = (format, sep) => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    const yy = yyyy.toString().slice(-2);
    
    if (format === 'dd-mm-yyyy') return `${dd}${sep}${mm}${sep}${yyyy}`;
    if (format === 'dd-mm-yy') return `${dd}${sep}${mm}${sep}${yy}`;
    if (format === 'mm-dd-yyyy') return `${mm}${sep}${dd}${sep}${yyyy}`;
    if (format === 'mm-dd-yy') return `${mm}${sep}${dd}${sep}${yy}`;
    
    if (format === 'us') return `${mm}${sep}${dd}${sep}${yyyy}`;
    if (format === 'uk') return `${dd}${sep}${mm}${sep}${yyyy}`;
    
    return `${yyyy}${sep}${mm}${sep}${dd}`; 
};

const formatTime = (format, sep) => {
    const d = new Date();
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

// FIX: Added a final, absolute hard cap of 110 characters to the builder.
// This ensures that even if you have a massive title + huge custom pills, it will never exceed Windows path limits.
const buildNameString = (pills, data, sepChar) => {
    if (!pills || pills.length === 0) return data.fallbackHash;

    let result = '';
    let prevWasUserText = false;

    pills.forEach((pill, idx) => {
        const isUserText = (pill.type === 'user_text');

        if (idx > 0) {
            if (!isUserText && !prevWasUserText) {
                result += sepChar;
            }
        }

        if (isUserText) result += pill.generatedText || '';
        else if (pill.type === 'title') result += data.title; 
        else if (pill.type === 'index') result += data.index;
        else if (pill.type === 'subreddit') result += data.subreddit;
        else if (pill.type === 'author') result += data.author;
        else if (pill.type === 'upload_date' || pill.type === 'dl_date') result += data.date;
        else if (pill.type === 'time') result += data.time;
        else if (pill.type === 'unique_id') result += data.uniqueId;

        prevWasUserText = isUserText;
    });

    let finalStr = cleanName(result) || data.fallbackHash;
    return finalStr.substring(0, 110).trim();
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

            const folderData = {
                title: cleanPromptTitle.split(/\s+/).join(folderSep),
                subreddit: cleanName(post.subreddit || 'unknown_sub').split(/\s+/).join(folderSep),
                author: cleanName(post.author || 'unknown_user').split(/\s+/).join(folderSep),
                date: formatDate(prefs.dateFormat || 'yyyy-mm-dd', dateSep),
                time: formatTime(prefs.timeFormat || '24h', folderSep),
                uniqueId: uniqueId,
                fallbackHash: fallbackHash
            };

            const fileData = {
                title: cleanPromptTitle.split(/\s+/).join(fileSep),
                subreddit: cleanName(post.subreddit || 'unknown_sub').split(/\s+/).join(fileSep),
                author: cleanName(post.author || 'unknown_user').split(/\s+/).join(fileSep),
                date: formatDate(prefs.dateFormat || 'yyyy-mm-dd', dateSep),
                time: formatTime(prefs.timeFormat || '24h', fileSep),
                uniqueId: uniqueId,
                fallbackHash: fallbackHash
            };

            if (activeMode === 'zip') {
                await downloadAsZip(imageUrls, folderData, fileData, modeState.zip, folderSep, fileSep, indexFormat, baseFolder);
            } else if (activeMode === 'individual') {
                await downloadAsIndividual(imageUrls, fileData, modeState.individual, fileSep, indexFormat, baseFolder);
            } else {
                await downloadAsFolder(imageUrls, folderData, fileData, modeState.folder, folderSep, fileSep, indexFormat, baseFolder);
            }

            sendResponse({ success: true, count: imageUrls.length });
        });

    } catch (error) {
        console.error("Reddit Downloader Error:", error);
        sendResponse({ success: false, count: 0 });
    }
}

async function downloadAsFolder(urls, folderData, fileData, folderSettings, folderSep, fileSep, indexFormat, baseFolder) {
    const folderPills = folderSettings?.folder || [{type: 'subreddit'}];
    const imagePills = folderSettings?.image || [{type: 'title'}, {type: 'index'}];

    const folderName = buildNameString(folderPills, folderData, folderSep);
    const hasIndex = imagePills.some(pill => pill.type === 'index');

    for (let i = 0; i < urls.length; i++) {
        let currentFileData = { ...fileData, index: formatIndex(i + 1, indexFormat) };
        let fileName = buildNameString(imagePills, currentFileData, fileSep);
        
        if (urls.length > 1 && !hasIndex) {
            fileName += `${fileSep}${currentFileData.index}`;
        }
        
        let ext = urls[i].split('?')[0].split('.').pop() || 'jpg';
        let fullPath = `${baseFolder}/${folderName}/${fileName}.${ext}`;

        chrome.downloads.download({
            url: urls[i],
            filename: fullPath,
            conflictAction: 'uniquify',
            saveAs: false
        });
    }
}

async function downloadAsIndividual(urls, fileData, indSettings, fileSep, indexFormat, baseFolder) {
    const formulaPills = indSettings?.formula || [{type: 'title'}, {type: 'index'}];
    const hasIndex = formulaPills.some(pill => pill.type === 'index');

    for (let i = 0; i < urls.length; i++) {
        let currentFileData = { ...fileData, index: formatIndex(i + 1, indexFormat) };
        let fileName = buildNameString(formulaPills, currentFileData, fileSep);
        
        if (urls.length > 1 && !hasIndex) {
            fileName += `${fileSep}${currentFileData.index}`;
        }
        
        let ext = urls[i].split('?')[0].split('.').pop() || 'jpg';
        let fullPath = `${baseFolder}/${fileName}.${ext}`;

        chrome.downloads.download({
            url: urls[i],
            filename: fullPath,
            conflictAction: 'uniquify',
            saveAs: false
        });
    }
}

async function downloadAsZip(urls, folderData, fileData, zipSettings, folderSep, fileSep, indexFormat, baseFolder) {
    if (typeof JSZip === 'undefined') {
        console.error("JSZip is required for ZIP mode but is not loaded.");
        return; 
    }

    const archivePills = zipSettings?.archive || [{type: 'title'}];
    const imagePills = zipSettings?.image || [{type: 'index'}];

    const zipName = buildNameString(archivePills, folderData, folderSep);
    const zip = new JSZip();

    const hasIndex = imagePills.some(pill => pill.type === 'index');

    for (let i = 0; i < urls.length; i++) {
        try {
            let res = await fetch(urls[i]);
            let blob = await res.blob();
            
            let currentFileData = { ...fileData, index: formatIndex(i + 1, indexFormat) };
            let fileName = buildNameString(imagePills, currentFileData, fileSep);
            
            if (urls.length > 1 && !hasIndex) {
                fileName += `${fileSep}${currentFileData.index}`;
            }
            
            let ext = urls[i].split('?')[0].split('.').pop() || 'jpg';

            zip.file(`${fileName}.${ext}`, blob);
        } catch (err) {
            console.error("Failed to fetch image for ZIP:", urls[i]);
        }
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const reader = new FileReader();
    
    reader.onload = function() {
        chrome.downloads.download({
            url: reader.result, 
            filename: `${baseFolder}/${zipName}.zip`,
            conflictAction: 'uniquify',
            saveAs: false
        });
    };
    reader.readAsDataURL(zipBlob);
}