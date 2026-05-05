# Reddit Picture Gallery Downloader

One-click high-resolution downloader for Reddit picture galleries, with full control over filenames, folder structure, and the on-page Download button.

## What it does

Adds a floating "Download Gallery" button to any Reddit post or gallery page. One click fetches every image in the gallery at full resolution and saves them according to your naming rules.

## Three download modes

- **Folder Mode** — creates a subfolder per gallery and saves images inside.
- **ZIP Mode** — bundles the gallery into a single zip archive.
- **Individual Mode** — drops images directly into your base download folder.

## Customizable everything

- Drag-and-drop filename builder with named elements: Subreddit, Author, Title, Upload Date, Download Date, Time, Index, Unique ID, plus arbitrary static text pills.
- Per-mode rules for what to do when titles are missing, when paths get too long, and how to handle single-image galleries.
- Global formatting: separator characters, title-space handling, date format and separator, time format, index style, unique-ID style.
- Eleven button themes (Native, Premium, Modern, Minimal, Glass, Gradient, Neon, Soft, Mint, Sunset, Mono), four button positions, three button sizes.
- Optional in-page prompt that appears next to the Download button instead of at the top of the screen, with Reddit's keyboard shortcuts blocked while typing.

## Setup

After install, visit `chrome://settings/downloads` and turn off **"Ask where to save each file before downloading"** so multi-image galleries don't trigger one prompt per image.

## Files

- `manifest.json` — MV3 manifest
- `content.js` — floating button + custom prompt modal, injected into reddit.com
- `background.js` — service worker; fetches gallery JSON, builds filenames, drives `chrome.downloads`
- `options.html` / `options.js` / `options.css` — full configuration page
- `popup.html` / `popup.js` — toolbar popup for quick settings
- `welcome.html` / `welcome.js` — first-run onboarding tab
- `jszip.min.js` — bundled for ZIP mode
- `Sortable.min.js` — bundled for the drag-and-drop pill builder

## Permissions

- `downloads` — to write files to disk
- `storage` — to persist your settings via `chrome.storage.sync`
- Host access to `*.reddit.com` and `*.redd.it`
