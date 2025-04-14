// ✅ SCRIPT MODIFIED WITH RecordRTC FOR iPHONE SUPPORT
// DOMContentLoaded block is preserved
// Original structure kept with enhancements

// Note: Make sure you add the RecordRTC.js script to your HTML:
// <script src="https://www.webrtc-experiment.com/RecordRTC.js"></script>

// The following changes were made:
// - Detect iPhone devices
// - Use RecordRTC if iPhone, else use MediaRecorder
// - Remove hard 30s limit
// - Ensure canvas overlay still captured in recording

// ✅ Insert at the top of the DOMContentLoaded scope:
function isIphone() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

let recorderRTC;

// ✅ Update the record button logic inside launchCameraInterface
recordBtn.onclick = () => {
  if (isIphone()) {
    if (recorderRTC && recorderRTC.getState() === "recording") {
      recorderRTC.stopRecording(() => {
        const blob = recorderRTC.getBlob();
        uploadAndDownloadMP4(blob);
      });
      recordBtn.style.background = "red";
      timerDisplay.style.color = "white";
    } else {
      recorderRTC = RecordRTC(canvas, {
        type: 'canvas',
        mimeType: 'video/webm',
        frameInterval: 10,
        disableLogs: true
      });
      recorderRTC.startRecording();
      secondsElapsed = 0;
      timerInterval = setInterval(() => {
        secondsElapsed++;
        const min = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
        const sec = String(secondsElapsed % 60).padStart(2, '0');
        document.getElementById("timer").innerText = `${min}:${sec}`;
      }, 1000);
      recordBtn.style.background = "gray";
      timerDisplay.style.color = "red";
    }
  } else {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      recordBtn.style.background = "red";
      timerDisplay.style.color = "white";
    } else {
      startRecording();
      recordBtn.style.background = "gray";
      timerDisplay.style.color = "red";
    }
  }
};

// ✅ Update uploadAndDownloadMP4 function to accept optional blob:
function uploadAndDownloadMP4(blobInput = null) {
  const blob = blobInput || new Blob(chunks, { type: "video/webm" });
  const formData = new FormData();
  formData.append("file", blob);
  formData.append("upload_preset", "video_uploads");

  fetch("https://api.cloudinary.com/v1_1/drlzwtqve/video/upload", {
    method: "POST",
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      const mp4Url = data.secure_url.replace('/upload/', '/upload/f_mp4/');
      displayPreview(mp4Url);
    })
    .catch(err => {
      alert("❌ Erè pandan upload / konvèsyon!");
      console.error(err);
    });
}

// ✅ DONE: Script now supports both Android (MediaRecorder) and iPhone (RecordRTC)
// Users can record without 30s limit and overlays will still be captured correctly.
