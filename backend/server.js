require('dotenv').config(); 
const crypto = require('crypto');
const ALGORITMO = 'aes-256-cbc';
// Usamos tu DB_PASS para generar una llave de 32 bytes estable
const KEY = Buffer.from((process.env.DB_PASS || 'default_password_2026').padEnd(32).slice(0, 32));

const encriptar = (texto) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITMO, KEY, iv);
    let encrypted = cipher.update(texto, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
};
const desencriptar = (texto) => {
    const partes = texto.split(':');
    const iv = Buffer.from(partes.shift(), 'hex');
    const contenidoEncrypted = partes.join(':');
    const decipher = crypto.createDecipheriv(ALGORITMO, KEY, iv);
    let decrypted = decipher.update(contenidoEncrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Anthropic = require('@anthropic-ai/sdk'); 
const sequelize = require('./database');
const User = require('./User');
const Message = require('./message');
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
const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY, 
});

const JWT_SECRET = 'elevation_secreto_super_seguro_2026';

// --- PUENTE FRONTEND-BACKEND ---
// 1. Servir los archivos estáticos de React (Vite)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// 2. Cualquier ruta que no sea de la API, que cargue el Frontend
// --- RUTA PARA CARGAR EL HISTORIAL (Añade esto aquí) ---
app.get('/api/messages', verificarToken, async (req, res) => {
    try {
        const mensajes = await Message.findAll({
            where: { UserId: req.user.id },
            order: [['createdAt', 'ASC']]
        });

        const historial = mensajes.map(m => {
            try {
                // Intentamos desencriptar cada mensaje
                return {
                    role: m.role === 'assistant' ? 'bot' : 'user',
                    text: desencriptar(m.content) // <--- ¡AQUÍ ESTÁ LA MAGIA!
                };
            } catch (e) {
                // Si algún mensaje viejo no estaba encriptado, lo muestra normal
                return {
                    role: m.role === 'assistant' ? 'bot' : 'user',
                    text: m.content 
                };
            }
        });

        res.json(historial);
    } catch (error) {
        console.error("❌ Error cargando historial:", error);
        res.status(500).json({ error: "Error de memoria" });
    }
});

app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Sincronizamos la base de datos y arrancamos el servidor
sequelize.sync({ alter: true }) 
  .then(() => {
    console.log('✅ Conexión a PostgreSQL en Google Cloud establecida con éxito.');
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor de Elevation corriendo en el puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Error fatal al conectar con la base de datos:', error);
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


// ==========================================
// 🧠 RUTA DEL CHAT (Guarda en Base de Datos)
// ==========================================
app.post('/api/chat', verificarToken, async (req, res) => {
    const mensajeUsuario = req.body.message;
    const userId = req.user.id; 

    try {
        // 1. Guardamos el mensaje del usuario ENCRIPTADO
        await Message.create({
            role: 'user',
            content: encriptar(mensajeUsuario),
            UserId: userId // <--- El vínculo vital que nos faltaba
        });

        // 2. Llamada a Anthropic (Mantenemos tu lógica exacta)
        const msg = await anthropic.messages.create({
            model: "claude-3-haiku-20240307", 
            max_tokens: 1000,
            system: "Eres Elevation, una inteligencia artificial empática, profesional y cálida...",
            messages: [{ role: "user", content: mensajeUsuario }]
        });

        const respuestaIA = msg.content[0].text;

        // 3. Guardamos la respuesta de la IA ENCRIPTADA
        await Message.create({
            role: 'assistant',
            content: encriptar(respuestaIA),
            UserId: userId
        });

        res.json({ reply: respuestaIA });

    } catch (error) {
        console.error("❌ Error de comunicación:", error);
        res.status(500).json({ reply: "Lo siento, tuve una pequeña desconexión." });
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
    text: desencriptar(m.content) // <-- No olvides el escudo de desencriptación
}));

        res.json(historial);
    } catch (error) {
        console.error("❌ Error obteniendo historial:", error);
        res.status(500).json({ error: "No se pudo cargar el historial." });
    }
});


// Definimos el puerto: Cloud Run nos dará uno en process.env.PORT, 
// si no, usamos el 8080 por defecto.
const PORT = process.env.PORT || 8080;

// Arrancamos el servidor
app.listen(PORT, () => {
    console.log(`🚀 Elevation está en el aire en el puerto ${PORT}`);
    console.log(`🌍 Conectado al cerebro de IA y listo para el cliente.`);
});
module.exports = app;