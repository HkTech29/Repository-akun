const Joi = require('joi');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');


async function routeHandler(server) {
    const db = admin.firestore();
<<<<<<< HEAD
    server.route({
        method: 'POST',
        path: '/login',
        handler: async (request, h) => {
            const { email, password } = request.payload;
    
            const userSnapshot = await db.collection('users').where('email', '==', email).get();
            if (userSnapshot.empty) {
                return h.response({ error: true, message: "Email tidak ditemukan. Pastikan Anda telah mendaftar dengan email yang benar." }).code(401);
            }
    
            const userDoc = userSnapshot.docs[0];
            const user = userDoc.data();
    
            const isPasswordValid = await argon2.verify(user.password, password);
            if (!isPasswordValid) {
                return h.response({ error: true, message: 'Password salah. Silakan periksa kembali password Anda.' }).code(401);
            }
    
            const nameForAvatar = encodeURIComponent(user.name);
            const avatarUrl = `https://ui-avatars.com/api/?name=${nameForAvatar}&size=50`;
    
            const token = jwt.sign({ userId: userDoc.id, name: user.name, avatarUrl }, 'kunci-rahasia-anda', { expiresIn: '1h' });
    
            return h.response({
                error: false,
                message: 'Sukses',
                loginResult: {
                    userId: userDoc.id,
                    name: user.name,
                    avatarUrl,
                    token: token
                }
            }).code(200);
        }
    });

}

module.exports = routeHandler;
