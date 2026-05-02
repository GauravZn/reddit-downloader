document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('closeWelcomeBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            window.close();
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Your existing logic for closing the tab
    const closeBtn = document.getElementById('closeWelcomeBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            window.close();
        });
    }

    // New logic for the Customize Naming button
    const customizeBtn = document.getElementById('customizeNamingBtnWelcome');
    if (customizeBtn) {
        customizeBtn.addEventListener('click', () => {
            if (chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage();
            } else {
                window.open(chrome.runtime.getURL('options.html'));
            }
        });
    }
});