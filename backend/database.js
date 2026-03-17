const { Sequelize } = require('sequelize');
const path = require('path');

// Inicializamos la conexión con SQLite
// Esto creará automáticamente un archivo llamado "elevation_vault.sqlite" en tu backend
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'elevation_vault.sqlite'),
  logging: false // Apagamos los logs de la base de datos para mantener la consola limpia
});

// Verificamos la conexión
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('🗄️ Bóveda de Datos (SQLite) conectada y encriptada con éxito.');
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
  }
};

module.exports = { sequelize, connectDB };