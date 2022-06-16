import {Multa} from '../Models/multa.js';

export var MultaDao = {
  getMulteDaPagare: getMulteDaPagare,
  creazioneMulta: creazioneMulta,
  getMultaById: getMultaById,
  getMulte: getMulte,
  pagaMulta: pagaMulta
}

//creazione della multa
function creazioneMulta(targa, importo) {
  var newMulta = await Multa.create({importo: importo, targa: targa, pagato: false});
  return newMulta; //potenzialmente rimovibile
}

//si ricercano tutte le multe il cui campo "pagato" risulta falso
function getMulteDaPagare() {
  return Multa.findAll({ where: { pagato: False } });
}

//si ricerca una specifica multa a partire dal suo id
function getMultaById(id) {
  return Multa.findByPk(id);
}

//si ricercano tutte le multe relative ad una specifica targa
function getMulte(targa) {
  return Multa.findAll({ where: { targa: targa } });
}

//si cambia il campo "pagato" di una specifica multa a partire dal suo id
function pagaMulta(id) {
  Multa.findByPk(id)
    .on('success', function (multa) {
      // Check if record exists in db
      if (multa) {
        multa.update({
          pagato: True
        })
          .success(function () { })
      }
    })
}