const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth'); // Include relationship Login

// 1. LIHAT SEMUA DATA (Read All)
// Aktor harus login terlebih dahulu [auth]
router.get('/', auth, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM Tabel_Langganan');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. LIHAT DETAIL DATA (Read Detail)
router.get('/:id', auth, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM Tabel_Langganan WHERE Id_Langganan = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: "Data tidak ditemukan" });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. TAMBAH DATA (Create)
router.post('/', auth, async (req, res) => {
    const { jenis, harga } = req.body;

    // Validasi Constraints: Jenis harus 'Tahunan', 'Bulanan', atau 'Harian'
    const validJenis = ['Tahunan', 'Bulanan', 'Harian'];
    if (!validJenis.includes(jenis)) {
        return res.status(400).json({ message: "Jenis langganan tidak valid" });
    }

    try {
        const sql = `INSERT INTO Tabel_Langganan (Jenis, Harga) VALUES (?, ?)`;
        const [result] = await db.execute(sql, [jenis, harga]);
        
        // Log Aktivitas ke Tabel_Log
        await db.execute('INSERT INTO Tabel_Log (Aktivitas, Waktu_Kejadian) VALUES (?, NOW())', 
            [`Tambah Langganan: ${jenis}`]);

        res.status(201).json({ 
            message: "Data langganan berhasil ditambahkan",
            id: result.insertId 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. UBAH DATA (Update)
router.put('/:id', auth, async (req, res) => {
    const { jenis, harga } = req.body;
    
    // Validasi Constraints
    const validJenis = ['Tahunan', 'Bulanan', 'Harian'];
    if (jenis && !validJenis.includes(jenis)) {
        return res.status(400).json({ message: "Jenis langganan tidak valid" });
    }

    try {
        const sql = `UPDATE Tabel_Langganan SET Jenis = ?, Harga = ? WHERE Id_Langganan = ?`;
        const [result] = await db.execute(sql, [jenis, harga, req.params.id]);
        
        if (result.affectedRows === 0) return res.status(404).json({ message: "Data tidak ditemukan" });

        // Log Aktivitas
        await db.execute('INSERT INTO Tabel_Log (Aktivitas, Waktu_Kejadian) VALUES (?, NOW())', 
            [`Ubah Langganan ID: ${req.params.id}`]);

        res.json({ message: "Data langganan berhasil diperbarui" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. HAPUS DATA (Delete)
router.delete('/:id', auth, async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM Tabel_Langganan WHERE Id_Langganan = ?', [req.params.id]);
        if (result.affectedRows > 0) {
            // Catat ke Log sesuai Kamus Data
            await db.execute('INSERT INTO Tabel_Log (Aktivitas, Waktu_Kejadian) VALUES (?, NOW())', ['Hapus Paket Langganan']);
            res.json({ message: "Paket berhasil dihapus" });
        } else {
            res.status(404).json({ message: "Data tidak ditemukan" });
        }
    } catch (err) {
        res.status(500).json({ message: "Gagal menghapus. Data mungkin sedang digunakan oleh pelanggan." });
    }
});

module.exports = router;