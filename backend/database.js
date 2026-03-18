const { Sequelize } = require('sequelize');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production' || process.env.DB_HOST.includes('/cloudsql/');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  // CONFIGURACIÓN PARA EL TÚNEL VIP DE GOOGLE
  dialectOptions: isProduction ? {
    socketPath: process.env.DB_HOST // Aquí es donde el túnel se conecta mágicamente
  } : {}, 
  port: isProduction ? null : 5432, // En producción anulamos el puerto
  logging: false,
});

module.exports = sequelize;