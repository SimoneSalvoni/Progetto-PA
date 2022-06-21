import {Sequelize} from 'sequelize';
export const db = new Sequelize(process.env.DATABASE, process.env.USERNAME, process.env.PASSWORD, {
    host: "mysqldb",
    port: process.env.MYSQL_PORT,
    dialect: 'mysql',
    retry:{
        match: Sequelize.ConnectionError,
        backoffbase:5000
    }
});