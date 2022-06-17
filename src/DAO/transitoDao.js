import { Transito } from "../Models/transito.js";

export var TransitoDao = {
  getTransitiTratta: getTransitiTratta,
  aggiungiTransito: aggiungiTransito,
  ricercaTransitoAperto: ricercaTransitoAperto,
  getTransitiTrattaData: getTransitiTrattaData,
  getTransitiTarga: getTransitiTarga,
  findById: findById,
  deleteById: deleteById,
  chiudiTransito: chiudiTransito,
  eliminaTransitiErrati: eliminaTransitiErrati
}
//si aggiunge una tupla alla tabella transito su db
async function aggiungiTransito(targa, tratta, timestampInizio) {
  var newTransito = await Transito.create({ tratta: tratta, aperto: true, targa: targa, timestampInizio: timestampInizio });
  return newTransito; //potenzialmente rimovibile
}

//viene restituito uno specifico Transito a partire dal suo id
function findById(id) {
  return Transito.findByPk(id);
}

//viene restituito uno specifico Transito con valore di "aperto" true a partire dalla Tratta percorsa e la Targa del veicolo
async function ricercaTransitoAperto(targa, tratta) {
  return await Transito.findOne({ where: { targa: targa, tratta: tratta, aperto: true } });
}


//vengono restituiti tutti i transiti su una specifica tratta
async function getTransitiTratta(id) {

  return await Transito.findAll({
    where:
    {
      tratta: id
    }
  });
}

//vengono restituiti tutti i transiti su una specifica tratta nell'arco di tempo richiesto
async function getTransitiTrattaData(id, startDate, endDate) {

  return await Transito.findAll({
    where:
    {
      tempofin: $between[startDate, endDate],
      tratta: id
    }
  });
}

//vengono restituiti tutti i transiti di uno specifico veicolo su una specifica tratta
function getTransitiTarga(tratta, targa) {

  return Transito.findAll({
    where: { tratta: tratta, targa: targa }
  });
}

//viene eliminato un transito a partire dal suo id
function deleteById(id) {
  return Transito.destroy({ where: { idTransito: id } });
}

//vengono eliminati tutti i transiti aperti più vecchi di 2 ore
function eliminaTransitiErrati(date) {
  return Transito.destroy({ where: { tempoiniz: $lt[date - 7200000], aperto: true } });
}


//viene modificato il campo "aperto" e il campo "tempofin" di uno specifico transito a partire dal suo id
async function chiudiTransito(id, vel, tempo) {
  // Check if record exists in db
  let transito = await Transito.findByPk(id);
  if (transito) {
    await transito.update({
      aperto: false,
      velMedia: vel,
      timestampFine: tempo
    })
  }
}
