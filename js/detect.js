const URL_TM = "https://teachablemachine.withgoogle.com/models/t3DsCswoe/"; 

let model, pose, camera;
let isProcessing = false;
const countdownDuration = 3; 

const videoElement = document.getElementById("camera");
const canvasElement = document.getElementById("canvas");
const canvasCtx = canvasElement.getContext("2d");
const statusElement = document.getElementById("status");

async function loadModels() {
    statusElement.innerText = "Memuat AI Model... Mohon Tunggu";
    
    try {
        const modelURL = URL_TM + "model.json";
        const metadataURL = URL_TM + "metadata.json";
        model = await tmImage.load(modelURL, metadataURL);
        
        pose = new Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });

        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        pose.onResults(onPoseResults);
        console.log("Model AI Berhasil Dimuat");
    } catch (e) {
        console.error("Gagal memuat model:", e);
        statusElement.innerText = "Gagal memuat model AI. Periksa koneksi internet.";
    }
}

async function startAutomaticFlow() {
    isProcessing = true;

    for (let i = countdownDuration; i > 0; i--) {
        statusElement.innerText = `Siap dalam ${i}...`;
        statusElement.style.backgroundColor = "#fff7ed";
        statusElement.style.color = "#c2410c";
        statusElement.style.border = "1px solid #fdba74";
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    statusElement.innerText = "Menganalisis...";
    statusElement.style.backgroundColor = "#eef2ff"; 
    statusElement.style.color = "#4338ca";
    
    await new Promise(resolve => setTimeout(resolve, 800));

    const prediction = await model.predict(canvasElement);
    const isSafe = prediction[0].probability > prediction[1].probability; 
    const finalStatus = isSafe ? "LENGKAP (PAKAI MASKER)" : "TIDAK LENGKAP (TANPA MASKER)";

    if(isSafe) {
        statusElement.style.backgroundColor = "#dcfce7";
        statusElement.style.color = "#15803d";
    } else {
        statusElement.style.backgroundColor = "#fee2e2"; 
        statusElement.style.color = "#b91c1c";
    }

    saveToRecap(finalStatus);
    showResultPopup(finalStatus, isSafe);
}

function saveToRecap(statusResult) {
    const nama = sessionStorage.getItem("workerName");
    const id = sessionStorage.getItem("workerId");
    
    const history = JSON.parse(localStorage.getItem("recapHistory") || "[]");
    history.push({
        nama: nama,
        id: id,
        status: statusResult,
        waktu: new Date().toLocaleString('id-ID')
    });
    localStorage.setItem("recapHistory", JSON.stringify(history));
}

function showResultPopup(statusResult, isSafe) {
    const nama = sessionStorage.getItem("workerName");
    const id = sessionStorage.getItem("workerId");

    Swal.fire({
        title: isSafe ? 'Verifikasi Berhasil!' : 'Verifikasi Gagal!',
        html: `
            <div style="text-align: left; background: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0;">
                <p style="margin: 5px 0;"><strong>Nama:</strong> ${nama}</p>
                <p style="margin: 5px 0;"><strong>ID:</strong> ${id}</p>
                <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${isSafe ? '#15803d' : '#b91c1c'}; font-weight: bold;">${statusResult}</span></p>
            </div>
            <p style="margin-top: 15px; font-size: 13px; color: #64748b;">Pilih tindakan selanjutnya di bawah ini.</p>
        `,
        icon: isSafe ? 'success' : 'error',
        
        confirmButtonText: 'Lihat Rekap',
        confirmButtonColor: '#6366f1',
        
        showDenyButton: true,
        denyButtonText: 'Selesai / Menu Utama',
        denyButtonColor: '#94a3b8',
        
        allowOutsideClick: false,
        backdrop: `rgba(99, 102, 241, 0.2)`
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = "recap.html";
        } else if (result.isDenied) {
            sessionStorage.clear(); 
            window.location.href = "index.html";
        }
    });
}

function onPoseResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.poseLandmarks) {
        // code dibawah ini buat nampilin mark atau titik tubuh pakai mediapipe
        // drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {color: '#00FF00', lineWidth: 2});
        // drawLandmarks(canvasCtx, results.poseLandmarks, {color: '#FF0000', lineWidth: 1, radius: 2});

        if (!isProcessing) {
            startAutomaticFlow();
        }
    } else {
        if (!isProcessing) {
            statusElement.innerText = "Posisikan tubuh & wajah di depan kamera";
            statusElement.style.backgroundColor = "#666";
        }
    }
    canvasCtx.restore();
}

async function startSystem() {
    await loadModels();

    camera = new Camera(videoElement, {
        onFrame: async () => {
            await pose.send({ image: videoElement });
        },
        width: 640,
        height: 480
    });

    statusElement.innerText = "Menghidupkan Kamera...";
    camera.start();
}

window.addEventListener("DOMContentLoaded", () => {
    const workerName = sessionStorage.getItem("workerName");
    
    if (workerName) {
        document.getElementById("workerName").innerText = `Selamat Datang, ${workerName}`;
        startSystem();
    } else {
        window.location.href = "scan.html";
    }
});