const cron = require('node-cron');
const db = require('../config/db');

// Fungsi untuk mengecek dan update status
const checkExpiredSubscriptions = async () => {
    console.log('[SCHEDULER] Menjalankan pengecekan pelanggan expired...');
    
    try {
        // 1. Query untuk mengubah status menjadi 'Tidak Aktif' 
        // Kriteria: Status masih 'Aktif' DAN Tanggal Selesai kurang dari HARI INI
        const sql = `
            UPDATE Tabel_Pelanggan 
            SET Status = 'Tidak Aktif' 
            WHERE Status = 'Aktif' AND Tgl_Selesai < CURDATE()
        `;

        const [result] = await db.execute(sql);

        if (result.affectedRows > 0) {
            console.log(`[SCHEDULER] Berhasil menonaktifkan ${result.affectedRows} pelanggan expired.`);
            
            // 2. Catat ke Tabel_Log sesuai SRS (Audit Trail)
            // SRS Appendix B.6 mewajibkan log aktivitas
            const logMsg = `System Auto-Update: ${result.affectedRows} Pelanggan Expired`;
            await db.execute(
                'INSERT INTO Tabel_Log (Aktivitas, Waktu_Kejadian) VALUES (?, NOW())', 
                [logMsg]
            );
        } else {
            console.log('[SCHEDULER] Tidak ada pelanggan yang expired hari ini.');
        }

    } catch (error) {
        console.error('[SCHEDULER ERROR]', error.message);
    }
};

const initScheduler = () => {
    // Jadwal: Dijalankan setiap hari pukul 00:01 dini hari
    // Format Cron: Menit Jam Tanggal Bulan Hari
    cron.schedule('1 0 * * *', () => {
        checkExpiredSubscriptions();
    });

    console.log('✅ Scheduler aktif: Pengecekan expired otomatis setiap jam 00:01');
};

module.exports = { initScheduler, checkExpiredSubscriptions };