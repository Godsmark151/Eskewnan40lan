let mediaRecorder;
let recordedChunks = [];

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
    const recordedVideo = document.getElementById('recordedVideo');
    const body = document.body;

    // Fè sit la disparèt epi mete kamera an plen ekran
    body.style.overflow = 'hidden';
    cameraScreen.style.display = 'flex';
    cameraScreen.style.position = 'fixed';
    cameraScreen.style.top = '0';
    cameraScreen.style.left = '0';
    cameraScreen.style.width = '100%';
    cameraScreen.style.height = '100vh';
    cameraScreen.style.zIndex = '1000';

    // Mete frame ki matche ak lang lan
    frame.src = frameImage[language];

    // Mete bouton yo ak lang ki koresponn
    startButton.innerText = language === 'fr' ? '🔴 Enregistrer' : language === 'en' ? '🔴 Record' : '🔴 Rekòde';
    stopButton.innerText = language === 'fr' ? '⏹️ Arrêter' : language === 'en' ? '⏹️ Stop' : '⏹️ Stop';
    downloadButton.innerText = language === 'fr' ? '📥 Télécharger' : language === 'en' ? '📥 Download' : '📥 Telechaje';

    // Mete paramèt kamera yo
    navigator.mediaDevices.getUserMedia({ 
        video: { width: 2400, height: 2400, aspectRatio: 1 } 
    })
    .then(stream => {
        video.srcObject = stream;
        recordedChunks = []; // Reyinisyalize si te gen ansyen done

        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });

        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);

            recordedVideo.src = url;
            recordedVideo.style.display = 'block';
            downloadButton.style.display = 'block';

            // Bouton pou telechaje videyo a
            downloadButton.onclick = () => {
                const a = document.createElement('a');
                a.href = url;
                a.download = 'recorded-video.mp4';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };
        };

        // Aktive bouton rekòde a
        startButton.onclick = () => {
            mediaRecorder.start();
            startButton.disabled = true;
            stopButton.disabled = false;
        };

        // Bouton pou sispann anrejistreman
        stopButton.onclick = () => {
            mediaRecorder.stop();
            stopButton.disabled = true;
            startButton.disabled = false;
        };
    })
    .catch(error => {
        console.error('Error accessing the camera:', error);
        alert('Nou pa ka jwenn aksè ak kamera ou. Tanpri verifye pèmisyon yo.');
    });
}

