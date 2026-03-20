chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchAndDownload") {
        let jsonUrl = request.url + '.json';
        let customTitle = request.title;

        fetch(jsonUrl)
            .then(response => response.json())
            .then(data => {
                let postData = data[0].data.children[0].data;

                // Crosspost Support
                if (postData.crosspost_parent_list && postData.crosspost_parent_list.length > 0) {
                    postData = postData.crosspost_parent_list[0];
                }

                let mediaUrls = [];

                // 1. Multi-image/GIF gallery logic
                if (postData.is_gallery && postData.media_metadata) {
                    let galleryItems = postData.gallery_data.items;
                    galleryItems.forEach(item => {
                        let mediaId = item.media_id;
                        let media = postData.media_metadata[mediaId];

                        if (media && media.s) {
                            // Prioritize standard high-res image
                            if (media.s.u) {
                                mediaUrls.push(media.s.u.replace(/&amp;/g, '&'));
                            }
                            // Fallback to gallery GIF if it's an animated gallery
                            else if (media.s.gif) {
                                mediaUrls.push(media.s.gif.replace(/&amp;/g, '&'));
                            }
                        }
                    });
                }
                // 2. Single image, native GIF, or Imgur .gifv logic
                // We explicitly ignore postData.is_video to filter out Reddit native videos
                else if (postData.url && !postData.is_video) {
                    let url = postData.url;

                    // Handle Imgur .gifv (Chrome prefers downloading these as mp4 to animate them)
                    if (url.endsWith('.gifv')) {
                        url = url.replace('.gifv', '.mp4');
                    }

                    // Match standard image/gif extensions
                    if (url.match(/\.(jpg|jpeg|png|gif|webp|mp4)/i)) {
                        mediaUrls.push(url);
                    }
                }

                // --- Download Logic & File Naming ---
                if (mediaUrls.length > 0) {
                    mediaUrls.forEach((url, index) => {
                        let cleanUrlForExt = url.split('?')[0];
                        let ext = cleanUrlForExt.split('.').pop();

                        // Safety fallback
                        if (ext.length > 4) ext = 'png';

                        // Calculate padding (e.g., 01, 02... or 001, 002 if over 100 images)
                        let padLength = Math.max(2, mediaUrls.length.toString().length);
                        let paddedIndex = String(index + 1).padStart(padLength, '0');

                        // Format filename: "Title.png" or "Title (01).png"
                        let filename = mediaUrls.length > 1
                            ? `Reddit_Grabber/${customTitle} (${paddedIndex}).${ext}`
                            : `Reddit_Grabber/${customTitle}.${ext}`;

                        chrome.downloads.download({
                            url: url,
                            filename: filename,
                            conflictAction: 'uniquify'
                        });
                    });
                    sendResponse({ success: true, count: mediaUrls.length });
                } else {
                    sendResponse({ success: false }); // No images/gifs found
                }
            })
            .catch(err => {
                console.error("Download Error:", err);
                sendResponse({ success: false });
            });

        return true; // Keep the message channel open for async fetch
    }
});