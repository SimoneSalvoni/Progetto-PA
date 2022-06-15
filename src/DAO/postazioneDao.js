const Postazione = require('../models/postazione.js');

var postazioneDao = {
    findById: findById,
    getPostazioni: getPostazioni
}

//si ricerca una specifica postazione a partire dal suo id
export function findById(id) {
    return Postazione.findByPk(id);
}

//vengono restituite tutte le postazioni presenti sul db
export function getPostazioni() {
    return Tratta.findAll();
}