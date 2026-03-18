const { Sequelize } = require('sequelize');
require('dotenv').config(); // Carga las variables de tu archivo .env

// Extraemos las credenciales de las variables de entorno
const DB_USER = process.env.DB_USER;
const DB_PASS = encodeURIComponent(process.env.DB_PASS);
const DB_HOST = process.env.DB_HOST;
const DB_NAME = process.env.DB_NAME;

// Construimos la URL de conexión a PostgreSQL
const databaseUrl = `postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:5432/${DB_NAME}`;

// Rayos X: Imprimimos la URL en consola (ocultando la contraseña por seguridad)
console.log('🚨 URL DE CONEXIÓN ARMADA:', `postgres://${DB_USER}:***@${DB_HOST}:5432/${DB_NAME}`);

// Inicializamos Sequelize con la configuración estricta para Google Cloud
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Vital para conexiones en la nube como GCP
    }
  },
  logging: false // Evita que la terminal se llene de ruido
});

// Exportamos la conexión para que los modelos (User, Message) y server.js la puedan usar
module.exports = sequelize;