const Tratta = require('../models/tratta.js');

var trattaDao = {
    findById: findById,
    findAll: findAll
}

function findAll() {
    return Tratta.findAll();
}

function findById(id) {
    return Tratta.findByPk(id);
}