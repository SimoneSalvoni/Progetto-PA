import 'dotenv/config';
import express from 'express';
import fileUpload from 'express-fileupload';
import { db } from './Connection/connect.js';
import { unlink, createWriteStream, readFileSync, promises, access, constants } from 'fs';
import Tesseract from 'tesseract.js';
import { MultaDao } from './DAO/multaDao.js';
import { PostazioneDao } from './DAO/postazioneDao.js';
import { TransitoDao } from './DAO/transitoDao.js';
import { TrattaDao } from './DAO/trattaDao.js';
import { jwtCheck, checkPostazione, checkTratta, checkDate, checkFile, checkTarga, checkTarghe, checkTimestamp, errorHandler } from './Middleware/middleware.js';

db.authenticate().then(() => {
    console.log('Connesso al database');
}).catch(err => {
    console.log('Errore: ' + err);
})

async function createTmpLog() {
    access('./tmp', constants.F_OK, async (err) => { await promises.mkdir('./tmp', (err) => { console.log(err) }) });
    access('./log', constants.F_OK, async (err) => {
        await promises.mkdir('./log', (err) => { console.log(err) });
        await promises.writeFile('log/log.txt', '', (err) => { console.log(err) })
    });
}
await createTmpLog();

let app = express();
app.use(fileUpload());

const EXTERNAL_PORT = process.env.EXTERNAL_PORT || 3000
const PORT = process.env.EXTERNAL_PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

//Viene fatta una prima chiamata al DB, con cui si prendono postazioni e tratte. Dato che il numero sarà verosimilmente sempre 
//relativamente limitato, lo si preferisce a chiamare il DB ogni volta che sono necessarie delle informazioni a riguardo
let listaPost = await PostazioneDao.getPostazioni();
let listaPostId = listaPost.map(x => x.get('idPostazione'));
let listaTratte = await TrattaDao.getTratte();
let listaTratteId = listaTratte.map(x => x.get('idTratta'));


//Qua vengono definiti i middleware da applicare alle varie rotte.
app.use('/nuovarilevazione/:postazione', jwtCheck('smartautovelox'), checkPostazione(listaPostId), checkTimestamp, checkFile, errorHandler);
app.use('/listaveicoli/:tratta', jwtCheck("admin"), checkTratta(listaTratteId), checkDate, errorHandler);
app.use('/stat/:targa/:tratta', jwtCheck("admin"), checkTratta(listaTratteId), checkTarga, errorHandler);
app.use('/tratte', jwtCheck("admin"), errorHandler);
app.use('/multe/:targa', jwtCheck("admin"), checkTarga, errorHandler);
app.use('/multeaperte', jwtCheck('admin'), errorHandler);
app.use('/propriemulte', jwtCheck("car-owner"), checkTarghe, errorHandler);
app.use('/pagamento/:idMulta', jwtCheck("car-owner"), checkTarghe, errorHandler)

/*
Questa funzione gestisce il log di due situazioni anomale: l'incapacità di Tesseract di estrarre una targa valida da un'immagine
e la rilevazione del passaggio di un'automobile alla fine di una tratta in assenza di rilevazione dell'inizio. 

@param mess {string} Il messaggio da loggare
*/
let logError = function (mess) {
    let stream = createWriteStream("./log/log.txt", { flags: 'a' });
    stream.write(mess + '\n');
}

/*
Questa funzione calcola l'importo della multa

@param vel {number} La velocità media dell'auto
@param limite {number} Il limite di velocità nella tratta
@return {number} L'importo della multa, senza l'eventuale moltiplicatore dovuto a altre multe recenti
*/
let calcoloImporto = function (vel, limite) {
    if ((vel - limite < 10)) return 1;
    else if (vel - limite < 40) return 2;
    else if (vel - limite < 60) return 4;
    else return 8;
}

/*
Questa funzione calcola le statistiche riguardanti il passaggio di autovetture nelle tratte

@param listaTransiti {object} la lista dei transiti ottenuti dal db
@param numeroTransiti {number} il numero di transiti nella lista

@return {object} Un oggetto con dentro le statistiche calcolate
*/
let calcoloStat = function (listaTransiti, numeroTransiti) {
    //x.velMedia è salvata come numeric sul db, ma viene restituita come stringa per qualche motivo. La passiamo in parseFloat
    let velocita = listaTransiti.map(x => parseFloat(x.velMedia));
    let velMedia = velocita.reduce((prec, succ) => prec + succ, 0) / numeroTransiti;
    let velMax = Math.max(...velocita);
    let velMin = Math.min(...velocita);
    //Uso il + e toFixed per forzare due cifre decimali al massimo, ma non forzarne due quando non serve
    let velStd = +(Math.sqrt(velocita.map(x => Math.pow(x - velMedia, 2)).reduce((a, b) => a + b) / numeroTransiti)).toFixed(2);
    return { numero_transiti: numeroTransiti, velocità_media: velMedia, velocità_max: velMax, velocità_min: velMin, deviazione_standard: velStd }
}


/*
Questa funzione definisce la rotta /nuovarilevazione/:postazione che permette ad un utente smartautovelox di spedire una nuova 
rilevazione di passaggio di un'automobile. In questo caso l'autovelox spedisce un'immagine della targa
*/
app.post('/nuovarilevazione/:postazione', async (req, res) => {
    try {
        let file = req.files.file;
        let targa;
        var filePath = './tmp/' + file.name;
        //Il file è salvato, dato che Tesseract richiede come parametro il path del file.
        let error = await file.mv(filePath);
        if (error) {
            logError(error.message);
            return res.status(500).send({ "errore": "Errore interno del server" });
        }
        else if (req.fileType == 'image') {
            //Lettura della targa tramite Tesseract se il file è un'immagine
            let result = await Tesseract.recognize(filePath, 'eng');
            targa = result.data.text;
        }
        else {
            //Lettura da file JSON
            let jsonFile = JSON.parse(readFileSync(filePath, 'utf8'))
            if (!jsonFile.targa) return res.status(400).send({ 'errore': 'Targa mancante nel file JSON' });
            targa = jsonFile.targa;
        }
        let postId = parseInt(req.params.postazione);
        //Si sono notati due errori che Tesseract compie nella scrittura: l'aggiunta di un trattino (presumibilmente è il simbolo
        //della repubblica a confonderlo) e inserimento di uno \n alla fine della stringa. Questi vengono rimosssi manualmente. 
        targa = targa.replace('-', '');
        targa = targa.replace('\n', '');
        let trattaId;
        let tipoPostazione;
        //Si ricerca l'id della tratta relativa alla postazione che ha spedito la targa, e se questa è di inizio o fine tratta
        for (let post of listaPost) {
            if (post.get('idPostazione') === postId) {
                trattaId = post.get('idTratta');
                tipoPostazione = post.get('tipo');
                break;
            }
        }
        let timestamp = parseInt(req.headers.timestamp);
        let regex = new RegExp('^[A-Z0-9]{7}$');
        if (typeof (targa) !== "string" || targa === '' || !regex.test(targa)) {
            logError(`ERRORE:TARGA INVALIDA. Postazione: ${postId}. Tratta: ${trattaId}. Timestamp: ${timestamp}`);
            return res.sendStatus(400);
        }
        if (tipoPostazione === 'inizio') {
            //Se è una postazione di inizio si apre un nuovo transito
            await TransitoDao.aggiungiTransito(targa, trattaId, timestamp);
            return res.sendStatus(200);
        }
        else {
            //Se è una postazione di fine si ricerca un transito aperto dalla stessa targa sulla stessa tratta per chiuderlo
            let data = await TransitoDao.ricercaTransitoAperto(targa, trattaId);
            if (!data) {
                logError(`ERRORE:RILEVATO TRANSITO DI AUTOVETTURA ALLA FINE DI UN TRATTO SENZA LA PRECEDENTE RILEVAZIONE DI\
                ENTRATA NEL TRATTO. Postazione: ${postId}. Tratta: ${trattaId}. Timestamp: ${timestamp}`);
                return res.sendStatus(400);
            }
            else {
                let transitoAperto = data.dataValues;
                let timestampInizio = parseInt(transitoAperto.timestampInizio);
                let timestampFine = timestamp;
                let distanza;
                let limite;
                //Si recuperano distanza e limite della tratta
                for (let tratta of listaTratte) {
                    if (tratta.get('idTratta') === trattaId) {
                        distanza = tratta.get('distanza');
                        limite = tratta.get('limite');
                        break;
                    }
                }
                if (timestampInizio === timestampFine) {
                    logError(`ERRORE:RILEVATO TRANSITO DI AUTOVETTURA AD INIZIO E FINE TRATTA CON LO STESSO TIMESTAMP. Postazione: ${postId}. Tratta: ${trattaId}. Timestamp: ${timestamp}`)
                    return res.sendStatus(400);
                }
                //Nel calcolo della velocità si moltiplica per 3.600.000 per averlo in km/h
                let vel = ((distanza) / ((timestampFine - timestampInizio))) * 3600000;
                //Se la velocità supera il limite si crea la multa dopo aver chiuso il transito
                if (vel > limite) {
                    let importo = calcoloImporto(vel, distanza);
                    let data = await MultaDao.getMulteRecenti(targa, timestampFine);
                    //Se ci sono multe negli ultimi 30 giorno l'import aumenta del 50%
                    if (data.length !== 0) importo = importo * 1.5;
                    await TransitoDao.chiudiTransito(transitoAperto.idTransito, vel, timestampFine);
                    await MultaDao.creaMulta(targa, importo, timestampFine);
                    return res.sendStatus(200);
                }
                else {
                    await TransitoDao.chiudiTransito(transitoAperto.idTransito, vel, timestampFine);
                    return res.sendStatus(200);
                }
            }
        }
    }
    catch (err) {
        logError(err.message);
        return res.status(500).send({ "errore": "Errore interno del server" });
    }
    finally {
        try {
            unlink(filePath, () => { });
        } catch (error) {
            logError('Errore durante la cancellazione del file:', error.message);
        }
    }
})

/*
Questa è la definizione della rotta /listaveicoli/:tratta, che serve ad un utente di tipo admin per richiedere una lista 
dei veicoli transitati in una data tratta, con la possibilità di specificare un intervallo temporale, con statistiche a riguardo
*/
app.get('/listaveicoli/:tratta', async (req, res) => {
    let tratta = parseInt(req.params.tratta);
    let timestampInizio = parseInt(req.timestampInizio);
    let timestampFine = parseInt(req.timestampFine);
    try {
        let data;
        //I timestamp sono posti a -1 dal middleware se entrambi assenti nell'header della richiesta
        if (timestampInizio === -1) data = await TransitoDao.getTransitiTratta(tratta);
        else data = await TransitoDao.getTransitiTrattaData(tratta, timestampInizio, timestampFine);
        let listaTransiti = data.map(x => x.dataValues);
        let numeroTransiti = listaTransiti.length;
        if (numeroTransiti !== 0) {
            let stat = calcoloStat(listaTransiti,numeroTransiti)
            let response = { veicoli_transitati: listaTransiti.map(x => x.targa), statistiche: stat };
            return res.send(response)
        }
        else {
            return res.send("Su questa tratta, nel periodo in questione, non sono mai passate autovetture");
        }
    }
    catch (err) {
        logError(err.message);
        return res.status(500).send({ "error": "Errore interno del server" });
    }
});

/*
Questa è la definizione della rotta /stat/:targa/:tratta, che serve ad un utente di tipo admin per richiedere le statitiche
riguardanti i viaggi di una particolare targa su una particolare targa
*/
app.get('/stat/:targa/:tratta', async (req, res) => {
    let tratta = parseInt(req.params.tratta);
    let targa = req.params.targa;
    try {
        let data = await TransitoDao.getTransitiTarga(tratta, targa);
        let listaTransiti = data.map(x => x.dataValues);
        let numeroTransiti = listaTransiti.length;
        if (numeroTransiti === 0) {
            return res.send("L'autovettura con la targa richiesta non ha mai attraversato la tratta");
        }
        else {
            let stat = calcoloStat(listaTransiti, numeroTransiti);
            let response = { statistiche: stat };
            return res.send(response)
        }
    }
    catch (err) {
        logError(err.message);
        return res.status(500).send({ "error": "Errore interno del server" });
    }
});

/*
Questa è la definizione della rotta /tratte, che permette ad un utente di tipo admin di recuperare la lista delle tratte attualmente
presenti, con le due postazioni di inzio e fine e la distanza fra le due
*/
app.get("/tratte", (req, res) => {
    let response = { tratte: [] };
    for (let tratta of listaTratte) {
        let id = tratta.get('idTratta');
        let idPostInizio;
        let idPostFine;
        for (let post of listaPost) {
            if (post.get('idTratta') === id && post.get('tipo') === 'inizio') idPostInizio = post.get('idPostazione');
            else if (post.get('idTratta') === id && post.get('tipo') === 'fine') idPostFine = post.get('idPostazione');
        }
        response.tratte.push({ id_tratta: id, post_inizio: idPostInizio, post_fine: idPostFine, distanza: tratta.get('distanza') })
    }
    return res.send(response);
});

/*
Questa è la definizione della rotta /multe/:targa, che permette ad un utente admin di ottenere la lista di tutte le multe 
relative ad una particolare targa.
*/
app.get("/multe/:targa", async (req, res) => {
    let targa = req.params.targa;
    try {
        let data = await MultaDao.getMulte(targa);
        let listaMulte;
        if (data.length === 0) listaMulte = [];
        else listaMulte = data.map(x => x.dataValues).map(y => {
            return { importo: parseFloat(y.importo), data: (new Date(parseInt(y.timestamp))).toDateString(), pagato: y.pagato }
        });
        let response = { targa: targa, multe: listaMulte };
        return res.send(response);
    }
    catch (err) {
        logError(err.message);
        return res.status(500).send({ "error": "Errore interno del server" });
    }
})

/*
Questa è la definizione della rotta /multeaperte, che permette ad un utente admin di ottenere la lista di tutte le multe
attualmente da pagare.
*/
app.get('/multeaperte', async (req, res) => {
    try {
        let data = await MultaDao.getMulteDaPagare();
        let listaMulte;
        if (data.length === 0) listaMulte = [];
        else listaMulte = data.map(x => x.dataValues).map(y => {
            return { targa: y.targa, importo: parseFloat(y.importo), data: (new Date(parseInt(y.timestamp))).toDateString() }
        });
        let response = { multe_da_pagare: listaMulte };
        return res.send(response);
    }
    catch (err) {
        logError(err.message);
        return res.status(500).send({ "error": "Errore interno del server" });
    }
})

/*
Questa funzione definisce la rotta /propriemulte, con cui un utente car-owner può controllare le proprie multe
*/
app.get('/propriemulte', async (req, res) => {
    try {
        let listaMulte = [];
        //se è valorizzato req.targa il jwt ha solo una stringa, se invece è valorizzato req.targhe ha un array di stringhe
        if (req.targa) {
            let data = await MultaDao.getMulte(req.targa);
            listaMulte = listaMulte.concat(data.map(x => x.dataValues));
        }
        else if (req.targhe) {
            for (let targa of req.targhe) {
                let data = await MultaDao.getMulte(targa);
                listaMulte = listaMulte.concat(data.map(x => x.dataValues));
            }
        }
        let response = {
            multe: listaMulte.map(y => {
                return {
                    id_multa: y.idMulta, targa: y.targa, importo: parseFloat(y.importo),
                    data: (new Date(parseInt(y.timestamp))).toDateString(), pagato: y.pagato
                }
            })
        };
        return res.send(response);
    } catch (err) {
        logError(err.message);
        return res.status(500).send({ "error": "Errore interno del server" });
    }
})

/*
Questa funzione definisce la rotta /paga/:id_multa, con cui un utente car-owner può pagare una propria multa.
*/
app.patch("/pagamento/:idMulta", async (req, res) => {
    if (!req.params.hasOwnProperty('idMulta')) {
        let err = new Error("Id della multa mancante");
        res.status(400).send({ error: err.message });
    }
    let idMulta = parseInt(req.params.idMulta);
    try {
        let data = await MultaDao.getMultaById(idMulta);
        let multa = data.dataValues;
        let targaMulta = multa.targa;
        //se è valorizzato req.targa il jwt ha solo una stringa, se è valorizzato req.targhe ha un array di stringhe
        if (req.targa) {
            let targaUtente = req.targa;
            if (!targaUtente === targaMulta)
                return res.status(403).send({ "error": "La multa relativa all'id fornito non appartiene a nessuna delle targhe dell'utente." });
        }
        else if (req.targhe) {
            let targheUtente = req.targhe;
            if (!targheUtente.includes(targaMulta))
                return res.status(403).send({ "error": "La multa relativa all'id fornito non appartiene a nessuna delle targhe dell'utente." });
        }

        if (multa.pagato)
            return res.status(403).send({ "error": "La multa relativa all'id fornito è già stata pagata." });
        else {
            await MultaDao.pagaMulta(idMulta);
            return res.send("Pagamento eseguito");
        }
    } catch (err) {
        logError(err.message);
        return res.status(500).send({ "error": "Errore interno del server" });
    }
});


/*È possibile che venga rilevato il passaggio di un veicolo all'ingresso di una tratta ma non della fine. Per evitare di mantenere 
transiti aperti per troppo tempo, nello specifico da più di due ore rispetto alla data attuale,
si definisce un operazione di pulizia del DB che viene ripetuta ciclamente.
*/
setInterval(() => {
    let date = new Date();
    TransitoDao.eliminaTransitiErrati(date.getTime());
}, 100000);



app.listen(PORT, HOST, err => {
    if (err) return console.log(`Impossibile ascoltare sull host ${HOST} nella porta: ${EXTERNAL_PORT}`);
    console.log(`server in ascolto su: http://${HOST}:${EXTERNAL_PORT}/`);
});