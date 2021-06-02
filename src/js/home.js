
"use strict"; 

const peerLoockupUrl = "https://extreme-ip-lookup.com/json/";
const avatarApiUrl = "https://eu.ui-avatars.com/api";
const isWebRTCSupported = DetectRTC.isWebRTCSupported;
const isMobileDevice = DetectRTC.isMobileDevice;

var recStartTime;
var recElapsedTime;
var Theme = "neon"; 
var signalingServerPort = 3000; 
var signalingServer = getServerUrl();
var roomId = getRoomId();
var peerInfo = getPeerInfo();
var peerGeo;
var peerConnection;
var myPeerName;
var useAudio = true;
var useVideo = true;
var camera = "user";
var myVideoChange = false;
var myVideoStatus = true;
var myAudioStatus = true;
var isScreenStreaming = false;
var isButtonsVisible = false;
var isVideoOnFullScreen = false;
var isDocumentOnFullScreen = false;
var signalingSocket; 
var localMediaStream; 
var remoteMediaStream; 
var remoteMediaControls = false; 
var peerConnections = {}; 
var dataChannels = {}; 
var useRTCDataChannel = true; 
var peerMediaElements = {}; 
var iceServers = [{ urls: "stun:stun.l.google.com:19302" }]; 


var initAudioBtn;
var initVideoBtn;

var Buttons;
var shareRoomBtn;
var audioBtn;
var videoBtn;
var screenShareBtn;
var fileShareBtn;
var leaveRoomBtn;
var myVideo;
var myVideoParagraph;
var myVideoStatusIcon;
var myAudioStatusIcon;

function getHtmlElementsById() {
  myVideo = getId("myVideo");
  Buttons = getId("Buttons");
  shareRoomBtn = getId("shareRoomBtn");
  audioBtn = getId("audioBtn");
  videoBtn = getId("videoBtn");
  screenShareBtn = getId("screenShareBtn");
  fileShareBtn = getId("fileShareBtn");
  leaveRoomBtn = getId("leaveRoomBtn");
  myVideoParagraph = getId("myVideoParagraph");


}

function setButtonsTitle() {

  tippy(shareRoomBtn, {
    content: "Invite people to join",
    placement: "right-start",
  });
  tippy(audioBtn, {
    content: "Click to audio OFF",
    placement: "right-start",
  });
  tippy(videoBtn, {
    content: "Click to video OFF",
    placement: "right-start",
  });
  tippy(screenShareBtn, {
    content: "START screen sharing",
    placement: "right-start",
  });
  tippy(fileShareBtn, {
    content: "START file sharing",
    placement: "right-start",
  });
  tippy(leaveRoomBtn, {
    content: "Leave this room",
    placement: "right-start",
  });

}

function getPeerInfo() {
  return {
    detectRTCversion: DetectRTC.version,
    isWebRTCSupported: DetectRTC.isWebRTCSupported,
    isMobileDevice: DetectRTC.isMobileDevice,
    osName: DetectRTC.osName,
    osVersion: DetectRTC.osVersion,
    browserName: DetectRTC.browser.name,
    browserVersion: DetectRTC.browser.version,
  };
}

function getPeerGeoLocation() {
  fetch(peerLoockupUrl)
    .then((res) => res.json())
    .then((outJson) => {
      peerGeo = outJson;
    })
    .catch((err) => console.error(err));
}


function getServerUrl() {
  return (
    "http" +
    (location.hostname == "localhost" ? "" : "s") +
    "://" +
    location.hostname +
    (location.hostname == "localhost" ? ":" + signalingServerPort : "")
  );
}


function getRoomId() {

  let roomId = location.pathname.substring(6);

  if (roomId == "") {
    roomId = makeId(12);
    const newurl = signalingServer + "/join/" + roomId;
    window.history.pushState({ url: newurl }, roomId, newurl);
  }
  return roomId;
}

function makeId(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function thereIsPeerConnections() {
  if (Object.keys(peerConnections).length === 0) {
    return false;
  }
  return true;
}

function initPeer() {

  if (!isWebRTCSupported) {
    console.error("isWebRTCSupported: false");
    userLog("error", "This browser seems not supported WebRTC!");
    return;
  }
  console.log("Connecting");
  signalingSocket = io(signalingServer);

  signalingSocket.on("connect", function () {
    if (localMediaStream) joinToChannel();
    else
      setupLocalMedia(function () {
        newUser();
      });
  });

  function newUser() {

    Swal.fire({
      allowOutsideClick: false,
      position: "center",
      imageAlt: "ClassRoom-name",
      title: "Enter your name",
      input: "text",
      html: `<br>
        <button id="initAudioBtn" class="fas fa-microphone" onclick="handleAudio(event, true)"></button>
        <button id="initVideoBtn" class="fas fa-video" onclick="handleVideo(event, true)"></button>   
      `,
      confirmButtonText: `Join meeting`,
      inputValidator: (value) => {
        if (!value) {
          return "Please enter youre name";
        }
        myPeerName = value;
        myVideoParagraph.innerHTML = myPeerName + " (me)";
        setPeerAvatarImgName("myVideoAvatarImage", myPeerName);
        joinToChannel();
      },
    }).then(function () {
      welcomeUser();
    });

 
    
    initAudioBtn = getId("initAudioBtn");
    initVideoBtn = getId("initVideoBtn");
 
    tippy(initAudioBtn, {
      content: "Click to audio OFF",
      placement: "top",
    });
    tippy(initVideoBtn, {
      content: "Click to video OFF",
      placement: "top",
    });
  }

  function joinToChannel() {
    console.log("join to channel", roomId);
    signalingSocket.emit("join", {
      channel: roomId,
      peerInfo: peerInfo,
      peerGeo: peerGeo,
      peerName: myPeerName,
      peerVideo: myVideoStatus,
      peerAudio: myAudioStatus,
    });
  }

  function welcomeUser() {
    const myRoomUrl = window.location.href;
    copyRoomURL();
    Swal.fire({
      position: "center",
      allowOutsideClick: true,
      title: "<strong>Welcome " + myPeerName + "</strong>",
      imageAlt: "ClassRoom-welcome",
      html:
        `
      <br/> 
      <p style="color:black;"> Share this meeting invite others to join.</p>
      <p style="color:rgb(8, 189, 89);">` +
        myRoomUrl +
        `</p>`,
      confirmButtonText: `Copy meeting URL`,
    });
  }
  signalingSocket.on("disconnect", function () {
    console.log("Disconnected from signaling server");
    for (var peer_id in peerMediaElements) {
      document.body.removeChild(peerMediaElements[peer_id].parentNode);
      resizeVideos();
    }
    for (var peer_id in peerConnections) {
      peerConnections[peer_id].close();
    }
    if (useRTCDataChannel) dataChannels = {};
    peerConnections = {};
    peerMediaElements = {};
  });

  signalingSocket.on("addPeer", function (config) {

    var peer_id = config.peer_id;
    var peers = config.peers;

    if (peer_id in peerConnections) {
      console.log("Already connected to peer", peer_id);
      return;
    }

    if (config.iceServers) iceServers = config.iceServers;
    console.log("iceServers", iceServers[0]);

  
    peerConnection = new RTCPeerConnection({ iceServers: iceServers });

   
    peerConnections[peer_id] = peerConnection;


    peerConnections[peer_id].onicecandidate = function (event) {
      if (event.candidate) {
        signalingSocket.emit("relayICE", {
          peer_id: peer_id,
          ice_candidate: {
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            candidate: event.candidate.candidate,
            address: event.candidate.address,
          },
        });
      }
    };


    let ontrackCount = 0;
    peerConnections[peer_id].ontrack = function (event) {
      ontrackCount++;
      if (ontrackCount === 2) {
        console.log("ontrack", event);
        remoteMediaStream = event.streams[0];

        const videoWrap = document.createElement("div");
        const remoteVideoParagraph = document.createElement("h4");
        const remoteVideoStatusIcon = document.createElement("button");
        const remoteAudioStatusIcon = document.createElement("button");
        const remoteVideoAvatarImage = document.createElement("img");

        remoteVideoParagraph.setAttribute("id", peer_id + "_name");
        remoteVideoParagraph.className = "videoPeerName";
        tippy(remoteVideoParagraph, {
          content: "Participant name",
        });
        const peerVideoText = document.createTextNode(
          peers[peer_id]["peer_name"]
        );
        remoteVideoParagraph.appendChild(peerVideoText);
        remoteVideoStatusIcon.setAttribute("id", peer_id + "_videoStatus");
        remoteVideoStatusIcon.className = "fas fa-video videoStatusIcon";
        tippy(remoteVideoStatusIcon, {
          content: "Participant video is ON",
        });
        remoteAudioStatusIcon.setAttribute("id", peer_id + "_audioStatus");
        remoteAudioStatusIcon.className = "fas fa-microphone audioStatusIcon";
        tippy(remoteAudioStatusIcon, {
          content: "Participant audio is ON",
        });
        remoteVideoAvatarImage.setAttribute("id", peer_id + "_avatar");
        remoteVideoAvatarImage.className = "videoAvatarImage";

        videoWrap.appendChild(remoteVideoParagraph);
        videoWrap.appendChild(remoteVideoStatusIcon);
        videoWrap.appendChild(remoteAudioStatusIcon);
        videoWrap.appendChild(remoteVideoAvatarImage);

        const remoteMedia = document.createElement("video");
        videoWrap.className = "video";
        videoWrap.appendChild(remoteMedia);
        remoteMedia.setAttribute("id", peer_id + "_video");
        remoteMedia.setAttribute("playsinline", true);
        remoteMedia.mediaGroup = "remotevideo";
        remoteMedia.autoplay = true;
        isMobileDevice
          ? (remoteMediaControls = false)
          : (remoteMediaControls = remoteMediaControls);
        remoteMedia.controls = remoteMediaControls;
        peerMediaElements[peer_id] = remoteMedia;
        document.body.appendChild(videoWrap);
        attachMediaStream(remoteMedia, remoteMediaStream);
        resizeVideos();

        if (!isMobileDevice) {
          handleVideoPlayerFs(peer_id + "_video");
        }

        setPeerAvatarImgName(peer_id + "_avatar", peers[peer_id]["peer_name"]);
        setPeerVideoStatus(peer_id, peers[peer_id]["peer_video"]);
        setPeerAudioStatus(peer_id, peers[peer_id]["peer_audio"]);
      }
    };
    localMediaStream.getTracks().forEach(function (track) {
      peerConnections[peer_id].addTrack(track, localMediaStream);
    });
    if (config.should_create_offer) {
      console.log("Creating RTC offer to", peer_id);
      peerConnections[peer_id]
        .createOffer()
        .then(function (local_description) {
          console.log("Local offer description is", local_description);
          peerConnections[peer_id]
            .setLocalDescription(local_description)
            .then(function () {
              signalingSocket.emit("relaySDP", {
                peer_id: peer_id,
                session_description: local_description,
              });
              console.log("Offer setLocalDescription done!");
            })
            .catch((e) => {
              console.error("[Error] offer setLocalDescription", e);
              userLog(
                "error",
                "Offer setLocalDescription failed: " + e.message
              );
            });
        })
        .catch((e) => {
          console.error("[Error] sending offer", e);
        });
    } 
  }); 

  signalingSocket.on("sessionDescription", function (config) {
    console.log("Remote Session-description", config);

    var peer_id = config.peer_id;
    var remote_description = config.session_description;
    var description = new RTCSessionDescription(remote_description);
    peerConnections[peer_id]
      .setRemoteDescription(description)
      .then(function () {
        console.log("setRemoteDescription done!");
        if (remote_description.type == "offer") {
          console.log("Creating answer");
          peerConnections[peer_id]
            .createAnswer()
            .then(function (local_description) {
              console.log("Answer description is: ", local_description);
              peerConnections[peer_id]
                .setLocalDescription(local_description)
                .then(function () {
                  signalingSocket.emit("relaySDP", {
                    peer_id: peer_id,
                    session_description: local_description,
                  });
                  console.log("Answer setLocalDescription done!");
                })
                .catch((e) => {
                  console.error("[Error] answer setLocalDescription", e);
                  userLog(
                    "error",
                    "Answer setLocalDescription failed: " + e.message
                  );
                });
            })
            .catch((e) => {
              console.error("[Error] creating answer", e);
            });
        } 
      })
      .catch((e) => {
        console.error("[Error] setRemoteDescription", e);
      });
  }); 

  signalingSocket.on("iceCandidate", function (config) {
    var peer_id = config.peer_id;
    var ice_candidate = config.ice_candidate;
    peerConnections[peer_id].addIceCandidate(
      new RTCIceCandidate(ice_candidate)
    );
  });


  signalingSocket.on("onpeerStatus", function (config) {
    var peer_id = config.peer_id;
    var element = config.element;
    var status = config.status;

    switch (element) {
      case "video":
        setPeerVideoStatus(peer_id, status);
        break;
      case "audio":
        setPeerAudioStatus(peer_id, status);
        break;
    }
  });


  
  signalingSocket.on("removePeer", function (config) {
    console.log("Signaling server said to remove peer:", config);

    var peer_id = config.peer_id;

    if (peer_id in peerMediaElements) {
      document.body.removeChild(peerMediaElements[peer_id].parentNode);
      resizeVideos();
    }
    if (peer_id in peerConnections) {
      peerConnections[peer_id].close();
    }


    if (useRTCDataChannel) delete dataChannels[peer_id];

    delete peerConnections[peer_id];
    delete peerMediaElements[peer_id];
  });
} 

function setTheme(theme) {

  
}

function setupLocalMedia(callback, errorback) {

  if (localMediaStream != null) {
    if (callback) callback();
    return;
  }

  getPeerGeoLocation();
  console.log("Requesting access to local audio / video inputs");

  const constraints = {
    audio: useAudio,
    video: useVideo,
  };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function (stream) {
      localMediaStream = stream;

      const videoWrap = document.createElement("div");
      const myVideoParagraph = document.createElement("h4");
      const myVideoStatusIcon = document.createElement("button");
      const myAudioStatusIcon = document.createElement("button");
      const myVideoAvatarImage = document.createElement("img");

     
      myVideoParagraph.setAttribute("id", "myVideoParagraph");
      myVideoParagraph.className = "videoPeerName";
      tippy(myVideoParagraph, {
        content: "My name",
      });
      myVideoStatusIcon.setAttribute("id", "myVideoStatusIcon");
      myVideoStatusIcon.className = "fas fa-video videoStatusIcon";
      tippy(myVideoStatusIcon, {
        content: "My video is ON",
      });
      myAudioStatusIcon.setAttribute("id", "myAudioStatusIcon");
      myAudioStatusIcon.className = "fas fa-microphone audioStatusIcon";
      tippy(myAudioStatusIcon, {
        content: "My audio is ON",
      });
      myVideoAvatarImage.setAttribute("id", "myVideoAvatarImage");
      myVideoAvatarImage.className = "videoAvatarImage";

    
      videoWrap.appendChild(myVideoParagraph);
      videoWrap.appendChild(myVideoStatusIcon);
      videoWrap.appendChild(myAudioStatusIcon);
      videoWrap.appendChild(myVideoAvatarImage);



      const localMedia = document.createElement("video");
      videoWrap.className = "video";
      videoWrap.setAttribute("id", "myVideoWrap");
      videoWrap.appendChild(localMedia);
      localMedia.setAttribute("id", "myVideo");
      localMedia.setAttribute("playsinline", true);
      localMedia.className = "mirror";
      localMedia.autoplay = true;
      localMedia.muted = true;
      localMedia.volume = 0;
      localMedia.controls = false;
      document.body.appendChild(videoWrap);

      console.log("local-video-audio", {
        video: localMediaStream.getVideoTracks()[0].label,
        audio: localMediaStream.getAudioTracks()[0].label,
      });
      attachMediaStream(localMedia, localMediaStream);
      resizeVideos();
      getHtmlElementsById();
      setButtonsTitle();
      manageButtons();
      handleBodyOnMouseMove();
      if (callback) callback();
    })
    .catch((e) => {
      console.error("Access denied for audio/video", e);
      window.location.href = `/permission?roomId=${roomId}`;
      if (errorback) errorback();
    });
} 


function resizeVideos() {
  const numToString = ["", "one", "two", "three", "four", "five", "six"];
  const videos = document.querySelectorAll(".video");
  document.querySelectorAll(".video").forEach((v) => {
    v.className = "video " + numToString[videos.length];
  });
}

function setPeerAvatarImgName(videoAvatarImageId, peerName) {
  var videoAvatarImageElement = getId(videoAvatarImageId);
  var avatarImgSize = isMobileDevice ? 128 : 256;
  videoAvatarImageElement.setAttribute(
    "src",
    avatarApiUrl +
      "?name=" +
      peerName +
      "&size=" +
      avatarImgSize +
      "&background=random&rounded=true"
  );
}


function handleVideoPlayerFs(videoId) {
  var videoPlayer = getId(videoId);

  videoPlayer.addEventListener("fullscreenchange", function (e) {

    if (videoPlayer.controls || isDocumentOnFullScreen) return;
    var fullscreenElement = document.fullscreenElement;
    if (!fullscreenElement) {
      videoPlayer.style.pointerEvents = "auto";
      isVideoOnFullScreen = false;
    }
  });

 
  videoPlayer.addEventListener("webkitfullscreenchange", function () {
  
    if (videoPlayer.controls || isDocumentOnFullScreen) return;
    var webkitIsFullScreen = document.webkitIsFullScreen;
    if (!webkitIsFullScreen) {
      videoPlayer.style.pointerEvents = "auto";
      isVideoOnFullScreen = false;
    }
  });

  videoPlayer.addEventListener("click", (e) => {
   
    if (videoPlayer.controls || isDocumentOnFullScreen) return;

    if (!isVideoOnFullScreen) {
      if (videoPlayer.requestFullscreen) {
        videoPlayer.requestFullscreen();
      } else if (videoPlayer.webkitRequestFullscreen) {
        videoPlayer.webkitRequestFullscreen();
      } else if (videoPlayer.msRequestFullscreen) {
        videoPlayer.msRequestFullscreen();
      }
      isVideoOnFullScreen = true;
      videoPlayer.style.pointerEvents = "none";
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      isVideoOnFullScreen = false;
      videoPlayer.style.pointerEvents = "auto";
    }
  });
}
function manageButtons() {
  setShareRoomBtn();
  setAudioBtn();
  setVideoBtn();
  setScreenShareBtn();
  setFileShareBtn();
  setLeaveRoomBtn();
  showButtons();
}

function setShareRoomBtn() {
  shareRoomBtn.addEventListener("click", async (e) => {
    shareRoomUrl();
  });
}
function setAudioBtn() {
  audioBtn.addEventListener("click", (e) => {
    handleAudio(e, false);
  });
}


function setVideoBtn() {
  videoBtn.addEventListener("click", (e) => {
    handleVideo(e, false);
  });
}


function setScreenShareBtn() {
  if (navigator.getDisplayMedia || navigator.mediaDevices.getDisplayMedia) {
    screenShareBtn.addEventListener("click", (e) => {
      toggleScreenSharing();
    });
  } else {
    screenShareBtn.style.display = "none";
  }
}
function setFileShareBtn() {
  fileShareBtn.addEventListener("click", (e) => {
    shareFile();
  });
}


async function shareFile() {
  const { value: file } = await Swal.fire({
    allowOutsideClick: false,
    position: "center",
    title: "Share the Room",
    input: 'file',
    inputAttributes: {
      'accept': 'files/*',
      'aria-label': 'Upload your profile picture'
    }
  })
  
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      Swal.fire({
        title: 'Your uploaded picture',
        imageUrl: e.target.result,
        imageAlt: 'The uploaded picture'
      })
    }
    reader.readAsDataURL(file)
  }
}


function setLeaveRoomBtn() {
  leaveRoomBtn.addEventListener("click", (e) => {
    leaveRoom();
  });
}

function handleBodyOnMouseMove() {
  document.body.addEventListener("mousemove", (e) => {
    showButtons();
  });
}




function changeAudioDestination() {
  const audioDestination = audioOutputSelect.value;
  attachSinkId(myVideo, audioDestination);
}


function attachSinkId(element, sinkId) {
  if (typeof element.sinkId !== "undefined") {
    element
      .setSinkId(sinkId)
      .then(() => {
        console.log(`Success, audio output device attached: ${sinkId}`);
      })
      .catch((error) => {
        let errorMessage = error;
        if (error.name === "SecurityError") {
          errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
        }
        console.error(errorMessage);
        audioOutputSelect.selectedIndex = 0;
      });
  } else {
    console.warn("Browser does not support output device selection.");
  }
}


function gotStream(stream) {
  refreshMyStreamToPeers(stream);
  refreshMyLocalStream(stream);
  setMyVideoStatusTrue();
  if (myVideoChange) {
    myVideo.classList.toggle("mirror");
  }
  return navigator.mediaDevices.enumerateDevices();
}




function attachMediaStream(element, stream) {
  console.log("Success, media stream attached");
  element.srcObject = stream;
}

function showButtons() {
  
  Buttons.style.display = "flex";
  isButtonsVisible = true;
  setTimeout(function () {
    Buttons.style.display = "none";
    isButtonsVisible = false;
  }, 10000);
}
async function shareRoomUrl() {
  copyRoomURL();
  let isSupportedNavigatorShare = false;
  let errorNavigatorShare = false;
  if (navigator.share) {
    isSupportedNavigatorShare = true;
    try {
      await navigator.share({ url: window.location.href });
      userLog("info", "Room Shared successfully!");
    } catch (error) {
      errorNavigatorShare = true;
    
    }
  }


  if (
    !isSupportedNavigatorShare ||
    (isSupportedNavigatorShare && errorNavigatorShare)
  ) {
    Swal.fire({
      allowOutsideClick: false,
      position: "center",
      title: "Share the Room",
      imageAlt: "ClassRoom",
      html:
        `<br/>
      <p style="color:black;"> Share this meeting invite others to join.</p>
      <p style="color:rgb(8, 189, 89);">` +
        window.location.href +
        `</p>`,
      confirmButtonText: `Copy meeting URL`,
    });
  }
}


function copyRoomURL() {
  var roomURL = window.location.href;
  var tmpInput = document.createElement("input");
  document.body.appendChild(tmpInput);
  tmpInput.value = roomURL;
  tmpInput.select();
  tmpInput.setSelectionRange(0, 99999);
  document.execCommand("copy");
  console.log("Copied to clipboard Join Link ", roomURL);
  document.body.removeChild(tmpInput);
}


function handleAudio(e, init) {
  localMediaStream.getAudioTracks()[0].enabled = !localMediaStream.getAudioTracks()[0]
    .enabled;
  myAudioStatus = localMediaStream.getAudioTracks()[0].enabled;
  e.target.className = "fas fa-microphone" + (myAudioStatus ? "" : "-slash");
  if (init) {
    audioBtn.className = "fas fa-microphone" + (myAudioStatus ? "" : "-slash");
    if (!isMobileDevice) {
      tippy(initAudioBtn, {
        content: myAudioStatus ? "Click to audio OFF" : "Click to audio ON",
        placement: "top",
      });
    }
  }
  setMyAudioStatus(myAudioStatus);
}


function handleVideo(e, init) {
  localMediaStream.getVideoTracks()[0].enabled = !localMediaStream.getVideoTracks()[0]
    .enabled;
  myVideoStatus = localMediaStream.getVideoTracks()[0].enabled;
  e.target.className = "fas fa-video" + (myVideoStatus ? "" : "-slash");
  if (init) {
    videoBtn.className = "fas fa-video" + (myVideoStatus ? "" : "-slash");
    if (!isMobileDevice) {
      tippy(initVideoBtn, {
        content: myVideoStatus ? "Click to video OFF" : "Click to video ON",
        placement: "top",
      });
    }
  }
  setMyVideoStatus(myVideoStatus);
}


function swapCamera() {
  camera = camera == "user" ? "environment" : "user";
  if (camera == "user") useVideo = true;
  else useVideo = { facingMode: { exact: camera } };

  navigator.mediaDevices
    .getUserMedia({ video: useVideo })
    .then((camStream) => {
      refreshMyStreamToPeers(camStream);
      refreshMyLocalStream(camStream);
      if (useVideo) {
        setMyVideoStatusTrue();
        localMediaStream.getVideoTracks()[0].enabled = true;
      }
      myVideo.classList.toggle("mirror");
    })
    .catch((e) => {
      console.log("[Error] to swaping camera", e);
      userLog("error", "Error to swaping the camera: " + e.message);
    });
}


function toggleScreenSharing() {
  const constraints = {
    video: true,
  };

  let screenMediaPromise;

  if (!isScreenStreaming) {
    if (navigator.getDisplayMedia) {
      screenMediaPromise = navigator.getDisplayMedia(constraints);
    } else if (navigator.mediaDevices.getDisplayMedia) {
      screenMediaPromise = navigator.mediaDevices.getDisplayMedia(constraints);
    } else {
      screenMediaPromise = navigator.mediaDevices.getUserMedia({
        video: {
          mediaSource: "screen",
        },
      });
    }
  } 
  else{
    screenMediaPromise = navigator.mediaDevices.getUserMedia(constraints);
  }
  screenMediaPromise
    .then((screenStream) => {
      localMediaStream.getVideoTracks()[0].stop();
      isScreenStreaming = !isScreenStreaming;
      refreshMyStreamToPeers(screenStream);
      refreshMyLocalStream(screenStream);
      myVideo.classList.toggle("mirror");
      setScreenSharingStatus(isScreenStreaming);
    })
    .catch((e) => {
      console.error("[Error] Unable to share the screen", e);
      userLog("error", "Unable to share the screen: " + e.message);
    });
}


function setScreenSharingStatus(status) {
  screenShareBtn.className = status ? "fas fa-stop-circle" : "fas fa-desktop";
  if (!isMobileDevice) {
    tippy(screenShareBtn, {
      content: status ? "STOP screen sharing" : "START screen sharing",
      placement: "right-start",
    });
  }
}


function setMyVideoStatusTrue() {
  if (myVideoStatus === false) {
    myVideoStatus = true;
    videoBtn.className = "fas fa-video";
    myVideoStatusIcon.className = "fas fa-video videoStatusIcon";
    myVideoAvatarImage.style.display = "none";
    emitPeerStatus("video", myVideoStatus);
    if (!isMobileDevice) {
      tippy(videoBtn, {
        content: "Click to video OFF",
        placement: "right-start",
      });
    }
  }
}



function refreshMyStreamToPeers(stream) {
  if (thereIsPeerConnections()) {
    for (var peer_id in peerConnections) {
      var sender = peerConnections[peer_id]
        .getSenders()
        .find((s) => (s.track ? s.track.kind === "video" : false));
      sender.replaceTrack(stream.getVideoTracks()[0]);
    }
  }
}


function refreshMyLocalStream(stream) {
  stream.getVideoTracks()[0].enabled = true;
  const newStream = new MediaStream([
    stream.getVideoTracks()[0],
    localMediaStream.getAudioTracks()[0],
  ]);
  localMediaStream = newStream;

  attachMediaStream(myVideo, localMediaStream); 

  stream.getVideoTracks()[0].onended = function () {
    if (isScreenStreaming) toggleScreenSharing();
  };


  if (myVideoStatus === false) {
    localMediaStream.getVideoTracks()[0].enabled = false;
  }
}

function handleDataAvailable(event) {
  console.log("handleDataAvailable", event);
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function getDataTimeString() {
  const d = new Date();
  const date = d.toISOString().split("T")[0];
  const time = d.toTimeString().split(" ")[0];
  return `${date}-${time}`;
}


function disableElements(b) {
  screenShareBtn.disabled = b;
}




function escapeSpecialChars(regex) {
  return regex.replace(/([()[{*+.$^\\|?])/g, "\\$1");
}



function getFormatDate(date) {
  const time = date.toTimeString().split(" ")[0];
  return `${time}`;
}






function updateMyPeerName() {
  myVideoParagraph.innerHTML = myPeerName + " (me)";

  myPeerNameSet.value = ""; ///////////////////////////////////////////////////////////////
  myPeerNameSet.placeholder = myPeerName;

  setPeerAvatarImgName("myVideoAvatarImage", myPeerName);
}


function appendPeerName(id, name) {
  var videoName = getId(id + "_name");
  if (videoName) {
    videoName.innerHTML = name;
  }

}

function emitPeerStatus(element, status) {
  signalingSocket.emit("peerStatus", {
    peerConnections: peerConnections,
    room_id: roomId,
    peer_name: myPeerName,
    element: element,
    status: status,
  });
}

function setMyAudioStatus(status) {
  myAudioStatusIcon.className =
    "fas fa-microphone" + (status ? "" : "-slash") + " audioStatusIcon";
  emitPeerStatus("audio", status);
  tippy(myAudioStatusIcon, {
    content: status ? "My audio is ON" : "My audio is OFF",
  });
 
  if (!isMobileDevice) {
    tippy(audioBtn, {
      content: status ? "Click to audio OFF" : "Click to audio ON",
      placement: "right-start",
    });
  }
}

function setMyVideoStatus(status) {
  myVideoAvatarImage.style.display = status ? "none" : "block";
  myVideoStatusIcon.className =
    "fas fa-video" + (status ? "" : "-slash") + " videoStatusIcon";
  emitPeerStatus("video", status);
  tippy(myVideoStatusIcon, {
    content: status ? "My video is ON" : "My video is OFF",
  });
    tippy(videoBtn, {
      content: status ? "Click to video OFF" : "Click to video ON",
      placement: "right-start",
    });
}



function setPeerAudioStatus(peer_id, status) {
  let peerAudioStatus = getId(peer_id + "_audioStatus");
  peerAudioStatus.className =
    "fas fa-microphone" + (status ? "" : "-slash") + " audioStatusIcon";
  tippy(peerAudioStatus, {
    content: status ? "Participant audio is ON" : "Participant audio is OFF",
  });
}


function setPeerVideoStatus(peer_id, status) {
  let peerVideoAvatarImage = getId(peer_id + "_avatar");
  let peerVideoStatus = getId(peer_id + "_videoStatus");
  peerVideoStatus.className =
    "fas fa-video" + (status ? "" : "-slash") + " videoStatusIcon";
  peerVideoAvatarImage.style.display = status ? "none" : "block";
  tippy(peerVideoStatus, {
    content: status ? "Participant video is ON" : "Participant video is OFF",
  });
}


function cleanBoard() {

  Swal.fire({
    position: "center",
    title: "Clean the board",
    text: "Are you sure you want to clean the board?",
    showDenyButton: true,
    confirmButtonText: `Yes`,
    denyButtonText: `No`,
  }).then((result) => {
    if (result.isConfirmed) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  });
}

function draw(newx, newy, oldx, oldy) {
  ctx.strokeStyle = color;
  ctx.lineWidth = drawsize;
  ctx.beginPath();
  ctx.moveTo(oldx, oldy);
  ctx.lineTo(newx, newy);
  ctx.stroke();
  ctx.closePath();
}


function fitToContainer(canvas) {
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}


function reportWindowSize() {
  fitToContainer(canvas);
}

function setupCanvas() {
  fitToContainer(canvas);

  canvas.addEventListener("mousedown", (e) => {
    x = e.offsetX;
    y = e.offsetY;
    isDrawing = 1;
  });
  canvas.addEventListener("mousemove", (e) => {
    if (isDrawing) {
      draw(e.offsetX, e.offsetY, x, y);
      x = e.offsetX;
      y = e.offsetY;
    }
  });
  window.addEventListener("mouseup", (e) => {
    if (isDrawing) {
      isDrawing = 0;
    }
  });

  window.onresize = reportWindowSize;
}


function setMyAudioOff(peer_name) {
  if (myAudioStatus === false) return;
  localMediaStream.getAudioTracks()[0].enabled = false;
  myAudioStatus = localMediaStream.getAudioTracks()[0].enabled;
  audioBtn.className = "fas fa-microphone-slash";
  setMyAudioStatus(myAudioStatus);
  userLog("info", peer_name + " has disabled your audio");
}

function setMyVideoOff(peer_name) {
  if (myVideoStatus === false) return;
  localMediaStream.getVideoTracks()[0].enabled = false;
  myVideoStatus = localMediaStream.getVideoTracks()[0].enabled;
  videoBtn.className = "fas fa-video-slash";
  setMyVideoStatus(myVideoStatus);
  userLog("info", peer_name + " has disabled your video");
}

function leaveRoom() {

  Swal.fire({
    position: "center",
    imageAlt: "ClassRoom",
    title: "Leave this room?",
    showDenyButton: true,
    confirmButtonText: `Yes`,
    denyButtonText: `No`,
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = "/newcall";
    }
  });
}

function userLog(type, message) {
  switch (type) {
    case "error":
      Swal.fire({
        position: "center",
        icon: "error",
        title: "Oops...",
        text: message,
      });
      break;
    case "info":
      Swal.fire({
        position: "center",
        icon: "info",
        title: "Info",
        text: message,
      });
      break;
    case "success":
      Swal.fire({
        position: "center",
        icon: "success",
        title: "Success",
        text: message,

      });
      break;
    default:
      alert(message);
  }
}



function getId(id) {
  return document.getElementById(id);
}

function getSl(selector) {
  return document.querySelector(selector);
}
