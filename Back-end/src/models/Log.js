const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Log = sequelize.define('Log', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    action: {
        type: DataTypes.STRING(60),
        allowNull: false,
    },
    resource: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    resource_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    details: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    ip: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
}, {
    tableName: 'logs',
    updatedAt: false,
});

module.exports = Log;
