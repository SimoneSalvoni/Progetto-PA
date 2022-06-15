const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'mysql'
});


const Postazione = sequelize.define('postazioni', { 
	idpostazione: Sequelize.INTEGER, 
	limite: Sequelize.INTEGER, 
	distanza: Sequelize.FLOAT 
	});