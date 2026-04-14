const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Evaluation = sequelize.define('Evaluation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    audit_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    mesure_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    niveau_maturite: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 0, max: 5 },
    },
    conformite: {
        type: DataTypes.ENUM('conforme', 'partiel', 'non_conforme', 'na'),
        defaultValue: 'na',
    },
    commentaire: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    preuve: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
}, {
    tableName: 'evaluations',
    indexes: [
        {
            unique: true,
            fields: ['audit_id', 'mesure_id'],
        },
    ],
});

module.exports = Evaluation;
