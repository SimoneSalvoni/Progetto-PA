const Multa = require('../models/Multa');

var multaDao = {
    findAllUnpaid: findAllUnpaid,
    createMulta: createMulta,
    findById: findById,
    findByPlate: findByPlate,
    payFine: payFine
}

function createMulta(multa) {
    var newMulta = new Multa(multa);
    return newMulta.save();
}

function findAllUnpaid() {
    return Multa.findAll({where: {pagato: False}});
}

function findById(id) {
    return Multa.findByPk(id);
}

function findByPlate(targa) {
    return Multa.findAll({where: {targa: targa}});
}

function payFine(id) {
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