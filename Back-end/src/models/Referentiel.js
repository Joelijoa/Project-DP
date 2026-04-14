const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Referentiel = sequelize.define('Referentiel', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nom: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    version: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    type: {
        type: DataTypes.ENUM('ISO27001', 'DNSSI'),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'referentiels',
});

module.exports = Referentiel;
