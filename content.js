const MAX_SAFE_LENGTH = 110;

const themeStyles = `
  /* Base Structure */
  .reddit-gallery-dl-btn {
    position: fixed !important;
    z-index: 2147483647 !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
    transition: all 0.2s ease-in-out !important;
    font-weight: 600 !important;
  }

  /* Position variants */
  .reddit-gallery-dl-btn[data-pos="bottom-right"] { bottom: 30px !important; right: 30px !important; top: auto !important; left: auto !important; }
  .reddit-gallery-dl-btn[data-pos="bottom-left"]  { bottom: 30px !important; left: 30px !important; top: auto !important; right: auto !important; }
  .reddit-gallery-dl-btn[data-pos="top-right"]    { top: 80px !important; right: 30px !important; bottom: auto !important; left: auto !important; }
  .reddit-gallery-dl-btn[data-pos="top-left"]     { top: 80px !important; left: 30px !important; bottom: auto !important; right: auto !important; }

  /* Size variants */
  .reddit-gallery-dl-btn[data-size="compact"] { padding: 8px 16px !important; font-size: 13px !important; }
  .reddit-gallery-dl-btn[data-size="normal"]  { padding: 14px 28px !important; font-size: 15px !important; }
  .reddit-gallery-dl-btn[data-size="large"]   { padding: 18px 36px !important; font-size: 17px !important; }

  /* Theme variants */
  .reddit-gallery-dl-btn[data-theme="theme-native"] { background: linear-gradient(135deg, #FF4500 0%, #FF8C00 100%) !important; color: white !important; border: none !important; border-radius: 50px !important; box-shadow: 0 8px 16px rgba(255, 69, 0, 0.25) !important; }
  .reddit-gallery-dl-btn[data-theme="theme-native"]:hover { transform: translateY(-3px) !important; box-shadow: 0 12px 20px rgba(255, 69, 0, 0.35) !important; }

  .reddit-gallery-dl-btn[data-theme="theme-premium"] { background-color: #0F0F0F !important; color: #FFFFFF !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 8px !important; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important; letter-spacing: 0.3px !important; }
  .reddit-gallery-dl-btn[data-theme="theme-premium"]:hover { background-color: #202020 !important; transform: translateY(-2px) !important; box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4) !important; }

  .reddit-gallery-dl-btn[data-theme="theme-modern"] { background-color: #1A73E8 !important; color: #FFFFFF !important; border: none !important; border-radius: 8px !important; box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3) !important; }
  .reddit-gallery-dl-btn[data-theme="theme-modern"]:hover { background-color: #1557B0 !important; transform: translateY(-2px) !important; box-shadow: 0 6px 16px rgba(26, 115, 232, 0.4) !important; }

  .reddit-gallery-dl-btn[data-theme="theme-minimal"] { background-color: #FFFFFF !important; color: #3C4043 !important; border: 1px solid #DADCE0 !important; border-radius: 8px !important; box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }
  .reddit-gallery-dl-btn[data-theme="theme-minimal"]:hover { background-color: #F8F9FA !important; color: #202124 !important; border-color: #BDC1C6 !important; transform: translateY(-2px) !important; box-shadow: 0 4px 10px rgba(0,0,0,0.1) !important; }

  .reddit-gallery-dl-btn[data-theme="theme-glass"] { background: rgba(255,255,255,0.15) !important; backdrop-filter: blur(14px) saturate(180%) !important; -webkit-backdrop-filter: blur(14px) saturate(180%) !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.25) !important; border-radius: 12px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important; }
  .reddit-gallery-dl-btn[data-theme="theme-glass"]:hover { background: rgba(255,255,255,0.22) !important; transform: translateY(-2px) !important; }

  .reddit-gallery-dl-btn[data-theme="theme-gradient"] { background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%) !important; color: #ffffff !important; border: none !important; border-radius: 12px !important; box-shadow: 0 8px 24px rgba(118, 75, 162, 0.4) !important; }
  .reddit-gallery-dl-btn[data-theme="theme-gradient"]:hover { transform: translateY(-3px) !important; box-shadow: 0 12px 32px rgba(118, 75, 162, 0.5) !important; }

  .reddit-gallery-dl-btn[data-theme="theme-neon"] { background-color: #0a0a0a !important; color: #00ffd1 !important; border: 1px solid #00ffd1 !important; border-radius: 6px !important; box-shadow: 0 0 12px rgba(0, 255, 209, 0.5), inset 0 0 8px rgba(0, 255, 209, 0.1) !important; text-shadow: 0 0 6px rgba(0, 255, 209, 0.7) !important; letter-spacing: 0.5px !important; }
  .reddit-gallery-dl-btn[data-theme="theme-neon"]:hover { box-shadow: 0 0 18px rgba(0, 255, 209, 0.7), inset 0 0 12px rgba(0, 255, 209, 0.15) !important; transform: translateY(-2px) !important; }

  .reddit-gallery-dl-btn[data-theme="theme-soft"] { background-color: #f0f0f3 !important; color: #2d3748 !important; border: none !important; border-radius: 16px !important; box-shadow: 6px 6px 12px rgba(174, 174, 192, 0.5), -6px -6px 12px rgba(255, 255, 255, 0.95) !important; }
  .reddit-gallery-dl-btn[data-theme="theme-soft"]:hover { box-shadow: inset 4px 4px 8px rgba(174, 174, 192, 0.4), inset -4px -4px 8px rgba(255,255,255,0.9) !important; }

  .reddit-gallery-dl-btn[data-theme="theme-mint"] { background-color: #10B981 !important; color: #FFFFFF !important; border: none !important; border-radius: 50px !important; box-shadow: 0 6px 16px rgba(16, 185, 129, 0.35) !important; }
  .reddit-gallery-dl-btn[data-theme="theme-mint"]:hover { background-color: #059669 !important; transform: translateY(-2px) !important; }

  .reddit-gallery-dl-btn[data-theme="theme-sunset"] { background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 100%) !important; color: #2d1810 !important; border: none !important; border-radius: 50px !important; box-shadow: 0 6px 18px rgba(255, 107, 107, 0.35) !important; }
  .reddit-gallery-dl-btn[data-theme="theme-sunset"]:hover { transform: translateY(-2px) !important; box-shadow: 0 10px 24px rgba(255, 107, 107, 0.45) !important; }

  .reddit-gallery-dl-btn[data-theme="theme-mono"] { background-color: transparent !important; color: currentColor !important; border: 1.5px solid currentColor !important; border-radius: 6px !important; box-shadow: none !important; }
  .reddit-gallery-dl-btn[data-theme="theme-mono"]:hover { background-color: rgba(0,0,0,0.05) !important; }

  /* Custom modal — sits near the button so users don't have to chase the top of the screen */
  .rgd-modal-backdrop {
    position: fixed !important;
    inset: 0 !important;
    background: rgba(0,0,0,0.45) !important;
    z-index: 2147483646 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .rgd-modal {
    position: fixed !important;
    z-index: 2147483647 !important;
    background: #ffffff !important;
    color: #111827 !important;
    border-radius: 12px !important;
    padding: 20px 22px !important;
    width: 380px !important;
    max-width: calc(100vw - 40px) !important;
    box-shadow: 0 20px 50px rgba(0,0,0,0.35) !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
    box-sizing: border-box !important;
  }
  @media (prefers-color-scheme: dark) {
    .rgd-modal { background: #1f2937 !important; color: #f9fafb !important; }
  }
  .rgd-modal h3 { margin: 0 0 6px 0 !important; font-size: 14px !important; font-weight: 500 !important; opacity: 0.7 !important; }
  .rgd-modal .rgd-default {
    background: rgba(128,128,128,0.12) !important;
    padding: 10px 12px !important;
    border-radius: 8px !important;
    font-size: 13px !important;
    margin-bottom: 14px !important;
    word-break: break-word !important;
    border-left: 3px solid #1A73E8 !important;
  }
  .rgd-modal label { display: block !important; font-size: 13px !important; margin-bottom: 6px !important; font-weight: 500 !important; }
  .rgd-modal .rgd-helper { font-size: 11px !important; opacity: 0.65 !important; margin-top: 4px !important; }
  .rgd-modal input[type="text"] {
    width: 100% !important;
    padding: 10px 12px !important;
    border: 1px solid rgba(128,128,128,0.35) !important;
    border-radius: 8px !important;
    font-size: 14px !important;
    box-sizing: border-box !important;
    background: transparent !important;
    color: inherit !important;
    font-family: inherit !important;
  }
  .rgd-modal input[type="text"]:focus { outline: 2px solid #1A73E8 !important; outline-offset: -1px !important; }
  .rgd-modal-actions { display: flex !important; gap: 8px !important; justify-content: flex-end !important; margin-top: 16px !important; }
  .rgd-modal button {
    padding: 8px 16px !important;
    border-radius: 6px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    border: none !important;
    font-family: inherit !important;
  }
  .rgd-btn-primary { background: #1A73E8 !important; color: #ffffff !important; }
  .rgd-btn-primary:hover { background: #1557B0 !important; }
  .rgd-btn-secondary { background: transparent !important; border: 1px solid rgba(128,128,128,0.4) !important; color: inherit !important; }
  .rgd-btn-secondary:hover { background: rgba(128,128,128,0.12) !important; }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = themeStyles;
document.head.appendChild(styleSheet);

const MINIMAL_LABEL_THEMES = new Set(['theme-premium', 'theme-mono', 'theme-neon']);

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getButtonContent(themeName, customLabel) {
    const isMinimal = MINIMAL_LABEL_THEMES.has(themeName);
    if (customLabel) {
        const safe = escapeHtml(customLabel);
        if (isMinimal) return `<span>${safe}</span>`;
        return `<span style="font-size: 18px;">🚀</span><span>${safe}</span>`;
    }
    if (isMinimal) return `<span>Download</span>`;
    return `<span style="font-size: 18px;">🚀</span><span>Download Gallery</span>`;
}

function getLoadingText(themeName) {
    if (MINIMAL_LABEL_THEMES.has(themeName)) return "Fetching...";
    return "⏳ Fetching...";
}

function getSuccessText(themeName, count, total) {
    const trailing = (total && total !== count) ? `${count}/${total}` : `${count}`;
    if (MINIMAL_LABEL_THEMES.has(themeName)) return `${trailing} Saved`;
    return `✅ ${trailing} Files Saved!`;
}

function getFailText(themeName) {
    if (MINIMAL_LABEL_THEMES.has(themeName)) return "No Images";
    return "❌ No Images";
}

// Custom in-page modal that sits anywhere we want and stops Reddit's hotkeys from
// stealing keystrokes (capture-phase listeners + stopImmediatePropagation).
function showTitleModal({ defaultTitle, anchorEl }, callback) {
    const existing = document.getElementById('rgd-modal-root');
    if (existing) existing.remove();

    const root = document.createElement('div');
    root.id = 'rgd-modal-root';

    const backdrop = document.createElement('div');
    backdrop.className = 'rgd-modal-backdrop';

    const modal = document.createElement('div');
    modal.className = 'rgd-modal';

    modal.innerHTML = `
        <h3>www.reddit.com says</h3>
        <div class="rgd-default" id="rgd-default-title"></div>
        <label>Enter a custom title for this gallery:</label>
        <input type="text" id="rgd-title-input" autocomplete="off" spellcheck="false" />
        <div class="rgd-helper">Press <strong>Enter</strong> to save, <strong>Esc</strong> to cancel. Use Ctrl+Arrows to jump words.</div>
        <div class="rgd-modal-actions">
            <button type="button" class="rgd-btn-secondary" id="rgd-cancel">Cancel</button>
            <button type="button" class="rgd-btn-primary" id="rgd-confirm">Download</button>
        </div>
    `;

    backdrop.appendChild(modal);
    root.appendChild(backdrop);
    document.body.appendChild(root);

    const defaultBox = modal.querySelector('#rgd-default-title');
    defaultBox.textContent = defaultTitle || '(no title detected)';

    const input = modal.querySelector('#rgd-title-input');
    input.value = defaultTitle || '';

    // Position modal near the trigger button when possible.
    if (anchorEl) {
        const rect = anchorEl.getBoundingClientRect();
        const modalWidth = 380;
        const modalHeight = 220;

        let left = rect.right - modalWidth;
        if (left < 20) left = 20;
        if (left + modalWidth > window.innerWidth - 20) left = window.innerWidth - modalWidth - 20;

        let top = rect.top - modalHeight - 12;
        if (top < 20) top = rect.bottom + 12;
        if (top + modalHeight > window.innerHeight - 20) top = Math.max(20, window.innerHeight - modalHeight - 20);

        modal.style.position = 'fixed';
        modal.style.left = `${left}px`;
        modal.style.top = `${top}px`;
        modal.style.transform = 'none';
        backdrop.style.alignItems = 'flex-start';
        backdrop.style.justifyContent = 'flex-start';
    }

    // Block Reddit's site-wide keyboard shortcuts while the modal is open. We listen
    // at window-level capture so we run before Reddit's listeners regardless of where
    // they're bound. Only swallow events whose target is inside the modal.
    const swallow = (e) => {
        if (root.contains(e.target)) {
            e.stopImmediatePropagation();
        }
    };
    const swallowEvents = ['keydown', 'keypress', 'keyup'];
    swallowEvents.forEach(evt => window.addEventListener(evt, swallow, true));

    let resolved = false;
    const cleanup = () => {
        if (resolved) return;
        resolved = true;
        swallowEvents.forEach(evt => window.removeEventListener(evt, swallow, true));
        root.remove();
    };

    const finish = (value) => {
        cleanup();
        if (value === null) return; // cancelled
        let typed = (value || '').trim() || "Untitled_Gallery";
        let cleaned = typed.replace(/[\\/:*?"<>|]/g, "");
        callback(cleaned);
    };

    modal.querySelector('#rgd-confirm').addEventListener('click', () => finish(input.value));
    modal.querySelector('#rgd-cancel').addEventListener('click', () => finish(null));
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) finish(null); });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); finish(input.value); }
        else if (e.key === 'Escape') { e.preventDefault(); finish(null); }
    }, true);

    setTimeout(() => { input.focus(); input.select(); }, 0);
}

let cachedSettings = null;

function loadSettings(callback) {
    chrome.storage.sync.get(['buttonTheme', 'buttonPosition', 'buttonSize', 'customButtonLabel', 'keyboardShortcutEnabled', 'globalPrefs', 'modeState', 'useCustomModal'], (s) => {
        cachedSettings = {
            theme: s.buttonTheme || 'theme-native',
            position: s.buttonPosition || 'bottom-right',
            size: s.buttonSize || 'normal',
            customLabel: (s.customButtonLabel || '').trim().slice(0, 40),
            keyboardShortcutEnabled: s.keyboardShortcutEnabled !== false,
            useCustomModal: s.useCustomModal !== false,
            globalPrefs: s.globalPrefs || {},
            modeState: s.modeState || {}
        };
        callback(cachedSettings);
    });
}

function applyButtonAppearance(btn, settings) {
    btn.className = 'reddit-gallery-dl-btn';
    btn.setAttribute('data-theme', settings.theme);
    btn.setAttribute('data-pos', settings.position);
    btn.setAttribute('data-size', settings.size);
    btn.innerHTML = getButtonContent(settings.theme, settings.customLabel);
}

function isPostPage() {
    return window.location.pathname.includes('/comments/') ||
           window.location.pathname.includes('/gallery/') ||
           window.location.href.includes('#lightbox');
}

function manageFloatingButton() {
    let btn = document.getElementById('reddit-custom-dl-btn');

    if (!isPostPage()) {
        if (btn) btn.remove();
        return;
    }
    if (btn) return;

    loadSettings((settings) => {
        // Re-check after async — page may have navigated.
        if (!isPostPage()) return;
        if (document.getElementById('reddit-custom-dl-btn')) return;

        const newBtn = document.createElement("button");
        newBtn.id = "reddit-custom-dl-btn";
        applyButtonAppearance(newBtn, settings);
        document.body.appendChild(newBtn);
        attachClickHandler(newBtn);
    });
}

function getRawTitle() {
    let rawTitle = "";
    const currentPath = window.location.pathname;
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
    return rawTitle;
}

function attachClickHandler(btn) {
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const originalText = btn.innerHTML;
        const currentTheme = btn.getAttribute('data-theme') || 'theme-native';
        const rawTitle = getRawTitle();
        const currentUrl = window.location.href.split('?')[0].split('#')[0].replace(/\/$/, "");

        const executeDownload = (finalTitle) => {
            btn.innerHTML = getLoadingText(currentTheme);

            chrome.runtime.sendMessage({
                action: "fetchAndDownload",
                url: currentUrl,
                title: finalTitle
            }, (response) => {
                if (response && response.success) {
                    btn.innerHTML = getSuccessText(currentTheme, response.count, response.total);
                } else {
                    btn.innerHTML = getFailText(currentTheme);
                }
                setTimeout(() => { btn.innerHTML = originalText; }, 3000);
            });
        };

        chrome.storage.sync.get(['globalPrefs', 'modeState', 'downloadMode', 'useCustomModal'], (data) => {
            const prefs = data.globalPrefs || {};
            const modeState = data.modeState || {};
            const activeMode = data.downloadMode || prefs.activeMode || 'folder';

            const isPromptEnabled = prefs.promptCustomTitle || false;
            const useCustomModal = data.useCustomModal !== false;

            const truncateRule = modeState[activeMode]?.fallbacks?.truncate || 'auto';

            let formattedCleanTitle = rawTitle.replace(/[\\/:*?"<>|]/g, "").trim();
            const isTooLong = formattedCleanTitle.length > MAX_SAFE_LENGTH;

            const promptDefault = formattedCleanTitle.substring(0, MAX_SAFE_LENGTH);

            const askForTitle = (cb) => {
                if (useCustomModal) {
                    showTitleModal({ defaultTitle: promptDefault, anchorEl: btn }, cb);
                } else {
                    // Native fallback — show default in the message body so user sees it before editing.
                    const message =
                        `Default Title:\n${promptDefault}\n\n` +
                        `Enter a custom title for this gallery:\n` +
                        `(Your active separators will be applied to spaces unless Title Spaces is set otherwise)`;
                    const input = window.prompt(message, promptDefault);
                    if (input !== null) {
                        let typed = input.trim() || "Untitled_Gallery";
                        cb(typed.replace(/[\\/:*?"<>|]/g, ""));
                    }
                }
            };

            if (isPromptEnabled) {
                askForTitle(executeDownload);
            } else if (isTooLong && truncateRule === 'prompt') {
                askForTitle(executeDownload);
            } else {
                if (isTooLong && truncateRule === 'auto') {
                    formattedCleanTitle = formattedCleanTitle.substring(0, MAX_SAFE_LENGTH).trim();
                }
                executeDownload(formattedCleanTitle);
            }
        });
    });
}

// MutationObserver replaces the old 500ms polling — orders of magnitude less work.
let observerScheduled = false;
const scheduleCheck = () => {
    if (observerScheduled) return;
    observerScheduled = true;
    requestAnimationFrame(() => {
        observerScheduled = false;
        manageFloatingButton();
    });
};

const bodyObserver = new MutationObserver(scheduleCheck);
const startObserving = () => {
    if (document.body) {
        bodyObserver.observe(document.body, { childList: true, subtree: false });
        scheduleCheck();
    } else {
        setTimeout(startObserving, 50);
    }
};
startObserving();

// Reddit is an SPA — react to route changes that don't trigger DOM mutations on body.
const _pushState = history.pushState;
const _replaceState = history.replaceState;
history.pushState = function () { _pushState.apply(this, arguments); scheduleCheck(); };
history.replaceState = function () { _replaceState.apply(this, arguments); scheduleCheck(); };
window.addEventListener('popstate', scheduleCheck);
window.addEventListener('hashchange', scheduleCheck);

// Alt+D keyboard shortcut. Listens at window level (capture phase) so it runs before
// Reddit's site-wide hotkeys, but bails immediately when:
//   - the shortcut is disabled in settings
//   - the user is typing in any input/textarea/contenteditable
//   - any modifier other than Alt is pressed (so it doesn't collide with Ctrl+Alt+D etc.)
//   - we're not currently on a post/gallery page (no button to click)
function isTypingTarget(target) {
    if (!target) return false;
    if (target.isContentEditable) return true;
    const tag = (target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    // Reddit's reply composer uses shadow DOM editors; check for role.
    const role = target.getAttribute && target.getAttribute('role');
    if (role === 'textbox' || role === 'combobox') return true;
    return false;
}

function handleKeyboardShortcut(e) {
    if (!cachedSettings || cachedSettings.keyboardShortcutEnabled === false) return;
    if (e.key !== 'd' && e.key !== 'D') return;
    if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.repeat) return;
    if (isTypingTarget(e.target)) return;
    // If the modal is open, don't hijack — its own input has its own listeners.
    if (document.getElementById('rgd-modal-root')) return;

    const btn = document.getElementById('reddit-custom-dl-btn');
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();
    btn.click();
}
window.addEventListener('keydown', handleKeyboardShortcut, true);

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'sync') return;
    const relevant = ['buttonTheme', 'buttonPosition', 'buttonSize', 'customButtonLabel', 'useCustomModal', 'keyboardShortcutEnabled'];
    if (!relevant.some(k => changes[k])) return;

    loadSettings((settings) => {
        const activeBtn = document.getElementById("reddit-custom-dl-btn");
        if (activeBtn) applyButtonAppearance(activeBtn, settings);
    });
});
