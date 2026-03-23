// Helper to find the post we are currently looking at
function getActivePost() {
    let currentPath = window.location.pathname;
    const allPosts = document.querySelectorAll('shreddit-post');
    for (let post of allPosts) {
        let permalink = post.getAttribute('permalink');
        if (permalink && currentPath.includes(permalink.replace(/\/$/, ""))) {
            return post;
        }
    }
    return document.querySelector('shreddit-post');
}

function manageFloatingButton() {
    const isPostPage = window.location.href.includes('/comments/');
    let btn = document.getElementById('gallery-grabber-btn');

    if (!isPostPage) {
        if (btn) btn.remove();
        return;
    }

    // 1. Determine the core post type (image, gallery, text, video)
    let activePost = getActivePost();
    let postType = activePost ? activePost.getAttribute('post-type') : 'unknown';
    
    // --- THE CLEAN UX DYNAMIC BUTTON STATES ---
    let buttonText = "Download Media";
    let buttonIcon = "🚀";
    let isSupported = true;

    if (postType === 'image') {
        buttonText = "Download Image";
        buttonIcon = "🖼️";
    } else if (postType === 'gallery') {
        buttonText = "Download Gallery";
        buttonIcon = "🚀";
    } else if (postType === 'text') {
        buttonText = "Download Post (Text)";
        buttonIcon = "📄";
    } else if (postType === 'video') {
        buttonText = "Video Not Supported";
        buttonIcon = "⚠️";
        isSupported = false;
    } else if (postType === 'link') {
        buttonText = "Link Not Supported";
        buttonIcon = "🔗";
        isSupported = false;
    }

    // Inject the button if it doesn't exist yet
    if (!btn) {
        btn = document.createElement("button");
        btn.id = "gallery-grabber-btn";
        document.body.appendChild(btn);
    }

    let stateKey = postType;

    // Update button styling and logic dynamically as you scroll
    if (btn.dataset.stateKey !== stateKey && btn.dataset.fetching !== "true" && !btn.innerHTML.includes("✅") && !btn.innerHTML.includes("❌")) {
        
        btn.innerHTML = `
            <span style="margin-right: 10px; font-size: 18px;">${buttonIcon}</span>
            <span>${buttonText}</span>
        `;
        
        btn.dataset.stateKey = stateKey;

        // Base Styling
        const style = btn.style;
        style.position = "fixed";
        style.bottom = "30px";
        style.right = "30px";
        style.zIndex = "999999";
        style.padding = "14px 28px";
        style.border = "none";
        style.borderRadius = "50px";
        style.fontSize = "16px";
        style.fontWeight = "bold";
        style.display = "flex";
        style.alignItems = "center";
        style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        style.transition = "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";

        // Change colors based on if we support the media or not
        if (isSupported) {
            style.background = "linear-gradient(135deg, #FF4500 0%, #FF8C00 100%)";
            style.color = "white";
            style.cursor = "pointer";
            style.boxShadow = "0 10px 20px rgba(255, 69, 0, 0.3)";
            style.opacity = "1";
            
            btn.onmouseover = () => {
                style.transform = "translateY(-5px) scale(1.05)";
                style.boxShadow = "0 15px 25px rgba(255, 69, 0, 0.4)";
            };
            btn.onmouseout = () => {
                style.transform = "translateY(0) scale(1)";
                style.boxShadow = "0 10px 20px rgba(255, 69, 0, 0.3)";
            };
        } else {
            // Greyed out / Disabled look for unsupported media
            style.background = "#4a4a4a"; 
            style.color = "#aaaaaa"; 
            style.cursor = "not-allowed";
            style.boxShadow = "none";
            style.opacity = "0.8";
            style.transform = "none";
            
            btn.onmouseover = null;
            btn.onmouseout = null;
        }

        // The Click Listener
        btn.onclick = (e) => {
            e.preventDefault();
            
            if (!isSupported) return; 

            let originalText = btn.innerHTML;
            btn.dataset.fetching = "true";
            btn.innerHTML = "⏳ Fetching...";
            btn.style.transform = "scale(0.95)";

            // Grab title logic
            let currentActivePost = getActivePost();
            let rawTitle = "";
            
            if (currentActivePost && currentActivePost.getAttribute('post-title')) {
                rawTitle = currentActivePost.getAttribute('post-title');
            } else if (document.title) {
                rawTitle = document.title.split(' : ')[0].split(' | ')[0];
            } else {
                const standardH1 = document.querySelector('h1');
                if (standardH1) rawTitle = standardH1.innerText;
            }

            if (!rawTitle || rawTitle.trim().length === 0 || rawTitle.includes('reddit: the front page')) {
                const now = new Date();
                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                rawTitle = `${months[now.getMonth()]}-${now.getDate()}-${now.getFullYear()}_${now.getHours()}-${now.getMinutes()}`;
            }

            let cleanTitle = rawTitle.replace(/[\\/:*?"<>|]/g, "").substring(0, 80).trim();
            let currentUrl = window.location.href.split('?')[0].split('#')[0].replace(/\/$/, "");

            chrome.runtime.sendMessage({
                action: "fetchAndDownload",
                url: currentUrl,
                title: cleanTitle
            }, (response) => {
                btn.dataset.fetching = "false";
                btn.style.transform = "scale(1)";
                
                if (response && response.success) {
                    if (response.texts > 0) {
                        btn.innerHTML = `✅ Text File Saved!`;
                    } else {
                        btn.innerHTML = `✅ ${response.count} file` + (response.count > 1 ? "s" : "") + ` saved!`;
                    }
                } else {
                    btn.innerHTML = "❌ No media/text found";
                }
                
                setTimeout(() => btn.dataset.stateKey = "reset", 3000);
            });
        };
    }
}

setInterval(manageFloatingButton, 500);