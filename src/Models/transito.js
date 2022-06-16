const { Sequelize } = require('sequelize');
import db from './Connection/connect.js'

export const Transito = db.define('postazioni', {
	idtransito: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	tratta: Sequelize.INTEGER,
	apertura: Sequelize.BOOLEAN,
	targa: Sequelize.STRING(7),
	tempoiniz: Sequelize.STRING(20),
	tempofin: Sequelize.STRING(20),
	vmedia: Sequelize.FLOAT
},
	{
		initialAutoIncrement: 1
	}
);