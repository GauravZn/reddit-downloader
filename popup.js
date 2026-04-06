const descriptions = {
  folder: "Creates a subfolder named after the post and saves uncompressed images inside it.",
  zip: "Bundles all images into a single .zip file to keep your downloads clutter-free.",
  individual: "Downloads all images directly into the base folder."
};

function updateDescription() {
  const mode = document.getElementById('downloadMode').value;
  document.getElementById('modeDescription').textContent = descriptions[mode];
}

function saveOptions() {
  const folderName = document.getElementById('folderName').value.trim() || 'reddit_downloads';
  const downloadMode = document.getElementById('downloadMode').value;
  const buttonTheme = document.getElementById('buttonTheme').value;

  chrome.storage.sync.set({
    preferredFolder: folderName,
    downloadMode: downloadMode,
    buttonTheme: buttonTheme
  }, () => {

    window.close();
  });
}

function restoreOptions() {
  chrome.storage.sync.get({
    preferredFolder: 'reddit_downloads',
    downloadMode: 'folder',
    buttonTheme: 'theme-native'
  }, (items) => {

    document.getElementById('folderName').value = items.preferredFolder;
    document.getElementById('downloadMode').value = items.downloadMode;


    // Safety check: Ensure the saved theme actually exists in the dropdown
    const themeDropdown = document.getElementById('buttonTheme');
    const validThemes = Array.from(themeDropdown.options).map(opt => opt.value);

    if (validThemes.includes(items.buttonTheme)) {
      themeDropdown.value = items.buttonTheme;
    } else {
      themeDropdown.value = 'theme-native'; // Fallback if their saved theme was deleted
    }

    updateDescription();
  });
}


document.getElementById('downloadMode').addEventListener('change', updateDescription);
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveBtn').addEventListener('click', saveOptions);
