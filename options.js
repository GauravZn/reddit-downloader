document.addEventListener('DOMContentLoaded', () => {
    const toolbox = document.getElementById('toolbox');
    const dropzones = {
        folder: { folder: document.getElementById('dropzone-folder-folder'), image: document.getElementById('dropzone-folder-image') },
        zip: { archive: document.getElementById('dropzone-zip-archive'), image: document.getElementById('dropzone-zip-image') },
        individual: document.getElementById('dropzone-individual')
    };

    const saveBtn = document.getElementById('save-configuration-btn');
    const addStaticTextBtn = document.getElementById('add-static-text-btn');
    const toast = document.getElementById('toast');

    const tabLinks = document.querySelectorAll('.tab-link');
    const panels = document.querySelectorAll('.panel');

    // Mode-specific explainer that sits above the Filename Elements toolbar.
    // Each string describes what background.js's matching download function
    // actually does, including the on-disk path. If you change a download
    // function, update the description here too.
    const MODE_DESCRIPTIONS = {
        folder: 'Wraps every gallery in its own sub-folder under your base downloads folder. The sub-folder is named using the <strong>Folder Naming Formula</strong>; each image inside follows the <strong>Image Filename Formula</strong>. Files land at <code>downloads/[base]/[your folder name]/[your image name].jpg</code>. Best when you want one folder per gallery — easy to find, easy to delete as a unit.',
        zip: 'Packs every image in the gallery into a single <code>.zip</code> archive that lands in your base downloads folder. The archive is named using the <strong>ZIP Archive Naming Formula</strong>; image filenames inside the ZIP follow the <strong>Image Filename Formula</strong>. Files land at <code>downloads/[base]/[your archive name].zip</code>. Best when you want to share a whole gallery as one file — Discord, email, cloud drives.',
        individual: 'Drops every image straight into your base downloads folder — no sub-folder, no archive. Each image is named using the <strong>Image Filename Formula</strong>. Files land at <code>downloads/[base]/[your image name].jpg</code>. Best when you have your own folder organization in mind and just want the bytes.'
    };
    const modeDescriptionEl = document.getElementById('mode-description');
    function setModeDescription(mode) {
        modeDescriptionEl.innerHTML = MODE_DESCRIPTIONS[mode] || '';
    }

    const folderSeparatorSelect = document.getElementById('folder-separator-select');
    const fileSeparatorSelect = document.getElementById('file-separator-select');
    const titleSpaceSelect = document.getElementById('title-space-select');
    const titleCaseSelect = document.getElementById('title-case-select');
    const indexFormatSelect = document.getElementById('index-format-select');
    const dateFormatSelect = document.getElementById('date-format-select');
    const dateSeparatorSelect = document.getElementById('date-separator-select');
    const timeFormatSelect = document.getElementById('time-format-select');
    const idFormatSelect = document.getElementById('id-format-select');
    const promptTitleToggle = document.getElementById('prompt-title-toggle');
    const keyboardShortcutToggle = document.getElementById('keyboard-shortcut-toggle');

    const fallbacks = {
        folder: {
            truncate: document.getElementById('truncate-rule-folder'),
            missingTitle: document.getElementById('missing-title-rule-folder'),
            placeholderText: document.getElementById('placeholder-text-folder'),
            singleFileIndex: document.getElementById('single-file-index-folder')
        },
        zip: {
            truncate: document.getElementById('truncate-rule-zip'),
            missingTitle: document.getElementById('missing-title-rule-zip'),
            placeholderText: document.getElementById('placeholder-text-zip'),
            singleFileIndex: document.getElementById('single-file-index-zip')
        },
        individual: {
            truncate: document.getElementById('truncate-rule-individual'),
            missingTitle: document.getElementById('missing-title-rule-individual'),
            placeholderText: document.getElementById('placeholder-text-individual'),
            singleFileIndex: document.getElementById('single-file-index-individual')
        }
    };

    function syncPlaceholderVisibility(group) {
        const hide = group.missingTitle.value !== 'placeholder';
        group.placeholderText.closest('.rule-group').classList.toggle('placeholder-hidden', hide);
    }
    Object.values(fallbacks).forEach(group => {
        group.missingTitle.addEventListener('change', () => syncPlaceholderVisibility(group));
    });

    let uniqueStaticTextId = 0;
    let toastTimeout;
    let currentBaseFolder = 'reddit_downloads';

    const emptyFallbackHash = Math.random().toString(36).substring(2, 10);

    function showToast(message, variant) {
        const textEl = toast.querySelector('.toast-text') || toast;
        textEl.textContent = message;
        toast.classList.remove('success');
        if (variant === 'success') toast.classList.add('success');
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        const dur = variant === 'success' ? 2400 : 4000;
        toastTimeout = setTimeout(() => { toast.classList.remove('show'); }, dur);
    }

    new Sortable(toolbox, { group: { name: 'shared', pull: 'clone', put: false }, animation: 150, sort: false });

    const makeSortable = (el) => {
        new Sortable(el, { group: 'shared', animation: 150, onAdd: updatePreview, onUpdate: updatePreview, onRemove: updatePreview });
    };

    makeSortable(dropzones.folder.folder);
    makeSortable(dropzones.folder.image);
    makeSortable(dropzones.zip.archive);
    makeSortable(dropzones.zip.image);
    makeSortable(dropzones.individual);

    addStaticTextBtn.addEventListener('click', () => {
        addStaticTextBtn.style.display = 'none';

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'pill user-typed-text';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'pill-input';
        input.placeholder = 'Type...';
        input.style.width = '8ch';

        inputWrapper.appendChild(input);
        toolbox.insertBefore(inputWrapper, addStaticTextBtn);

        input.focus();

        const updateWidth = () => { input.style.width = Math.max(input.value.length + 1, 8) + 'ch'; };
        input.addEventListener('input', updateWidth);

        let saved = false;
        const finalizePill = () => {
            if (saved) return;
            saved = true;

            let rawText = input.value;
            if (rawText === "") {
                inputWrapper.remove();
                addStaticTextBtn.style.display = 'block';
                return;
            }

            let sanitizedText = rawText.replace(/[<>:"/\\|?*]/g, '-');
            if (rawText !== sanitizedText) showToast("Special characters were replaced with '-'");

            inputWrapper.innerHTML = `<span style="white-space: pre;">${sanitizedText.replace(/ /g, '&nbsp;')}</span>`;
            inputWrapper.setAttribute('data-type', 'user_text');
            inputWrapper.setAttribute('data-generated-text', sanitizedText);
            inputWrapper.setAttribute('data-static-text-id', `static-text-${uniqueStaticTextId++}`);

            makePillDeletable(inputWrapper);

            addStaticTextBtn.style.display = 'block';
            updatePreview();
        };

        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') finalizePill(); });
        input.addEventListener('blur', finalizePill);
    });

    const makePillDeletable = (pillEl) => {
        pillEl.title = "Double-click to delete";
        pillEl.addEventListener('dblclick', (e) => {
            if (pillEl.parentElement === toolbox) {
                pillEl.remove();
                updatePreview();
            }
        });
    };

    const activeZoneList = [dropzones.folder.folder, dropzones.folder.image, dropzones.zip.archive, dropzones.zip.image, dropzones.individual];
    activeZoneList.forEach(zone => {
        zone.addEventListener('dblclick', (e) => {
            if (e.target.classList.contains('pill') && e.target.parentElement === zone) {
                e.target.remove();
                updatePreview();
            }
        });
    });

    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const mode = e.target.getAttribute('data-mode');
            tabLinks.forEach(l => l.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            e.target.classList.add('active');
            document.getElementById(`panel-${mode}`).classList.add('active');
            setModeDescription(mode);
            updatePreview();
        });
    });

    [folderSeparatorSelect, fileSeparatorSelect, titleSpaceSelect, titleCaseSelect, indexFormatSelect, dateFormatSelect, dateSeparatorSelect, timeFormatSelect, idFormatSelect].forEach(select => {
        select.addEventListener('change', updatePreview);
    });

    // Mock-post carousel — slides between the peacock images. Pure CSS transform
    // on the track for the transition. Linear (no wrap-around): the prev arrow
    // hides at the first slide, the next arrow hides at the last.
    (function setupGalleryCarousel() {
        const track = document.getElementById('gallery-track');
        const counter = document.getElementById('gallery-counter');
        const prev = document.querySelector('.gallery-prev');
        const next = document.querySelector('.gallery-next');
        if (!track || !prev || !next) return;

        // Slides 2 and 3 reference peacock2.jpg / peacock3.jpg, which the user
        // may not have saved yet. Inline onerror="" attributes get blocked by
        // the extension's CSP, so we wire the fallback up here. Each slide
        // tries its data-fallback once, then gives up to avoid a loop.
        track.querySelectorAll('.gallery-img').forEach(img => {
            img.addEventListener('error', function once() {
                img.removeEventListener('error', once);
                const fallback = img.getAttribute('data-fallback');
                if (fallback) img.src = fallback;
            });
        });

        const total = track.querySelectorAll('.gallery-img').length;
        let idx = 0;
        const apply = () => {
            track.style.transform = `translateX(-${idx * 100}%)`;
            if (counter) counter.textContent = `${idx + 1} / ${total}`;
            prev.classList.toggle('is-hidden', idx === 0);
            next.classList.toggle('is-hidden', idx === total - 1);
        };
        prev.addEventListener('click', () => { if (idx > 0) { idx--; apply(); } });
        next.addEventListener('click', () => { if (idx < total - 1) { idx++; apply(); } });
        apply(); // Initial state: prev hidden because we start at slide 0.
    })();

    const applyTitleCase = (str, format) => {
        if (!str) return str;
        if (format === 'lower')    return str.toLowerCase();
        if (format === 'upper')    return str.toUpperCase();
        if (format === 'title')    return str.split(/(\s+)/).map(t => /\s/.test(t) ? t : (t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())).join('');
        if (format === 'sentence') return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        return str;
    };

    function getActiveMode() {
        const activeTab = document.querySelector('.tab-link.active');
        return activeTab ? activeTab.getAttribute('data-mode') : 'folder';
    }

    const getSeparatorChar = (val) => {
        if (val === 'dash') return '-';
        if (val === 'space') return ' ';
        if (val === 'none') return '';
        return '_';
    };

    const getDateSeparatorChar = (val) => {
        if (val === 'underscore') return '_';
        if (val === 'space') return ' ';
        if (val === 'dot') return '.';
        if (val === 'none') return '';
        return '-';
    };

    const resolveTitleSep = (titleVal, fallbackChar) => {
        if (!titleVal || titleVal === 'default') return fallbackChar;
        if (titleVal === 'keep') return ' ';
        return getSeparatorChar(titleVal);
    };

    // Stable, hand-picked example for each Unique ID format so the preview
    // is deterministic instead of jumping every time the user touches a knob.
    const ID_FORMAT_PREVIEWS = {
        hex: 'a1b2c3',
        hex8: 'a1b2c3d4',
        numeric: '987654',
        numeric8: '12345678',
        alpha6: 'k7p2m9',
        letters: 'xKjPqM',
        timestamp: '1733123456'
    };

    function formatIndexValue(n, format) {
        const padded = String(n).padStart(2, '0');
        if (format === 'parentheses') return `(${padded})`;
        if (format === 'brackets') return `[${padded}]`;
        return padded;
    }

    const getDataValues = (separator, indexFormat, dateFormat, dateSeparator, timeFormat, idFormat, titleSpace, titleCase) => {
        const sepChar = getSeparatorChar(separator);
        const dateSepChar = getDateSeparatorChar(dateSeparator);
        const titleSepChar = resolveTitleSep(titleSpace, sepChar);
        const rawTitle = applyTitleCase("A peacock showing off its feathers", titleCase || 'original');

        let formattedDate = '';
        if (dateFormat === 'dd-mm-yyyy' || dateFormat === 'uk') formattedDate = `03${dateSepChar}05${dateSepChar}2026`;
        else if (dateFormat === 'dd-mm-yy') formattedDate = `03${dateSepChar}05${dateSepChar}26`;
        else if (dateFormat === 'mm-dd-yyyy' || dateFormat === 'us') formattedDate = `05${dateSepChar}03${dateSepChar}2026`;
        else if (dateFormat === 'mm-dd-yy') formattedDate = `05${dateSepChar}03${dateSepChar}26`;
        else formattedDate = `2026${dateSepChar}05${dateSepChar}03`;

        return {
            subreddit: 'BeAmazed',
            author: 'FeatherFanatic',
            title: rawTitle.split(' ').join(titleSepChar),
            index: formatIndexValue(1, indexFormat),
            unique_id: ID_FORMAT_PREVIEWS[idFormat] || ID_FORMAT_PREVIEWS.hex,
            date: formattedDate,
            time: (timeFormat === '24h') ? `14${sepChar}30${sepChar}00` : `02${sepChar}30${sepChar}PM`
        };
    };

    const getFormulaString = (dropzone, data, sepChar) => {
        const pills = dropzone.querySelectorAll('.pill');
        if (pills.length === 0) return emptyFallbackHash;

        let formulaString = '';
        let prevWasUserText = false;
        let isFirstEmitted = true;

        pills.forEach((pill) => {
            const type = pill.getAttribute('data-type');
            const isUserText = (type === 'user_text');

            let value = '';
            if (isUserText) {
                value = pill.getAttribute('data-generated-text') || '';
            } else if (type === 'unique_id') {
                value = data.unique_id;
            } else if (type === 'upload_date' || type === 'dl_date') {
                value = data.date;
            } else if (type === 'time') {
                value = data.time;
            } else {
                value = data[type] || '';
            }

            if (value === '' || value === undefined || value === null) return;

            if (!isFirstEmitted && !isUserText && !prevWasUserText) {
                formulaString += sepChar;
            }
            formulaString += value;
            prevWasUserText = isUserText;
            isFirstEmitted = false;
        });
        return formulaString;
    };

    // Tree icons in Windows-File-Explorer-ish style: two-tone yellow folder
    // (darker back panel peeking above a lighter front panel), zip = same folder
    // with a white zipper running down the middle, image = blue sky + sun + green
    // hills. Colors are baked into each SVG so they look the same regardless of
    // theme; per-row CSS color tinting is no longer needed.
    const PREVIEW_ICONS = {
        // Open folder — for the "downloads/[base]/" root line. The front panel is
        // "tipped open" by drawing it as a leaning trapezoid.
        download: '<svg viewBox="0 0 24 24"><path d="M2 7a2 2 0 0 1 2-2h6l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z" fill="#c89a3b"/><path d="M3 10l3-1h17l-2.6 9.5a1.2 1.2 0 0 1-1.16.9H4a1 1 0 0 1-1-1V10z" fill="#f5c25e"/></svg>',
        // Closed folder — gallery sub-folders in Folder Mode.
        folder:   '<svg viewBox="0 0 24 24"><path d="M2 7a2 2 0 0 1 2-2h6l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z" fill="#c89a3b"/><path d="M2 10.2h20V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8.8z" fill="#f5c25e"/></svg>',
        // Photo file — blue sky background, soft sun, green hills.
        image:    '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="1.6" fill="#82c5e8"/><circle cx="8" cy="9" r="1.7" fill="#fff5cf"/><path d="M3 17.2l4.2-4.2 3.8 3.8 4-3.6 6 5v1.3a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-1.3z" fill="#7ec488"/></svg>',
        // Zip — yellow folder with a vertical white zipper and tiny teeth.
        archive:  '<svg viewBox="0 0 24 24"><path d="M2 7a2 2 0 0 1 2-2h6l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z" fill="#c89a3b"/><path d="M2 10.2h20V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8.8z" fill="#f5c25e"/><rect x="11.1" y="10.2" width="1.8" height="10.8" fill="#ffffff"/><rect x="11.1" y="12" width="1.8" height="0.55" fill="#c89a3b"/><rect x="11.1" y="14" width="1.8" height="0.55" fill="#c89a3b"/><rect x="11.1" y="16" width="1.8" height="0.55" fill="#c89a3b"/><rect x="11.1" y="18" width="1.8" height="0.55" fill="#c89a3b"/></svg>'
    };

    const NUM_PREVIEW_IMAGES = 3;

    function escapeHtml(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    // Build one image filename for the preview, mirroring background.js's
    // shouldAddTrailingIndex behaviour: if the formula has no Index pill and
    // we're showing >1 images, append the trailing index. Demo always shows 3,
    // so trailing index always applies when the formula doesn't already include one.
    function buildPreviewImageName(dropzone, fileData, sepChar, indexFormat, imageNum) {
        const dataI = { ...fileData, index: formatIndexValue(imageNum, indexFormat) };
        let name = getFormulaString(dropzone, dataI, sepChar);
        const hasIndexPill = dropzone.querySelectorAll('.pill[data-type="index"]').length > 0;
        if (!hasIndexPill) name += `${sepChar}${dataI.index}`;
        return name;
    }

    function previewRow(iconKey, name, kindClass, indentLevel) {
        const indent = indentLevel ? ` preview-indent-${indentLevel}` : '';
        return `<div class="preview-row ${kindClass}${indent}"><span class="preview-icon">${PREVIEW_ICONS[iconKey]}</span><span class="preview-name">${escapeHtml(name)}</span></div>`;
    }

    function updatePreview() {
        const activeMode = getActiveMode();

        const folderSepGroup = folderSeparatorSelect.closest('.setting-group');
        if (activeMode === 'individual') folderSepGroup.style.display = 'none';
        else folderSepGroup.style.display = 'block';

        const folderSep = getSeparatorChar(folderSeparatorSelect.value);
        const fileSep = getSeparatorChar(fileSeparatorSelect.value);
        const indexFormat = indexFormatSelect.value;

        const folderData = getDataValues(folderSeparatorSelect.value, indexFormat, dateFormatSelect.value, dateSeparatorSelect.value, timeFormatSelect.value, idFormatSelect.value, titleSpaceSelect.value, titleCaseSelect.value);
        const fileData = getDataValues(fileSeparatorSelect.value, indexFormat, dateFormatSelect.value, dateSeparatorSelect.value, timeFormatSelect.value, idFormatSelect.value, titleSpaceSelect.value, titleCaseSelect.value);

        const summary = document.getElementById('preview-summary');
        if (!summary) return;

        const lines = [previewRow('download', `downloads/${currentBaseFolder}/`, 'is-base', 0)];

        if (activeMode === 'folder') {
            const folderName = getFormulaString(dropzones.folder.folder, folderData, folderSep);
            lines.push(previewRow('folder', `${folderName}/`, 'is-folder', 1));
            for (let i = 1; i <= NUM_PREVIEW_IMAGES; i++) {
                const imgName = buildPreviewImageName(dropzones.folder.image, fileData, fileSep, indexFormat, i);
                lines.push(previewRow('image', `${imgName}.jpg`, 'is-image', 2));
            }
        } else if (activeMode === 'zip') {
            const archiveName = getFormulaString(dropzones.zip.archive, folderData, folderSep);
            lines.push(previewRow('archive', `${archiveName}.zip`, 'is-archive', 1));
            for (let i = 1; i <= NUM_PREVIEW_IMAGES; i++) {
                const imgName = buildPreviewImageName(dropzones.zip.image, fileData, fileSep, indexFormat, i);
                lines.push(previewRow('image', `${imgName}.jpg`, 'is-image', 2));
            }
        } else if (activeMode === 'individual') {
            for (let i = 1; i <= NUM_PREVIEW_IMAGES; i++) {
                const imgName = buildPreviewImageName(dropzones.individual, fileData, fileSep, indexFormat, i);
                lines.push(previewRow('image', `${imgName}.jpg`, 'is-image', 1));
            }
        }

        summary.innerHTML = lines.join('');
    }

    const pillToState = (pill) => {
        const type = pill.getAttribute('data-type');
        if (type === 'user_text') return { type: 'user_text', staticTextId: pill.getAttribute('data-static-text-id'), generatedText: pill.getAttribute('data-generated-text') };
        else return { type };
    };

    saveBtn.addEventListener('click', () => {
        const globalPrefs = {
            folderSeparatorFormat: folderSeparatorSelect.value,
            fileSeparatorFormat: fileSeparatorSelect.value,
            titleSpaceFormat: titleSpaceSelect.value,
            titleCaseFormat: titleCaseSelect.value,
            indexFormat: indexFormatSelect.value,
            dateFormat: dateFormatSelect.value,
            dateSeparatorFormat: dateSeparatorSelect.value,
            timeFormat: timeFormatSelect.value,
            idFormat: idFormatSelect.value,
            promptCustomTitle: promptTitleToggle.checked,
            activeMode: getActiveMode()
        };

        const saveZoneState = (dropzone) => Array.from(dropzone.querySelectorAll('.pill')).map(pillToState);

        const fallbackState = (group) => ({
            truncate: group.truncate.value,
            missingTitle: group.missingTitle.value,
            placeholderText: (group.placeholderText.value || '').replace(/[\\/:*?"<>|]/g, '').trim(),
            singleFileIndex: group.singleFileIndex.value
        });

        const modeState = {
            folder: { folder: saveZoneState(dropzones.folder.folder), image: saveZoneState(dropzones.folder.image), fallbacks: fallbackState(fallbacks.folder) },
            zip: { archive: saveZoneState(dropzones.zip.archive), image: saveZoneState(dropzones.zip.image), fallbacks: fallbackState(fallbacks.zip) },
            individual: { formula: saveZoneState(dropzones.individual), fallbacks: fallbackState(fallbacks.individual) }
        };

        const toolboxPills = Array.from(toolbox.querySelectorAll('.pill[data-type="user_text"]')).map(pillToState);

        chrome.storage.sync.set({
            globalPrefs,
            modeState,
            toolboxStaticTextDefs: toolboxPills,
            lastUniqueStaticTextId: uniqueStaticTextId,
            keyboardShortcutEnabled: keyboardShortcutToggle.checked
        }, () => {
            saveBtn.classList.add('saved');
            showToast('Settings saved successfully', 'success');
            setTimeout(() => saveBtn.classList.remove('saved'), 1800);
        });
    });

    function stateToPill(pillState) {
        const pill = document.createElement('div');
        pill.className = 'pill';
        pill.setAttribute('data-type', pillState.type);

        if (pillState.type === 'user_text') {
            pill.className += ' user-typed-text';
            pill.setAttribute('data-generated-text', pillState.generatedText);
            pill.setAttribute('data-static-text-id', pillState.staticTextId);

            let displayString = pillState.generatedText || 'Custom';
            pill.innerHTML = `<span style="white-space: pre;">${displayString.replace(/ /g, '&nbsp;')}</span>`;
        } else if (pillState.type === 'unique_id') {
            pill.className += ' unique-id';
            pill.textContent = 'Unique ID';
        } else {
            let formattedText = pillState.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            pill.textContent = formattedText;
        }
        return pill;
    }

    const defaultState = {
        globalPrefs: {
            folderSeparatorFormat: 'space',
            fileSeparatorFormat: 'space',
            titleSpaceFormat: 'default',
            titleCaseFormat: 'original',
            indexFormat: 'standard',
            dateFormat: 'yyyy-mm-dd',
            dateSeparatorFormat: 'dash',
            timeFormat: '24h',
            idFormat: 'hex',
            promptCustomTitle: false,
            activeMode: 'folder'
        },
        toolboxStaticTextDefs: [],
        lastUniqueStaticTextId: 0,
        keyboardShortcutEnabled: true,
        modeState: {
            folder: { folder: [{ type: 'subreddit' }], image: [{ type: 'title' }, { type: 'index' }], fallbacks: { truncate: 'auto', missingTitle: 'omit', singleFileIndex: 'never' } },
            zip: { archive: [{ type: 'title' }], image: [{ type: 'index' }], fallbacks: { truncate: 'auto', missingTitle: 'omit', singleFileIndex: 'never' } },
            individual: { formula: [{ type: 'title' }, { type: 'index' }], fallbacks: { truncate: 'auto', missingTitle: 'omit', singleFileIndex: 'never' } }
        }
    };

    function applySettings(data) {
        currentBaseFolder = data.preferredFolder || 'reddit_downloads';

        folderSeparatorSelect.value = data.globalPrefs.folderSeparatorFormat || data.globalPrefs.separatorFormat || 'space';
        fileSeparatorSelect.value = data.globalPrefs.fileSeparatorFormat || data.globalPrefs.separatorFormat || 'space';
        titleSpaceSelect.value = data.globalPrefs.titleSpaceFormat || 'default';
        titleCaseSelect.value = data.globalPrefs.titleCaseFormat || 'original';
        indexFormatSelect.value = data.globalPrefs.indexFormat || 'standard';
        dateFormatSelect.value = data.globalPrefs.dateFormat || 'yyyy-mm-dd';
        dateSeparatorSelect.value = data.globalPrefs.dateSeparatorFormat || 'dash';
        timeFormatSelect.value = data.globalPrefs.timeFormat || '24h';
        idFormatSelect.value = data.globalPrefs.idFormat || 'hex';
        promptTitleToggle.checked = data.globalPrefs.promptCustomTitle || false;
        keyboardShortcutToggle.checked = data.keyboardShortcutEnabled !== false;
        uniqueStaticTextId = data.lastUniqueStaticTextId || 0;

        const restoredMode = data.globalPrefs.activeMode || 'folder';
        tabLinks.forEach(l => l.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        document.querySelector(`.tab-link[data-mode="${restoredMode}"]`).classList.add('active');
        document.getElementById(`panel-${restoredMode}`).classList.add('active');
        setModeDescription(restoredMode);

        // Wipe any user_text pills already in the toolbox, then re-add from saved state.
        Array.from(toolbox.querySelectorAll('.pill[data-type="user_text"]')).forEach(p => p.remove());
        if (data.toolboxStaticTextDefs) {
            data.toolboxStaticTextDefs.forEach(pillState => {
                const pill = stateToPill(pillState);
                makePillDeletable(pill);
                toolbox.insertBefore(pill, addStaticTextBtn);
            });
        }

        const loadZoneState = (zoneEl, pillStates) => {
            zoneEl.innerHTML = '';
            (pillStates || []).forEach(pillState => {
                const pill = stateToPill(pillState);
                zoneEl.appendChild(pill);
            });
        };

        const loadFallbacks = (fallbackGroup, fallbackStates) => {
            const states = fallbackStates || {};
            if (fallbackGroup.truncate) fallbackGroup.truncate.value = states.truncate || 'auto';
            if (fallbackGroup.missingTitle) fallbackGroup.missingTitle.value = states.missingTitle || 'omit';
            if (fallbackGroup.placeholderText) fallbackGroup.placeholderText.value = states.placeholderText || '';
            if (fallbackGroup.singleFileIndex) fallbackGroup.singleFileIndex.value = states.singleFileIndex || 'never';
            syncPlaceholderVisibility(fallbackGroup);
        };

        loadZoneState(dropzones.folder.folder, data.modeState.folder.folder);
        loadZoneState(dropzones.folder.image, data.modeState.folder.image);
        loadFallbacks(fallbacks.folder, data.modeState.folder.fallbacks);

        loadZoneState(dropzones.zip.archive, data.modeState.zip.archive);
        loadZoneState(dropzones.zip.image, data.modeState.zip.image);
        loadFallbacks(fallbacks.zip, data.modeState.zip.fallbacks);

        loadZoneState(dropzones.individual, data.modeState.individual.formula);
        loadFallbacks(fallbacks.individual, data.modeState.individual.fallbacks);

        updatePreview();
    }

    // ---- Backup & reset ----
    function showConfirm({ title, message, okText, danger }, onConfirm) {
        const overlay = document.getElementById('confirm-overlay');
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        const okBtn = document.getElementById('confirm-ok');
        okBtn.textContent = okText || 'Confirm';
        okBtn.classList.toggle('confirm-danger', !!danger);
        overlay.classList.add('show');

        const cleanup = () => {
            overlay.classList.remove('show');
            okBtn.replaceWith(okBtn.cloneNode(true));
            document.getElementById('confirm-cancel').replaceWith(document.getElementById('confirm-cancel').cloneNode(true));
            overlay.removeEventListener('click', backdropHandler);
        };
        const backdropHandler = (e) => { if (e.target === overlay) cleanup(); };
        overlay.addEventListener('click', backdropHandler);
        document.getElementById('confirm-cancel').addEventListener('click', cleanup);
        document.getElementById('confirm-ok').addEventListener('click', () => {
            cleanup();
            onConfirm();
        });
    }

    document.getElementById('export-btn').addEventListener('click', () => {
        chrome.storage.sync.get(null, (data) => {
            const payload = {
                _exportFormat: 1,
                _exportedAt: new Date().toISOString(),
                ...data
            };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const ts = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            a.download = `reddit-gallery-downloader-settings-${ts}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 100);
            showToast('Settings exported', 'success');
        });
    });

    document.getElementById('import-btn').addEventListener('click', () => {
        document.getElementById('import-file-input').click();
    });

    document.getElementById('import-file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const parsed = JSON.parse(evt.target.result);
                if (!parsed.globalPrefs || !parsed.modeState || !parsed.modeState.folder) {
                    showToast('That file does not look like a valid settings export.');
                    return;
                }
                showConfirm({
                    title: 'Replace your current settings?',
                    message: 'Importing will overwrite all naming formulas, format options, and toggles. Your current settings will be lost.',
                    okText: 'Import & Replace',
                    danger: true
                }, () => {
                    const cleanData = {
                        globalPrefs: parsed.globalPrefs,
                        modeState: parsed.modeState,
                        toolboxStaticTextDefs: parsed.toolboxStaticTextDefs || [],
                        lastUniqueStaticTextId: parsed.lastUniqueStaticTextId || 0,
                        keyboardShortcutEnabled: parsed.keyboardShortcutEnabled !== false,
                        preferredFolder: parsed.preferredFolder,
                        downloadMode: parsed.downloadMode,
                        buttonTheme: parsed.buttonTheme,
                        buttonPosition: parsed.buttonPosition,
                        buttonSize: parsed.buttonSize,
                        customButtonLabel: parsed.customButtonLabel
                    };
                    Object.keys(cleanData).forEach(k => cleanData[k] === undefined && delete cleanData[k]);
                    chrome.storage.sync.clear(() => {
                        chrome.storage.sync.set(cleanData, () => {
                            applySettings({ ...defaultState, ...cleanData });
                            showToast('Settings imported successfully', 'success');
                        });
                    });
                });
            } catch (err) {
                showToast('Could not parse that file. Make sure it is valid JSON.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    document.getElementById('reset-btn').addEventListener('click', () => {
        showConfirm({
            title: 'Reset everything to defaults?',
            message: 'All your formulas, format options, custom static text pills, and button preferences will be erased. You can\'t undo this.',
            okText: 'Reset',
            danger: true
        }, () => {
            chrome.storage.sync.clear(() => {
                chrome.storage.sync.set(defaultState, () => {
                    applySettings(defaultState);
                    showToast('Settings reset to defaults', 'success');
                });
            });
        });
    });

    chrome.storage.sync.get(null, (allData) => {
        let data = allData || {};

        // First run, or storage got into a weird state. Merge in the defaults instead of
        // overwriting, otherwise we'd nuke things like preferredFolder/buttonTheme that
        // the popup already wrote.
        if (!data.globalPrefs || !data.modeState || !data.modeState.folder) {
            data = { ...defaultState, ...data };
            data.globalPrefs = { ...defaultState.globalPrefs, ...(data.globalPrefs || {}) };
            data.modeState = data.modeState && data.modeState.folder ? data.modeState : defaultState.modeState;
            chrome.storage.sync.set({
                globalPrefs: data.globalPrefs,
                modeState: data.modeState,
                toolboxStaticTextDefs: data.toolboxStaticTextDefs || [],
                lastUniqueStaticTextId: data.lastUniqueStaticTextId || 0
            });
        }

        applySettings(data);
    });
});
