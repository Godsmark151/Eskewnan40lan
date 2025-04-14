// ✅ Ajoute sipò pou iPhone ak RecordRTC
// Mete sa nan <head> ou:
// <script src="https://www.webrtc-experiment.com/RecordRTC.js"></script>

function isIphone() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

let recorderRTC;
document.addEventListener("DOMContentLoaded", () => {
  console.log("Mon projet est prêt !");

  let currentLang = "";
  let currentFacing = "user";
  let mediaRecorder, stream, canvasStream, audioTrack;
  let chunks = [], video, overlay, canvas, ctx, timerInterval;
  let secondsElapsed = 0;

  const messages = {
    ht: "Tanpri tann...",
    en: "Please wait...",
    fr: "Veuillez patienter...",
    es: "Por favor espera..."
  };

  document.querySelectorAll('.lang-button').forEach(button => {
    button.addEventListener('click', async () => {
      currentLang = button.parentElement.getAttribute('data-lang');
      await requestPermissions();
      await launchCameraInterface();
    });
  });

  async function requestPermissions() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: currentFacing } },
        audio: true
      });
    } catch (err) {
      alert("❌ Kamera pa ka louvri. Tanpri verifye pèmisyon ou oswa chanje navigatè.");
      console.error(err);
    }
  }

  async function hasMultipleCameras() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput').length > 1;
  }

  async function switchCamera() {
    currentFacing = currentFacing === 'user' ? 'environment' : 'user';
    stream.getTracks().forEach(track => track.stop());
    await requestPermissions();
    video.srcObject = stream;
    await video.play();
  }

  async function launchCameraInterface() {
    // Kache seksyon ki deja la
    document.querySelector(".first-background").style.display = "none";
    document.querySelector(".second-background").style.display = "none";

    // Kreye nouvo zòn entèfas
    const cameraInterface = document.createElement("div");
    cameraInterface.id = "camera-interface";
    cameraInterface.style.position = "relative";
    document.body.appendChild(cameraInterface);

    // Video
    video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.srcObject = stream;
    cameraInterface.appendChild(video);

    // Overlay
    overlay = new Image();
    overlay.src = `images/overlay-${currentLang}.png`;

    // Canvas
    canvas = document.createElement("canvas");
    ctx = canvas.getContext("2d");
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.objectFit = "cover";
    cameraInterface.appendChild(canvas);

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      video.play();
    };

    // Timer
    const timerDisplay = document.createElement("div");
    timerDisplay.id = "timer";
    timerDisplay.innerText = "00:00";
    timerDisplay.style.position = "fixed";
    timerDisplay.style.top = "20px";
    timerDisplay.style.left = "50%";
    timerDisplay.style.transform = "translateX(-50%)";
    timerDisplay.style.background = "rgba(0,0,0,0.5)";
    timerDisplay.style.color = "#fff";
    timerDisplay.style.padding = "4px 8px";
    timerDisplay.style.borderRadius = "6px";
    timerDisplay.style.fontSize = "14px";
    timerDisplay.style.zIndex = "10002";
    cameraInterface.appendChild(timerDisplay);

    // Bouton Record
    const recordBtn = document.createElement("button");
    recordBtn.className = "record-btn";
    const redSquare = document.createElement("div");
    redSquare.className = "inner-circle";
    recordBtn.appendChild(redSquare);
    recordBtn.style.position = "fixed";
    recordBtn.style.bottom = "30px";
    recordBtn.style.left = "50%";
    recordBtn.style.transform = "translateX(-50%)";
    recordBtn.style.padding = "16px";
    recordBtn.style.fontSize = "24px";
    recordBtn.style.borderRadius = "50%";
    recordBtn.style.border = "none";
    recordBtn.style.background = "red";
    recordBtn.style.color = "white";
    recordBtn.style.zIndex = "10003";
    cameraInterface.appendChild(recordBtn);

    recordBtn.onclick = () => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        recordBtn.style.background = "red";
        timerDisplay.style.color = "white";
      } else {
        startRecording();
        recordBtn.style.background = "gray";
        timerDisplay.style.color = "red";
      }
    };

    requestAnimationFrame(drawLoop);
  }

  function drawOverlay() {
    if (overlay.complete) ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height);
  }

  function drawLoop() {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    drawOverlay();
    requestAnimationFrame(drawLoop);
  }

  function startRecording() {
    chunks = [];
    canvasStream = canvas.captureStream(30);
    audioTrack = stream.getAudioTracks()[0];
    canvasStream.addTrack(audioTrack);

    mediaRecorder = new MediaRecorder(canvasStream, { mimeType: "video/webm" });
    mediaRecorder.ondataavailable = e => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      clearInterval(timerInterval);
      uploadAndDownloadMP4();
    };
    mediaRecorder.start();

    secondsElapsed = 0;
    timerInterval = setInterval(() => {
      secondsElapsed++;
      const min = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
      const sec = String(secondsElapsed % 60).padStart(2, '0');
      document.getElementById("timer").innerText = `${min}:${sec}`;
    }, 1000);
  }

  function uploadAndDownloadMP4() {
    const blob = new Blob(chunks, { type: "video/webm" });
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

  function displayPreview(mp4Url) {
    document.body.innerHTML = "";
    document.body.style.background = "#000";

    const videoPreview = document.createElement("video");
    videoPreview.src = mp4Url;
    videoPreview.controls = true;
    videoPreview.autoplay = true;
    videoPreview.className = "preview";
    document.body.appendChild(videoPreview);

    const downloadBtn = document.createElement("button");
    downloadBtn.innerText = "⬇️ Telechaje";
    downloadBtn.style.padding = "10px 20px";
    downloadBtn.style.background = "#0f0";
    downloadBtn.style.color = "#000";
    downloadBtn.style.borderRadius = "8px";
    downloadBtn.style.fontWeight = "bold";
    downloadBtn.onclick = () => forceDownloadMP4(mp4Url);

    const redoBtn = document.createElement("button");
    redoBtn.innerText = "🔁 Rekòmanse";
    redoBtn.style.padding = "10px 20px";
    redoBtn.style.background = "#f00";
    redoBtn.style.color = "#fff";
    redoBtn.style.borderRadius = "8px";
    redoBtn.style.marginLeft = "12px";
    redoBtn.onclick = () => window.location.reload();

    const actionZone = document.createElement("div");
    actionZone.style.marginTop = "20px";
    actionZone.style.display = "flex";
    actionZone.style.justifyContent = "center";
    actionZone.style.gap = "20px";
    actionZone.appendChild(downloadBtn);
    actionZone.appendChild(redoBtn);

    document.body.appendChild(actionZone);
  }

  function forceDownloadMP4(mp4Url) {
    fetch(mp4Url)
      .then(res => res.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = "Eske-w-nan-40-lan.mp4";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      })
      .catch(err => {
        alert("❌ Pa ka telechaje videyo a.");
        console.error(err);
      });
  }
});
