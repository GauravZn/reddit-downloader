// Import JSZip for the bundling feature
importScripts('jszip.min.js');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchAndDownload") {

        // Fetch the Reddit JSON
        fetch(request.url + '.json')
            .then(response => response.json())
            .then(data => {
                const postData = data[0].data.children[0].data;
                let imageUrls = [];

                // Parse Gallery Images
                if (postData.is_gallery && postData.media_metadata) {
                    const galleryItems = postData.gallery_data.items;
                    for (let item of galleryItems) {
                        const mediaId = item.media_id;
                        const media = postData.media_metadata[mediaId];
                        if (media && media.s && media.s.u) {
                            let cleanUrl = media.s.u.replace(/&amp;/g, '&');
                            imageUrls.push(cleanUrl);
                        }
                    }
                }
                // Parse Single Images
                else if (postData.url && (postData.url.match(/\.(jpg|png|jpeg)$/i))) {
                    imageUrls.push(postData.url);
                } else {
                    sendResponse({ success: false, message: "No standard images found." });
                    return;
                }

                if (imageUrls.length === 0) {
                    sendResponse({ success: false, message: "Failed to extract images." });
                    return;
                }

                // Get User Settings and Download
                chrome.storage.sync.get({
                    preferredFolder: 'reddit_downloads',
                    downloadMode: 'folder'
                }, (settings) => {

                    // 1. Strip leading slashes from the folder name
                    const baseFolder = (settings.preferredFolder.trim() || 'reddit_downloads').replace(/^[\\/]+/, '');

                    // 2. Kill line breaks, illegal characters, and trailing dots in the title
                    let title = request.title.replace(/[\r\n]+/g, " ").replace(/[\\/:*?"<>|]/g, "").replace(/\.+$/, "").trim();

                    // 3. Fallback just in case the title was literally just emojis or illegal characters
                    if (!title) title = "Reddit_Download";
                    
                    const mode = settings.downloadMode;

                    // ROUTE 1: Folder
                    if (mode === 'folder') {
                        imageUrls.forEach((imgUrl, index) => {
                            let fileNum = String(index + 1).padStart(2, '0');
                            chrome.downloads.download({
                                url: imgUrl,
                                filename: `${baseFolder}/${title}/${title}(${fileNum}).jpg`,
                                saveAs: false
                            });
                        });
                        sendResponse({ success: true, count: imageUrls.length });

                        // ROUTE 2: Individual
                    } else if (mode === 'individual') {
                        imageUrls.forEach((imgUrl, index) => {
                            let fileNum = String(index + 1).padStart(2, '0');
                            chrome.downloads.download({
                                url: imgUrl,
                                filename: `${baseFolder}/${title}(${fileNum}).jpg`,
                                saveAs: false
                            });
                        });
                        sendResponse({ success: true, count: imageUrls.length });

                        // ROUTE 3: Zip File
                    } else if (mode === 'zip') {
                        const zip = new JSZip();
                        const fetchPromises = imageUrls.map(async (imgUrl, index) => {
                            let fileNum = String(index + 1).padStart(2, '0');
                            try {
                                const imgResponse = await fetch(imgUrl);
                                const blob = await imgResponse.blob();
                                zip.file(`${title}(${fileNum}).jpg`, blob);
                            } catch (error) {
                                console.error("Failed to fetch image for zip:", error);
                            }
                        });

                        Promise.all(fetchPromises).then(async () => {
                            const zipBlob = await zip.generateAsync({ type: "blob" });
                            const reader = new FileReader();
                            reader.onloadend = function () {
                                chrome.downloads.download({
                                    url: reader.result,
                                    filename: `${baseFolder}/${title}.zip`,
                                    saveAs: false
                                });
                            };
                            reader.readAsDataURL(zipBlob);
                        });

                        sendResponse({ success: true, count: imageUrls.length });
                    }
                });
            })
            .catch(error => {
                console.error("Error processing Reddit JSON:", error);
                sendResponse({ success: false });
            });

        return true;
    }
});


// Auto-open the welcome page on first install
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        chrome.tabs.create({ url: "welcome.html" });
    }
});
