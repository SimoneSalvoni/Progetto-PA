import { Postazione } from '../Models/postazione.js';

export var PostazioneDao = {
    findById: findById,
    getPostazioni: getPostazioni
}

//si ricerca una specifica postazione a partire dal suo id
function findById(id) {
    return Postazione.findByPk(id);
}

//vengono restituite tutte le postazioni presenti sul db
function getPostazioni() {
    return Postazione.findAll();
}