const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'mysql'
});


const Transito = sequelize.define('postazioni', { 
	idtransito: Sequelize.INTEGER, 
	tratta: Sequelize.INTEGER,
	apertura: Sequelize.BOOLEAN,
	targa: Sequelize.STRING(7),
	tempoiniz: Sequelize.STRING(20),
	tempofin: Sequelize.STRING(20),
	vmedia: Sequelize.FLOAT 
	});