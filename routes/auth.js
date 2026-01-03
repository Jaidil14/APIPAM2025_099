const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Validasi input: Username max 25 char
    if (username.length > 25) return res.status(400).json({ message: "Username terlalu panjang" });

    try {
        const [rows] = await db.execute('SELECT * FROM Tabel_User WHERE Username = ?', [username]);
        if (rows.length === 0) return res.status(404).json({ message: "User tidak ditemukan" });

        const validPass = await bcrypt.compare(password, rows[0].Password);
        if (!validPass) return res.status(400).json({ message: "Password salah" });

        const token = jwt.sign({ id: rows[0].Id_User }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        // Log Aktivitas
        await db.execute('INSERT INTO Tabel_Log (Aktivitas, Waktu_Kejadian) VALUES (?, NOW())', ['User Login']);

        res.json({ token, message: "Login berhasil" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/logout', async (req, res) => {
    // Sisi klien menghapus token, backend mencatat log
    await db.execute('INSERT INTO Tabel_Log (Aktivitas, Waktu_Kejadian) VALUES (?, NOW())', ['User Logout']);
    res.json({ message: "Logout berhasil" });
});

module.exports = router;