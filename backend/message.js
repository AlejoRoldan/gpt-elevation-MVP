const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const Message = sequelize.define('Message', {
    role: {
        type: DataTypes.STRING, 
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT, 
        allowNull: false
    }
});

module.exports = Message;