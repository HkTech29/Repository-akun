const Joi = require('joi');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');


async function routeHandler(server) {
    const db = admin.firestore(); 
    server.route({
        method: 'POST',
        path: '/register',
        handler: async (request, h) => {
            const { name, email, password } = request.payload;
            const db = admin.firestore();
    
            const schema = Joi.object({
                name: Joi.string().min(3).max(20).required(),
                email: Joi.string().email().required(),
                password: Joi.string().min(8).required()
            });
    
            const { error } = schema.validate(request.payload, { abortEarly: false });
            if (error) {
                const translatedErrors = error.details.map(err => translateJoiError(err));
                return h.response({ error: true, message: translatedErrors.join(', ') }).code(400);
            }
    
            const userSnapshot = await db.collection('users').where('email', '==', email).get();
            if (!userSnapshot.empty) {
                return h.response({ error: true, message: 'Email sudah digunakan, silakan coba lagi' }).code(400);
            }
    
            const hashedPassword = await argon2.hash(password);
    
            const userRef = db.collection('users').doc();
            await userRef.set({
                name,
                email,
                password: hashedPassword
            });
    
            return h.response({ error: false, message: 'Pengguna berhasil dibuat' }).code(201);
        }
    });
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
