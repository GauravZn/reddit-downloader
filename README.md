# 🚀 Reddit Picture Gallery Downloader

A lightweight, frictionless Chrome Extension that allows you to download high-resolution images, multi-image galleries, and text posts directly from Reddit with a single click. 

No sketchy third-party websites, no copied links, and no annoying pop-up ads. Everything happens locally on your machine.

![Demo GIF](link-to-your-demo-gif-here.gif) *(Tip: Upload a quick 10-second screen recording of the extension working here!)*

## ✨ Features

* **One-Click Gallery Downloads:** Instantly fetch and save every image in a swipeable Reddit gallery.
* **Smart File Naming:** Automatically names and numbers files sequentially using the original post title (e.g., `Comic Title (01).png`, `Comic Title (02).png`) so your galleries stay in perfect reading order.
* **Context-Aware Button:** The download button dynamically changes its text and icon based on what you are scrolling past (Image, Gallery, or Text Post).
* **Text Post Extraction:** If a post contains body text, the extension automatically generates a cleanly formatted `.txt` file containing the title, author, URL, and post body.
* **Lightning Fast:** Powered by Manifest V3. The extension safely fetches the underlying JSON data of the post to grab the highest resolution media available.

## ⚠️ Known Limitations
* **Native Reddit Videos:** To ensure a high-quality user experience, this extension intentionally skips native Reddit videos (`v.redd.it`). Reddit stores video and audio tracks on completely separate servers, meaning downloaded videos would be muted. The extension focuses strictly on delivering flawless picture, GIF, and text downloads.

## 🛠️ Installation

<!-- ### Option 1: Chrome Web Store (Recommended) -->
<!-- [Download from the Chrome Web Store here](#) -->

<!-- ### Option 2: Manual Installation (Developer Mode) -->
<!-- If you want to install the extension directly from the source code: -->
1. Download or clone this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Toggle on **"Developer mode"** in the top right corner.
4. Click the **"Load unpacked"** button in the top left.
5. Select the folder containing this repository's files.
6. The extension is now installed and ready to use!

## 💡 How to Use
1. Pin the extension to your Chrome toolbar.
2. Browse Reddit normally. When you open a post or scroll through comments, a sleek orange button will appear in the bottom right corner.
3. The button will intelligently tell you what it found (e.g., "Download Gallery", "Download Image", or "Download Post (Text)").
4. Click it! The files will automatically save to your default Chrome downloads folder inside a newly created `Reddit_Grabber` folder.
<!-- 
## ☕ Support the Developer
If this tool saved you from right-clicking 100 times today, consider buying me a coffee! It helps keep the extension free and updated.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/YOUR_KOFI_LINK_HERE) -->

## 📄 License
This project is open-source and available under the MIT License. Feel free to fork, modify, and improve it! Developed by GauravZn.