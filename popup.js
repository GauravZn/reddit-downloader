const descriptions = {
    folder: "Creates a subfolder named after the post and saves uncompressed images inside it.",
    zip: "Bundles all images into a single .zip file to keep your downloads clutter-free.",
    individual: "Downloads all images directly into the base folder."
};

const positionLabels = {
    'bottom-right': 'Bottom Right',
    'bottom-left':  'Bottom Left',
    'top-right':    'Top Right',
    'top-left':     'Top Left'
};

const sizeLabels = { compact: 'Compact', normal: 'Normal', large: 'Large' };
const minimalLabelThemes = new Set(['theme-premium', 'theme-mono', 'theme-neon']);

function updateDescription() {
    const mode = document.getElementById('downloadMode').value;
    document.getElementById('modeDescription').textContent = descriptions[mode];
}

function updatePreview() {
    const theme = document.getElementById('buttonTheme').value;
    const size = document.getElementById('buttonSize').value;
    const position = document.getElementById('buttonPosition').value;
    const customLabel = (document.getElementById('customButtonLabel').value || '').trim();

    const previewBtn = document.getElementById('previewBtn');
    const previewMeta = document.getElementById('previewMeta');
    const labelText = previewBtn.querySelector('.preview-label-text');
    const emoji = previewBtn.querySelector('.preview-emoji');

    previewBtn.setAttribute('data-theme', theme);
    previewBtn.setAttribute('data-size', size);

    if (customLabel) {
        labelText.textContent = customLabel;
        emoji.style.display = minimalLabelThemes.has(theme) ? 'none' : 'inline';
    } else if (minimalLabelThemes.has(theme)) {
        labelText.textContent = 'Download';
        emoji.style.display = 'none';
    } else {
        labelText.textContent = 'Download Gallery';
        emoji.style.display = 'inline';
    }

    previewMeta.textContent = `${positionLabels[position] || position} · ${sizeLabels[size] || size}`;
}

function saveOptions() {
    const folderName = document.getElementById('folderName').value.trim() || 'reddit_downloads';
    const downloadMode = document.getElementById('downloadMode').value;
    const buttonTheme = document.getElementById('buttonTheme').value;
    const buttonPosition = document.getElementById('buttonPosition').value;
    const buttonSize = document.getElementById('buttonSize').value;
    const customButtonLabel = document.getElementById('customButtonLabel').value.trim().slice(0, 40);

    chrome.storage.sync.set({
        preferredFolder: folderName,
        downloadMode: downloadMode,
        buttonTheme: buttonTheme,
        buttonPosition: buttonPosition,
        buttonSize: buttonSize,
        customButtonLabel: customButtonLabel
    }, () => {
        const saveBtn = document.getElementById('saveBtn');
        saveBtn.classList.add('saved');
        setTimeout(() => window.close(), 850);
    });
}

function restoreOptions() {
    chrome.storage.sync.get({
        preferredFolder: 'reddit_downloads',
        downloadMode: 'folder',
        buttonTheme: 'theme-native',
        buttonPosition: 'bottom-right',
        buttonSize: 'normal',
        customButtonLabel: ''
    }, (items) => {
        document.getElementById('folderName').value = items.preferredFolder;
        document.getElementById('downloadMode').value = items.downloadMode;
        document.getElementById('customButtonLabel').value = items.customButtonLabel || '';

        const safeSelect = (id, value, fallback) => {
            const el = document.getElementById(id);
            const valid = Array.from(el.options).map(opt => opt.value);
            el.value = valid.includes(value) ? value : fallback;
        };
        safeSelect('buttonTheme', items.buttonTheme, 'theme-native');
        safeSelect('buttonPosition', items.buttonPosition, 'bottom-right');
        safeSelect('buttonSize', items.buttonSize, 'normal');

        updateDescription();
        updatePreview();
    });
}

document.getElementById('downloadMode').addEventListener('change', updateDescription);
['buttonTheme', 'buttonPosition', 'buttonSize'].forEach(id => {
    document.getElementById(id).addEventListener('change', updatePreview);
});
document.getElementById('customButtonLabel').addEventListener('input', updatePreview);
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveBtn').addEventListener('click', saveOptions);

document.getElementById('customizeNamingBtn').addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
    } else {
        window.open(chrome.runtime.getURL('options.html'));
    }
});
