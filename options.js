document.addEventListener('DOMContentLoaded', () => {
    const toolbox = document.getElementById('toolbox');
    const dropzones = {
        folder: { folder: document.getElementById('dropzone-folder-folder'), image: document.getElementById('dropzone-folder-image') },
        zip: { archive: document.getElementById('dropzone-zip-archive'), image: document.getElementById('dropzone-zip-image') },
        individual: document.getElementById('dropzone-individual')
    };

    const livePreview = document.getElementById('live-preview');
    const previewDescription = document.getElementById('preview-description');
    const saveBtn = document.getElementById('save-configuration-btn');
    const statusMsg = document.getElementById('status-msg');
    const addStaticTextBtn = document.getElementById('add-static-text-btn');
    const toast = document.getElementById('toast');

    const tabLinks = document.querySelectorAll('.tab-link');
    const panels = document.querySelectorAll('.panel');

    const folderSeparatorSelect = document.getElementById('folder-separator-select');
    const fileSeparatorSelect = document.getElementById('file-separator-select');
    const indexFormatSelect = document.getElementById('index-format-select');
    const dateFormatSelect = document.getElementById('date-format-select');
    const dateSeparatorSelect = document.getElementById('date-separator-select'); // NEW
    const timeFormatSelect = document.getElementById('time-format-select');
    const idFormatSelect = document.getElementById('id-format-select');
    const promptTitleToggle = document.getElementById('prompt-title-toggle');

    const fallbacks = {
        folder: { truncate: document.getElementById('truncate-rule-folder'), missingTitle: document.getElementById('missing-title-rule-folder') },
        zip: { truncate: document.getElementById('truncate-rule-zip'), missingTitle: document.getElementById('missing-title-rule-zip') },
        individual: { truncate: document.getElementById('truncate-rule-individual'), missingTitle: document.getElementById('missing-title-rule-individual') }
    };

    let uniqueStaticTextId = 0;
    let toastTimeout;
    let currentBaseFolder = 'reddit_downloads';

    const emptyFallbackHash = Math.random().toString(36).substring(2, 10);

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => { toast.classList.remove('show'); }, 4000);
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

            inputWrapper.innerHTML = '';
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
            updatePreview();
        });
    });

    // Added Date Separator to the live update triggers
    [folderSeparatorSelect, fileSeparatorSelect, indexFormatSelect, dateFormatSelect, dateSeparatorSelect, timeFormatSelect, idFormatSelect].forEach(select => {
        select.addEventListener('change', updatePreview);
    });

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

    const getDataValues = (separator, indexFormat, dateFormat, dateSeparator, timeFormat, idFormat) => {
        const sepChar = getSeparatorChar(separator);
        const dateSepChar = getDateSeparatorChar(dateSeparator);
        const rawTitle = "The iridescent feathers on this peacock are unreal";

        let indexString = '01';
        if (indexFormat === 'parentheses') indexString = '(01)';
        if (indexFormat === 'brackets') indexString = '[01]';

        // Dynamically build the new requested date formats for the preview!
        let formattedDate = '';
        if (dateFormat === 'dd-mm-yyyy' || dateFormat === 'uk') formattedDate = `03${dateSepChar}05${dateSepChar}2026`;
        else if (dateFormat === 'dd-mm-yy') formattedDate = `03${dateSepChar}05${dateSepChar}26`;
        else if (dateFormat === 'mm-dd-yyyy' || dateFormat === 'us') formattedDate = `05${dateSepChar}03${dateSepChar}2026`;
        else if (dateFormat === 'mm-dd-yy') formattedDate = `05${dateSepChar}03${dateSepChar}26`;
        else formattedDate = `2026${dateSepChar}05${dateSepChar}03`;

        return {
            subreddit: 'NatureIsFuckingLit',
            author: 'FeatherFanatic',
            title: rawTitle.split(' ').join(sepChar),
            index: indexString,
            unique_id: idFormat === 'hex' ? 'a1b2c3' : '987654',
            date: formattedDate,
            time: (timeFormat === '24h') ? `14${sepChar}30${sepChar}00` : `02${sepChar}30${sepChar}PM`
        };
    };

    const getFormulaString = (dropzone, data, sepChar) => {
        const pills = dropzone.querySelectorAll('.pill');
        if (pills.length === 0) return emptyFallbackHash;

        let formulaString = '';
        let prevWasUserText = false;

        pills.forEach((pill, index) => {
            const type = pill.getAttribute('data-type');
            const isUserText = (type === 'user_text');

            if (index > 0) {
                if (!isUserText && !prevWasUserText) {
                    formulaString += sepChar;
                }
            }

            if (isUserText) {
                formulaString += pill.getAttribute('data-generated-text') || '';
            } else if (type === 'unique_id') {
                formulaString += data.unique_id;
            } else if (type === 'upload_date' || type === 'dl_date') {
                formulaString += data.date;
            } else if (type === 'time') {
                formulaString += data.time;
            } else {
                formulaString += data[type] || '';
            }

            prevWasUserText = isUserText;
        });
        return formulaString;
    };

    function updatePreview() {
        const activeMode = getActiveMode();

        const folderSepGroup = folderSeparatorSelect.closest('.setting-group');
        if (activeMode === 'individual') folderSepGroup.style.display = 'none';
        else folderSepGroup.style.display = 'block';

        const folderSep = getSeparatorChar(folderSeparatorSelect.value);
        const fileSep = getSeparatorChar(fileSeparatorSelect.value);

        const folderData = getDataValues(folderSeparatorSelect.value, indexFormatSelect.value, dateFormatSelect.value, dateSeparatorSelect.value, timeFormatSelect.value, idFormatSelect.value);
        const fileData = getDataValues(fileSeparatorSelect.value, indexFormatSelect.value, dateFormatSelect.value, dateSeparatorSelect.value, timeFormatSelect.value, idFormatSelect.value);

        if (activeMode === 'folder') {
            const folderFormula = getFormulaString(dropzones.folder.folder, folderData, folderSep);
            const imageFormula = getFormulaString(dropzones.folder.image, fileData, fileSep);

            previewDescription.innerHTML = `Creates a sub-folder named <strong>"${folderFormula}"</strong> and saves the images inside it as <strong>"${imageFormula}.jpg"</strong>.`;
            livePreview.textContent = `downloads/${currentBaseFolder}/${folderFormula}/${imageFormula}.jpg`;

        } else if (activeMode === 'zip') {
            const archiveFormula = getFormulaString(dropzones.zip.archive, folderData, folderSep);
            const imageFormula = getFormulaString(dropzones.zip.image, fileData, fileSep);

            previewDescription.innerHTML = `Bundles everything into a single ZIP archive named <strong>"${archiveFormula}.zip"</strong>. Inside the ZIP, this image will be named <strong>"${imageFormula}.jpg"</strong>.`;
            livePreview.textContent = `downloads/${currentBaseFolder}/${archiveFormula}.zip -> (${imageFormula}.jpg)`;

        } else if (activeMode === 'individual') {
            const imageFormula = getFormulaString(dropzones.individual, fileData, fileSep);

            previewDescription.innerHTML = `Saves the image directly into your base download folder as <strong>"${imageFormula}.jpg"</strong>.`;
            livePreview.textContent = `downloads/${currentBaseFolder}/${imageFormula}.jpg`;
        }
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
            indexFormat: indexFormatSelect.value,
            dateFormat: dateFormatSelect.value,
            dateSeparatorFormat: dateSeparatorSelect.value, // NEW
            timeFormat: timeFormatSelect.value,
            idFormat: idFormatSelect.value,
            promptCustomTitle: promptTitleToggle.checked,
            activeMode: getActiveMode()
        };

        const saveZoneState = (dropzone) => Array.from(dropzone.querySelectorAll('.pill')).map(pillToState);

        const modeState = {
            folder: { folder: saveZoneState(dropzones.folder.folder), image: saveZoneState(dropzones.folder.image), fallbacks: { truncate: fallbacks.folder.truncate.value, missingTitle: fallbacks.folder.missingTitle.value } },
            zip: { archive: saveZoneState(dropzones.zip.archive), image: saveZoneState(dropzones.zip.image), fallbacks: { truncate: fallbacks.zip.truncate.value, missingTitle: fallbacks.zip.missingTitle.value } },
            individual: { formula: saveZoneState(dropzones.individual), fallbacks: { truncate: fallbacks.individual.truncate.value, missingTitle: fallbacks.individual.missingTitle.value } }
        };

        const toolboxPills = Array.from(toolbox.querySelectorAll('.pill[data-type="user_text"]')).map(pillToState);

        chrome.storage.sync.set({
            globalPrefs, modeState, toolboxStaticTextDefs: toolboxPills, lastUniqueStaticTextId: uniqueStaticTextId
        }, () => {
            statusMsg.textContent = 'Settings Saved';
            setTimeout(() => statusMsg.textContent = '', 2000);
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
        globalPrefs: { folderSeparatorFormat: 'space', fileSeparatorFormat: 'space', indexFormat: 'standard', dateFormat: 'yyyy-mm-dd', dateSeparatorFormat: 'dash', timeFormat: '24h', idFormat: 'hex', promptCustomTitle: false, activeMode: 'folder' },
        toolboxStaticTextDefs: [], lastUniqueStaticTextId: 0,
        modeState: {
            folder: { folder: [{ type: 'subreddit' }], image: [{ type: 'title' }, { type: 'index' }], fallbacks: { truncate: 'auto', missingTitle: 'placeholder' } },
            zip: { archive: [{ type: 'title' }], image: [{ type: 'index' }], fallbacks: { truncate: 'auto', missingTitle: 'placeholder' } },
            // FIX: Replaced 'unique_id' with 'index' as the default pill here!
            individual: { formula: [{ type: 'title' }, { type: 'index' }], fallbacks: { truncate: 'auto', missingTitle: 'placeholder' } }
        }
    };

    chrome.storage.sync.get(null, (allData) => {
        let data = allData;

        if (!data || Object.keys(data).length === 0 || !data.globalPrefs || !data.modeState || !data.modeState.folder) {
            data = defaultState;
            chrome.storage.sync.clear();
            chrome.storage.sync.set(defaultState);
        }

        currentBaseFolder = data.preferredFolder || 'reddit_downloads';

        folderSeparatorSelect.value = data.globalPrefs.folderSeparatorFormat || data.globalPrefs.separatorFormat || 'space';
        fileSeparatorSelect.value = data.globalPrefs.fileSeparatorFormat || data.globalPrefs.separatorFormat || 'space';
        indexFormatSelect.value = data.globalPrefs.indexFormat || 'standard';

        dateFormatSelect.value = data.globalPrefs.dateFormat || 'yyyy-mm-dd';
        dateSeparatorSelect.value = data.globalPrefs.dateSeparatorFormat || 'dash'; // NEW
        timeFormatSelect.value = data.globalPrefs.timeFormat || '24h';
        idFormatSelect.value = data.globalPrefs.idFormat || 'hex';
        promptTitleToggle.checked = data.globalPrefs.promptCustomTitle || false;
        uniqueStaticTextId = data.lastUniqueStaticTextId || 0;

        const restoredMode = data.globalPrefs.activeMode || 'folder';
        tabLinks.forEach(l => l.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        document.querySelector(`.tab-link[data-mode="${restoredMode}"]`).classList.add('active');
        document.getElementById(`panel-${restoredMode}`).classList.add('active');

        if (data.toolboxStaticTextDefs) {
            data.toolboxStaticTextDefs.forEach(pillState => {
                const pill = stateToPill(pillState);
                makePillDeletable(pill);
                toolbox.insertBefore(pill, addStaticTextBtn);
            });
        }

        const loadZoneState = (zoneEl, pillStates) => {
            zoneEl.innerHTML = '';
            pillStates.forEach(pillState => {
                const pill = stateToPill(pillState);
                zoneEl.appendChild(pill);
            });
        };

        const loadFallbacks = (fallbackGroup, fallbackStates) => {
            if (fallbackGroup.truncate) fallbackGroup.truncate.value = fallbackStates.truncate || 'auto';
            if (fallbackGroup.missingTitle) fallbackGroup.missingTitle.value = fallbackStates.missingTitle || 'placeholder';
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
    });
});