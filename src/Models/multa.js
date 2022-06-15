const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'mysql'
});


const Multa = sequelize.define('postazioni', { 
	idmulta: Sequelize.INTEGER, 
	importo: Sequelize.INTEGER, 
	targa: Sequelize.STRING(7),
	pagato: Sequelize.BOOLEAN 
	});
