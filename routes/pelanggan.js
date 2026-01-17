const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const { checkExpiredSubscriptions } = require('../utils/scheduler');

// LIHAT DATA (dengan Search & Filter)
router.get('/', auth, async (req, res) => {
    const { search, status } = req.query;
    let query = "SELECT p.*, l.Jenis as Nama_Langganan FROM Tabel_Pelanggan p JOIN Tabel_Langganan l ON p.Id_Langganan = l.Id_Langganan WHERE 1=1";
    let params = [];

    if (search) {
        query += " AND p.Nama LIKE ?";
        params.push(`%${search}%`);
    }
    if (status && status !== 'Semua') {
        query += " AND p.Status = ?";
        params.push(status);
    }

    try {
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// TAMBAH DATA
router.post('/', auth, async (req, res) => {
    const { nama, alamat, kontak, tgl_mulai, tgl_selesai, status, id_langganan } = req.body;

    // Validasi Constraints
    if (!kontak.startsWith('08') || kontak.length !== 13) {
        return res.status(400).json({ message: "Kontak harus 13 digit dan diawali 08" });
    }

    if (new Date(tgl_selesai) < new Date(tgl_mulai)) {
        return res.status(400).json({ 
            message: "Validasi Gagal: Tanggal selesai harus lebih besar dari tanggal mulai." 
        });
    }

    const namaRegex = /^[a-zA-Z\s]+$/;
    if (!namaRegex.test(nama)) {
        return res.status(400).json({ message: "Nama hanya boleh berisi huruf." });
    }

    const alamatRegex = /^[a-zA-Z0-9\s.,/-]+$/; 
    if (!alamatRegex.test(alamat)) {
        return res.status(400).json({ message: "Format alamat tidak valid." });
    }

    try {
        const sql = `INSERT INTO Tabel_Pelanggan (Nama, Alamat, Kontak, Tgl_Mulai, Tgl_Selesai, Status, Id_Langganan) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        await db.execute(sql, [nama, alamat, kontak, tgl_mulai, tgl_selesai, status, id_langganan]);
        
        await db.execute('INSERT INTO Tabel_Log (Aktivitas, Waktu_Kejadian) VALUES (?, NOW())', [`Tambah Pelanggan: ${nama}`]);
        res.status(201).json({ message: "Pelanggan berhasil ditambahkan" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UBAH DATA
router.put('/:id', auth, async (req, res) => {
    const { nama, alamat, kontak, tgl_mulai, tgl_selesai, status, id_langganan } = req.body;

    // Validasi Constraints
    if (!kontak.startsWith('08') || kontak.length !== 13) {
        return res.status(400).json({ message: "Kontak harus 13 digit dan diawali 08" });
    }
    if (new Date(tgl_selesai) < new Date(tgl_mulai)) {
        return res.status(400).json({ 
            message: "Validasi Gagal: Tanggal selesai harus lebih besar dari tanggal mulai." 
        });
    }

    const namaRegex = /^[a-zA-Z\s]+$/;
    if (!namaRegex.test(nama)) {
        return res.status(400).json({ message: "Nama hanya boleh berisi huruf." });
    }

    const alamatRegex = /^[a-zA-Z0-9\s.,/-]+$/; 
    if (!alamatRegex.test(alamat)) {
        return res.status(400).json({ message: "Format alamat tidak valid." });
    }
    
    try {
        const sql = `UPDATE Tabel_Pelanggan SET Nama=?, Alamat=?, Kontak=?, Tgl_Mulai=?, Tgl_Selesai=?, Status=?, Id_Langganan=? WHERE Id_Pelanggan=?`;
        await db.execute(sql, [nama, alamat, kontak, tgl_mulai, tgl_selesai, status, id_langganan, req.params.id]);
        
        await db.execute('INSERT INTO Tabel_Log (Aktivitas, Waktu_Kejadian) VALUES (?, NOW())', ['Update Data Pelanggan']);
        res.json({ message: "Data pelanggan berhasil diperbarui" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// HAPUS DATA
router.delete('/:id', auth, async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM Tabel_Pelanggan WHERE Id_Pelanggan = ?', [req.params.id]);
        if (result.affectedRows > 0) {
            await db.execute('INSERT INTO Tabel_Log (Aktivitas, Waktu_Kejadian) VALUES (?, NOW())', ['Hapus Data Pelanggan']);
            res.json({ message: "Pelanggan berhasil dihapus" });
        } else {
            res.status(404).json({ message: "Data tidak ditemukan" });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Endpoint Khusus Testing (Nanti bisa dihapus saat production)
router.post('/test-auto-expire', auth, async (req, res) => {
    try {
        await checkExpiredSubscriptions(); // Paksa jalankan fungsi sekarang
        res.json({ message: "Pengecekan expired manual berhasil dijalankan. Cek terminal backend untuk log." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
module.exports = router;