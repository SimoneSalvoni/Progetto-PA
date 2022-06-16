const express = require("express");
const fileUpload = require("express-fileupload");
import db from './Connection/connect.js'
import { unlink, createWriteStream } from 'fs'
import Tesseract from 'tesseract.js';
import Multa from './Models/multa.js';
import Transito from './Models/transito.js';
import MultaDao from './DAO/multaDao.js';
import PostazioneDao from './DAO/postazioneDao.js';
import TransitoDao from './DAO/transitoDao.js';
import TrattaDao from './DAO/trattaDao.js';
import { jwtCheck, checkPostazione, checkTratta, checkDate, checkImmagine, checkJson, checkTarga, checkTarghe, checkTimestamp, errorHandler } from './Middleware/middleware.js';


db.authenticate().then(() => {
    console.log('Connesso al database');
}).catch(err => {
    console.log('Errore: ' + err);
})

let app = express();
app.use(fileUpload());

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || localhost;

let listaPost = PostazioneDao.getPostazioni();
let listaPostId = listaPost.map(x => x.id);
let listaTratte = TrattaDao.getTratte();
let listaTratteId = listaTratte.map(x => x.id);

/*
Questa funzione gestisce il log di due situazioni anomale: l'incapacità di Tesseract di estrarre una targa valida da un'immagine
e la rilevazione del passaggio di un'automobile alla fine di una tratta in assenza di rilevazione dell'inizio. 

@param mess {string} Il messaggio da loggare
*/
let logError = function (mess) {
    let stream = createWriteStream("../log/log.txt", { flags: 'a' });
    stream.write(mess + '\n');
}


/*
Questa funzione processa l'arrivo di una nuova rilevazione. È una funzione separata dato che è utilizzata da due rotte differenti.

@param targa {string} la targa rilevata dall'immagine o dal json
@param req {Object} la richiesta da processare, che contiene dati da recuperare.
*/
//NON SO SE SERVE ASYNC AWAIT...
let processaRilevazione = function (targa, req) {
    let postId = req.params.postazione;
    let trattaId;
    let tipoPostazione;
    for (let post in listaPost) {
        if (post.id === postId) {
            trattaId = post.tratta;
            tipoPostazione = post.tipo
            break;
        }
    }
    let timestamp = req.timestamp;
    if (typeof (targa) !== "string" || targa === '' || !targa.test("[A-Z0-9]{7}")) {
        logError(`ERRORE:TARGA ILLEGGIBILE. Postazione: ${postId}. Tratta: ${trattaId}. Timestamp: ${timestamp}`);
        return;
    }
    if (post.tipo === 'inizio') {
        //RIVEDI I PARAMETRI QUANDO ABBIAMO LA CLASSE E IL COSTRUTTORE
        let nuovoTransito = new Transito(targa, trattaId, timestamp);
        TransitoDao.aggiungiTransito(nuovoTransito)
        //CI VUOLE LA RISPOSTA???
    }
    else {
        TransitoDao.ricercaTransitoAperto(targa, trattaId).then(({ data: { transitoAperto } }) => {
            if (!transitoAperto) {
                logError(`ERRORE:RILEVATO TRANSITO DI AUTOVETTURA ALLA FINE DI UN TRATTO SENZA LA PRECEDENTE RILEVAZIONE DI \
                ENTRATA NEL TRATTO. Postazione: ${postId}. Tratta: ${trattaId}. Timestamp: ${timestamp}`);
                return;
            }
            let timestampInizio = transitoAperto.timestampFine;
            let timestampFine = timestamp;
            let distanza;
            let limite;
            for (let tratta in listaTratte) {
                if (tratta.id === trattaId) {
                    lunghezza = tratta.distanza;
                    limite = tratta.limite;
                    break;
                }
            }
            //*1000 al numeratore si semplifica con /1000 al denominatore. *3.6 per averlo in km/h
            let vel = ((distanza) / ((timestampFine - timestampInizio))) * 3.6;
            let creazioneMulta = (vel, limite) => {
                let importo;
                if ((vel - limite < 10)) importo = 1;
                else if (vel - limite < 40) importo = 2;
                else if (vel - limite < 60) importo = 4;
                else importo = 8;
                return new Multa(targa, importo);
            };
            if (vel > limite)
                //RIVEDI I PARAMETRI QUANDO ABBIAMO LA CLASSE E IL COSTRUTTORE
                TransitoDao.chiudiTransito(transitoAperto, vel, timestampFine).then(() => {
                    nuovaMulta = creazioneMulta(vel, limite);
                    MultaDao.creaMulta(nuovaMulta);
                });
            else TransitoDao.chiudiTransito(transitoAperto, vel, timestampFine);
            //CI VUOLE LA RISPOSTA????
        })
    }
};

/*
Questa funzione definisce la rotta /nuovarilevazione/:postazione che permette ad un utente smartautovelox di spedire una nuova 
rilevazione di passaggio di un'automobile. In questo caso l'autovelox spedisce un'immagine della targa
*/
app.post('/nuovarilevazione/:postazione', (req, res) => {
    let file = req.files.file;
    let filePath = __dirname + '/tmp/' + file.name;
    sampleFile.mv(filePath, (err) => {
        //SPEDISCO L'ERRORE O NO?
        if (err) res.status(500).send({ "errore": "Errore interno del server" });
    });
    try {
        Tesseract.recognize(
            filePath,
            'eng'
        ).then(({ data: { text } }) => processaRilevazione(text, req)) //SERVE AWAIT????
    }
    catch (err) {
        res.status(500).send({ "errore": "Errore interno del server" });
    }
    finally {
        /*
        POTREI DOVER FARE COSI' SE NON CANCELLA BENE
        var tempFile = fs.openSync(filePath, 'r');
        fs.closeSync(tempFile);
        fs.unlinkSync(filePath);
        */
        //prima però provo async
        try {
            unlink(filePath);
        } catch (error) {
            console.error('there was an error while deleting the file:', error.message);
        }
    }
})

/*
Questa funzione definisce la rotta /nuovarilevazione/json/:postazione che permette ad un utente smartautovelox di spedire una nuova 
rilevazione di passaggio di un'automobile. In questo caso l'autovelox spedisce un json del tipo {targa:"XX XXX XX"}
*/
app.post('/nuovarilevazione/json/:postazione', (req, res) => {
    let file = req.files.file;
    let filePath = __dirname + '/tmp/' + file.name;
    sampleFile.mv(filePath, (err) => {
        //SPEDISCO L'ERRORE O NO?
        if (err) res.status(500).send({ "errore": "Errore interno del server" });
    });
    try {
        let jsonFile = require(filePath);
        if (!jsonFile.targa) res.status(400).send({ 'errore': 'Targa mancante nel file JSON' });
        //SERVE AWAIT???
        processaRilevazione(jsonFile.targa, req);
    }
    catch (err) {
        res.status(500).send({ "errore": "Errore interno del server" });
    }
    finally {
        /*
        POTREI DOVER FARE COSI' SE NON CANCELLA BENE
        var tempFile = fs.openSync(filePath, 'r');
        fs.closeSync(tempFile);
        fs.unlinkSync(filePath);
        */
        //prima però provo async
        try {
            unlink(filePath);
        } catch (error) {
            console.error('there was an error while deleting the file:', error.message);
        }
    }
});

/*
Questa è la definizione della rotta /listaveicoli/:tratta, che serve ad un utente di tipo admin per richiedere una lista 
dei veicoli transitati in una data tratta, con la possibilità di specificare un intervallo temporale, con statistiche a riguardo
*/
app.get('/listaveicoli/:tratta', (req, res) => {
    let tratta = req.params.tratta;
    let timestampInizio = req.timestampInizio;
    let timestampFine = req - timestampFine;
    let callback = ({ data: { listaTransiti } }) => {
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
    }

    try {
        /*
        CANCELLA SE FUNZIONA CON LA CALLBACK
        TransitoDao.getTransitiTrattaData(tratta, timestampInizio, timestampFine).then(({ data: { listaTransiti } }) => {
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
        */
        if (timestampInizio === -1) TransitoDao.getTransitiTratta(tratta).then(callback);
        else TransitoDao.getTransitiTrattaData(tratta, timestampInizio, timestampFine).then(callback);
    }
    catch (err) {
        res.status(500).send({ "error": "Errore interno del server" });
    }
});

/*
Questa è la definizione della rotta /stat/:targa/:tratta, che serve ad un utente di tipo admin per richiedere le statitiche
riguardanti i viaggi di una particolare targa su una particolare targa
*/
app.get('/stat/:targa/:tratta', (req, res) => {
    let tratta = req.params.tratta;
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
            let response = JSON.stringify({ stat: { media: velMedia, max: velMax, min: velMin, std: velStd } });
            res.send(response)
        })
    }
    catch (err) {
        res.status(500).send({ "error": "Errore interno del server" });
    }
});

/*
Questa è la definizione della rotta /tratte, che permette ad un utente di tipo admin di recuperare la lista delle tratte attualmente
presenti, con le due postazioni di inzio e fine e la distanza fra le due
*/
app.get("/tratte", (req, res) => {
    let response = { tratte: [] };
    for (let tratta in listaTratte) {
        let id = tratta.id;
        let idPostInizio;
        let idPostFine;
        for (let post in listaPost) {
            if (post.tratta === id && post.tipo === 'inizio') idPostInizio = post.id;
            else if (post.tratta === id && post.tipo === 'fine') idPostFine = post.id;
        }
        response.tratte.push({ tratta: id, post_inizio: idPostInizio, post_fine: idPostFine, distanza: tratta.distanza })
    }
    res.send(response);
});

/*
Questa è la definizione della rotta /multa/:targa, che permette ad un utente admin di ottenere la lista di tutte le multe 
relative ad una particolare targa.
*/
app.get("/multa/:targa", (req, res) => {
    let targa = req.params.targa;
    try {
        MultaDao.getMulte(targa).then(({ data: { listaMulte } }) => {
            let response = { targa: targa, multe: listaMulte };
            res.send(response);
        })
    }
    catch (err) {
        res.status(500).send({ "error": "Errore interno del server" });
    }
})

/*
Questa è la definizione della rotta /multeaperte, che permette ad un utente admin di ottenere la lista di tutte le multe
attualmente da pagare.
*/
app.get('/multeaperte', (req, res) => {
    try {
        MultaDao.getMulteDaPagare().then(({ data: { listaMulte } }) => {
            let response = { multe: listaMulte };
            res.send(response);
        })
    }
    catch (err) {
        res.status(500).send({ "error": "Errore interno del server" });
    }
})

/*
Questa funzione definisce la rotta /propriemulte, con cui un utente car-owner può controllare le proprie multe
*/
//MODIFICA PER AVERE SOLO UNA TARGA COME ARGOMENTO DI GETMULTE
app.get('/propriemulte', (req, res) => {
    try {
        let listaMulte;
        for (let targa in req.targhe) {
            //AWAIT VA BENE?????
            let listaMulteParziale = await MultaDao.getMulte(targa);
            listaMulte = listaMulte.concat(listaMulteParziale);
        }
        let response = { multe: listaMulte };
        res.send(response);
    } catch (error) {
        res.status(500).send({ "error": "Errore interno del server" });
    }
})

/*
Questa funzione definisce la rotta /paga/:id_multa, con cui un utente car-owner può pagare una propria multa.
*/
app.patch("/pagamento/:idMulta", (req, res) => {
    if (!req.params.hasOwnProperty('idMulta')) {
        let err = new Error("Id della multa mancante");
        res.status(400).send({ error: err.message });
    }
    let idMulta = req.params.idMulta;
    try {
        MultaDao.getMulta(idMulta).then(({ data: { multa } }) => {
            let targheUtente = req.targhe;
            let targaMulta = multa.targa;
            if (!targheUtente.includes(targaMulta))
                res.status(403).send({ "error": "La multa relativa all'id fornito non appartiene a nessuna delle targhe dell'utente." });
            else if (multa.pagato)
                res.status(403).send({ "error": "La multa relativa all'id fornito è già stata pagata." });
            else MultaDao.pagaMulta(idMulta).then(() => res.send("Pagamento eseguito"));
        })
    } catch (error) {
        res.status(500).send({ "error": "Errore interno del server" });
    }
});


//Qua vengono definiti i middleware da applicare alle varie rotte.
app.use('/nuovarilevazione/:postazione', jwtCheck('smartautovelox'), checkPostazione(listaPostId), checkTimestamp, checkImmagine, errorHandler);
app.use('/nuovarilevazione/json/:postazione', jwtCheck('smartautovelox'), checkPostazione(listaPostId), checkTimestamp, checkJson, errorHandler);
app.use('listaveicoli/:tratta', jwtCheck("admin"), checkTratta(listaTratteId), checkDate, errorHandler);
app.use('/stat/:targa/:tratta', jwtCheck("admin"), checkTratta(listaTratteId), checkTarga, errorHandler);
app.use('/tratte', jwtCheck("admin"), errorHandler);
app.use('multa/:targa', jwtCheck("admin"), checkTarga, errorHandler);
app.use('/propriemulte', jwtCheck("car-owner"), checkTarghe, errorHandler);
app.use('/pagamento/:id_multa', jwtCheck("car-owner"), checkTarghe, errorHandler)

app.listen(PORT, HOST, err => {
    if (err) return console.log(`Impossibile ascoltare sull host ${HOST} nella porta: ${PORT}`);
    console.log(`server in ascolto su: http://${HOST}:${PORT}/`);
});


/*È possibile che venga rilevato il passaggio di un veicolo all'ingresso di una tratta ma non della fine. Per evitare di mantenere 
transiti aperti per troppo tempo, si definisce un operazione che viene ripetuta ciclamente di pulizia del DB.
*/
setInterval(() => {
    TransitoDao.eliminaTransitiErrati(Date.getTime());
}, 1000000000);