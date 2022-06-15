const Transito = require('../models/transito.js');

var transitoDao = {
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
export function aggiungiTransito(transito) {
  var newTransito = new Transito(transito);
  return newTransito.save();
}

//viene restituito uno specifico Transito a partire dal suo id
export function findById(id) {
  return Transito.findByPk(id);
}

//viene restituito uno specifico Transito con valore di "aperto" true a partire dalla Tratta percorsa e la Targa del veicolo
export function ricercaTransitoAperto(targa, tratta) {
  return Transito.findOne({ where: { targa: targa, tratta: tratta, aperto: true } });
}


//vengono restituiti tutti i transiti su una specifica tratta
export function getTransitiTratta(id) {

  return Transito.findAll({
    where:
    {
      tratta: id
    }
  });
}

//vengono restituiti tutti i transiti su una specifica tratta nell'arco di tempo richiesto
export function getTransitiTrattaData(id, startDate, endDate) {

  return Transito.findAll({
    where:
    {
      tempofin: $between[startDate, endDate],
      tratta: id
    }
  });
}

//vengono restituiti tutti i transiti di uno specifico veicolo su una specifica tratta
export function getTransitiTarga(tratta, targa) {

  return Transito.findAll({
    where: { tratta: tratta, targa: targa }
  });
}

//viene eliminato un transito a partire dal suo id
export function deleteById(id) {
  return Transito.destroy({ where: { idtransito: id } });
}

//vengono eliminati tutti i transiti aperti più vecchi di 2 ore
export function eliminaTransitiErrati(date) {
  return Transito.destroy({ where: { tempoiniz: lt[date - 7200000], aperto: True } });
}


//viene modificato il campo "aperto" e il campo "tempofin" di uno specifico transito a partire dal suo id
export function chiudiTransito(id, tempo) {

  Transito.findByPk(id)
    .on('success', function (transito) {
      // Check if record exists in db
      if (transito) {
        transito.update({
          aperto: False,
          tempofin: tempo
        })
          .success(function () { })
      }
    })
}
