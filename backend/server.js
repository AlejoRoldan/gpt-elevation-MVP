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
const MoodLog = require('./MoodLog');
const SessionRating = require('./SessionRating');
const adminUsersRouter = require('./routes/adminUsers');
const therapistRouter = require('./routes/therapistRoutes');
const ClinicalNote = require('./ClinicalNote');
const WellnessRecommendation = require('./WellnessRecommendation');

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
  User.hasMany(MoodLog);
  MoodLog.belongsTo(User);
  User.hasMany(SessionRating);
  SessionRating.belongsTo(User);
  User.hasMany(ClinicalNote, { foreignKey: 'UserId' });
  ClinicalNote.belongsTo(User, { foreignKey: 'UserId' });
  User.hasMany(WellnessRecommendation, { foreignKey: 'UserId' });
  WellnessRecommendation.belongsTo(User, { foreignKey: 'UserId' });
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
    // HU-049 — Use therapist prompt if user has an assigned therapist
    const user = await User.findByPk(userId, { attributes: ['therapistId'] });

    let systemPrompt = null;

    if (user?.therapistId) {
      systemPrompt = await getActivePrompt(`therapist_prompt_${user.therapistId}`);
    }

    // Fallback to general Elevation prompt
    if (!systemPrompt) {
      systemPrompt = await getActivePrompt('elevation_system_prompt');
    }

    // Final fallback hardcoded
    if (!systemPrompt) {
      systemPrompt = "You are Elevation, an empathetic emotional wellness companion. You listen actively and ask reflective questions. Your responses are concise, warm and you never use emojis.";
    }
  } 
    catch (error) {
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

app.use('/api/admin/usuarios', verificarAdmin, adminUsersRouter);

// HU-046 — Therapist Routes
app.use('/api/therapist', verificarToken, therapistRouter);

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
// 😊 HU-021 — MOOD LOGS (Check-in / Check-out)
// ==========================================

// POST /api/mood/checkin — guarda el estado de ánimo al iniciar
app.post('/api/mood/checkin', verificarToken, async (req, res) => {
  try {
    const { mood } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const userId = req.user.id;

    // upsert — si ya existe el registro del día, actualiza solo el checkin
    const [log] = await MoodLog.upsert({
      UserId: userId,
      date: today,
      checkin_mood: mood,
    });

    res.json({ message: 'Check-in registrado.', log });
  } catch (error) {
    console.error('❌ Error en mood checkin:', error);
    res.status(500).json({ error: 'No se pudo registrar el check-in.' });
  }
});

// POST /api/mood/checkout — actualiza el estado de ánimo al finalizar
app.post('/api/mood/checkout', verificarToken, async (req, res) => {
  try {
    const { mood } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const userId = req.user.id;

    // busca el registro del día y actualiza solo el checkout
    const [log, created] = await MoodLog.upsert({
      UserId: userId,
      date: today,
      checkout_mood: mood,
    });

    res.json({ message: 'Check-out registrado.', log });
  } catch (error) {
    console.error('❌ Error en mood checkout:', error);
    res.status(500).json({ error: 'No se pudo registrar el check-out.' });
  }
});

// GET /api/mood/history — historial de los últimos 30 días
app.get('/api/mood/history', verificarToken, async (req, res) => {
  try {
    const logs = await MoodLog.findAll({
      where: { UserId: req.user.id },
      order: [['date', 'DESC']],
      limit: 30,
    });
    res.json(logs);
  } catch (error) {
    console.error('❌ Error obteniendo historial mood:', error);
    res.status(500).json({ error: 'No se pudo obtener el historial.' });
  }
});

// ==========================================
// ⭐ HU-022 — CALIFICACIÓN CON ESTRELLAS
// ==========================================

// POST /api/rating — guarda calificación de la sesión
app.post('/api/rating', verificarToken, async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating debe ser entre 1 y 5.' });
    }
    const today = new Date().toISOString().split('T')[0];
    await SessionRating.create({
      UserId: req.user.id,
      rating,
      date: today,
    });
    res.json({ message: 'Calificación guardada.' });
  } catch (error) {
    console.error('❌ Error guardando rating:', error);
    res.status(500).json({ error: 'No se pudo guardar la calificación.' });
  }
});

// GET /api/rating/avg — promedio de calificaciones (solo admin/superadmin)
app.get('/api/rating/avg', verificarAdmin, async (req, res) => {
  try {
    const ratings = await SessionRating.findAll({
      attributes: ['rating'],
    });
    if (ratings.length === 0) {
      return res.json({ avg: 0, total: 0 });
    }
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const avg = Math.round((sum / ratings.length) * 10) / 10;
    res.json({ avg, total: ratings.length });
  } catch (error) {
    console.error('❌ Error obteniendo promedio:', error);
    res.status(500).json({ error: 'No se pudo obtener el promedio.' });
  }
});

// ==========================================
// ✨ HU-051 — WELLNESS RECOMMENDATIONS
// ==========================================

const CATEGORY_EMOJI = {
  mindfulness: '🧘',
  habit:       '🌿',
  reflection:  '📓',
  resource:    '📚',
};

// POST /api/recommendations/generate
app.post('/api/recommendations/generate', verificarToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const moodLogs = await MoodLog.findAll({
      where: { UserId: userId },
      order: [['date', 'DESC']],
      limit: 7,
    });

    const avgMood = moodLogs.length > 0
      ? (moodLogs
          .flatMap(m => [m.checkin_mood, m.checkout_mood])
          .filter(Boolean)
          .reduce((a, b) => a + b, 0) / moodLogs.length).toFixed(1)
      : null;

    const trend = moodLogs.length >= 2
      ? (moodLogs[0].checkin_mood ?? 3) >= (moodLogs[moodLogs.length - 1].checkin_mood ?? 3)
        ? 'improving' : 'declining'
      : 'stable';

    const prompt = `You are a wellness coach for Elevation, a mental health platform.

Based on this user's recent emotional data:
- Sessions in last 7 days: ${moodLogs.length}
- Average mood (1-5 scale): ${avgMood ?? 'No data yet'}
- Recent trend: ${trend}

Generate exactly 3 personalized wellness recommendations. Respond ONLY with a valid JSON array, no markdown, no extra text:
[
  { "category": "mindfulness", "content": "..." },
  { "category": "habit", "content": "..." },
  { "category": "reflection", "content": "..." }
]

Categories must be one of: mindfulness, habit, reflection, resource.
Each content must be 1-2 sentences, warm, actionable and specific to the user's emotional state.
Never mention diagnoses or medical advice.`;

    const msg = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });

    let recommendations = [];
    try {
      const raw = msg.content[0].text.replace(/```json|```/g, '').trim();
      recommendations = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: 'Could not parse recommendations.' });
    }

    // Save encrypted to DB
    const saved = await Promise.all(
      recommendations.map(r =>
        WellnessRecommendation.create({
          UserId: userId,
          content: encriptar(r.content),
          category: r.category,
          generatedAt: new Date(),
        })
      )
    );

    // Return decrypted to client
    res.json(saved.map((r, i) => ({
      id: r.id,
      category: r.category,
      content: recommendations[i].content,
      generatedAt: r.generatedAt,
      seenByUser: r.seenByUser,
    })));

  } catch (error) {
    console.error('❌ Error generating recommendations:', error);
    res.status(500).json({ error: 'Could not generate recommendations.' });
  }
});

// GET /api/recommendations
app.get('/api/recommendations', verificarToken, async (req, res) => {
  try {
    const recs = await WellnessRecommendation.findAll({
      where: { UserId: req.user.id },
      order: [['generatedAt', 'DESC']],
      limit: 9,
    });

    res.json(recs.map(r => ({
      id: r.id,
      category: r.category,
      content: desencriptar(r.content),
      generatedAt: r.generatedAt,
      seenByUser: r.seenByUser,
    })));
  } catch (error) {
    console.error('❌ Error fetching recommendations:', error);
    res.status(500).json({ error: 'Could not fetch recommendations.' });
  }
});

// PUT /api/recommendations/:id/seen
app.put('/api/recommendations/:id/seen', verificarToken, async (req, res) => {
  try {
    const rec = await WellnessRecommendation.findOne({
      where: { id: req.params.id, UserId: req.user.id },
    });
    if (!rec) return res.status(404).json({ error: 'Recommendation not found.' });
    await rec.update({ seenByUser: true });
    res.json({ message: 'Marked as seen.' });
  } catch (error) {
    res.status(500).json({ error: 'Could not update recommendation.' });
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