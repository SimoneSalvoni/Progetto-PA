const Postazione = require('../models/Postazione');

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