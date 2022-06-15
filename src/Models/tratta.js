const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'mysql'
});


const Tratta = sequelize.define('tratte', { 
	idtratta: Sequelize.INTEGER, 
	limite: Sequelize.INTEGER, 
	distanza: Sequelize.FLOAT 
	});