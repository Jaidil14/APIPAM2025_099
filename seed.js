const db = require('./config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

function hashSHA256(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
}

async function seedUser() {
    try {
        const username = 'admin';
        const passwordAsli = 'admin123';
        
        // 1. Simulasikan proses Android: Hash password asli ke SHA-256
        const passwordDariAndroid = hashSHA256(passwordAsli);

        // 2. Proses Backend: Encrypt SHA-256 string tersebut dengan Bcrypt
        const saltRounds = 10;
        const hashFinal = await bcrypt.hash(passwordDariAndroid, saltRounds);

        // 3. Hapus user lama
        await db.execute('DELETE FROM Tabel_User WHERE Username = ?', [username]);

        // 4. Insert User Baru
        const sql = 'INSERT INTO Tabel_User (Username, Password) VALUES (?, ?)';
        await db.execute(sql, [username, hashFinal]);

        console.log("------------------------------------------");
        console.log("✅ SEED BERHASIL (FORMAT BARU)!");
        console.log(`Username: ${username}`);
        console.log(`Password Asli: ${passwordAsli}`);
        console.log(`Simulasi Kiriman Android (SHA256): ${passwordDariAndroid.substring(0, 10)}...`);
        console.log("------------------------------------------");
        
        process.exit();
    } catch (err) {
        console.error("❌ Gagal seeding:", err.message);
        process.exit(1);
    }
}

seedUser();