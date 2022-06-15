const Transito = require('../models/Transito');

var transitoDao = {
    findByTratta: findByTratta,
    createTransito: createTransito,
    findBetweenDatesTratta: findBetweenDatesTratta,
    findByTargaTratta: findByTargaTratta,
    findById: findById,
    deleteById: deleteById,
    updateTransito: updateTransito
}

function createTransito(transito) {
    var newGig = new Gig(gig);
    return newGig.save();
}

function findById(id) {
    return Transito.findByPk(id);
}


function findBetweenDatesTratta(id, startDate, endDate) {

    return Transito.findAll({where
   {
       tempofin $between: [startDate, endDate]
    });
}

function findByTargaTratta(tratta, targa){

    return Transito.findAll({where: {tratta: tratta, targa: targa}
});
}

function deleteById(id) {
    return Transito.destroy({ where: { idtransito: id } });
}

function updateTransito(id,tempo) {
    Transito.findByPk(id)
  .on('success', function (transito) {
    // Check if record exists in db
    if (transito) {
      transito.update({
        aperto: False
	tempofin: tempo
      })
      .success(function () {})
    }
  })
}
