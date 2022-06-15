import db from './Connection/connect.js'


export const Postazione = db.define('postazioni', {
	idpostazione: Sequelize.INTEGER,
	limite: Sequelize.INTEGER,
	distanza: Sequelize.FLOAT
});