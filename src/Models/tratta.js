import db from './Connection/connect.js'


export const Tratta = db.define('tratte', {
	idtratta: Sequelize.INTEGER,
	limite: Sequelize.INTEGER,
	distanza: Sequelize.FLOAT
});