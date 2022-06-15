import db from './Connection/connect.js'

export const Multa = db.define('postazioni', {
	idMulta: Sequelize.INTEGER,
	importo: Sequelize.INTEGER,
	targa: Sequelize.STRING(7),
	pagato: Sequelize.BOOLEAN
});
