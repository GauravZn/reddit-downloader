# Reddit Picture Gallery Downloader

> One-click, high-resolution download for Reddit galleries — straight from the post page, in the folder layout *you* choose.

A Chrome extension (Manifest V3) that adds a floating **Download Gallery** button to every Reddit post. Pick a download mode — folder, ZIP, or individual files — name them with a drag-and-drop formula builder, and ship. WebP images are silently re-encoded to JPG so Windows Photos opens them without complaint.

<p align="center">
  <img width="1900" height="929" alt="Screenshot 2026-05-13 123526" src="https://github.com/user-attachments/assets/ca6f0a79-3bf8-4167-833c-4a9ec2dcad85" />
</p>

---

## Table of contents

- [Features](#features)
- [Install](#install)
- [Quick start](#quick-start)
- [Download modes](#download-modes)
- [Naming formulas](#naming-formulas)
- [Tips & recipes](#tips--recipes)
- [Keyboard shortcut](#keyboard-shortcut)
- [Permissions](#permissions)
- [Project structure](#project-structure)
- [Development](#development)

---

## Features

- **Three download modes** — save as a Folder, a ZIP archive, or as Individual files. Each mode has its own independent settings.
- **Drag-and-drop filename builder** — compose folder and image names from pills (Subreddit, Title, Author, Date, Index, Unique ID, …) plus your own static-text pills.
- **WebP → JPG conversion** — Reddit's CDN serves WebP; we re-encode so files open in Windows Photos / macOS Preview / anywhere else.
- **11 button themes** — Native, Premium, Modern, Minimal, Glass, Gradient, Neon, Soft, Mint, Sunset, Mono. Position (4 corners) and size (3 steps) are configurable too.
- **Lightbox aware** — the button stays visible when you open Reddit's image lightbox, and resolves to the *clicked* post, not the topmost one in the feed.
- **Crosspost-safe** — galleries that live on the parent post are recursed into automatically.
- **Backup & restore** — export/import settings as JSON; reset to defaults in one click.
- **Keyboard shortcut** — `Alt + Shift + D` triggers the download from any supported post page.

---

## Install

### From source (developer mode)

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome / Edge / Brave.
3. Toggle **Developer mode** on (top-right).
4. Click **Load unpacked** and pick this folder.
5. The welcome tab opens automatically. Follow the on-screen setup.

> **Recommended:** at `chrome://settings/downloads`, switch off **"Ask where to save each file before downloading"** — otherwise every gallery throws a Save dialog per image.

<p align="center">
  <img width="958" height="476" alt="1" src="https://github.com/user-attachments/assets/31517831-d7c4-430f-b94f-50fc1cf68265" />
</p>

---

## Quick start

1. Open any Reddit post with images (e.g. `reddit.com/r/pics/comments/...`).
2. Click the floating **Download Gallery** button in the corner.
3. Watch the button cycle through `Downloading…` → `✅ N Files Saved!`.
4. Files land in your base download folder, named according to your chosen formula.

<p align="center">
  <img width="1280" height="800" alt="uno" src="https://github.com/user-attachments/assets/7f30398c-7422-4ca2-bb18-bcf8fc39d136" />
</p>

---

## Download modes

Switch modes from the toolbar popup or the Options page. Each mode keeps its own naming formula, format tweaks, and fallback rules.

| Mode | What lands on disk |
|---|---|
| **Folder** | A subfolder per gallery, with each image inside. |
| **ZIP** | A single `.zip` archive containing the gallery. |
| **Individual** | Loose image files directly in your base download folder. |

<p align="center">
  <img width="780" height="478" alt="1356d051-2239-4e22-b295-4b49398c4294_1000057480" src="https://github.com/user-attachments/assets/b6c215a3-c2f2-4be8-aa06-45499ed84a35" />
</p>

---

## Naming formulas

The Options page hosts a drag-and-drop **filename builder**. Drop pills like `Subreddit`, `Title`, `Author`, `Date`, `Time`, `Index`, `Unique ID` (or your own static-text pills) into the folder name and image filename dropzones. A live preview at the bottom updates as you build.

Per-mode **Format tweaks** let you control:

- Folder & Title pill separators (`-`, `_`, `.`, space, none)
- Title case (Original / lower / UPPER / Title / Sentence) — preserves all-caps acronyms like *NASA*, *BMW*
- Title space handling, Index format (`01` / `(01)` / `[01]`)
- Date format & separator, 12h / 24h time
- Unique ID format (Hex / Numeric / Alphanumeric / Letters / Timestamp)

<p align="center">
  <img width="1899" height="939" alt="Screenshot 2026-05-13 125543" src="https://github.com/user-attachments/assets/91e07cfd-604f-4fce-a13c-2984236bec50" />
</p>

---

## Tips & recipes

The bundled **Tips & recipes** page (`tips.html`) collects seven small habits that pay off forever — one folder per subreddit, custom static-text prefixes, faster custom-title editing, and more. Reach it from the welcome page or from the Backup & reset row in Options.

<p align="center">
  <img width="1280" height="800" alt="cuatro" src="https://github.com/user-attachments/assets/54967c99-e63a-48fa-8b5c-443b19c8feff" />
</p>

---

## Keyboard shortcut

| Action | Shortcut |
|---|---|
| Trigger download on the current post | `Alt` + `Shift` + `D` |

The shortcut is keyed off `event.code === 'KeyD'`, so non-Latin keyboard layouts and macOS Option-key dead-glyphs (`∂`, `Î`) all work correctly. Disable it from Options if it collides with anything in your workflow.

---

## Permissions

| Permission | Reason |
|---|---|
| `downloads` | Save images to your chosen folder via `chrome.downloads.download`. |
| `storage` | Persist your settings (formulas, themes, format tweaks) across sessions and Chrome-sync them between devices. |
| `host_permissions: *://*.reddit.com/*`, `*://*.redd.it/*` | Inject the floating button and fetch gallery JSON from Reddit. |

No analytics, no telemetry, no third-party calls. Everything stays on your machine.

---

## Project structure

```text
.
├── manifest.json          # MV3 manifest
├── background.js          # Service worker — orchestrates fetch, decode, downloads
├── content.js             # Floating button injection, post detection, lightbox handling
├── themes.js              # Shared theme CSS (popup preview ↔ real button stay in sync)
├── popup.html / popup.js  # Toolbar popup (quick settings)
├── options.html / js      # Full settings page — naming builder, format tweaks, backup
├── welcome.html / js      # First-run onboarding
├── tips.html              # Tips & recipes page
├── fonts/ + fonts.css     # Bundled web fonts
├── jszip.min.js           # ZIP-mode archiver
├── Sortable.min.js        # Drag-and-drop pills in the filename builder
├── options.css            # Options-page styling
├── icon16/48/128.png      # Extension icons
```

---


## Credits

Built with [JSZip](https://stuk.github.io/jszip/) and [SortableJS](https://github.com/SortableJS/Sortable). Fonts: Fredoka, Quicksand, Caveat (bundled in `fonts/`).
