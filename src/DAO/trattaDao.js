const Tratta = require('../models/Tratta');

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