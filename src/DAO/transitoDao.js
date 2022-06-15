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

export function aggiungiTransito(transito) {
  var newTransito = new Transito(transito);
  return newTransito.save();
}

export function findById(id) {
  return Transito.findByPk(id);
}

export function ricercaTransitoAperto(targa, tratta) {
  return Transito.findOne({where : {targa:targa, tratta: tratta, aperto:true }});
}

export function getTransitiTratta(id) {

  return Transito.findAll({
    where:
    {
      tratta:id
    }
  });
}

export function getTransitiTrattaData(id, startDate, endDate) {

  return Transito.findAll({
    where:
    {
      tempofin: $between[startDate, endDate],
      tratta:id
    }
  });
}

export function getTransitiTarga(tratta, targa) {

  return Transito.findAll({
    where: { tratta: tratta, targa: targa }
  });
}

export function deleteById(id) {
  return Transito.destroy({ where: { idtransito: id } });
}

export function eliminaTransitiErrati(date) {
  return Transito.destroy({ where: { tempoiniz: lt [date - 7200000 ], aperto: True} });
}

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
