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

                let downloadJobs = [];
                let textCount = 0;

                // 1. Multi-image/GIF gallery logic
                if (postData.is_gallery && postData.media_metadata) {
                    let galleryItems = postData.gallery_data.items;
                    galleryItems.forEach(item => {
                        let mediaId = item.media_id;
                        let media = postData.media_metadata[mediaId];

                        if (media && media.s) {
                            if (media.s.u) {
                                downloadJobs.push({ url: media.s.u.replace(/&amp;/g, '&') });
                            } else if (media.s.gif) {
                                downloadJobs.push({ url: media.s.gif.replace(/&amp;/g, '&') });
                            }
                        }
                    });
                }
                // 2. Single image, native GIF, or Imgur .gifv logic (Excludes Reddit Video)
                else if (postData.url && !postData.is_video) {
                    let url = postData.url;

                    if (url.endsWith('.gifv')) {
                        url = url.replace('.gifv', '.mp4');
                    }

                    if (url.match(/\.(jpg|jpeg|png|gif|webp|mp4)/i)) {
                        downloadJobs.push({ url });
                    }
                }

                // 3. Text support (Strictly for pure text posts - skips if images were found)
                if (downloadJobs.length === 0 && (postData.is_self || (postData.selftext && postData.selftext.trim().length > 0))) {
                    let textBody = postData.selftext ? postData.selftext.trim() : "";
                    const header = [
                        `Title: ${postData.title || customTitle}`,
                        `Author: u/${postData.author || 'unknown'}`,
                        `Subreddit: r/${postData.subreddit || 'unknown'}`,
                        `URL: ${request.url}`,
                        ''
                    ].join('\n');
                    
                    const fullText = textBody.length > 0 ? `${header}\n${textBody}` : header;
                    downloadJobs.push({ textContent: fullText, forceExt: 'txt', kind: 'text' });
                    textCount += 1;
                }

                // --- Download Logic & File Naming ---
                if (downloadJobs.length > 0) {
                    let index = 0;
                    let padLength = Math.max(2, downloadJobs.length.toString().length);

                    downloadJobs.forEach((job) => {
                        index += 1;
                        let ext = job.forceExt || 'png';
                        let url = job.url;

                        if (url) {
                            let cleanUrlForExt = url.split('?')[0];
                            let derivedExt = cleanUrlForExt.split('.').pop();
                            if (derivedExt && derivedExt.length <= 4) {
                                ext = derivedExt;
                            }
                        }

                        // Safety fallback
                        if (ext.length > 4) ext = 'png';

                        let paddedIndex = String(index).padStart(padLength, '0');
                        let filename = downloadJobs.length > 1
                            ? `Reddit_Grabber/${customTitle} (${paddedIndex}).${ext}`
                            : `Reddit_Grabber/${customTitle}.${ext}`;

                        // Execute Download
                        if (job.textContent) {
                            // Manifest V3 Text Download Fix (Data URI)
                            const base64Text = btoa(unescape(encodeURIComponent(job.textContent)));
                            const dataUrl = `data:text/plain;base64,${base64Text}`;
                            
                            chrome.downloads.download({
                                url: dataUrl,
                                filename: filename,
                                conflictAction: 'uniquify'
                            });
                        } else {
                            chrome.downloads.download({
                                url: url,
                                filename: filename,
                                conflictAction: 'uniquify'
                            });
                        }
                    });
                    
                    sendResponse({
                        success: true,
                        count: downloadJobs.length,
                        texts: textCount
                    });
                } else {
                    sendResponse({ success: false }); 
                }
            })
            .catch(err => {
                console.error("Download Error:", err);
                sendResponse({ success: false });
            });

        return true; 
    }
});