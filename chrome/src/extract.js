/**
 * Handle messages from the extension
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // Check if the request is to extract
    if (request.command !== "extract")
        return;
    // Check if declarative content API is not enabled and check for the video player class element
    if ((chrome.declarativeContent === null || typeof(chrome.declarativeContent) === "undefined")) {
        var videoPlayersElements = document.getElementsByClassName("video-player");
        // Failed to find item in page
        if (videoPlayersElements.length === 0) {
            return sendResponse({
                error: "message_find_stream_fail"
            });
        }
    }
    // Get login name
    var login;
    var videoId;
    var videoPlayers = document.getElementsByClassName("video-player__container");
    if (videoPlayers.length > 0) {
        var videoPlayer = videoPlayers[0];
        login = videoPlayer.getAttribute("data-channel");
        videoId = videoPlayer.getAttribute("data-video");
        if (videoId !== null && typeof(videoId) !== "undefined")
            videoId = videoId.replace("v", "");
    }
    // Extract login/video id from URL
    if ((login === null || typeof(login) === "undefined") && (videoId === null || typeof(videoId) === "undefined")) {
        console.log("Failed to get login from video player attributes.");
        console.log(videoPlayers);
        var path = document.location.pathname;
        if (path.indexOf("?") > -1)
            path = path.substring(0, path.indexOf("?"));
        if (path.indexOf("#") > -1)
            path = path.substring(0, path.indexOf("#"));
        var pathSplit = path.split("/");
        console.log(pathSplit);
        if ((pathSplit.length === 3 && pathSplit[1] !== "videos") || pathSplit.length < 2 || pathSplit.length > 3 ||
            (pathSplit.length === 2 && (pathSplit[1] === "directory" || pathSplit[1] === ""))) {
            console.log("Failed to get login from path.");
            console.log(document.location.pathname);
            console.log(pathSplit);
            return sendResponse({
                error: "message_find_stream_fail"
            });
        }
        if (pathSplit.length === 2)
            login = pathSplit[1];
        if (pathSplit.length === 3)
            videoId = pathSplit[2];
    }
    // Get the display name
    var displayName;
    // Wait for the video time
    var pollTime = new Date().getMilliseconds();
    var timeElement;
    do {
        timeElement = document.getElementById("org.twitched.buffer_time");
    }
    while ((timeElement === null || typeof(timeElement) === "undefined") &&
        new Date().getMilliseconds() - pollTime <= 2000);
    // Get the video time
    var time;
    if (timeElement !== null && typeof(timeElement) !== "undefined")
        time = timeElement.getAttribute("data-time");
    else
        console.log("Failed to fetch time");
    // Respond
    sendResponse({
        streamer: {
            login: login,
            displayName: displayName
        },
        video: {
            id: videoId,
            time: time
        }
    });
});

/**
 * Injects a script directly into the DOM that can access the actual window element
 */
function injectScript() {
    var script = document.createElement("script");
    script.src = chrome.extension.getURL("src/extract_time.js");
    script.onload = function() {
        this.remove()
    };
    (document.head || document.documentElement).appendChild(script);
}

injectScript();