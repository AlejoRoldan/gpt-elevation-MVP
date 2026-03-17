require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Anthropic = require('@anthropic-ai/sdk'); 
const { connectDB, sequelize } = require('./database'); 
const User = require('./User'); 
const Message = require('./Message'); // 📦 Importamos la tabla de mensajes

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY, 
});

const JWT_SECRET = 'elevation_secreto_super_seguro_2026';

connectDB().then(() => {
    User.hasMany(Message);
    Message.belongsTo(User);

    sequelize.sync({ alter: true }) 
        .then(() => console.log('✅ Tablas de usuario y mensajes listas y sincronizadas.'))
        .catch(err => console.error('❌ Error creando las tablas:', err));
});

// ==========================================
// 🛡️ RUTAS DE SEGURIDAD
// ==========================================
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ name, email, password: hashedPassword });
        res.status(201).json({ message: "Usuario creado exitosamente. ¡Bienvenido a Elevation!" });
    } catch (error) {
        res.status(400).json({ error: "El correo ya está registrado o hubo un error." });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ error: "Usuario no encontrado." });
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: "Contraseña incorrecta." });
        
        const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET, { expiresIn: '2h' });
        res.json({ message: "Inicio de sesión exitoso", token, name: user.name });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor." });
    }
});

// ==========================================
// 👮‍♂️ EL GUARDIA (Verifica la llave de React)
// ==========================================
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ error: "Acceso denegado. No tienes llave." });

    const token = authHeader.split(' ')[1]; 
    
    try {
        const decodificado = jwt.verify(token, JWT_SECRET);
        req.user = decodificado; 
        next(); 
    } catch (error) {
        return res.status(401).json({ error: "Llave inválida o expirada." });
    }
};

// ==========================================
// 🧠 RUTA DEL CHAT (Guarda en Base de Datos)
// ==========================================
app.post('/api/chat', verificarToken, async (req, res) => {
    const mensajeUsuario = req.body.message;
    const userId = req.user.id; 

    try {
        await Message.create({
            role: 'user',
            content: mensajeUsuario,
            UserId: userId
        });

        const msg = await anthropic.messages.create({
            model: "claude-3-haiku-20240307", 
            max_tokens: 1000,
            system: "Eres Elevation, una inteligencia artificial empática, profesional y cálida, diseñada para brindar apoyo en salud mental y bienestar emocional. Escuchas activamente, validas las emociones del usuario y haces preguntas reflexivas. Tus respuestas deben ser concisas y conversacionales.",
            messages: [
                { role: "user", content: mensajeUsuario }
            ]
        });

        const respuestaIA = msg.content[0].text;

        await Message.create({
            role: 'assistant',
            content: respuestaIA,
            UserId: userId
        });

        res.json({ reply: respuestaIA });

    } catch (error) {
        console.error("❌ Error de comunicación:", error);
        res.status(500).json({ reply: "Lo siento, tuve una pequeña desconexión. ¿Podrías repetirme eso?" });
    }
});
// ==========================================
// 📜 RUTA PARA CARGAR EL HISTORIAL DE CHAT
// ==========================================
app.get('/api/messages', verificarToken, async (req, res) => {
    try {
        // Buscamos todos los mensajes de este usuario específico y los ordenamos por fecha
        const mensajes = await Message.findAll({
            where: { UserId: req.user.id },
            order: [['createdAt', 'ASC']]
        });

        // Los convertimos al formato que entiende nuestro frontend (user / bot)
        const historial = mensajes.map(m => ({
            role: m.role === 'assistant' ? 'bot' : 'user',
            text: m.content
        }));

        res.json(historial);
    } catch (error) {
        console.error("❌ Error obteniendo historial:", error);
        res.status(500).json({ error: "No se pudo cargar el historial." });
    }
});

//const PORT = 3000;
//app.listen(PORT, () => {
//    console.log(`🚀 Servidor de Elevation conectado al cerebro de IA en el puerto ${PORT}`);
//});

module.exports = app;