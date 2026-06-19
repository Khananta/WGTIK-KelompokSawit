const MASK_URL = 'https://teachablemachine.withgoogle.com/models/W0XPL_SL8/';
const HELMET_URL = 'https://teachablemachine.withgoogle.com/models/wmk9d7ycW/';
const GLASSES_URL = 'https://teachablemachine.withgoogle.com/models/X4SAlDgM1/';


let maskModel;
let helmetModel;
let glassesModel;
let pose, camera;

let isProcessing = false;
const countdownDuration = 3;

const videoElement = document.getElementById('camera');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');
const statusElement = document.getElementById('status');

async function loadModels(useCamera = true) {
  statusElement.innerText = 'Memuat AI Model... Mohon Tunggu';

  try {
    statusElement.innerText = 'Memuat Model Masker... (1/3)';
    maskModel = await tmImage.load(MASK_URL + 'model.json', MASK_URL + 'metadata.json');
    console.log('Mask Model Loaded');

    statusElement.innerText = 'Memuat Model Helm... (2/3)';
    helmetModel = await tmImage.load(HELMET_URL + 'model.json', HELMET_URL + 'metadata.json');
    console.log('Helmet Model Loaded');

    statusElement.innerText = 'Memuat Model Kacamata... (3/3)';
    glassesModel = await tmImage.load(GLASSES_URL + 'model.json', GLASSES_URL + 'metadata.json');
    console.log('Glasses Model Loaded');

    if (useCamera) {
      statusElement.innerText = 'Menyiapkan Pose Detection...';

      pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults(onPoseResults);

      statusElement.innerText = 'Menginisialisasi Deteksi Tubuh... (Agak Lama)';
      await pose.initialize();
      
      console.log('Pose Loaded');
    }
  } catch (e) {
    console.error(e);
    statusElement.innerText = 'Gagal memuat model AI';
  }
}

async function startAutomaticFlow(skipCountdown = false) {
  isProcessing = true;

  if (!skipCountdown) {
    for (let i = countdownDuration; i > 0; i--) {
      statusElement.innerText = `Siap dalam ${i}...`;
      statusElement.style.backgroundColor = '#fff7ed';
      statusElement.style.color = '#c2410c';
      statusElement.style.border = '1px solid #fdba74';

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  statusElement.innerHTML = '🔍 Memindai atribut keselamatan...';
  statusElement.style.backgroundColor = '#eef2ff';
  statusElement.style.color = '#4338ca';

  await new Promise((resolve) => setTimeout(resolve, 800));

  // ==========================
  // PREDIKSI MASKER
  // ==========================
  const maskPrediction = await maskModel.predict(canvasElement);
  const maskOK = maskPrediction[0].probability > maskPrediction[1].probability;

  // ==========================
  // PREDIKSI HELM
  // ==========================
  const helmetPrediction = await helmetModel.predict(canvasElement);
  const helmetOK = helmetPrediction[0].probability > helmetPrediction[1].probability;

  // ==========================
  // PREDIKSI KACAMATA
  // ==========================
  const glassesPrediction = await glassesModel.predict(canvasElement);
  const glassesOK = glassesPrediction[0].probability > glassesPrediction[1].probability;

  console.log(maskPrediction);
  console.log(helmetPrediction);
  console.log(glassesPrediction);

  // ==========================
  // HASIL AKHIR
  // ==========================
  let atributKurang = [];

  if (!maskOK) {
    atributKurang.push('Masker');
  }

  if (!helmetOK) {
    atributKurang.push('Helm');
  }

  if (!glassesOK) {
    atributKurang.push('Kacamata');
  }

  const isSafe = atributKurang.length === 0;

  // Update panel hasil
  const helmetResult = document.getElementById('helmetResult');
  const maskResult = document.getElementById('maskResult');
  const glassesResult = document.getElementById('glassesResult');

  helmetResult.innerHTML = helmetOK ? '<span class="status-success">✅ Terdeteksi</span>' : '<span class="status-fail">❌ Tidak Terdeteksi</span>';
  maskResult.innerHTML = maskOK ? '<span class="status-success">✅ Terdeteksi</span>' : '<span class="status-fail">❌ Tidak Terdeteksi</span>';
  if (glassesResult) {
    glassesResult.innerHTML = glassesOK ? '<span class="status-success">✅ Terdeteksi</span>' : '<span class="status-fail">❌ Tidak Terdeteksi</span>';
  }

  // Update status utama
  statusElement.innerHTML = isSafe ? '✅ AKSES DIBERIKAN' : '❌ AKSES DITOLAK';

  if (isSafe) {
    statusElement.style.backgroundColor = '#dcfce7';
    statusElement.style.color = '#15803d';
  } else {
    statusElement.style.backgroundColor = '#fee2e2';
    statusElement.style.color = '#b91c1c';
  }

  const finalStatus = isSafe ? 'SEMUA ATRIBUT LENGKAP' : 'Kurang: ' + atributKurang.join(', ');
  saveToRecap(finalStatus);
  showResultPopup(finalStatus, isSafe);
}

function saveToRecap(statusResult) {
  const nama = sessionStorage.getItem('workerName');
  const id = sessionStorage.getItem('workerId');

  const history = JSON.parse(localStorage.getItem('recapHistory') || '[]');

  history.push({
    nama: nama,
    id: id,
    status: statusResult,
    waktu: new Date().toLocaleString('id-ID'),
  });

  localStorage.setItem('recapHistory', JSON.stringify(history));
}

function showResultPopup(statusResult, isSafe) {
  const nama = sessionStorage.getItem('workerName');
  const id = sessionStorage.getItem('workerId');

  Swal.fire({
    title: isSafe ? 'Verifikasi Berhasil!' : 'Verifikasi Gagal!',
    html: `
      <div style="text-align:left;background:#f8fafc;padding:15px;border-radius:10px;border:1px solid #e2e8f0;">
        <p><strong>Nama :</strong> ${nama}</p>
        <p><strong>ID :</strong> ${id}</p>
        <p>
          <strong>Status :</strong>
          <span style="color:${isSafe ? '#15803d' : '#b91c1c'};font-weight:bold;">
            ${statusResult}
          </span>
        </p>
      </div>
    `,
    icon: isSafe ? 'success' : 'error',
    confirmButtonText: 'Lihat Rekap',
    confirmButtonColor: '#6366f1',
    showDenyButton: true,
    denyButtonText: 'Selesai / Menu Utama',
    denyButtonColor: '#94a3b8',
    allowOutsideClick: false,
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = 'recap.html';
    } else if (result.isDenied) {
      sessionStorage.clear();
      window.location.href = 'index.html';
    }
  });
}

function onPoseResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.poseLandmarks) {
    if (!isProcessing) {
      startAutomaticFlow();
    }
  } else {
    if (!isProcessing) {
      statusElement.innerText = 'Posisikan tubuh & wajah di depan kamera';
    }
  }

  canvasCtx.restore();
}

// ========================================================
// FUNGSI UTAMA YANG SUDAH DIPERBAIKI (PERUBAHAN DI SINI)
// ========================================================
async function startSystem(useCamera) {
  await loadModels(useCamera);

  if (useCamera) {
    // Inisialisasi dimensi canvas internal agar sinkron dengan video
    canvasElement.width = 640;
    canvasElement.height = 480;

    camera = new Camera(videoElement, {
      onFrame: async () => {
        await pose.send({
          image: videoElement,
        });
      },
      width: 640,
      height: 480,
    });

    statusElement.innerText = 'Menghidupkan Kamera...';

    try {
      await camera.start();
      console.log('Camera Started Successfully');
    } catch (err) {
      console.error(err);
      statusElement.innerHTML = '❌ Kamera gagal dibuka. Pastikan izin kamera aktif.';
    }
  } else {
    statusElement.innerText = 'Silakan unggah foto uji coba.';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const workerName = sessionStorage.getItem('workerName');

  const imageUpload = document.getElementById('imageUpload');
  if (imageUpload) {
    imageUpload.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        if (camera) {
          try {
            camera.stop();
          } catch(e) {}
        }
        
        statusElement.innerText = 'Menganalisis Foto Unggahan...';
        const img = new Image();
        img.onload = () => {
          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
          
          // Hitung rasio agar gambar tidak penyok
          const scale = Math.min(canvasElement.width / img.width, canvasElement.height / img.height);
          const x = (canvasElement.width / 2) - (img.width / 2) * scale;
          const y = (canvasElement.height / 2) - (img.height / 2) * scale;
          
          canvasCtx.drawImage(img, x, y, img.width * scale, img.height * scale);
          canvasCtx.restore();
          
          if (!isProcessing) {
            startAutomaticFlow(true); // skip countdown on file upload
          }
        };
        img.src = URL.createObjectURL(file);
      }
    });
  }

  if (workerName) {
    const workerNameEl = document.getElementById('workerName');
    if (workerNameEl) {
      workerNameEl.innerText = `Selamat Datang, ${workerName}`;
    }
    
    Swal.fire({
      title: 'Pilih Mode Deteksi',
      text: 'Bagaimana Anda ingin melakukan verifikasi APD?',
      icon: 'question',
      showDenyButton: true,
      confirmButtonText: '📷 Gunakan Kamera',
      denyButtonText: '📁 Unggah Foto',
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then((result) => {
      if (result.isConfirmed) {
        document.getElementById('video-container-div').style.display = 'block';
        document.getElementById('btnUpload').style.display = 'none';
        startSystem(true);
      } else if (result.isDenied) {
        document.getElementById('video-container-div').style.display = 'none';
        document.getElementById('btnUpload').style.display = 'block';
        startSystem(false);
      }
    });

  } else {
    // Diproteksi agar tidak redirect looping jika memang sengaja tes halaman ini
    // window.location.href = 'scan.html';
  }
});

window.addEventListener('load', () => {
  const video = document.getElementById('preview');
  const resultElement = document.getElementById('result');

  // Hanya jalankan QR Reader jika elemen UI prasyaratnya ('preview') ada di halaman ini
  if (video && typeof ZXing !== 'undefined') {
    const codeReader = new ZXing.BrowserMultiFormatReader();
    codeReader.decodeFromVideoDevice(null, video, async (result, err) => {
      if (result) {
        resultElement.innerText = 'Mengecek ID: ' + result.text;
        try {
          const response = await fetch('../data/pekerja.json');
          const workers = await response.json();
          const worker = workers.find((w) => w.id === result.text);

          if (worker) {
            sessionStorage.setItem('workerName', worker.nama);
            sessionStorage.setItem('workerId', worker.id);
            window.location.href = 'check.html';
          } else {
            resultElement.innerText = 'ID Tidak Terdaftar!';
            resultElement.style.color = 'red';
          }
        } catch (error) {
          console.error('Gagal memuat data pekerja:', error);
        }
      }
    });
  }
});

window.addEventListener('load', () => {
  const recapContent = document.getElementById('recap-content');
  if (recapContent) {
    renderRecap();
  }
});

function renderRecap() {
  const history = JSON.parse(localStorage.getItem('recapHistory') || '[]');
  const container = document.getElementById('recap-content');

  if (!container) return;

  if (history.length === 0) {
    container.innerHTML = '<div class="empty-state">Belum ada riwayat pemeriksaan.</div>';
    return;
  }

  const sortedHistory = [...history].reverse();

  const groupedData = {};
  sortedHistory.forEach((item) => {
    const datePart = item.waktu.split(',')[0];
    if (!groupedData[datePart]) {
      groupedData[datePart] = [];
    }
    groupedData[datePart].push(item);
  });

  let htmlContent = '';
  for (const date in groupedData) {
    htmlContent += `
            <div class="date-group">
                <div class="date-badge">${date}</div>
                <table class="recap-table">
                    <thead>
                        <tr>
                            <th>Waktu</th>
                            <th>Nama</th>
                            <th>ID Pekerja</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${groupedData[date]
                          .map(
                            (row) => `
                            <tr>
                                <td>${row.waktu.split(',')[1] || row.waktu}</td>
                                <td><strong>${row.nama}</strong></td>
                                <td>${row.id}</td>
                                <td>
                                    <span class="status-badge ${row.status.includes('LENGKAP') && !row.status.includes('TIDAK') ? 'status-ok' : 'status-fail'}">
                                        ${row.status}
                                    </span>
                                </td>
                            </tr>
                        `,
                          )
                          .join('')}
                    </tbody>
                </table>
            </div>
        `;
  }

  container.innerHTML = htmlContent;
}

function clearHistory() {
  Swal.fire({
    title: 'Hapus Semua Riwayat?',
    text: 'Tindakan ini tidak dapat dibatalkan!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal',
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem('recapHistory');
      renderRecap();
      Swal.fire('Terhapus!', 'Semua data riwayat telah dibersihkan.', 'success');
    }
  });
}
