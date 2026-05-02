document.addEventListener('DOMContentLoaded', () => {
    const toolbox = document.getElementById('toolbox');
    const dropzones = {
        folder: {
            folder: document.getElementById('dropzone-folder-folder'),
            image: document.getElementById('dropzone-folder-image')
        },
        zip: {
            archive: document.getElementById('dropzone-zip-archive'),
            image: document.getElementById('dropzone-zip-image')
        },
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

    const separatorSelect = document.getElementById('separator-select'); 
    const dateFormatSelect = document.getElementById('date-format-select');
    const timeFormatSelect = document.getElementById('time-format-select');
    const idFormatSelect = document.getElementById('id-format-select');
    
    // NEW: The Toggle Switch Element
    const promptTitleToggle = document.getElementById('prompt-title-toggle');

    const fallbacks = {
        folder: { truncate: document.getElementById('truncate-rule-folder'), missingTitle: document.getElementById('missing-title-rule-folder') },
        zip: { truncate: document.getElementById('truncate-rule-zip'), missingTitle: document.getElementById('missing-title-rule-zip') },
        individual: { truncate: document.getElementById('truncate-rule-individual'), missingTitle: document.getElementById('missing-title-rule-individual') }
    };

    let uniqueStaticTextId = 0;
    let toastTimeout;

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => { toast.classList.remove('show'); }, 4000);
    }

    new Sortable(toolbox, {
        group: { name: 'shared', pull: 'clone', put: false },
        animation: 150,
        sort: false
    });

    const makeSortable = (el) => {
        new Sortable(el, { group: 'shared', animation: 150, onAdd: updatePreview, onUpdate: updatePreview, onRemove: updatePreview });
    };

    makeSortable(dropzones.folder.folder);
    makeSortable(dropzones.folder.image);
    makeSortable(dropzones.zip.archive);
    makeSortable(dropzones.zip.image);
    makeSortable(dropzones.individual);

    addStaticTextBtn.addEventListener('click', () => {
        const newPillId = `static-text-${uniqueStaticTextId++}`;
        const newPill = document.createElement('div');
        newPill.className = 'pill user-typed-text';
        newPill.setAttribute('data-type', 'user_text');
        newPill.setAttribute('data-static-text-id', newPillId);
        newPill.textContent = '[Type Text...]';
        
        toolbox.appendChild(newPill);
        makePillEditable(newPill);
    });

    const makePillEditable = (pillEl) => {
        pillEl.addEventListener('dblclick', (e) => {
            if (e.target === pillEl) convertToInput(pillEl);
        });
    };

    const convertToInput = (pillEl) => {
        const currentText = pillEl.textContent.replace(/^\[|\]$/g, '');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'pill-input';
        input.value = currentText === 'Type Text...' ? '' : currentText;
        
        const updateWidth = () => { input.style.width = Math.max(input.value.length + 1, 5) + 'ch'; };
        updateWidth();
        
        pillEl.textContent = ''; 
        pillEl.appendChild(input);

        requestAnimationFrame(() => {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        });
        
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveInput(pillEl, input); });
        input.addEventListener('blur', () => saveInput(pillEl, input));
        input.addEventListener('input', updateWidth);
    };

    const saveInput = (pillEl, inputEl) => {
        if (!pillEl.contains(inputEl)) return;

        let rawText = inputEl.value.trim() || 'Custom';
        let sanitizedText = rawText.replace(/[<>:"/\\|?*]/g, '-');
        
        if (rawText !== sanitizedText) {
            showToast("Special characters were replaced with '-' to prevent folder errors.");
        }
        
        pillEl.removeChild(inputEl);
        pillEl.textContent = `[${sanitizedText}]`; 
        pillEl.setAttribute('data-generated-text', sanitizedText); 
        updatePreview();
    }; 

    toolbox.querySelectorAll('.pill.user-typed-text').forEach(pill => makePillEditable(pill));

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

    [separatorSelect, dateFormatSelect, timeFormatSelect, idFormatSelect].forEach(select => {
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

    const getDataValues = (separator, dateFormat, timeFormat, idFormat) => {
        const sepChar = getSeparatorChar(separator);
        const rawTitle = "The iridescent feathers on this peacock are unreal";
        
        return {
            subreddit: 'NatureIsFuckingLit',
            author: 'FeatherFanatic',
            title: rawTitle.split(' ').join(sepChar),
            index: '01',
            unique_id: idFormat === 'hex' ? 'a1b2c3' : '987654',
            date: (dateFormat === 'iso') ? `2026${sepChar}05${sepChar}02` : (dateFormat === 'us') ? `05${sepChar}02${sepChar}2026` : `02${sepChar}05${sepChar}2026`,
            time: (timeFormat === '24h') ? `14${sepChar}30${sepChar}00` : `02${sepChar}30${sepChar}PM`
        };
    };

    const getFormulaString = (dropzone, data) => {
        const pills = dropzone.querySelectorAll('.pill');
        if (pills.length === 0) return 'unnamed';
        
        let formulaString = '';
        pills.forEach((pill, index) => {
            const type = pill.getAttribute('data-type');
            const sepChar = getSeparatorChar(separatorSelect.value);
            
            if (index > 0 && type !== 'user_text') formulaString += sepChar;

            if (type === 'user_text') {
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
        });
        return formulaString;
    };

    function updatePreview() {
        const activeMode = getActiveMode();
        const data = getDataValues(separatorSelect.value, dateFormatSelect.value, timeFormatSelect.value, idFormatSelect.value);
        
        if (activeMode === 'folder') {
            const folderFormula = getFormulaString(dropzones.folder.folder, data);
            const imageFormula = getFormulaString(dropzones.folder.image, data);
            
            previewDescription.innerHTML = `Creates a sub-folder named <strong>"${folderFormula}"</strong> and saves the images inside it as <strong>"${imageFormula}.jpg"</strong>.`;
            livePreview.textContent = `downloads/Reddit Downloads/${folderFormula}/${imageFormula}.jpg`;
            
        } else if (activeMode === 'zip') {
            const archiveFormula = getFormulaString(dropzones.zip.archive, data);
            const imageFormula = getFormulaString(dropzones.zip.image, data);
            
            previewDescription.innerHTML = `Bundles everything into a single ZIP archive named <strong>"${archiveFormula}.zip"</strong>. Inside the ZIP, this image will be named <strong>"${imageFormula}.jpg"</strong>.`;
            livePreview.textContent = `downloads/Reddit Downloads/${archiveFormula}.zip -> (${imageFormula}.jpg)`;
            
        } else if (activeMode === 'individual') {
            const imageFormula = getFormulaString(dropzones.individual, data);
            
            previewDescription.innerHTML = `Saves the image directly into your base download folder as <strong>"${imageFormula}.jpg"</strong>.`;
            livePreview.textContent = `downloads/Reddit Downloads/${imageFormula}.jpg`;
        }
    }

    const pillToState = (pill) => {
        const type = pill.getAttribute('data-type');
        if (type === 'user_text') {
            return { type: 'user_text', staticTextId: pill.getAttribute('data-static-text-id'), generatedText: pill.getAttribute('data-generated-text') };
        } else {
            return { type }; 
        }
    };

    saveBtn.addEventListener('click', () => {
        const globalPrefs = {
            separatorFormat: separatorSelect.value,
            dateFormat: dateFormatSelect.value,
            timeFormat: timeFormatSelect.value,
            idFormat: idFormatSelect.value,
            promptCustomTitle: promptTitleToggle.checked // NEW: Captures the toggle state
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
            pill.textContent = `[${pillState.generatedText || 'Custom'}]`;
        } else if (pillState.type === 'unique_id') {
            pill.className += ' unique-id';
            pill.textContent = '[Unique ID]';
        } else {
            let formattedText = pillState.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            pill.textContent = `[${formattedText}]`;
        }
        return pill;
    }

    const defaultState = {
        globalPrefs: { separatorFormat: 'underscore', dateFormat: 'iso', timeFormat: '24h', idFormat: 'hex', promptCustomTitle: false },
        toolboxStaticTextDefs: [], lastUniqueStaticTextId: 0,
        modeState: {
            folder: { folder: [{type: 'subreddit'}], image: [{type: 'title'}, {type: 'index'}], fallbacks: {truncate: 'auto', missingTitle: 'placeholder'} },
            zip: { archive: [{type: 'title'}], image: [{type: 'index'}], fallbacks: {truncate: 'auto', missingTitle: 'placeholder'} },
            individual: { formula: [{type: 'title'}, {type: 'unique_id'}], fallbacks: {truncate: 'auto', missingTitle: 'placeholder'} }
        }
    };

    chrome.storage.sync.get(null, (allData) => {
        let data = allData;
        
        if (!data || Object.keys(data).length === 0 || !data.globalPrefs || !data.modeState || !data.modeState.folder) {
            console.warn("Legacy data detected. Wiping and loading defaults to prevent crash.");
            data = defaultState;
            chrome.storage.sync.clear();
            chrome.storage.sync.set(defaultState);
        }

        separatorSelect.value = data.globalPrefs.separatorFormat || 'underscore';
        dateFormatSelect.value = data.globalPrefs.dateFormat;
        timeFormatSelect.value = data.globalPrefs.timeFormat;
        idFormatSelect.value = data.globalPrefs.idFormat;
        promptTitleToggle.checked = data.globalPrefs.promptCustomTitle || false; // NEW: Loads the toggle state
        uniqueStaticTextId = data.lastUniqueStaticTextId || 0;

        if (data.toolboxStaticTextDefs) {
            data.toolboxStaticTextDefs.forEach(pillState => {
                const pill = stateToPill(pillState);
                makePillEditable(pill);
                toolbox.appendChild(pill);
            });
        }

        const loadZoneState = (zoneEl, pillStates) => {
            zoneEl.innerHTML = ''; 
            pillStates.forEach(pillState => {
                const pill = stateToPill(pillState);
                if (pillState.type === 'user_text') makePillEditable(pill);
                zoneEl.appendChild(pill);
            });
        };

        const loadFallbacks = (fallbackGroup, fallbackStates) => {
            if (fallbackGroup.truncate) fallbackGroup.truncate.value = fallbackStates.truncate;
            if (fallbackGroup.missingTitle) fallbackGroup.missingTitle.value = fallbackStates.missingTitle;
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