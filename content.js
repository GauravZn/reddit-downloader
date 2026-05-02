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

  /* 1. Native Reddit (Orange Pill) */
  .theme-native { 
    background: linear-gradient(135deg, #FF4500 0%, #FF8C00 100%) !important; 
    color: white !important; 
    border: none !important; 
    border-radius: 50px !important; 
    box-shadow: 0 8px 16px rgba(255, 69, 0, 0.25) !important; 
  }
  .theme-native:hover { 
    transform: translateY(-3px) !important; 
    box-shadow: 0 12px 20px rgba(255, 69, 0, 0.35) !important; 
  }

  /* 2. Premium Black (No emojis, white text on black) */
  .theme-premium {
    background-color: #0F0F0F !important;
    color: #FFFFFF !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
    letter-spacing: 0.3px !important;
  }
  .theme-premium:hover {
    background-color: #202020 !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4) !important;
  }

  /* 3. Modern Blue (Google/Twitter style) */
  .theme-modern { 
    background-color: #1A73E8 !important; 
    color: #FFFFFF !important; 
    border: none !important; 
    border-radius: 8px !important; 
    box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3) !important;
  }
  .theme-modern:hover { 
    background-color: #1557B0 !important; 
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 16px rgba(26, 115, 232, 0.4) !important;
  }

  /* 4. Minimal Light (Clean white with outline) */
  .theme-minimal { 
    background-color: #FFFFFF !important; 
    color: #3C4043 !important; 
    border: 1px solid #DADCE0 !important; 
    border-radius: 8px !important; 
    box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important;
  }
  .theme-minimal:hover { 
    background-color: #F8F9FA !important;
    color: #202124 !important;
    border-color: #BDC1C6 !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1) !important;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = themeStyles;
document.head.appendChild(styleSheet);

function getButtonContent(themeName) {
    if (themeName === 'theme-premium') {
        return `<span>Download</span>`;
    }
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

// --- CUSTOM TITLE PROMPT UI ---
function promptForCustomTitle(defaultTitle, callback) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.75); z-index: 2147483647; 
        display: flex; justify-content: center; align-items: center;
        backdrop-filter: blur(4px); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: #111111; border: 1px solid #333333; border-radius: 12px;
        padding: 24px 32px; width: 440px; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
        display: flex; flex-direction: column; gap: 16px;
    `;

    const header = document.createElement('h3');
    header.textContent = "Rename Gallery Title";
    header.style.cssText = "margin: 0; color: #ffffff; font-size: 18px; font-weight: 600;";

    const desc = document.createElement('p');
    desc.textContent = "Hit enter to use this formatted default, or type a new name to override it.";
    desc.style.cssText = "margin: 0; color: #9aa0a6; font-size: 13px; line-height: 1.4;";

    const input = document.createElement('input');
    input.type = 'text';
    input.value = defaultTitle;
    input.style.cssText = `
        background: #000000; border: 1px solid #444444; color: #8ab4f8;
        padding: 12px 16px; border-radius: 8px; font-size: 15px; font-weight: 500;
        outline: none; width: 100%; box-sizing: border-box; transition: border-color 0.2s;
    `;
    input.addEventListener('focus', () => input.style.borderColor = '#8ab4f8');
    input.addEventListener('blur', () => input.style.borderColor = '#444444');

    // FIX: BLOCKS REDDIT KEYBOARD SHORTCUTS FROM INTERFERING WITH TYPING
    ['keydown', 'keyup', 'keypress'].forEach(evt => {
        input.addEventListener(evt, (e) => {
            e.stopPropagation();
        });
    });

    const btnRow = document.createElement('div');
    btnRow.style.cssText = "display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px;";

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.cssText = `
        background: transparent; color: #e8eaed; border: none; padding: 10px 16px;
        border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;
    `;
    cancelBtn.addEventListener('mouseover', () => cancelBtn.style.background = 'rgba(255,255,255,0.1)');
    cancelBtn.addEventListener('mouseout', () => cancelBtn.style.background = 'transparent');

    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = "Save & Download";
    downloadBtn.style.cssText = `
        background: #1a73e8; color: #ffffff; border: none; padding: 10px 20px;
        border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s;
    `;
    downloadBtn.addEventListener('mouseover', () => downloadBtn.style.background = '#174ea6');
    downloadBtn.addEventListener('mouseout', () => downloadBtn.style.background = '#1a73e8');

    btnRow.append(cancelBtn, downloadBtn);
    modal.append(header, desc, input, btnRow);
    overlay.append(modal);
    document.body.append(overlay);

    requestAnimationFrame(() => {
        input.focus();
        input.select();
    });

    const triggerDownload = () => {
        const finalTitle = input.value.trim() || "Untitled_Gallery";
        overlay.remove();
        callback(finalTitle); 
    };

    const cancelDownload = () => overlay.remove(); 

    downloadBtn.addEventListener('click', triggerDownload);
    cancelBtn.addEventListener('click', cancelDownload);
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') triggerDownload();
        if (e.key === 'Escape') cancelDownload();
    });
}

// --- MAIN BUTTON LOGIC ---
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

        // Check user settings for the Prompt Toggle and Separator
        chrome.storage.sync.get('globalPrefs', (data) => {
            const prefs = data.globalPrefs || {};
            const isPromptEnabled = prefs.promptCustomTitle || false;
            
            // Apply the user's custom Word Separator to the raw Reddit Title
            let sepFormat = prefs.separatorFormat || 'underscore';
            let sepChar = sepFormat === 'dash' ? '-' : sepFormat === 'space' ? ' ' : sepFormat === 'none' ? '' : '_';
            let formattedCleanTitle = rawTitle.replace(/[\\/:*?"<>|]/g, "").substring(0, 45).trim().split(/\s+/).join(sepChar);
            
            if (isPromptEnabled) {
                promptForCustomTitle(formattedCleanTitle, (newCustomTitle) => {
                    executeDownload(newCustomTitle);
                });
            } else {
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