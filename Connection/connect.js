import { Sequelize } from 'sequelize';

export const db = new Sequelize('Rilevazioni', process.env.USERNAME, process.env.PASSWORD, {
    host: "mysqldb",
    port: process.env.MYSQL_PORT,
    dialect: 'mysql'
});