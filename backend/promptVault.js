const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');
const CryptoJS = require('crypto-js');

// ============================================
// 🔐 TABLA DE PROMPTS ENCRIPTADOS
// ============================================
const PromptVault = sequelize.define('PromptVault', {
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
    // Nombre del prompt: 'elevation_system_prompt',
    // 'crisis_protocol', 'session_close', etc.
  },
  contentEncrypted: {
    type: DataTypes.TEXT,
    allowNull: false
    // Contenido encriptado con AES-256
    // NUNCA se guarda en texto plano
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  updatedBy: {
    type: DataTypes.STRING,
    allowNull: true
    // Email del admin que hizo el último cambio
  }
});

// ============================================
// 🔒 FUNCIONES DE ENCRIPTACIÓN
// ============================================

// Encripta un texto plano usando la clave del .env
const encryptPrompt = (plainText) => {
  const key = process.env.PROMPT_ENCRYPTION_KEY;
  if (!key) throw new Error('PROMPT_ENCRYPTION_KEY no está configurada');
  return CryptoJS.AES.encrypt(plainText, key).toString();
};

// Desencripta y retorna el texto plano en memoria
const decryptPrompt = (encryptedText) => {
  const key = process.env.PROMPT_ENCRYPTION_KEY;
  if (!key) throw new Error('PROMPT_ENCRYPTION_KEY no está configurada');
  const bytes = CryptoJS.AES.decrypt(encryptedText, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// ============================================
// 📖 OBTENER PROMPT ACTIVO POR CLAVE
// ============================================
const getActivePrompt = async (promptKey) => {
  const record = await PromptVault.findOne({
    where: { key: promptKey, isActive: true }
  });
  if (!record) return null;
  return decryptPrompt(record.contentEncrypted);
};

// ============================================
// 💾 GUARDAR O ACTUALIZAR UN PROMPT
// Solo lo puede hacer un admin desde el backoffice
// ============================================
const savePrompt = async (promptKey, plainText, adminEmail) => {
  const encrypted = encryptPrompt(plainText);
  const existing = await PromptVault.findOne({ where: { key: promptKey } });

  if (existing) {
    await existing.update({
      contentEncrypted: encrypted,
      version: existing.version + 1,
      updatedBy: adminEmail
    });
  } else {
    await PromptVault.create({
      key: promptKey,
      contentEncrypted: encrypted,
      updatedBy: adminEmail
    });
  }
};

module.exports = { PromptVault, getActivePrompt, savePrompt, encryptPrompt, decryptPrompt };