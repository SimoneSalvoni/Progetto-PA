const Multa = require('../models/multa.js');

var multaDao = {
    getMulteDaPagare: getMulteDaPagare,
    creazioneMulta: creazioneMulta,
    findById: findById,
    getMulte: getMulte,
    pagaMulta: pagaMulta
}

export function creazioneMulta(multa) {
    var newMulta = new Multa(multa);
    return newMulta.save();
}

export function getMulteDaPagare() {
    return Multa.findAll({where: {pagato: False}});
}

export function findById(id) {
    return Multa.findByPk(id);
}

export function getMulte(targa) {
    return Multa.findAll({where: {targa: targa}});
}

export function pagaMulta(id) {
    Multa.findByPk(id)
  .on('success', function (multa) {
    // Check if record exists in db
    if (multa) {
      multa.update({
        pagato: True
      })
      .success(function () {})
    }
  })
}