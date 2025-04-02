let mediaRecorder;
let recordedChunks = [];
let currentCamera = 'user'; // 'user' = front, 'environment' = back

function openCamera(language) {
    const frameImage = {
        'fr': 'Frame-fr.png',
        'en': 'Frame-en.png',
        'ht': 'Frame-ht.png'
    };

    const cameraScreen = document.getElementById('cameraScreen');
    const frame = document.getElementById('frame');
    const video = document.getElementById('video');
    const startButton = document.getElementById('startRecording');
    const stopButton = document.getElementById('stopRecording');
    const downloadButton = document.getElementById('downloadVideo');
    const switchCameraButton = document.getElementById('switchCamera');
    const body = document.body;

    // ❌ Kache tout lòt kontni paj la
    body.style.overflow = 'hidden';
    body.style.height = '100vh';
    body.style.background = 'black';

    // ✅ Fè sèlman kamera ak frame lan parèt sou ekran an
    cameraScreen.style.display = 'flex';
    cameraScreen.style.position = 'fixed';
    cameraScreen.style.top = '0';
    cameraScreen.style.left = '0';
    cameraScreen.style.width = '100%';
    cameraScreen.style.height = '100vh';
    cameraScreen.style.background = 'black';
    cameraScreen.style.zIndex = '1000';

    // 📌 Mete frame lan selon lang yo
    frame.src = frameImage[language];

    // 🟢 Chanje lang bouton yo
    startButton.innerText = language === 'fr' ? '🔴 Enregistrer' : language === 'en' ? '🔴 Record' : '🔴 Rekòde';
    stopButton.innerText = language === 'fr' ? '⏹️ Arrêter' : language === 'en' ? '⏹️ Stop' : '⏹️ Stop';
    downloadButton.innerText = language === 'fr' ? '⬇️ Télécharger' : language === 'en' ? '⬇️ Download' : '⬇️ Telechaje';

    // 🔄 Ajoute lang bouton chanjman kamera
    switchCameraButton.innerText = '🔄';

    startCamera();
}

function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: currentCamera } })
        .then(stream => {
            video.srcObject = stream;
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            recordedChunks = [];

            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: 'video/mp4' });
                const url = URL.createObjectURL(blob);
                const recordedVideo = document.getElementById('recordedVideo');

                recordedVideo.src = url;
                recordedVideo.style.display = 'block';
                downloadButton.style.display = 'block';

                downloadButton.onclick = () => {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'recorded-video.mp4';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                };
            };

            startButton.onclick = () => {
                mediaRecorder.start();
                startButton.style.display = 'none';
                stopButton.style.display = 'block';
            };

            stopButton.onclick = () => {
                mediaRecorder.stop();
                startButton.style.display = 'block';
                stopButton.style.display = 'none';
            };

        })
        .catch(error => {
            console.error('Error accessing the camera:', error);
            alert('Nou pa ka jwenn aksè ak kamera ou. Tanpri verifye pèmisyon yo.');
        });
}

// 🔄 Chanje Kamera Front ↔ Back
function switchCamera() {
    currentCamera = currentCamera === 'user' ? 'environment' : 'user';
    startCamera();
}
