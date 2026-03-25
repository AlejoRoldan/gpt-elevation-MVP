require('dotenv').config();
const rateLimit = require('express-rate-limit');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Anthropic = require('@anthropic-ai/sdk');
const { connectDB, sequelize } = require('./database');
const User = require('./User');
const Message = require('./Message');
const { 
  PromptVault, getActivePrompt, savePrompt, proposePrompt, approvePrompt, rejectPrompt, rollbackPrompt 
} = require('./promptVault');
const LandingContent = require('./LandingContent');

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// HU-038 — Rate limiting en login (10 intentos por minuto por IP)
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos. Intentá de nuevo en un minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// HU-038 — Delay para normalizar tiempo de respuesta (anti timing attacks)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
    console.error('⚠️ Error desencriptando mensaje:', error.message);
    return texto;
  }
};

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_dev_secret_2026';
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET no está configurado — usando valor de desarrollo');
}

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
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    const role = adminEmails.includes(email.toLowerCase()) ? 'admin' : 'user';
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashedPassword, role });
    res.status(201).json({ message: "Usuario creado exitosamente. ¡Bienvenido a Elevation!" });
  } catch (error) {
    res.status(400).json({ error: "El correo ya está registrado o hubo un error." });
  }
});

// HU-024 + HU-038 — Login con bloqueo + mensaje genérico + rate limiting
app.post('/api/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    // HU-038: mensaje genérico — no revela si el email existe o no
    if (!user) {
      await delay(200);
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    // HU-024: bloqueo por cuenta
    if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
      const minutosRestantes = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000);
      return res.status(423).json({
        error: `Cuenta bloqueada. Intentá de nuevo en ${minutosRestantes} minuto${minutosRestantes > 1 ? 's' : ''}.`,
        locked: true
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      const nuevosIntentos = (user.loginAttempts || 0) + 1;
      if (nuevosIntentos >= 3) {
        const bloqueadoHasta = new Date(Date.now() + 15 * 60 * 1000);
        await user.update({ loginAttempts: nuevosIntentos, lockedUntil: bloqueadoHasta });
        return res.status(423).json({
          error: 'Cuenta bloqueada por 15 minutos.',
          locked: true
        });
      }
      await user.update({ loginAttempts: nuevosIntentos });
      // HU-038: mensaje genérico — no dice "contraseña incorrecta"
      await delay(200);
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    await user.update({ loginAttempts: 0, lockedUntil: null });
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ message: 'Inicio de sesión exitoso', token, name: user.name, role: user.role });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor.' });
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
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ error: "Acceso denegado. Solo administradores." });
    }
    next();
  });
};

const verificarSuperAdmin = (req, res, next) => {
  verificarToken(req, res, () => {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: "Acceso exclusivo para superadmin." });
    }
    next();
  });
};

// ==========================================
// 🧠 RUTA DEL CHAT
// ==========================================
app.post('/api/chat', verificarToken, async (req, res) => {
  const mensajeUsuario = req.body.message;
  const userId = req.user.id;
  try {
    let systemPrompt = await getActivePrompt('elevation_system_prompt');
    if (!systemPrompt) {
      systemPrompt = "Eres Elevation, un acompañante empático de bienestar emocional. Escuchas activamente y haces preguntas reflexivas. Tus respuestas son concisas, cálidas y nunca usas emojis.";
    }
    await Message.create({ role: 'user', content: encriptar(mensajeUsuario), UserId: userId });
    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: mensajeUsuario }]
    });
    const respuestaIA = msg.content[0].text;
    await Message.create({ role: 'assistant', content: encriptar(respuestaIA), UserId: userId });
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
      text: desencriptar(m.content)
    }));
    res.json(historial);
  } catch (error) {
    console.error("❌ Error obteniendo historial:", error);
    res.status(500).json({ error: "No se pudo cargar el historial." });
  }
});

// ==========================================
// 🔐 RUTAS DEL BACKOFFICE
// ==========================================
app.post('/api/admin/prompt', verificarAdmin, async (req, res) => {
  try {
    const { key, content } = req.body;
    if (!key || !content) return res.status(400).json({ error: "key y content son requeridos." });
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

// HU-033 — GET prompt activo con fallback isActive
app.get('/api/admin/prompt/:key', verificarAdmin, async (req, res) => {
  try {
    let prompt = await PromptVault.findOne({
      where: { key: req.params.key, status: 'active' },
      attributes: ['id', 'key', 'version', 'status', 'approved_by', 'approved_at', 'updatedAt']
    });
    if (!prompt) {
      prompt = await PromptVault.findOne({
        where: { key: req.params.key, isActive: true },
        attributes: ['id', 'key', 'version', 'status', 'approved_by', 'approved_at', 'updatedAt'],
        order: [['version', 'DESC']]
      });
    }
    if (!prompt) return res.status(404).json({ error: 'Prompt no encontrado.' });
    const contenido = await getActivePrompt(req.params.key);
    res.json({ ...prompt.toJSON(), content: contenido });
  } catch (error) {
    console.error('❌ Error obteniendo prompt:', error);
    res.status(500).json({ error: 'Error obteniendo el prompt.' });
  }
});

// HU-033 — POST proponer nueva versión
app.post('/api/admin/prompt/propose', verificarAdmin, async (req, res) => {
  try {
    const { key, content } = req.body;
    if (!key || !content) return res.status(400).json({ error: 'key y content son requeridos.' });
    await proposePrompt(key, content, req.user.name);
    res.json({ message: 'Propuesta enviada al superadmin para revisión.' });
  } catch (error) {
    console.error('❌ Error proponiendo prompt:', error);
    res.status(500).json({ error: 'No se pudo enviar la propuesta.' });
  }
});

// HU-033 — GET historial de versiones
app.get('/api/superadmin/prompt/:key/versions', verificarSuperAdmin, async (req, res) => {
  try {
    const versiones = await PromptVault.findAll({
      where: { key: req.params.key },
      attributes: ['id', 'key', 'version', 'status', 'proposed_by', 'approved_by', 'rejected_by', 'rejection_note', 'approved_at', 'rejected_at', 'updatedAt'],
      order: [['version', 'DESC']]
    });
    res.json(versiones);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo versiones.' });
  }
});

// HU-033 — POST aprobar versión
app.post('/api/superadmin/prompt/:id/approve', verificarSuperAdmin, async (req, res) => {
  try {
    await approvePrompt(req.params.id, req.user.name);
    res.json({ message: 'Versión aprobada y activa en producción.' });
  } catch (error) {
    console.error('❌ Error aprobando prompt:', error);
    res.status(500).json({ error: error.message || 'No se pudo aprobar la versión.' });
  }
});

// HU-033 — POST rechazar versión
app.post('/api/superadmin/prompt/:id/reject', verificarSuperAdmin, async (req, res) => {
  try {
    const { note } = req.body;
    await rejectPrompt(req.params.id, req.user.name, note || '');
    res.json({ message: 'Versión rechazada.' });
  } catch (error) {
    console.error('❌ Error rechazando prompt:', error);
    res.status(500).json({ error: error.message || 'No se pudo rechazar la versión.' });
  }
});

// HU-033 — POST rollback
app.post('/api/superadmin/prompt/:id/rollback', verificarSuperAdmin, async (req, res) => {
  try {
    await rollbackPrompt(req.params.id, req.user.name);
    res.json({ message: 'Rollback exitoso. Versión anterior activa en producción.' });
  } catch (error) {
    console.error('❌ Error en rollback:', error);
    res.status(500).json({ error: error.message || 'No se pudo hacer rollback.' });
  }
});

// ==========================================
// 🌐 HU-039 — CONTENIDO LANDING
// ==========================================

// Textos por defecto si la BD está vacía
const LANDING_DEFAULTS = {
  es: {
    hero_title:         'Encuentra tu calma interior',
    hero_subtitle:      'Tu compañero privado para la claridad mental y el bienestar emocional.',
    cta_primary:        'Iniciar conversación',
    cta_final_title:    '¿Listo para empezar?',
    cta_final_subtitle: 'Sin tarjeta de crédito.',
  },
  en: {
    hero_title:         'Find your inner calm',
    hero_subtitle:      'Your private companion for mental clarity and emotional wellbeing.',
    cta_primary:        'Start a conversation',
    cta_final_title:    'Ready to begin?',
    cta_final_subtitle: 'No credit card required.',
  },
};

// GET /api/landing-content?lang=es — público, sin auth
app.get('/api/landing-content', async (req, res) => {
  try {
    const lang = req.query.lang === 'en' ? 'en' : 'es';
    const registros = await LandingContent.findAll({ where: { lang } });

    // Empezamos con los defaults y sobreescribimos con lo que haya en BD
    const content = { ...LANDING_DEFAULTS[lang] };
    registros.forEach(r => { content[r.key] = r.value; });

    res.json(content);
  } catch (error) {
    console.error('❌ Error obteniendo contenido landing:', error);
    // Si falla la BD, retornamos los defaults sin romper
    const lang = req.query.lang === 'en' ? 'en' : 'es';
    res.json(LANDING_DEFAULTS[lang]);
  }
});

// PUT /api/landing-content — solo superadmin
app.put('/api/landing-content', verificarSuperAdmin, async (req, res) => {
  try {
    const { key, lang, value } = req.body;
    if (!key || !lang || !value) {
      return res.status(400).json({ error: 'key, lang y value son requeridos.' });
    }
    if (!['es', 'en'].includes(lang)) {
      return res.status(400).json({ error: 'lang debe ser es o en.' });
    }

    // upsert — crea o actualiza
    await LandingContent.upsert({
      key,
      lang,
      value,
      updated_by: req.user.name,
    });

    res.json({ message: `Contenido '${key}' (${lang}) actualizado correctamente.` });
  } catch (error) {
    console.error('❌ Error actualizando contenido landing:', error);
    res.status(500).json({ error: 'No se pudo actualizar el contenido.' });
  }
});

// ==========================================
// 🌐 FRONTEND
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