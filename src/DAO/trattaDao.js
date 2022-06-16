import {Tratta} from '../Models/tratta.js'

export var TrattaDao = {
    findById: findById,
    getTratte: getTratte
}

//vengono restituite tutte le tratte presenti sul db
function getTratte() {
    return Tratta.findAll();
}

//si ricerca una specifica tratta a partire dal suo id
function findById(id) {
    return Tratta.findByPk(id);
}