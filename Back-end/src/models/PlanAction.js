const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const PlanAction = sequelize.define('PlanAction', {
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
    description_nc: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    action_corrective: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    responsable: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    delai: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    priorite: {
        type: DataTypes.ENUM('haute', 'moyenne', 'basse'),
        defaultValue: 'moyenne',
    },
    statut: {
        type: DataTypes.ENUM('a_faire', 'en_cours', 'cloture'),
        defaultValue: 'a_faire',
    },
    criticite: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    kpi: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    statut_validation: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: null,
    },
    commentaire_rejet: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
    },
}, {
    tableName: 'plans_actions',
});

module.exports = PlanAction;
