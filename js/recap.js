window.addEventListener("load", () => {
    renderRecap();
});

function renderRecap() {
    const history = JSON.parse(localStorage.getItem("recapHistory") || "[]");
    const container = document.getElementById("recap-content");
    
    if (history.length === 0) {
        container.innerHTML = '<div class="empty-state">Belum ada riwayat pemeriksaan.</div>';
        return;
    }

    const sortedHistory = history.reverse();

    const groupedData = {};
    sortedHistory.forEach(item => {
        const datePart = item.waktu.split(',')[0]; 
        if (!groupedData[datePart]) {
            groupedData[datePart] = [];
        }
        groupedData[datePart].push(item);
    });

    let htmlContent = "";
    for (const date in groupedData) {
        htmlContent += `
            <div class="date-group">
                <div class="date-badge">${date}</div>
                <div class="table-responsive">
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
                            ${groupedData[date].map(row => `
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
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = htmlContent;
}

function clearHistory() {
    Swal.fire({
        title: 'Hapus Semua Riwayat?',
        text: "Tindakan ini tidak dapat dibatalkan!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem("recapHistory");
            renderRecap();
            Swal.fire('Terhapus!', 'Semua data riwayat telah dibersihkan.', 'success');
        }
    });
}