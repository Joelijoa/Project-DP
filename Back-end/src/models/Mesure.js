const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Mesure = sequelize.define('Mesure', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    objectif_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    code: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    niveau_cible: {
        type: DataTypes.INTEGER,
        defaultValue: 3,
        validate: { min: 0, max: 5 },
    },
}, {
    tableName: 'mesures',
});

module.exports = Mesure;
