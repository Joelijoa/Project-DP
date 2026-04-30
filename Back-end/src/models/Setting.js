const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Setting = sequelize.define('Setting', {
    key: {
        type: DataTypes.STRING(100),
        primaryKey: true,
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'settings',
    timestamps: false,
});

module.exports = Setting;
