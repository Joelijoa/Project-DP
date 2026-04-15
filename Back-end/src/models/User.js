const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nom: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    prenom: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    role: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'auditeur_junior',
        validate: {
            isIn: [['admin', 'auditeur_senior', 'auditeur_junior', 'client']],
        },
    },
    organisation: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    telephone: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    actif: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    must_change_password: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    reset_token: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    reset_token_expires: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'users',
});

module.exports = User;
