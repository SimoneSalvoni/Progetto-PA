const Postazione = require('../models/postazione.js');

export var postazioneDao = {
    findById: findById,
    getPostazioni: getPostazioni
}

//si ricerca una specifica postazione a partire dal suo id
function findById(id) {
    return Postazione.findByPk(id);
}

//vengono restituite tutte le postazioni presenti sul db
function getPostazioni() {
    return Tratta.findAll();
}