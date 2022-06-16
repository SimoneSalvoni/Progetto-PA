const { Sequelize } = require('sequelize');
import db from './Connection/connect.js'


export const Tratta = db.define('tratte', {
	idtratta: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	limite: Sequelize.INTEGER,
	distanza: Sequelize.FLOAT,
},
	{
		initialAutoIncrement: 1
	}
);