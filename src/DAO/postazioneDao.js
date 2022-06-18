import { Postazione } from '../Models/postazione.js';

export var PostazioneDao = {
    getPostazioni: getPostazioni
}

//vengono restituite tutte le postazioni presenti sul db
async function getPostazioni() {
    return await Postazione.findAll();
}