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
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    evaluation_config: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    is_custom: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'referentiels',
});

module.exports = Referentiel;
