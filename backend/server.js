require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Anthropic = require('@anthropic-ai/sdk');
const { connectDB, sequelize } = require('./database');
const User = require('./User');
const Message = require('./Message');
const { PromptVault, getActivePrompt } = require('./promptVault');

const app = express();

// ==========================================
// 🛡️ CORS — Solo acepta el dominio de Google Cloud Run
// ==========================================
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ✅ JWT_SECRET desde variable de entorno — nunca quemado
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET no está configurado en .env');

// ==========================================
// 🗄️ CONEXIÓN BD Y SINCRONIZACIÓN DE TABLAS
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
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashedPassword });
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

    // ✅ Incluimos el role en el token para que el frontend sepa si es admin
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '2h' }
    );
    res.json({ message: "Inicio de sesión exitoso", token, name: user.name, role: user.role });
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor." });
  }
});

// ==========================================
// 👮 MIDDLEWARE — Verifica token de usuario
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
// 🔐 MIDDLEWARE — Solo admins pueden pasar
// ==========================================
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
// El system prompt viene de la BD encriptada
// ==========================================
app.post('/api/chat', verificarToken, async (req, res) => {
  const mensajeUsuario = req.body.message;
  const userId = req.user.id;

  try {
    // ✅ Leemos el prompt desde la BD — nunca del código
    let systemPrompt = await getActivePrompt('elevation_system_prompt');

    // Fallback de seguridad si aún no hay prompt en la BD
    if (!systemPrompt) {
      systemPrompt = "Eres Elevation, un acompañante empático de bienestar emocional. Escuchas activamente y haces preguntas reflexivas.";
    }

    await Message.create({ role: 'user', content: mensajeUsuario, UserId: userId });

    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: mensajeUsuario }]
    });

    const respuestaIA = msg.content[0].text;

    await Message.create({ role: 'assistant', content: respuestaIA, UserId: userId });

    res.json({ reply: respuestaIA });

  } catch (error) {
    console.error("❌ Error de comunicación:", error);
    res.status(500).json({ reply: "Lo siento, tuve una pequeña desconexión. ¿Podrías repetirme eso?" });
  }
});

// ==========================================
// 📜 HISTORIAL DE CHAT
// ==========================================
app.get('/api/messages', verificarToken, async (req, res) => {
  try {
    const mensajes = await Message.findAll({
      where: { UserId: req.user.id },
      order: [['createdAt', 'ASC']]
    });
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

// ==========================================
// 🔐 RUTAS DEL BACKOFFICE — Solo admin
// ==========================================

// Guardar o actualizar el prompt del acompañante
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

// Ver la lista de prompts (sin revelar el contenido)
app.get('/api/admin/prompts', verificarAdmin, async (req, res) => {
  try {
    const prompts = await PromptVault.findAll({
      attributes: ['key', 'version', 'isActive', 'updatedBy', 'updatedAt']
      // ✅ Nunca enviamos contentEncrypted al frontend
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