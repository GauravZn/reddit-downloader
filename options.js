document.addEventListener('DOMContentLoaded', () => {
    const toolbox = document.getElementById('toolbox');
    const dropzones = {
        folder: { folder: document.getElementById('dropzone-folder-folder'), image: document.getElementById('dropzone-folder-image') },
        zip: { archive: document.getElementById('dropzone-zip-archive'), image: document.getElementById('dropzone-zip-image') },
        individual: document.getElementById('dropzone-individual')
    };

    const saveBtn = document.getElementById('save-configuration-btn');
    const statusMsg = document.getElementById('status-msg');
    const addStaticTextBtn = document.getElementById('add-static-text-btn');
    const toast = document.getElementById('toast');

    const tabLinks = document.querySelectorAll('.tab-link');
    const panels = document.querySelectorAll('.panel');

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
    const customModalToggle = document.getElementById('custom-modal-toggle');
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

    [folderSeparatorSelect, fileSeparatorSelect, titleSpaceSelect, titleCaseSelect, indexFormatSelect, dateFormatSelect, dateSeparatorSelect, timeFormatSelect, idFormatSelect].forEach(select => {
        select.addEventListener('change', updatePreview);
    });

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

    const getDataValues = (separator, indexFormat, dateFormat, dateSeparator, timeFormat, idFormat, titleSpace, titleCase) => {
        const sepChar = getSeparatorChar(separator);
        const dateSepChar = getDateSeparatorChar(dateSeparator);
        const titleSepChar = resolveTitleSep(titleSpace, sepChar);
        const rawTitle = applyTitleCase("The iridescent feathers on this peacock are unreal", titleCase || 'original');

        let indexString = '01';
        if (indexFormat === 'parentheses') indexString = '(01)';
        if (indexFormat === 'brackets') indexString = '[01]';

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

    function getActivePanelPreview(activeMode) {
        const panel = document.getElementById(`panel-${activeMode}`);
        return {
            description: panel.querySelector('.preview-description'),
            box: panel.querySelector('.preview-box')
        };
    }

    function updatePreview() {
        const activeMode = getActiveMode();

        const folderSepGroup = folderSeparatorSelect.closest('.setting-group');
        if (activeMode === 'individual') folderSepGroup.style.display = 'none';
        else folderSepGroup.style.display = 'block';

        const folderSep = getSeparatorChar(folderSeparatorSelect.value);
        const fileSep = getSeparatorChar(fileSeparatorSelect.value);

        const folderData = getDataValues(folderSeparatorSelect.value, indexFormatSelect.value, dateFormatSelect.value, dateSeparatorSelect.value, timeFormatSelect.value, idFormatSelect.value, titleSpaceSelect.value, titleCaseSelect.value);
        const fileData = getDataValues(fileSeparatorSelect.value, indexFormatSelect.value, dateFormatSelect.value, dateSeparatorSelect.value, timeFormatSelect.value, idFormatSelect.value, titleSpaceSelect.value);

        const { description, box } = getActivePanelPreview(activeMode);

        if (activeMode === 'folder') {
            const folderFormula = getFormulaString(dropzones.folder.folder, folderData, folderSep);
            const imageFormula = getFormulaString(dropzones.folder.image, fileData, fileSep);

            description.innerHTML = `Creates a sub-folder named <strong>"${folderFormula}"</strong> and saves the images inside it as <strong>"${imageFormula}.jpg"</strong>.`;
            box.textContent = `downloads/${currentBaseFolder}/${folderFormula}/${imageFormula}.jpg`;

        } else if (activeMode === 'zip') {
            const archiveFormula = getFormulaString(dropzones.zip.archive, folderData, folderSep);
            const imageFormula = getFormulaString(dropzones.zip.image, fileData, fileSep);

            description.innerHTML = `Bundles everything into a single ZIP archive named <strong>"${archiveFormula}.zip"</strong>. Inside the ZIP, this image will be named <strong>"${imageFormula}.jpg"</strong>.`;
            box.textContent = `downloads/${currentBaseFolder}/${archiveFormula}.zip -> (${imageFormula}.jpg)`;

        } else if (activeMode === 'individual') {
            const imageFormula = getFormulaString(dropzones.individual, fileData, fileSep);

            description.innerHTML = `Saves the image directly into your base download folder as <strong>"${imageFormula}.jpg"</strong>.`;
            box.textContent = `downloads/${currentBaseFolder}/${imageFormula}.jpg`;
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
            useCustomModal: customModalToggle.checked,
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
        useCustomModal: true,
        keyboardShortcutEnabled: true,
        modeState: {
            folder: { folder: [{ type: 'subreddit' }], image: [{ type: 'title' }, { type: 'index' }], fallbacks: { truncate: 'auto', missingTitle: 'placeholder', singleFileIndex: 'never' } },
            zip: { archive: [{ type: 'title' }], image: [{ type: 'index' }], fallbacks: { truncate: 'auto', missingTitle: 'placeholder', singleFileIndex: 'never' } },
            individual: { formula: [{ type: 'title' }, { type: 'index' }], fallbacks: { truncate: 'auto', missingTitle: 'placeholder', singleFileIndex: 'never' } }
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
        customModalToggle.checked = data.useCustomModal !== false;
        keyboardShortcutToggle.checked = data.keyboardShortcutEnabled !== false;
        uniqueStaticTextId = data.lastUniqueStaticTextId || 0;

        const restoredMode = data.globalPrefs.activeMode || 'folder';
        tabLinks.forEach(l => l.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        document.querySelector(`.tab-link[data-mode="${restoredMode}"]`).classList.add('active');
        document.getElementById(`panel-${restoredMode}`).classList.add('active');

        // Clear any existing user_text pills from the toolbox before reinserting them.
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
            if (fallbackGroup.missingTitle) fallbackGroup.missingTitle.value = states.missingTitle || 'placeholder';
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
                        useCustomModal: parsed.useCustomModal !== false,
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

        // First-run / corrupted state — merge defaults rather than wiping. Wiping clobbers
        // unrelated keys like preferredFolder/buttonTheme that the popup may have already set.
        if (!data.globalPrefs || !data.modeState || !data.modeState.folder) {
            data = { ...defaultState, ...data };
            data.globalPrefs = { ...defaultState.globalPrefs, ...(data.globalPrefs || {}) };
            data.modeState = data.modeState && data.modeState.folder ? data.modeState : defaultState.modeState;
            chrome.storage.sync.set({
                globalPrefs: data.globalPrefs,
                modeState: data.modeState,
                toolboxStaticTextDefs: data.toolboxStaticTextDefs || [],
                lastUniqueStaticTextId: data.lastUniqueStaticTextId || 0,
                useCustomModal: data.useCustomModal !== false
            });
        }

        applySettings(data);
    });
});
