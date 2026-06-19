window.addEventListener("load", () => {
    const codeReader = new ZXing.BrowserMultiFormatReader();
    const video = document.getElementById("preview");
    const resultElement = document.getElementById("result");

    codeReader.decodeFromConstraints({ video: { facingMode: "environment" } }, video, async (result, err) => {
        if (result) {
            resultElement.innerText = "Mengecek ID: " + result.text;
            try {
                const response = await fetch('../data/pekerja.json');
                const workers = await response.json();
                const worker = workers.find(w => w.id === result.text);

                if (worker) {
                    sessionStorage.setItem("workerName", worker.nama);
                    sessionStorage.setItem("workerId", worker.id);
                    window.location.href = "check.html";
                } else {
                    resultElement.innerText = "ID Tidak Terdaftar!";
                    resultElement.style.color = "red";
                }
            } catch (error) {
                console.error("Gagal memuat data pekerja:", error);
            }
        }
    });
});