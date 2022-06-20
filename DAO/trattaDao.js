import {Tratta} from '../Models/tratta.js'

export var TrattaDao = {
    getTratte: getTratte
}

//vengono restituite tutte le tratte presenti sul db
async function getTratte() {
    return await Tratta.findAll();
}