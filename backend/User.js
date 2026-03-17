const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

// Definimos la estructura de la tabla 'User'
const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false // Obligatorio
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true // No se pueden repetir correos en la plataforma
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = User;