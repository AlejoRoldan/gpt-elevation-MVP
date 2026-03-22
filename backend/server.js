require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Anthropic = require('@anthropic-ai/sdk');
const { connectDB, sequelize } = require('./database');
const User = require('./User');
const Message = require('./Message');
const { PromptVault, getActivePrompt } = require('./promptVault');

const app = express();

// ==========================================
// 🛡️ CORS
// ==========================================
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// ==========================================
// 🔐 ENCRIPTACIÓN DE MENSAJES (AES-256-CBC)
// Usa DB_PASS como semilla de la clave — igual que en el sistema original
// ==========================================
const ALGORITMO = 'aes-256-cbc';
const KEY = Buffer.from(
  (process.env.DB_PASS || 'default_password_2026').padEnd(32).slice(0, 32)
);

const encriptar = (texto) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITMO, KEY, iv);
  let encrypted = cipher.update(texto, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

const desencriptar = (texto) => {
  try {
    const partes = texto.split(':');
    const iv = Buffer.from(partes.shift(), 'hex');
    const contenidoEncrypted = partes.join(':');
    const decipher = crypto.createDecipheriv(ALGORITMO, KEY, iv);
    let decrypted = decipher.update(contenidoEncrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    // Si no se puede desencriptar, devolvemos el texto tal cual
    // Esto protege contra mensajes corruptos o no encriptados
    console.error('⚠️ Error desencriptando mensaje:', error.message);
    return texto;
  }
};

// ==========================================
// 🤖 ANTHROPIC
// ==========================================
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ==========================================
// 🔑 JWT
// ==========================================
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_dev_secret_2026';
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET no está configurado — usando valor de desarrollo');
}

// ==========================================
// 🗄️ CONEXIÓN BD Y SINCRONIZACIÓN
// ==========================================
connectDB().then(() => {
  User.hasMany(Message);
  Message.belongsTo(User);

  sequelize.sync({ alter: true })
    .then(() => console.log('✅ Tablas sincronizadas en PostgreSQL.'))
    .catch(err => console.error('❌ Error sincronizando tablas:', err));
});

// ==========================================
// 🛡️ RUTAS DE AUTENTICACIÓN
// ==========================================
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Verificar lista blanca de admins
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    const role = adminEmails.includes(email.toLowerCase()) ? 'admin' : 'user';

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashedPassword, role });
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

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ message: "Inicio de sesión exitoso", token, name: user.name, role: user.role });
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor." });
  }
});

// ==========================================
// 👮 MIDDLEWARES
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

const verificarAdmin = (req, res, next) => {
  verificarToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Acceso denegado. Solo administradores." });
    }
    next();
  });
};

// ==========================================
// 🧠 RUTA DEL CHAT
// Los mensajes se encriptan antes de guardar en BD
// ==========================================
app.post('/api/chat', verificarToken, async (req, res) => {
  const mensajeUsuario = req.body.message;
  const userId = req.user.id;

  try {
    // ✅ Leemos el prompt desde la BD encriptada
    let systemPrompt = await getActivePrompt('elevation_system_prompt');
    if (!systemPrompt) {
      systemPrompt = "Eres Elevation, un acompañante empático de bienestar emocional. Escuchas activamente y haces preguntas reflexivas. Tus respuestas son concisas, cálidas y nunca usas emojis.";
    }

    // ✅ Guardamos el mensaje del usuario ENCRIPTADO
    await Message.create({
      role: 'user',
      content: encriptar(mensajeUsuario),
      UserId: userId
    });

    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: mensajeUsuario }]
    });

    const respuestaIA = msg.content[0].text;

    // ✅ Guardamos la respuesta de la IA ENCRIPTADA
    await Message.create({
      role: 'assistant',
      content: encriptar(respuestaIA),
      UserId: userId
    });

    res.json({ reply: respuestaIA });

  } catch (error) {
    console.error("❌ Error de comunicación:", error);
    res.status(500).json({ reply: "Lo siento, tuve una pequeña desconexión. ¿Podrías repetirme eso?" });
  }
});

// ==========================================
// 📜 HISTORIAL DE CHAT
// Los mensajes se desencriptan al leer
// ==========================================
app.get('/api/messages', verificarToken, async (req, res) => {
  try {
    const mensajes = await Message.findAll({
      where: { UserId: req.user.id },
      order: [['createdAt', 'ASC']]
    });

    // ✅ Desencriptamos cada mensaje antes de enviarlo al frontend
    const historial = mensajes.map(m => ({
      role: m.role === 'assistant' ? 'bot' : 'user',
      text: desencriptar(m.content)
    }));

    res.json(historial);
  } catch (error) {
    console.error("❌ Error obteniendo historial:", error);
    res.status(500).json({ error: "No se pudo cargar el historial." });
  }
});

// ==========================================
// 🔐 RUTAS DEL BACKOFFICE — Solo admin
// ==========================================
app.post('/api/admin/prompt', verificarAdmin, async (req, res) => {
  try {
    const { key, content } = req.body;
    if (!key || !content) {
      return res.status(400).json({ error: "key y content son requeridos." });
    }
    const { savePrompt } = require('./promptVault');
    await savePrompt(key, content, req.user.name);
    res.json({ message: `Prompt '${key}' guardado y encriptado exitosamente.` });
  } catch (error) {
    console.error("❌ Error guardando prompt:", error);
    res.status(500).json({ error: "No se pudo guardar el prompt." });
  }
});

app.get('/api/admin/prompts', verificarAdmin, async (req, res) => {
  try {
    const prompts = await PromptVault.findAll({
      attributes: ['key', 'version', 'isActive', 'updatedBy', 'updatedAt']
    });
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ error: "No se pudieron obtener los prompts." });
  }
});

// ==========================================
// 🌐 FRONTEND — Sirve los archivos de React
// ==========================================
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

// ==========================================
// 🚀 SERVIDOR
// ==========================================
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Elevation está en el aire en el puerto ${PORT}`);
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

module.exports = app;
