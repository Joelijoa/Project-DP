const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Entite = sequelize.define('Entite', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nom: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    secteur: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    adresse: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    ville: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    pays: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: 'Maroc',
    },
    telephone: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    site_web: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'entites',
});

module.exports = Entite;
