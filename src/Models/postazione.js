import Sequelize from 'sequelize';
import {db} from '../Connection/connect.js'


export const Postazione = db.define('postazioni', {
	idPostazione: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	tipo: Sequelize.STRING,
	idTratta: Sequelize.INTEGER
},
	{
		initialAutoIncrement: 1,
		tableName: 'Postazione',
		timestamps:false
	}
);