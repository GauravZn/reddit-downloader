function manageFloatingButton() {
    const isPostPage = window.location.href.includes('/comments/');
    let btn = document.getElementById('gallery-grabber-btn');

    if (!isPostPage) {
        if (btn) btn.remove();
        return;
    }
    if (btn) return;

    btn = document.createElement("button");
    btn.id = "gallery-grabber-btn";
    btn.innerHTML = `
        <span style="margin-right: 10px; font-size: 18px;">🚀</span>
        <span>Download Gallery</span>
    `;

    // --- PREMIUM PILL STYLING ---
    const style = btn.style;
    style.position = "fixed";
    style.bottom = "30px";
    style.right = "30px";
    style.zIndex = "999999";
    style.padding = "14px 28px";
    style.background = "linear-gradient(135deg, #FF4500 0%, #FF8C00 100%)";
    style.color = "white";
    style.border = "none";
    style.borderRadius = "50px";
    style.cursor = "pointer";
    style.fontSize = "16px";
    style.fontWeight = "bold";
    style.display = "flex";
    style.alignItems = "center";
    style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    style.boxShadow = "0 10px 20px rgba(255, 69, 0, 0.3)";
    style.transition = "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";

    btn.onmouseover = () => {
        style.transform = "translateY(-5px) scale(1.05)";
        style.boxShadow = "0 15px 25px rgba(255, 69, 0, 0.4)";
    };
    btn.onmouseout = () => {
        style.transform = "translateY(0) scale(1)";
        style.boxShadow = "0 10px 20px rgba(255, 69, 0, 0.3)";
    };

    document.body.appendChild(btn);

    btn.addEventListener("click", (e) => {
        e.preventDefault();
        let originalText = btn.innerHTML;
        btn.innerHTML = "⏳ Fetching...";

        let rawTitle = "";
        let currentPath = window.location.pathname;

        // 1. Find all posts currently loaded in the infinite scroll
        const allPosts = document.querySelectorAll('shreddit-post');
        let activePost = null;

        // 2. Find the exact post that matches your current URL
        for (let post of allPosts) {
            let permalink = post.getAttribute('permalink');
            // Check if the post's permalink matches our current browser path
            if (permalink && currentPath.includes(permalink.replace(/\/$/, ""))) {
                activePost = post;
                break;
            }
        }

        // 3. Fallback to the first post if URL matching fails
        if (!activePost) activePost = document.querySelector('shreddit-post');

        // Extract the title
        if (activePost && activePost.getAttribute('post-title')) {
            rawTitle = activePost.getAttribute('post-title');
        }
        // 4. Ultimate Fallback: The browser tab title (Reddit updates this dynamically)
        else if (document.title) {
            rawTitle = document.title.split(' : ')[0].split(' | ')[0];
        }
        else {
            const standardH1 = document.querySelector('h1');
            if (standardH1) rawTitle = standardH1.innerText;
        }

        // --- Fallback to Timestamp if all else fails ---
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
            if (response && response.success) {
                btn.innerHTML = `✅ ${response.count} Files Saved!`;
            } else {
                btn.innerHTML = "❌ No Images";
            }
            setTimeout(() => btn.innerHTML = originalText, 3000);
        });
    });
}

setInterval(manageFloatingButton, 500);