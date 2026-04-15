const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false,
        pool: {
            min: 1,
            max: 5,
            idle: 30000,
            acquire: 60000,
        },
        define: {
            timestamps: true,
            underscored: true,
        },
    }
);

module.exports = sequelize;
