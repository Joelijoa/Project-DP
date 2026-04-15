const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const SoA = sequelize.define('SoA', {
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
    // null = pas encore décidé, true = applicable, false = non applicable
    applicable: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
    },
    // Raisons d'inclusion : ['legal', 'contractuel', 'risque', 'bonne_pratique']
    raisons_inclusion: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
    },
    // Justification si non applicable
    justification_exclusion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    // Statut d'implémentation (si applicable)
    statut_implementation: {
        type: DataTypes.ENUM('non_implemente', 'planifie', 'partiel', 'implemente'),
        allowNull: true,
    },
    // Référence au document/procédure existant
    reference_document: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
}, {
    tableName: 'soa',
    indexes: [
        {
            unique: true,
            fields: ['audit_id', 'mesure_id'],
        },
    ],
});

module.exports = SoA;
