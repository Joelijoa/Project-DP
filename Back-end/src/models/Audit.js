const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Audit = sequelize.define('Audit', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nom: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    client: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    perimetre: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    date_debut: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    date_fin: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    statut: {
        type: DataTypes.ENUM('brouillon', 'en_cours', 'termine', 'archive'),
        defaultValue: 'brouillon',
    },
    entite_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    referentiel_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    identification: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
    },
    indicateurs: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
    },
}, {
    tableName: 'audits',
});

module.exports = Audit;
