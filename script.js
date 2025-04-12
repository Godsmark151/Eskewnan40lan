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
    document.body.appendChild(recordBtn);

    recordBtn.onclick = () => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        recordBtn.style.background = "red";
        document.getElementById("timer").style.color = "white";
      } else {
        startRecording();
        recordBtn.style.background = "gray";
        document.getElementById("timer").style.color = "red";
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
        const videoPreview = document.createElement("video");
        videoPreview.src = mp4Url;
        videoPreview.controls = true;
        videoPreview.autoplay = true;
        videoPreview.style.maxWidth = "90vw";
        videoPreview.style.maxHeight = "60vh";
        videoPreview.style.border = "4px solid #fff";
        videoPreview.style.borderRadius = "12px";

        const downloadBtn = document.createElement("a");
        downloadBtn.href = mp4Url;
        downloadBtn.download = "Eske w nan 40 lan.mp4";
        downloadBtn.innerText = "⬇️ Telechaje";
        downloadBtn.style.padding = "10px 20px";
        downloadBtn.style.background = "#0f0";
        downloadBtn.style.color = "#000";
        downloadBtn.style.borderRadius = "8px";
        downloadBtn.style.textDecoration = "none";

        const redoBtn = document.createElement("button");
        redoBtn.innerText = "🔁 Rekòmanse";
        redoBtn.style.padding = "10px 20px";
        redoBtn.style.background = "#f00";
        redoBtn.style.color = "#fff";
        redoBtn.style.border = "none";
        redoBtn.style.borderRadius = "8px";
        redoBtn.onclick = () => window.location.reload();

        const actionZone = document.createElement("div");
        actionZone.style.marginTop = "20px";
        actionZone.style.display = "flex";
        actionZone.style.gap = "20px";
        actionZone.appendChild(downloadBtn);
        actionZone.appendChild(redoBtn);

        document.body.innerHTML = "";
        document.body.style.background = "#000";
        document.body.appendChild(videoPreview);
        document.body.appendChild(actionZone);
      })
      .catch(err => {
        alert("❌ Erè pandan upload / konvèsyon!");
        console.error(err);
      });
  }
});
