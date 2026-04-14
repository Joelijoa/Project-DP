const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Objectif = sequelize.define('Objectif', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    domaine_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    code: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, {
    tableName: 'objectifs',
});

module.exports = Objectif;
