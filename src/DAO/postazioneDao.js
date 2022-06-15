const Postazione = require('../models/postazione.js');

var postazioneDao = {
    findById: findById,
    findAll: findAll
}

function findById(id) {
    return Postazione.findByPk(id);
}

function findAll() {
    return Tratta.findAll();
}