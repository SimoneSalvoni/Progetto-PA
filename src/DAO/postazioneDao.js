const Postazione = require('../models/postazione.js');

var postazioneDao = {
    findById: findById,
    getPostazioni: getPostazioni
}

export function findById(id) {
    return Postazione.findByPk(id);
}

export function getPostazioni() {
    return Tratta.findAll();
}