document.addEventListener("DOMContentLoaded", () => {
  console.log("Mon projet est prêt !");
});

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
  stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: currentFacing }, audio: true });
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
  document.body.innerHTML = "";
  document.body.style.margin = "0";
  document.body.style.background = "black";

  video = document.createElement("video");
  video.autoplay = true;
  video.playsInline = true;
  video.muted = true;
  video.srcObject = stream;
  await video.play();

  overlay = new Image();
  overlay.src = `images/overlay-${currentLang}.png`;

  canvas = document.createElement("canvas");
  ctx = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.objectFit = "cover";
  document.body.appendChild(canvas);

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
  document.body.appendChild(timerDisplay);

  const recordingUI = document.createElement("div");
  recordingUI.style.position = "fixed";
  recordingUI.style.bottom = "30px";
  recordingUI.style.left = "50%";
  recordingUI.style.transform = "translateX(-50%)";
  recordingUI.style.display = "flex";
  recordingUI.style.gap = "10px";
  recordingUI.style.background = "rgba(0,0,0,0.4)";
  recordingUI.style.padding = "8px 16px";
  recordingUI.style.borderRadius = "20px";
  recordingUI.style.zIndex = "10002";

  const recordBtn = createBtn("⏺️");
  const stopBtn = createBtn("⏹️");
  stopBtn.disabled = true;

  recordBtn.onclick = () => {
    startRecording();
    recordBtn.disabled = true;
    setTimeout(() => stopBtn.disabled = false, 30000);
  };

  stopBtn.onclick = () => mediaRecorder.stop();

  recordingUI.appendChild(recordBtn);
  recordingUI.appendChild(stopBtn);

  if (await hasMultipleCameras()) {
    const switchBtn = createBtn("🔄");
    switchBtn.onclick = switchCamera;
    recordingUI.appendChild(switchBtn);
  }

  document.body.appendChild(recordingUI);
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
  canvasStream = canvas.captureStream(30);
  audioTrack = stream.getAudioTracks()[0];
  canvasStream.addTrack(audioTrack);

  mediaRecorder = new MediaRecorder(canvasStream, { mimeType: "video/webm" });
  mediaRecorder.ondataavailable = e => chunks.push(e.data);
  mediaRecorder.onstop = () => {
    clearInterval(timerInterval);
    const waitMsg = document.createElement("div");
    waitMsg.innerText = messages[currentLang];
    waitMsg.style.position = "fixed";
    waitMsg.style.top = "50%";
    waitMsg.style.left = "50%";
    waitMsg.style.transform = "translate(-50%, -50%)";
    waitMsg.style.color = "#fff";
    waitMsg.style.fontSize = "18px";
    waitMsg.style.zIndex = "10003";
    document.body.appendChild(waitMsg);

    setTimeout(() => {
      waitMsg.remove();
      uploadAndDownloadMP4();
    }, 2000);
  };
  mediaRecorder.start();

  timerInterval = setInterval(() => {
    secondsElapsed++;
    const min = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
    const sec = String(secondsElapsed % 60).padStart(2, '0');
    document.getElementById("timer").innerText = `${min}:${sec}`;
  }, 1000);

  setTimeout(() => mediaRecorder.stop(), 120000);
}

function uploadAndDownloadMP4() {
  const blob = new Blob(chunks, { type: "video/webm" });
  const formData = new FormData();
  formData.append("video", blob, "video.webm");
// ✅ Log pou debogaj
console.log("📤 Nap voye videyo sou backend...");
console.log("🧱 Taille blob:", blob.size);
  fetch("http://localhost:3000/upload", {
    method: "POST",
    body: formData
  })
    .then(res => res.json())
    .then(({ downloadUrl }) => {
      document.body.innerHTML = "";
      document.body.style.margin = "0";
      document.body.style.background = "#000";
      document.body.style.display = "flex";
      document.body.style.flexDirection = "column";
      document.body.style.alignItems = "center";
      document.body.style.justifyContent = "center";
      document.body.style.height = "100vh";

      const videoPreview = document.createElement("video");
      videoPreview.src = new URL(downloadUrl, location.origin).href;
      videoPreview.controls = true;
      videoPreview.style.maxWidth = "90vw";
      videoPreview.style.maxHeight = "60vh";
      videoPreview.style.border = "4px solid #fff";
      videoPreview.style.borderRadius = "12px";
      videoPreview.autoplay = true;
      document.body.appendChild(videoPreview);

      const actionZone = document.createElement("div");
      actionZone.style.marginTop = "20px";
      actionZone.style.display = "flex";
      actionZone.style.gap = "20px";

      const downloadBtn = document.createElement("a");
      downloadBtn.href = videoPreview.src;
      downloadBtn.download = "video.mp4";
      downloadBtn.innerText = "⬇️ Telechaje";
      downloadBtn.style.padding = "10px 20px";
      downloadBtn.style.background = "#0f0";
      downloadBtn.style.color = "#000";
      downloadBtn.style.borderRadius = "8px";
      downloadBtn.style.textDecoration = "none";
      actionZone.appendChild(downloadBtn);

      const redoBtn = document.createElement("button");
      redoBtn.innerText = "🔁 Rekòmanse";
      redoBtn.style.padding = "10px 20px";
      redoBtn.style.background = "#f00";
      redoBtn.style.color = "#fff";
      redoBtn.style.border = "none";
      redoBtn.style.borderRadius = "8px";
      redoBtn.onclick = () => window.location.reload();
      actionZone.appendChild(redoBtn);

      document.body.appendChild(actionZone);
    })
    .catch(err => {
      alert("❌ Erè pandan upload / konvèsyon!");
      console.error(err);
    });
}

function createBtn(icon) {
  const btn = document.createElement("button");
  btn.innerText = icon;
  btn.style.padding = "6px 10px";
  btn.style.fontSize = "20px";
  btn.style.borderRadius = "50%";
  btn.style.border = "none";
  btn.style.background = "rgba(255,255,255,0.3)";
  btn.style.color = "#fff";
  btn.style.cursor = "pointer";
  return btn;
}
