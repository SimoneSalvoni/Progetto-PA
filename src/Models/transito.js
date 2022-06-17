import Sequelize from 'sequelize';
import {db} from '../Connection/connect.js'

export const Transito = db.define('postazioni', {
	idTransito: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	tratta: Sequelize.INTEGER,
	aperto: Sequelize.BOOLEAN,
	targa: Sequelize.STRING(7),
	timestampInizio: Sequelize.STRING(20),
	timestampFine: Sequelize.STRING(20),
	velMedia: Sequelize.FLOAT
},
	{
		initialAutoIncrement: 1,
		tableName: 'Transito',
		timestamps: false
	}
);