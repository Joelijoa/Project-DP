const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Document = sequelize.define('Document', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    audit_id: { type: DataTypes.INTEGER, allowNull: false },
    nom_original: { type: DataTypes.STRING(255), allowNull: false },
    nom_fichier:  { type: DataTypes.STRING(255), allowNull: false },
    type_mime:    { type: DataTypes.STRING(100), allowNull: true },
    taille:       { type: DataTypes.INTEGER,     allowNull: true },
    uploaded_by:  { type: DataTypes.INTEGER,     allowNull: false },
}, { tableName: 'documents' });

module.exports = Document;
