const Multa = require('../models/multa.js');

var multaDao = {
    getMulteDaPagare: getMulteDaPagare,
    creazioneMulta: creazioneMulta,
    findById: findById,
    getMulte: getMulte,
    pagaMulta: pagaMulta
}

//creazione della multa
export function creazioneMulta(multa) {
    var newMulta = new Multa(multa);
    return newMulta.save();
}

//si ricercano tutte le multe il cui campo "pagato" risulta falso
export function getMulteDaPagare() {
    return Multa.findAll({where: {pagato: False}});
}

//si ricerca una specifica multa a partire dal suo id
export function findById(id) {
    return Multa.findByPk(id);
}

//si ricercano tutte le multe relative ad una specifica targa
export function getMulte(targa) {
    return Multa.findAll({where: {targa: targa}});
}

//si cambia il campo "pagato" di una specifica multa a partire dal suo id
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