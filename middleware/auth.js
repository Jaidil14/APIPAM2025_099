const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "Akses ditolak. Silakan login terlebih dahulu." });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // Menyimpan data user dari token
        next();
    } catch (err) {
        res.status(403).json({ message: "Sesi tidak valid atau telah berakhir." });
    }
};