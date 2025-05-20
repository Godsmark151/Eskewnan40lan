function isIphoneChrome() {
  const ua = navigator.userAgent;
  return /CriOS/.test(ua) && /iPhone|iPod|iPad/.test(ua);
}
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

const errorMessages = {
  ht: "❌ Erè pandan upload. Tanpri verifye koneksyon ou.",
  fr: "❌ Erreur pendant le téléchargement. Veuillez vérifier votre connexion.",
  en: "❌ Upload failed. Please check your connection.",
  es: "❌ Error durante la carga. Por favor verifica tu conexión."
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
  return (
    /iPhone|iPod/.test(navigator.userAgent) ||
    navigator.platform === 'iPad' ||
    (navigator.userAgent.includes('Macintosh') && 'ontouchend' in document)
  );
}

function isIOSDevice() {
  return /iPhone|iPod|iPad/.test(navigator.userAgent);
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
  const modalData = safariMessages[currentLang];
  const safariModal = document.getElementById("safari-modal");
  if (safariModal) {
    safariModal.querySelector("h2").innerHTML = modalData.title;
    safariModal.querySelector("p").innerHTML = modalData.text;
    safariModal.querySelector("button").innerText = modalData.button;
    document.getElementById("close-safari-modal").addEventListener("click", () => {
      safariModal.style.display = "none";
    });
  }
  
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
  document.body.replaceChildren();
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
  overlay.src = "images/overlay.png";

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
    // Mete canvas ak overlay a sou 3000 x 3000
    canvas.width = 3000;
    canvas.height = 3000;
  
    // Ajiste videyo a pou li santre epi skale san li pa detire
    const videoAspect = video.videoWidth / video.videoHeight;
    const canvasAspect = canvas.width / canvas.height;
  
    let drawWidth, drawHeight, offsetX, offsetY;
  
    if (videoAspect > canvasAspect) {
      // Videyo pi laj: adapte selon wotè
      drawHeight = canvas.height;
      drawWidth = drawHeight * videoAspect;
      offsetX = (canvas.width - drawWidth) / 2;
      offsetY = 0;
    } else {
      // Videyo pi wo: adapte selon lajè
      drawWidth = canvas.width;
      drawHeight = drawWidth / videoAspect;
      offsetX = 0;
      offsetY = (canvas.height - drawHeight) / 2;
    }
  
    // Sove sa pou drawLoop
    video._drawX = offsetX;
    video._drawY = offsetY;
    video._drawW = drawWidth;
    video._drawH = drawHeight;
  
    video.play();
  };  
  const controlsContainer = document.createElement("div");
  controlsContainer.style.position = "fixed";
  controlsContainer.style.bottom = "30px";
  controlsContainer.style.left = "50%";
  controlsContainer.style.transform = "translateX(-50%)";
  controlsContainer.style.display = "flex";
  controlsContainer.style.gap = "60px";
  controlsContainer.classList.add("z-top");

  const recordBtn = document.createElement("button");
  recordBtn.className = "record-btn";
  recordBtn.innerHTML = `<div class="inner-circle"></div>`;
  recordBtn.onclick = () => toggleRecording();
  controlsContainer.appendChild(recordBtn);

  if (await hasMultipleCameras()) {
    const switchBtn = document.createElement("button");
    switchBtn.className = "switch-btn";
    switchBtn.innerText = "🔄";
    switchBtn.onclick = switchCamera;
    controlsContainer.appendChild(switchBtn);
  }

  cameraZone.appendChild(controlsContainer);

  const timer = document.createElement("div");
  timer.id = "timer";
  timer.innerText = "00:00";
  timer.classList.add("z-top");
  cameraZone.appendChild(timer);

  const userScript = {
    ht: "Mwen se [non ou], mwen nan [zòn kote ou ye a],\nMwen gen yon envitasyon espesyal pou ou!\nSoti 8 jen rive 20 jiyè, se 40 Jou Jèn sou Shekinah.fm.\nMwen deja la. E ou menm, èske w nan nan 40 lan?",
    fr: "Je suis [votre nom], je suis à [votre lieu],\nJ’ai une invitation spéciale pour vous !\nDu 8 juin au 20 juillet, ce sont les 40 jours de jeûne sur Shekinah.fm.\nMoi, j’y suis déjà. Et vous, êtes-vous dans les 40 ?",
    en: "Mwen se [non ou], mwen nan [zòn kote ou ye a],\nMwen gen yon envitasyon espesyal pou ou!\nSoti 8 jen rive 20 jiyè, se 40 Jou Jèn sou Shekinah.fm.\nMwen deja la. E ou menm, èske w nan nan 40 lan?",
    es: "Soy [tu nombre], estoy en [tu ubicación],\nTengo una invitación especial para ti.\nDel 8 de junio al 20 de julio, son los 40 días de ayuno en Shekinah.fm.\nYa estoy dentro. ¿Y tú, estás en los 40?"
  };

  const scriptDiv = document.createElement("div");
  scriptDiv.innerHTML = (userScript[currentLang] || userScript["en"]).replace(/\n/g, "<br>");
  scriptDiv.style.position = "absolute";
  scriptDiv.style.bottom = "100px";
  scriptDiv.style.left = "20px";
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
  if (video._drawW && video._drawH) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Netwaye canvas
    ctx.drawImage(video, video._drawX, video._drawY, video._drawW, video._drawH); // Jis SA
    if (overlay.complete) ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height); // Overlay
  }
  requestAnimationFrame(drawLoop);
}


async function switchCamera() {
  currentFacing = currentFacing === "user" ? "environment" : "user";
  if (stream) stream.getTracks().forEach(track => track.stop());
  await requestPermissions();
  await launchCameraInterface();
}

function toggleRecording() {
  const timer = document.getElementById("timer");
  const innerCircle = document.querySelector(".inner-circle");

  if ((isIphone() || isSafariReal()) && recorderRTC && recorderRTC.getState() === "recording") {
    recorderRTC.stopRecording(() => {
      clearInterval(timerInterval);
      const blob = recorderRTC.getBlob();
      uploadToCloudflareWorker(blob); // ✅ Upload sou Safari
    });
    return;
  }

  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      uploadToCloudflareWorker(blob); // ✅ Upload sou lòt browser
    };
    mediaRecorder.stop();
    clearInterval(timerInterval);
    return;
  }

  startRecording();
  if (timer) timer.style.color = "red";
  if (innerCircle) {
    innerCircle.style.width = "30px";
    innerCircle.style.height = "30px";
    innerCircle.style.borderRadius = "8px";
  }
}
function isRecordingSupported() {
  const hasMediaRecorder = typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("video/webm");
  const hasRecordRTC = typeof RecordRTC !== "undefined";
  return hasMediaRecorder || hasRecordRTC;
}
function isWebMSupported() {
  // Si se iOS epi RecordRTC disponib, n'ap kite l mache.
  if ((isIphone() || isSafariReal()) && typeof RecordRTC !== "undefined") {
    return true;
  }
  // Sinon, tcheke si MediaRecorder ka fè webm
  return MediaRecorder.isTypeSupported("video/webm");
}


function startRecording() {
  chunks = [];
  const canvasStream = canvas.captureStream(15);
  const audioTrack = stream.getAudioTracks()[0];
  canvasStream.addTrack(audioTrack);

  if (!isWebMSupported()) {
    alert("❌ Navigatè ou a pa sipòte fòma video/webm.");
    return;
  }

  if (isIphone() || isSafariReal()) {
    recorderRTC = RecordRTC(canvasStream, {
      type: 'video',
      mimeType: 'video/webm'
    });
    recorderRTC.startRecording();
  } else {
    mediaRecorder = new MediaRecorder(canvasStream, { mimeType: "video/webm" });
    mediaRecorder.ondataavailable = e => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      uploadToCloudflareWorker(blob);
    };
    mediaRecorder.start();
  }

  secondsElapsed = 0;
  timerInterval = setInterval(() => {
    secondsElapsed++;
    const min = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
    const sec = String(secondsElapsed % 60).padStart(2, '0');
    const timerElem = document.getElementById("timer");
    if (timerElem) {
      timerElem.innerText = `${min}:${sec}`;
    }

    if (secondsElapsed >= 60) {
      clearInterval(timerInterval);
      if (recorderRTC && recorderRTC.getState() === "recording") {
        recorderRTC.stopRecording(() => {
          // Nou mete ti delay pou asire blob la pare
          setTimeout(() => {
            const blob = recorderRTC.getBlob();
            if (blob && blob.size > 0) {
              uploadToCloudflareWorker(blob);
            } else {
              alert("❌ Videyo a pa disponib. Tanpri rekòmanse.");
            }
          }, 300); // ⏱️ tan optimal sou iOS
        });
      } else if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        clearInterval(timerInterval);
      }
    }    
  }, 1000);
}

// ✅ Fonksyon pou upload videyo sou Cloudinary
async function uploadAndDownloadMP4() {
  const blob = new Blob(chunks, { type: "video/webm" });
  uploadToCloudflareWorker(blob);
}

async function uploadToCloudflareWorker(blob) {
  const formData = new FormData();
  formData.append("file", blob);

  const waitDiv = document.createElement("div");
  waitDiv.id = "wait-message";
  waitDiv.classList.add("wait-overlay");
  waitDiv.innerHTML = `
    <div class="spinner"></div>
    <div>${waitMessages[currentLang] || waitMessages["en"]}</div>
  `;
  waitDiv.style.position = "fixed";
  waitDiv.style.top = "50%";
  waitDiv.style.left = "50%";
  waitDiv.style.transform = "translate(-50%, -50%)";
  waitDiv.style.zIndex = "10002";
  waitDiv.style.display = "flex";
  waitDiv.style.flexDirection = "column";
  waitDiv.style.alignItems = "center";
  waitDiv.style.gap = "16px";
  waitDiv.style.color = "white";
  document.body.appendChild(waitDiv);

  try {
    const res = await fetch("https://eskewnan40lan-worker.tgp-operateurradio.workers.dev", {
      method: "POST",
      body: formData,
    });    

    waitDiv.remove();

    if (!res.ok) {
      throw new Error("Worker upload failed");
    }

    const data = await res.json();
    const mp4Url = data.mp4Url;

    console.log("✅ Upload done via Worker + Cloudinary");
    showSourceLabel("cloudinary");
    displayPreview(mp4Url);
  } catch (err) {
    waitDiv.remove();
    alert(errorMessages[currentLang]);
    console.error("Cloudflare Worker error:", err);
  }
}

function showSourceLabel(source) {
  const label = document.createElement("div");
  label.innerText = source === "cloudinary" ? "☁️ Cloudinary" : "";
  label.style.position = "fixed";
  label.style.top = "10px";
  label.style.right = "10px";
  label.style.padding = "6px 12px";
  label.style.background = "#fff";
  label.style.color = "#000";
  label.style.fontWeight = "bold";
  label.style.borderRadius = "6px";
  label.style.zIndex = "10003";
  document.body.appendChild(label);
}


function displayPreview(mp4Url) {
  document.body.innerHTML = "";
  document.body.style.background = "#000";

  const videoPreview = document.createElement("video");
  videoPreview.src = mp4Url;
  videoPreview.controls = true;
  videoPreview.autoplay = true;
  videoPreview.crossOrigin = "anonymous";
  videoPreview.setAttribute("playsinline", "true");
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
    .catch(() => alert(errorMessages[currentLang]));
}
