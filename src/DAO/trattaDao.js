const Tratta = require('../models/Tratta');

var trattaDao = {
    findById: findById
}

function findById(id) {
    return Tratta.findByPk(id);
}