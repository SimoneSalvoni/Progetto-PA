import Sequelize from 'sequelize';
import {db} from '../Connection/connect.js';

export const Multa = db.define('postazioni', {
	idMulta: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	importo: Sequelize.INTEGER,
	targa: Sequelize.STRING(7),
	pagato: Sequelize.BOOLEAN
},
	{
		initialAutoIncrement: 1,
		tableName:'Multa',
		timestamps: false		
	}
);
