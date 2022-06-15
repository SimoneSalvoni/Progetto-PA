const Tratta = require('../models/tratta.js');

var trattaDao = {
    findById: findById,
    getTratte: getTratte
}

export function getTratte() {
    return Tratta.findAll();
}

export function findById(id) {
    return Tratta.findByPk(id);
}