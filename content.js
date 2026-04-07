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

// main button logic
function manageFloatingButton() {
    const isPostPage = window.location.pathname.includes('/comments/') || window.location.pathname.includes('/gallery/');
    let btn = document.getElementById('reddit-custom-dl-btn');

    // Make sure it appears even if Reddit uses #lightbox in the URL
    if (!isPostPage && !window.location.href.includes('#lightbox')) {
        if (btn) btn.remove();
        return;
    }
    if (btn) return;

    btn = document.createElement("button");
    btn.id = "reddit-custom-dl-btn";

    // grab the setting and build the initial button
    chrome.storage.sync.get({ buttonTheme: 'theme-native' }, (settings) => {
        btn.className = `reddit-gallery-dl-btn ${settings.buttonTheme}`;
        btn.innerHTML = getButtonContent(settings.buttonTheme);
    });

    document.body.appendChild(btn);

    btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevents clicking the button from closing the Reddit lightbox

        let originalText = btn.innerHTML;
        let currentTheme = Array.from(btn.classList).find(c => c.startsWith('theme-')) || 'theme-native';
        btn.innerHTML = getLoadingText(currentTheme);

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

        let cleanTitle = rawTitle.replace(/[\\/:*?"<>|]/g, "").substring(0, 45).trim();
        let currentUrl = window.location.href.split('?')[0].split('#')[0].replace(/\/$/, "");

        chrome.runtime.sendMessage({
            action: "fetchAndDownload",
            url: currentUrl,
            title: cleanTitle
        }, (response) => {
            if (response && response.success) {
                btn.innerHTML = getSuccessText(currentTheme, response.count);
            } else {
                btn.innerHTML = getFailText(currentTheme);
            }
            setTimeout(() => btn.innerHTML = originalText, 3000);
        });
    });
}

setInterval(manageFloatingButton, 500);

// Watch for live changes from the popup
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.buttonTheme) {
        const activeBtn = document.getElementById("reddit-custom-dl-btn");
        if (activeBtn) {
            activeBtn.className = `reddit-gallery-dl-btn ${changes.buttonTheme.newValue}`;
            activeBtn.innerHTML = getButtonContent(changes.buttonTheme.newValue);
        }
    }
});