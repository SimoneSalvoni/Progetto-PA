const Tratta = require('../models/tratta.js');

var trattaDao = {
    findById: findById,
    getTratte: getTratte
}

//vengono restituite tutte le tratte presenti sul db
export function getTratte() {
    return Tratta.findAll();
}

//si ricerca una specifica tratta a partire dal suo id
export function findById(id) {
    return Tratta.findByPk(id);
}