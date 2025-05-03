// 🌐 Lang ak modal Safari dinamik
const safariMessages = {
  ht: {
    title: "⚠️ Enpòtan",
    text: "Chrome sou iPhone pa sipòte anrejistreman videyo.<br>Tanpri ouvri sit sa a nan Safari pou ou ka kontinye anrejistre.",
    button: "Mwen konprann"
  },
  fr: {
    title: "⚠️ Important",
    text: "Chrome sur iPhone ne supporte pas l'enregistrement vidéo.<br>Veuillez ouvrir ce site dans Safari pour continuer.",
    button: "J'ai compris"
  },
  en: {
    title: "⚠️ Important",
    text: "Chrome on iPhone does not support video recording.<br>Please open this site in Safari to continue.",
    button: "I understand"
  },
  es: {
    title: "⚠️ Importante",
    text: "Chrome en iPhone no admite la grabación de video.<br>Por favor, abre este sitio en Safari para continuar.",
    button: "Entiendo"
  }
};

const currentLang = ["ht", "fr", "en", "es"].includes(navigator.language.slice(0, 2))
  ? navigator.language.slice(0, 2)
  : "en";

const modalData = safariMessages[currentLang];
document.querySelector("#safari-modal h2").innerHTML = modalData.title;
document.querySelector("#safari-modal p").innerHTML = modalData.text;
document.querySelector("#safari-modal button").innerText = modalData.button;
document.querySelector("#close-safari-modal").addEventListener("click", () => {
  document.getElementById("safari-modal").style.display = "none";
});

function isIphone() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}
function isIphoneChrome() {
  const ua = navigator.userAgent;
  return /CriOS/.test(ua) && /iPhone|iPad|iPod/.test(ua);
}
function isSafariReal() {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua);
}

let currentFacing = "user";
let stream, canvas, ctx, overlay, video, mediaRecorder, recorderRTC;
let chunks = [], timerInterval, secondsElapsed = 0;

const waitMessages = {
  ht: "Tanpri tann...",
  fr: "Veuillez patienter...",
  en: "Please wait...",
  es: "Por favor espera..."
};

document.addEventListener("DOMContentLoaded", async () => {
  if (isIphoneChrome()) {
    document.getElementById("safari-modal").style.display = "flex";
    return;
  }
  try {
    await requestPermissions();
    await launchCameraInterface();
  } catch (err) {
    alert("❌ Pa kapab jwenn kamera/mikwo. Tanpri verifye pèmisyon yo.");
    console.error(err);
  }
});

async function hasMultipleCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(device => device.kind === 'videoinput').length > 1;
}

async function requestPermissions() {
  stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: currentFacing } }, audio: true });
}

async function launchCameraInterface() {
  document.body.innerHTML = "";
  const cameraZone = document.createElement("div");
  cameraZone.id = "camera-interface";
  document.body.appendChild(cameraZone);

  video = document.createElement("video");
  video.autoplay = true;
  video.playsInline = true;
  video.muted = true;
  video.srcObject = stream;
  cameraZone.appendChild(video);

  overlay = new Image();
  overlay.src = `images/overlay-${currentLang}.png`;

  canvas = document.createElement("canvas");
  ctx = canvas.getContext("2d");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.zIndex = "10000";
  cameraZone.appendChild(canvas);

  video.onloadedmetadata = () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    video.play();
  };

  const recordBtn = document.createElement("button");
  recordBtn.className = "record-btn z-top";
  recordBtn.innerHTML = `<div class="inner-circle"></div>`;
  recordBtn.onclick = () => toggleRecording();
  recordBtn.style.position = "fixed";
  recordBtn.style.bottom = "80px";
  recordBtn.style.left = "50%";
  recordBtn.style.transform = "translateX(-50%)";
  cameraZone.appendChild(recordBtn);

  const timer = document.createElement("div");
  timer.id = "timer";
  timer.innerText = "00:00";
  timer.classList.add("z-top");
  cameraZone.appendChild(timer);

  if (await hasMultipleCameras()) {
    const switchBtn = document.createElement("button");
    switchBtn.className = "switch-btn z-top";
    switchBtn.innerText = "🔄";
    switchBtn.onclick = switchCamera;
    cameraZone.appendChild(switchBtn);
  }

  const userScript = {
    ht: "Mwen se [non ou], mwen nan [zòn kote ou ye a],\nMwen gen yon envitasyon espesyal pou ou!\nSoti 8 jen rive 20 jiyè, se 40 Jou Jèn sou Shekinah.fm.\nMwen deja la. E ou menm, èske w nan nan 40 lan?",
    fr: "Je suis [votre nom], je suis à [votre lieu],\nJ’ai une invitation spéciale pour vous !\nDu 8 juin au 20 juillet, ce sont les 40 jours de jeûne sur Shekinah.fm.\nMoi, j’y suis déjà. Et vous, êtes-vous dans les 40 ?",
    en: "I’m [your name], I’m in [your location],\nI have a special invitation for you!\nFrom June 8 to July 20, it’s 40 Days of Fasting on Shekinah.fm.\nI’m already in. And you, are you in the 40?",
    es: "Soy [tu nombre], estoy en [tu ubicación],\nTengo una invitación especial para ti.\nDel 8 de junio al 20 de julio, son los 40 días de ayuno en Shekinah.fm.\nYa estoy dentro. ¿Y tú, estás en los 40?"
  };

  const scriptDiv = document.createElement("div");
  scriptDiv.innerText = userScript[currentLang] || userScript["en"];
  scriptDiv.style.position = "absolute";
  scriptDiv.style.top = "20px";
  scriptDiv.style.right = "20px";
  scriptDiv.style.color = "white";
  scriptDiv.style.fontSize = "1.2rem";
  scriptDiv.style.background = "rgba(0,0,0,0.4)";
  scriptDiv.style.padding = "8px 14px";
  scriptDiv.style.borderRadius = "8px";
  scriptDiv.classList.add("z-top");
  cameraZone.appendChild(scriptDiv);

  drawLoop();
}

function drawLoop() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  if (overlay.complete) ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height);
  requestAnimationFrame(drawLoop);
}

function switchCamera() {
  currentFacing = currentFacing === "user" ? "environment" : "user";
  requestPermissions().then(launchCameraInterface);
}

function toggleRecording() {
  const timer = document.getElementById("timer");
  const innerCircle = document.querySelector(".inner-circle");

  if ((isIphone() || isSafariReal()) && recorderRTC && recorderRTC.getState() === "recording") {
    recorderRTC.stopRecording(() => {
      clearInterval(timerInterval);
      const blob = recorderRTC.getBlob();
      uploadBlob(blob);
    });
    return;
  }

  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    clearInterval(timerInterval);
    return;
  }

  startRecording();
  timer.style.color = "red";
  innerCircle.style.width = "30px";
  innerCircle.style.height = "30px";
  innerCircle.style.borderRadius = "8px";
}

function startRecording() {
  chunks = [];
  const canvasStream = canvas.captureStream(30);
  const audioTrack = stream.getAudioTracks()[0];
  canvasStream.addTrack(audioTrack);

  if (isIphone() || isSafariReal()) {
    recorderRTC = RecordRTC(canvasStream, {
      type: 'video',
      mimeType: 'video/webm'
    });
    recorderRTC.startRecording();
  } else {
    mediaRecorder = new MediaRecorder(canvasStream, { mimeType: "video/webm" });
    mediaRecorder.ondataavailable = e => chunks.push(e.data);
    mediaRecorder.onstop = () => uploadAndDownloadMP4();
    mediaRecorder.start();
  }

  secondsElapsed = 0;
  timerInterval = setInterval(() => {
    secondsElapsed++;
    const min = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
    const sec = String(secondsElapsed % 60).padStart(2, '0');
    document.getElementById("timer").innerText = `${min}:${sec}`;

    if (secondsElapsed >= 60) {
      if (recorderRTC && recorderRTC.getState() === "recording") {
        recorderRTC.stopRecording(() => {
          clearInterval(timerInterval);
          const blob = recorderRTC.getBlob();
          uploadBlob(blob);
        });
      } else if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
    }
  }, 1000);
}

function uploadAndDownloadMP4() {
  const blob = new Blob(chunks, { type: "video/webm" });
  uploadBlob(blob);
}

async function uploadBlob(blob) {
  const formData = new FormData();
  formData.append("video", blob);

  const downloadBtn = document.createElement("button");
  downloadBtn.className = "action-btn";
  downloadBtn.disabled = true;

  const spinner = document.createElement("span");
  spinner.className = "spinner";
  downloadBtn.appendChild(spinner);
  downloadBtn.append("Wait...");

  document.body.innerHTML = "";
  document.body.style.background = "#000";
  document.body.appendChild(downloadBtn);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch("http://eskewnan40lan-backend.onrender.com/upload", {
      method: "POST",
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) throw new Error("⛔ Echec konvèsyon sou sèvè a");
    const data = await res.json();
    const filename = data.filename;
    const token = data.token;
    const mp4Url = `http://eskewnan40lan-backend.onrender.com/${filename}?token=${token}`;

    displayPreview(mp4Url);
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("❌ Upload/Conversion failed:", err);
    if (err.name === 'AbortError') {
      alert("❌ Operasyon an pran twòp tan. Tanpri verifye koneksyon w epi eseye ankò.");
    } else {
      alert("❌ Echèk pandan upload oswa konvèsyon videyo a.");
    }
  }
}
   
function displayPreview(mp4Url) {
  document.body.innerHTML = "";
  document.body.style.background = "#000";

  const videoPreview = document.createElement("video");
  videoPreview.src = mp4Url;
  videoPreview.controls = true;
  videoPreview.autoplay = true;
  videoPreview.style.width = "90%";
  videoPreview.style.margin = "auto";
  document.body.appendChild(videoPreview);

  const downloadBtn = document.createElement("button");
  downloadBtn.className = "action-btn";
  const buttonTexts = {
    ht: { download: "⬇️ Telechaje", retry: "🔁 Rekòmanse" },
    fr: { download: "⬇️ Télécharger", retry: "🔁 Recommencer" },
    en: { download: "⬇️ Download", retry: "🔁 Retry" },
    es: { download: "⬇️ Descargar", retry: "🔁 Reintentar" }
  };
  downloadBtn.innerText = buttonTexts[currentLang]?.download || "⬇️ Download";
  downloadBtn.onclick = () => forceDownloadMP4(mp4Url);

  const retryBtn = document.createElement("button");
  retryBtn.className = "action-btn";
  retryBtn.innerText = buttonTexts[currentLang]?.retry || "🔁 Retry";
  retryBtn.onclick = async () => {
    await requestPermissions();
    launchCameraInterface();
  };

  const buttons = document.createElement("div");
  buttons.style.marginTop = "20px";
  buttons.style.display = "flex";
  buttons.style.justifyContent = "center";
  buttons.style.gap = "20px";
  buttons.appendChild(downloadBtn);
  buttons.appendChild(retryBtn);

  document.body.appendChild(buttons);
}

function forceDownloadMP4(mp4Url) {
  fetch(mp4Url)
    .then(res => res.blob())
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const names = {
        ht: "Eske-w-nan-40-lan.mp4",
        fr: "Es-tu-dans-les-40.mp4",
        en: "Are-you-in-the-40.mp4",
        es: "Estas-en-los-40.mp4"
      };
      a.download = names[currentLang] || "Eske-w-nan-40-lan.mp4";      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    })
    .catch(() => alert('❌ Pa ka telechaje videyo a.'));
}
