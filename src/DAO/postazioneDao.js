const Postazione = require('../models/Postazione');

var postazioneDao = {
    findById: findById
}

function findById(id) {
    return Postazione.findByPk(id);
}