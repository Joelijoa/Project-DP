const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const AuditAuditeur = sequelize.define('AuditAuditeur', {
    audit_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
}, {
    tableName: 'audit_auditeurs',
    timestamps: false,
});

module.exports = AuditAuditeur;
