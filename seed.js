const db = require('./config/db');
const bcrypt = require('bcrypt');

async function seedUser() {
    try {
        const username = 'admin';
        const passwordAsli = 'admin123';
        
        // 1. Proses Hashing (Menjamin kecocokan dengan backend)
        const saltRounds = 10;
        const hash = await bcrypt.hash(passwordAsli, saltRounds);

        // 2. Hapus user lama jika ada (untuk reset)
        await db.execute('DELETE FROM Tabel_User WHERE Username = ?', [username]);

        // 3. Insert User Baru
        const sql = 'INSERT INTO Tabel_User (Username, Password) VALUES (?, ?)';
        await db.execute(sql, [username, hash]);

        console.log("------------------------------------------");
        console.log("✅ SEED BERHASIL!");
        console.log(`Username: ${username}`);
        console.log(`Password: ${passwordAsli}`);
        console.log(`Hash di DB: ${hash}`);
        console.log("------------------------------------------");
        
        process.exit();
    } catch (err) {
        console.error("❌ Gagal seeding:", err.message);
        process.exit(1);
    }
}

seedUser();