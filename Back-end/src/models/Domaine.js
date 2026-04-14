const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Domaine = sequelize.define('Domaine', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    referentiel_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    code: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    nom: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    ponderation: {
        type: DataTypes.FLOAT,
        defaultValue: 1.0,
    },
}, {
    tableName: 'domaines',
});

module.exports = Domaine;
