const themeStyles = `
  /* Base Structure */
  .reddit-gallery-dl-btn {
    position: fixed !important;
    bottom: 30px !important;
    right: 30px !important;
    z-index: 2147483647 !important;
    padding: 14px 28px !important;
    font-size: 15px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
    transition: all 0.2s ease-in-out !important;
  }

  .theme-native { background: linear-gradient(135deg, #FF4500 0%, #FF8C00 100%) !important; color: white !important; border: none !important; border-radius: 50px !important; box-shadow: 0 8px 16px rgba(255, 69, 0, 0.25) !important; }
  .theme-native:hover { transform: translateY(-3px) !important; box-shadow: 0 12px 20px rgba(255, 69, 0, 0.35) !important; }

  .theme-premium { background-color: #0F0F0F !important; color: #FFFFFF !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 8px !important; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important; letter-spacing: 0.3px !important; }
  .theme-premium:hover { background-color: #202020 !important; transform: translateY(-2px) !important; box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4) !important; }

  .theme-modern { background-color: #1A73E8 !important; color: #FFFFFF !important; border: none !important; border-radius: 8px !important; box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3) !important; }
  .theme-modern:hover { background-color: #1557B0 !important; transform: translateY(-2px) !important; box-shadow: 0 6px 16px rgba(26, 115, 232, 0.4) !important; }

  .theme-minimal { background-color: #FFFFFF !important; color: #3C4043 !important; border: 1px solid #DADCE0 !important; border-radius: 8px !important; box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }
  .theme-minimal:hover { background-color: #F8F9FA !important; color: #202124 !important; border-color: #BDC1C6 !important; transform: translateY(-2px) !important; box-shadow: 0 4px 10px rgba(0,0,0,0.1) !important; }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = themeStyles;
document.head.appendChild(styleSheet);

function getButtonContent(themeName) {
    if (themeName === 'theme-premium') return `<span>Download</span>`;
    return `<span style="font-size: 18px;">🚀</span><span>Download Gallery</span>`;
}

function getLoadingText(themeName) {
    if (themeName === 'theme-premium') return "Fetching...";
    return "⏳ Fetching...";
}

function getSuccessText(themeName, count) {
    if (themeName === 'theme-premium') return `${count} Saved`;
    return `✅ ${count} Files Saved!`;
}

function getFailText(themeName) {
    if (themeName === 'theme-premium') return "No Images";
    return "❌ No Images";
}

function promptForCustomTitle(defaultTitle, callback) {
    const userInput = window.prompt(
        "Enter a custom title for this gallery:\n(Your active Folder and File separators will automatically be applied to any spaces you type)", 
        defaultTitle
    );
    
    if (userInput !== null) {
        let typedTitle = userInput.trim() || "Untitled_Gallery";
        let finalFormattedTitle = typedTitle.replace(/[\\/:*?"<>|]/g, ""); 
        callback(finalFormattedTitle);
    }
}

function manageFloatingButton() {
    const isPostPage = window.location.pathname.includes('/comments/') || window.location.pathname.includes('/gallery/');
    let btn = document.getElementById('reddit-custom-dl-btn');

    if (!isPostPage && !window.location.href.includes('#lightbox')) {
        if (btn) btn.remove();
        return;
    }
    if (btn) return;

    btn = document.createElement("button");
    btn.id = "reddit-custom-dl-btn";

    chrome.storage.sync.get({ buttonTheme: 'theme-native' }, (settings) => {
        btn.className = `reddit-gallery-dl-btn ${settings.buttonTheme}`;
        btn.innerHTML = getButtonContent(settings.buttonTheme);
    });

    document.body.appendChild(btn);

    btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation(); 

        let originalText = btn.innerHTML;
        let currentTheme = Array.from(btn.classList).find(c => c.startsWith('theme-')) || 'theme-native';

        let rawTitle = "";
        let currentPath = window.location.pathname;
        const allPosts = document.querySelectorAll('shreddit-post');
        let activePost = null;

        for (let post of allPosts) {
            let permalink = post.getAttribute('permalink');
            if (permalink && currentPath.includes(permalink.replace(/\/$/, ""))) {
                activePost = post;
                break;
            }
        }

        if (!activePost) activePost = document.querySelector('shreddit-post');

        if (activePost && activePost.getAttribute('post-title')) {
            rawTitle = activePost.getAttribute('post-title');
        } else if (document.title) {
            rawTitle = document.title.split(' : ')[0].split(' | ')[0];
        } else {
            const standardH1 = document.querySelector('h1');
            if (standardH1) rawTitle = standardH1.innerText;
        }

        if (!rawTitle || rawTitle.trim().length === 0 || rawTitle.toLowerCase().includes('reddit')) {
            const now = new Date();
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            rawTitle = `${months[now.getMonth()]}-${now.getDate()}-${now.getFullYear()}_${now.getHours()}-${now.getMinutes()}`;
        }

        let currentUrl = window.location.href.split('?')[0].split('#')[0].replace(/\/$/, "");

        const executeDownload = (finalTitle) => {
            btn.innerHTML = getLoadingText(currentTheme); 
            
            chrome.runtime.sendMessage({
                action: "fetchAndDownload",
                url: currentUrl,
                title: finalTitle
            }, (response) => {
                if (response && response.success) {
                    btn.innerHTML = getSuccessText(currentTheme, response.count);
                } else {
                    btn.innerHTML = getFailText(currentTheme);
                }
                setTimeout(() => btn.innerHTML = originalText, 3000);
            });
        };

        // FIX: The Length Evaluation Engine
        chrome.storage.sync.get(['globalPrefs', 'modeState'], (data) => {
            const prefs = data.globalPrefs || {};
            const modeState = data.modeState || {};
            const activeMode = prefs.activeMode || 'folder';
            
            const isPromptEnabled = prefs.promptCustomTitle || false;
            
            // Look up the specific truncate rule for their active mode
            const truncateRule = modeState[activeMode]?.fallbacks?.truncate || 'auto';
            
            // Clean the title so we know its true length
            let formattedCleanTitle = rawTitle.replace(/[\\/:*?"<>|]/g, "").trim();
            
            // The maximum safe length for the title portion before Windows paths break
            const MAX_SAFE_LENGTH = 80;
            const isTooLong = formattedCleanTitle.length > MAX_SAFE_LENGTH;

            if (isPromptEnabled) {
                // If they explicitly turned on "always prompt", trim it for the prompt box
                promptForCustomTitle(formattedCleanTitle.substring(0, MAX_SAFE_LENGTH), (newCustomTitle) => {
                    executeDownload(newCustomTitle);
                });
            } else if (isTooLong && truncateRule === 'prompt') {
                // FIX: They didn't have always prompt on, but the file was too long and they asked to be prompted!
                promptForCustomTitle(formattedCleanTitle.substring(0, MAX_SAFE_LENGTH), (newCustomTitle) => {
                    executeDownload(newCustomTitle);
                });
            } else {
                // Normal download, or they have 'auto' trim selected
                if (isTooLong && truncateRule === 'auto') {
                    formattedCleanTitle = formattedCleanTitle.substring(0, MAX_SAFE_LENGTH).trim();
                }
                executeDownload(formattedCleanTitle);
            }
        });
    });
}

setInterval(manageFloatingButton, 500);

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.buttonTheme) {
        const activeBtn = document.getElementById("reddit-custom-dl-btn");
        if (activeBtn) {
            activeBtn.className = `reddit-gallery-dl-btn ${changes.buttonTheme.newValue}`;
            activeBtn.innerHTML = getButtonContent(changes.buttonTheme.newValue);
        }
    }
});