import {Multa} from '../Models/multa.js';

export var MultaDao = {
  getMulteDaPagare: getMulteDaPagare,
  creaMulta: creaMulta,
  getMultaById: getMultaById,
  getMulte: getMulte,
  pagaMulta: pagaMulta
}

//creazione della multa
async function creaMulta(targa, importo, timestamp) {
  var newMulta = await Multa.create({importo: importo, targa: targa, timestamp:timestamp, pagato: false});
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
async function getMulte(targa) {
  return await Multa.findAll({ where: { targa: targa } });
}

//si cambia il campo "pagato" di una specifica multa a partire dal suo id
async function pagaMulta(id) {
  let multa = await Multa.findByPk(id);
  if (multa) await multa.update({pagato: True})
}