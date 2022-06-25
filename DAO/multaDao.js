import {Multa} from '../Models/multa.js';
import {Op} from 'sequelize';

export var MultaDao = {
  getMulteDaPagare: getMulteDaPagare,
  creaMulta: creaMulta,
  getMulteRecenti: getMulteRecenti,
  getMultaById: getMultaById,
  getMulte: getMulte,
  pagaMulta: pagaMulta
}

//creazione della multa
async function creaMulta(targa, importo, timestamp) {
  var newMulta = await Multa.create({importo: importo, targa: targa, timestamp:timestamp, pagato: false});
  return newMulta;
}

//si ricercano tutte le multe il cui campo "pagato" risulta falso
async function getMulteDaPagare() {
  return await Multa.findAll({ where: { pagato: false } });
}

async function getMulteRecenti(targa, timestamp) {
 
  return await Multa.findAll({
    where:
    {
      timestamp: {
        [Op.between]: [timestamp - 2592000000, timestamp - 1]
      },
      targa: targa
    }
  });
}


//si ricerca una specifica multa a partire dal suo id
async function getMultaById(id) {
  return await Multa.findByPk(id);
}

//si ricercano tutte le multe relative ad una specifica targa
async function getMulte(targa) {
  return await Multa.findAll({ where: { targa: targa } });
}

//si cambia il campo "pagato" di una specifica multa a partire dal suo id
async function pagaMulta(id) {
  let multa = await Multa.findByPk(id);
  if (multa) await multa.update({pagato: true})
}