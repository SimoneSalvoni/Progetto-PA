const express = require("express");
const fileUpload = require("express-fileupload");
import Tesseract from 'tesseract.js';
import Multa from './Models/multa.js';
import Postazione from './Models/postazione.js';
import Transito from './Models/transito.js';
import Tratta from './Models/tratta.js';
import MultaDao from './DAO/multaDao.js';
import PostazioneDao from './DAO/postazioneDao.js';
import TransitoDao from './DAO/transitoDao.js';
import TrattaDao from './DAO/trattaDao.js';
import { jwtCheck, checkID, checkDate, checkImage, checkJson, checkTarghe, checkTimestamp } from './Middleware/middleware.js';

let app = express();
app.use(fileUpload())

const port = process.env.PORT || 3000;

//INIZIALIZZAZIONE STRUTTURE DATI SONO ARRAY
let listaPost;
let listaTratte;
let listaPostId=listaPost.map(x=>x.id);
let listaTratteId=listaTratte.map(x=>x.id);

//DA COMPLETARE
app.post('/nuovarilevazione', (req, res) => {
    let file = req.files.file;
    let filePath = __dirname + '/tmp/' + file.name;
    sampleFile.mv(filePath, (err) => {
        if (err) res.status(500).send({ "errore": "Errore interno del server" });
    });
    try {
        Tesseract.recognize(
            filePath,
            'eng'
        ).then(({ data: { text } }) => {
            let targa = text;
            if (typeof (targa) !== "string" || targa === '' || !targa.test("[A-Z0-9]{7}")) {
                //LOGGING
                return;
            }
            let post_id = req.id;
            let tratta_id;
            let timestamp = req.timestamp;
            //DA FINIRE
        })
    }
    catch (err) {
        res.status(500).send({ "errore": "Errore interno del server" });
    }

})

app.post('/nuovarilevazione/json', (req, res) => {
//DA FARE 
});

/*
Questa è la definizione della rotta /listaveicoli, che serve ad un utente di tipo admin per richiedere una lista 
dei veicoli transitati in un dato intervallo temporale in una data tratta, con statistiche a riguardo
*/
app.get('/listaveicoli', (req, res) => {
    let tratta = req.id;
    let timestampInizio = req.timestampInizio;
    let timestampFine = req - timestampFine;

    try {
        TransitoDao.getTransitiData(tratta, timestampInizio, timestampFine).then(({ data: { listaTransiti } }) => {
            let numeroTransiti = listaTransiti.length;
            if (numeroTransiti !== 0) {
                var velocita = listaTransiti.map(x => x.vel);
                var velMedia = velocita.reduce((prec, succ) => prec + succ, 0) / numeroTransiti;
                var velMax = Math.max(...velocita);
                var velMin = Math.min(...velocita);
                var velStd = Math.sqrt(velocita.map(x => Math.pow(x - velMedia, 2)).reduce((a, b) => a + b) / numeroTransiti);
            }
            else {
                var velMedia = 0;
                var velMax = 0;
                var velMin = 0;
                var velStd = 0;
            }
            let response = JSON.stringify({ transiti: listaTransiti, stat: { media: velMedia, max: velMax, min: velMin, std: velStd } });
            res.send(response)
        })
    }
    catch (err) {
        res.status(500).send({ "error": "Errore interno del server" });
    }
});

/*
Questa è la definizione della rotta /stat, che serve ad un utente di tipo admin per richiedere le statitiche
riguardanti i viaggi di una particolare targa su una particolare targa
*/
app.get('/stat', (req, res)=>{
    let tratta = req.id;
    let targa = req.targa;
    try {
        TransitoDao.getTransitiTarga(tratta, targa).then(({ data: { listaTransiti } }) => {
            let numeroTransiti = listaTransiti.length;
            if (numeroTransiti === 0) {
                res.send("L'autovettura con la targa richiesta non ha mai attraversato la tratta");
            }
            var velocita = listaTransiti.map(x => x.vel);
            var velMedia = velocita.reduce((prec, succ) => prec + succ, 0) / numeroTransiti;
            var velMax = Math.max(...velocita);
            var velMin = Math.min(...velocita);
            var velStd = Math.sqrt(velocita.map(x => Math.pow(x - velMedia, 2)).reduce((a, b) => a + b) / numeroTransiti);
            let response = JSON.stringify({stat: { media: velMedia, max: velMax, min: velMin, std: velStd } });
            res.send(response)
        })
    }
    catch (err) {
        res.status(500).send({ "error": "Errore interno del server" });
    }
});

app.get('/listaveicoli',jwtCheck("admin"), checkID(listaTratteId), checkDate);
app.get('/stat', jwtCheck("admin"), checkID(listaTratteId), checkTarghe);

