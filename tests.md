# Test plan — Reddit Picture Gallery Downloader

Run through this before publishing a new version to the Chrome Web Store. Sections are independent; tackle them in any order. If you only have five minutes, skip to the [smoke test](#smoke-test-5-minutes) at the bottom.

> Conventions: `[ ]` is the action you take. `→` is what you should observe. If something doesn't match, file it as a bug before shipping.

---

## 0. Setup before testing

- [ ] Disable any *other* Reddit downloader extensions you might have installed — they'll fight over the same buttons and confuse the test.
- [ ] At `chrome://extensions`: enable **Developer mode**, click **Load unpacked**, and point it at the project folder.
- [ ] At `chrome://settings/downloads`: turn **OFF** "Ask where to save each file before downloading". Otherwise every gallery test will spam Save dialogs and you'll lose your mind.
- [ ] Note your base download folder. Open it in a file explorer alongside Chrome so you can verify what lands.
- [ ] Open DevTools on a Reddit post (F12) and keep the Console tab visible. Errors there tell you something's broken even when the UI looks fine.

---

## 1. First-run / onboarding

- [ ] Fresh install (or remove + re-add the unpacked extension).
- [ ] → A new tab opens automatically pointing at `welcome.html`.
- [ ] → The page renders both in light mode and dark mode (toggle Chrome's theme to confirm).
- [ ] Click **"Got it, close tab"** → tab closes.
- [ ] Re-add the extension, click **"⚙️ Customize Naming"** instead → options page opens.
- [ ] Reload the *unpacked* extension (don't remove). → The welcome tab does **NOT** open again. (Welcome only triggers on `INSTALL`, not `UPDATE`.)

---

## 2. Toolbar popup

- [ ] Click the toolbar icon. → Popup opens at 340 px wide.
- [ ] Header reads **"Reddit Gallery Downloader · v2.2"** (or whatever the manifest version is). The version comes from `chrome.runtime.getManifest()` — not a hardcoded string.
- [ ] **Base Download Folder** input is pre-filled with `reddit_downloads` (or your last-saved value).
- [ ] **Download Mode** dropdown shows three options. Selecting each updates the helper text below.
- [ ] **Custom Button Label** is empty by default. Helper text is visible.
- [ ] **Theme** dropdown lists 11 themes. Selecting each instantly updates the live preview button below.
- [ ] **Position** and **Size** dropdowns update the meta text under the preview ("Bottom Right · Normal", etc.).
- [ ] Click **Save**. → Button flashes green with a checkmark, then the popup auto-closes after about 850 ms.
- [ ] Click **"Customize Naming & Formulas"**. → Options page opens in a new tab.

---

## 3. Live preview matches the actual button

The popup preview and the real floating button now share the same `themes.js` source — they shouldn't drift. Spot-check a handful:

- [ ] Pick **Native** in the popup. Save. Open a Reddit post. → The floating button looks identical to the preview (orange gradient pill with rocket emoji).
- [ ] **Glass** — translucent. Make sure it's actually visible against a real Reddit post (the preview's background isn't an image, so a small visual gap is OK as long as the button's clearly there).
- [ ] **Neon** — black with cyan glow and outline. The real button glows the same way.
- [ ] **Soft** — neumorphic shadows.
- [ ] Hover over the floating button on Reddit — it lifts/shadows-up. Hover the popup preview — same hover effect.

Anything wildly different between popup and reality means `themes.js` got out of sync somehow.

---

## 4. Floating button visibility on different page types

- [ ] `https://www.reddit.com/` (home feed) → button **NOT** visible.
- [ ] `https://www.reddit.com/r/pics/` (subreddit feed) → button **NOT** visible.
- [ ] `https://www.reddit.com/r/pics/comments/abc123/something/` (post page) → button **visible**.
- [ ] `https://www.reddit.com/gallery/abc123/` → button **visible**.
- [ ] On a post with a gallery, click an image to open Reddit's lightbox. URL becomes `…/#lightbox`. → Button **stays visible** on top of the lightbox overlay. (This is the v2.2 fix.)
- [ ] Close the lightbox. → Button stays visible on the post.
- [ ] Navigate (in same tab) back to the home feed. → Button disappears.
- [ ] Navigate forward to another post. → Button reappears.

Old reddit:

- [ ] `https://old.reddit.com/r/pics/comments/abc123/something/` → button **visible** (old reddit URLs still match `/comments/`).

---

## 5. Folder Mode download

- [ ] Open the popup, set Download Mode = **Folder**, save.
- [ ] Open a 4-image gallery (try r/pics, r/wallpapers, r/EarthPorn).
- [ ] Click Download Gallery.
- [ ] → Button reads `Downloading...` (no hourglass emoji), then `✅ 4 Files Saved!`.
- [ ] In your downloads folder, a new sub-folder appears named per the **Folder Naming Formula** (default: subreddit name).
- [ ] Inside the sub-folder: 4 image files named per the **Image Filename Formula** (default: `Title 01`, `Title 02`, etc).
- [ ] All 4 images open at full resolution in your image viewer.
- [ ] Filenames don't contain weird characters (no `<`, `>`, `:`, etc.).

---

## 6. ZIP Mode download

- [ ] Switch Download Mode = **ZIP**, save.
- [ ] Click Download on the same gallery.
- [ ] → A `.zip` file lands directly in your base downloads folder. No sub-folder.
- [ ] Extract the zip. → Filenames inside match the ZIP-mode "Image Filename Formula".
- [ ] All images open correctly.
- [ ] Try with a 12+ image gallery to stress the data-URL roundtrip the service worker uses for ZIP files.

---

## 7. Individual Mode download

- [ ] Switch Download Mode = **Individual**, save.
- [ ] Click Download.
- [ ] → Images land directly in your base folder. **No sub-folder, no zip.**
- [ ] Filenames follow the Individual-mode formula.

---

## 8. WebP conversion

This is the v2.2 headline. Reddit's preview CDN often serves `.webp` and Windows Photos can't open them.

- [ ] Find a recent image post. Open DevTools → Network → filter for "img". Click Download. Look at the source URLs in the JSON — they often end in `.webp`.
- [ ] Verify the saved files have `.jpg` extension, not `.webp`.
- [ ] Open one in Windows Photos / macOS Preview / your default image viewer. → Displays normally.
- [ ] Find a *single-image* WebP post (not a gallery — just a regular link post that resolves to a `.webp` URL). Click Download. → File downloads as `.jpg`. (This was the v2.2 single-image-fallback fix; pre-2.2 it was silently dropped with "No Images".)
- [ ] Find a JPG-only gallery (older posts often work). Download. → Saves quickly, no conversion overhead. (Direct `chrome.downloads` path, not the fetch+decode+re-encode path.)
- [ ] In ZIP mode, download a WebP gallery. → ZIP contains `.jpg` files, not `.webp`.

Cross-check: open `chrome://extensions` → click **service worker** under your extension → console should be quiet (no `WebP -> JPEG conversion failed` warnings unless something genuinely went wrong).

---

## 9. Missing-title behavior

- [ ] Find a post with no real title or one whose title is generic boilerplate ("reddit.com" etc.). If you can't find one organically, you can simulate by clearing the prompt in test 10 below.
- [ ] Default `missingTitle: 'omit'` → saved filename does NOT contain the word "Title" or any timestamp string. Title pill is omitted entirely.
- [ ] Open Options. Switch the rule to **Use a placeholder**. Leave the placeholder text input blank. Save.
- [ ] Download the same post. → File now contains "No Title".
- [ ] Type a custom placeholder ("MyDefault"). Save. Download again. → File contains "MyDefault".
- [ ] In Options, with rule = **Omit title from name**, the placeholder text input should be hidden (no dangling input box).

---

## 10. Title prompt

- [ ] Enable **Prompt for Custom Title before downloading** in Options. Save.
- [ ] Click Download on any post. → Browser's native prompt opens, pre-filled with the post's title.
- [ ] While the prompt is open, try Reddit shortcuts (J, K, /). → They do NOT do anything. The native prompt blocks page-level keystrokes.
- [ ] Press Enter without changing anything. → File saves with the original title.
- [ ] Try again, type a custom name. → File saves with custom name.
- [ ] Try again, press Esc. → Download cancels. The button returns to ready state without leaving "Downloading..." stuck.
- [ ] Find a titleless post (or test the fallback another way). Click Download with prompt enabled. → Default value in the prompt is a timestamp like `Untitled-2026-05-06-14-30` formatted with your **Date Format** + **Date Separator** + **Element Separator** + **Time Format** settings.
- [ ] Switch Date Format to **Day, Month, Year** + Date Separator to **Dot** + Element Separator to **Underscore**. Save. Trigger the fallback prompt again. → Default updates to something like `Untitled_06.05.2026_14_30`. (This is the v2.2 fix — used to be hardcoded `May-6-2026_14-30`.)

---

## 11. Path-too-long handling

- [ ] Find a post with a very long title (>110 chars; some news/announcement subs have these).
- [ ] Default `truncate: 'auto'` → title gets cut to 110 chars, file saves successfully.
- [ ] Switch to **Ask User and Halt Download**. Save.
- [ ] Click Download on the long-title post. → Native prompt appears asking you to confirm/edit the title. Submit. → File saves with whatever you submitted.

---

## 12. Single-image galleries

- [ ] Find a single-image post (not a gallery — just one image).
- [ ] Default `singleFileIndex: 'never'` → file saves WITHOUT an `_01` suffix.
- [ ] Switch to **Always add index**. Save. Re-download. → File now has the index suffix in your chosen index style (`01`, `(01)`, or `[01]`).

---

## 13. Filename builder (drag-and-drop)

- [ ] Open Options. In the **Folder Mode** tab, drag pills around in the **Folder Naming Formula** and **Image Filename Formula** dropzones.
- [ ] → Live preview at the bottom of the panel updates as pills move.
- [ ] Double-click a pill in a formula. → It disappears. Preview updates.
- [ ] Empty a formula entirely. → Preview shows a random hash (e.g. `a3b7c9d1`). At download time, this gets replaced with a fresh hash so the file still has a name.
- [ ] Click **+ Add Static Text** in the toolbox. Type "MyPrefix". Press Enter. → New pill appears in the toolbox.
- [ ] Drag the static-text pill into a formula. Preview updates.
- [ ] Drop the pill back in the toolbox or another formula. Confirm it works as a regular pill.
- [ ] Save settings. Reload the options page (close + reopen the tab). → Custom static text pill is still in the toolbox. Formulas still match what you saved.

Edge cases:

- [ ] In a formula with multiple static text pills back-to-back (e.g. `[Title][MyPrefix][Index]`), the separator between Title and Index is omitted because static text pills don't add separators on either side. Preview should reflect this.
- [ ] Static text containing forbidden filesystem chars (`<`, `>`, `:`, `"`, `/`, `\`, `|`, `?`, `*`) → They get replaced with `-` and a toast notifies you.

---

## 14. Format options

In Options, **Element Format Options** section:

- [ ] **Title Case** — try Original / lowercase / UPPERCASE / Title Case / Sentence case. Live preview's Title element changes accordingly.
- [ ] **Title Space Options**:
    - "Match Element Separator" → uses whatever Element Separation Character is set to.
    - "Keep spaces in title" → preserves spaces.
    - "Underscore" / "Dash" / "None" → literal char.
- [ ] **Date Format** — try each option. Date element in preview changes (Year-Month-Day vs Day-Month-Year etc.).
- [ ] **Date Separator** — character between date parts. Try dash / underscore / dot / space / none. Preview updates.
- [ ] **Time Format** — `24h` shows `14:30:00`-style; `12h` adds `AM`/`PM` at the end with the file separator (e.g. `02-30-00-PM`).
- [ ] **Index Format** — `01` / `(01)` / `[01]`.
- [ ] **Unique ID Format** — Hex (e.g. `a1b2c3`) or Numeric (e.g. `987654`).
- [ ] **Folder Separator** vs **Element Separation Character** — change one, only the relevant pieces of the preview update. Folder Separator only affects folder/ZIP-archive names; Element Separation affects image filenames.
- [ ] In **Individual Mode**, the Folder Separator dropdown is hidden (irrelevant since there's no folder).

---

## 15. Three modes have independent settings

- [ ] In **Folder Mode** tab, set the folder formula to `Subreddit + Author + Title`. Save.
- [ ] Switch to **ZIP Mode** tab. The archive formula should still be the saved ZIP formula (default: just Title), NOT what you set in Folder.
- [ ] Same check for **Individual Mode**.
- [ ] Same for fallback rules: each tab has its own truncate / missingTitle / singleFileIndex settings.

---

## 16. Themes (visual sweep)

For each of the 11 themes, set it via the popup, save, open a Reddit post, and confirm:

| Theme | Visual cue | Hover effect |
|---|---|---|
| Native | Orange gradient pill + rocket emoji | Lifts 3px, shadow grows |
| Premium | Black, sleek, no rocket on minimal status text | Background lightens to #202020 |
| Modern | Solid blue | Darker blue, lifts 2px |
| Minimal | White pill with light gray border | Light gray bg, border darkens |
| Glass | Translucent | Slightly more opaque |
| Gradient | Purple/pink/orchid gradient | Lifts 3px |
| Neon | Black bg, cyan border + glow + text-shadow | Glow intensifies |
| Soft | Neumorphic, soft outer shadows | Inset shadow on hover |
| Mint | Green pill | Darker green |
| Sunset | Red/yellow gradient | Lifts, shadow grows |
| Mono | Outline only, color matches Reddit text | Slight bg tint |

- [ ] Loading state (`Downloading...`) shows during fetch on every theme.
- [ ] Success state (`✅ X Files Saved!` or `X Saved` for minimal themes premium/mono/neon) shows after.
- [ ] Failure state (`❌ No Images` or `No Images`) shows when fetch fails.

---

## 17. Position and size

- [ ] Try each position: bottom-right, bottom-left, top-right, top-left. Confirm the floating button actually moves to the right corner.
- [ ] Try each size: compact, normal, large. Padding and font-size visibly scale.
- [ ] At top-left + Reddit's own header, the button doesn't get overlapped by Reddit's UI (it's `top: 80px` to clear the header).

---

## 18. Custom button label

- [ ] Type `Get them` in the popup's Custom Button Label. Save. → Reddit button reads exactly `Get them`. No rocket emoji.
- [ ] Type `🐸 Save it` → button reads `🐸 Save it`.
- [ ] Type `🚀 Download Gallery` (or any string with a rocket) → rocket appears as part of your typed string.
- [ ] Clear the label (back to empty). Save. → Button reverts to default `🚀 Download Gallery`.
- [ ] Live preview in the popup mirrors all of the above.

---

## 19. Mid-download settings change

This is a v2.2 fix — the button used to flicker back to the default label if you saved settings during a download.

- [ ] Open a post with 10+ images (slower download = bigger window to test).
- [ ] Click Download. Button shows `Downloading...`.
- [ ] Quickly open the popup, change the theme, click Save.
- [ ] → Button's color/styling updates immediately. The text stays `Downloading...` (does NOT flicker back to default).
- [ ] When the download completes, button shows `✅ X Files Saved!`. After 3 seconds, it reverts to the *new* theme's default label (not the old one). Mid-download label changes also propagate.

---

## 20. Alt + D keyboard shortcut

- [ ] Default state: shortcut is enabled.
- [ ] Open a post. Press **Alt + D**. → Download starts (same as clicking the button).
- [ ] Click into a comment box. Press Alt + D while typing. → Should NOT trigger the download. Your `D` lands as a character in the comment.
- [ ] Click into Reddit's search bar. Press Alt + D. → Same — typing wins.
- [ ] Press **Ctrl + Alt + D**. → Should NOT trigger the download (modifier safety — only plain Alt + D triggers).
- [ ] Press **Alt + Shift + D**. → Same, no trigger.
- [ ] In Options, turn OFF the keyboard shortcut. Save.
- [ ] Open a Reddit post (or refresh the existing tab so the change picks up). Press Alt + D. → Nothing happens.
- [ ] Re-enable. Save. Refresh. → Shortcut works again.

---

## 21. Backup / Reset

- [ ] In Options, set up a clearly distinctive config: weird formula, custom static text pill, every formatting option different from default, missing-title rule = placeholder with custom text, etc.
- [ ] Click **Export Settings**. → JSON file downloads, named `reddit-gallery-downloader-settings-YYYY-MM-DD.json`.
- [ ] Open the JSON in a text editor — confirm it has `globalPrefs`, `modeState`, `toolboxStaticTextDefs`, `_exportFormat: 1`, `_exportedAt`.
- [ ] Click **Reset to Defaults**. Confirm in the dialog. → All settings revert. The custom static text pill disappears.
- [ ] Click **Import Settings**. Pick the JSON. Confirm "Import & Replace". → All your settings restore exactly.
- [ ] Reload the options page. → Settings still match.
- [ ] Open a Reddit post. → Floating button reflects restored theme/position/size.
- [ ] Try importing a malformed JSON file (any random JSON). → Toast shows "That file does not look like a valid settings export." No settings change.
- [ ] Try importing a non-JSON file (rename a `.txt` to `.json`). → Toast shows "Could not parse that file."

---

## 22. Edge cases (graceful failure)

- [ ] **Deleted post** — paste a URL of a known-deleted post (one with `[removed]` content). Click Download. → "❌ No Images" or similar graceful failure. No crash. No console errors that would scare a user.
- [ ] **Private subreddit** (you're not a member) — Download. → Same graceful failure.
- [ ] **Self-text post** (no images, just text) — Download. → "No Images".
- [ ] **Video post** — Download. → "No Images". (Videos are intentionally not supported.)
- [ ] **Cross-post** of an image post — Download. → Should still get the original images.
- [ ] **Post with externally-hosted images** (e.g. imgur, gfycat) — depends on URL. If post.url ends in `.jpg/.png/.gif/.webp` → downloads. Otherwise → "No Images".
- [ ] **Network offline** — Disable internet. Click Download. → "❌ No Images" eventually. Re-enable internet. Try again. → Works.

---

## 23. Storage sync (only if you actually use Chrome sync)

- [ ] Sign into Chrome on Machine A. Configure the extension. Save.
- [ ] Sign into the same Chrome account on Machine B. Install the extension fresh.
- [ ] Open the options page on Machine B. → Settings should match Machine A within a minute or two (Chrome's sync isn't instant).

If you don't have two machines, skip this.

---

## 24. Onboarding link (welcome page)

- [ ] On the welcome page, the `chrome://settings/downloads` reference is shown as a styled badge, not a clickable link. (Chrome blocks `chrome://` from being linked from extension pages — that's an OS-level restriction, not a bug.) → User can read and copy the URL.

---

## 25. Console hygiene

Throughout testing, keep an eye on the browser console (F12 → Console) and the service-worker console (`chrome://extensions` → **service worker** under your extension):

- [ ] No `Uncaught` errors at any point. (Warnings about WebP fallbacks are OK if you intentionally hit them.)
- [ ] No CSP violations.
- [ ] No deprecation warnings about manifest V2 → V3 APIs.

---

## Smoke test (5 minutes)

If you're short on time, just do these six. If they all pass, ship it:

1. Install fresh → welcome tab opens.
2. Open a 4-image gallery, default settings, click Download → folder created, 4 images saved with correct names.
3. Open the lightbox by clicking an image → button still visible on top.
4. Switch to ZIP mode → re-download → ZIP arrives, contents look right.
5. Pick a non-default theme (Neon) → Reddit button matches popup preview, including hover effect.
6. Find a single-image WebP post → download → file is `.jpg` and opens cleanly.

---

## When something fails

Before filing it as a bug:

1. Note the exact post URL, the exact settings, and what the button/console showed.
2. Check the service worker console for warnings/errors.
3. Reload the extension (`chrome://extensions` → reload icon) and try once more — sometimes Chrome caches old service workers.
4. If still broken, capture a screen recording before changing anything, then file it.
