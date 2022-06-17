import 'dotenv/config';
import express from 'express';
import fileUpload from 'express-fileupload';
import { db } from './Connection/connect.js'
import { unlink, createWriteStream } from 'fs'
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

let app = express();
app.use(fileUpload());

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

let listaPost = await PostazioneDao.getPostazioni();
let listaPostId = listaPost.map(x => x.get('idPostazione'));
let listaTratte = await TrattaDao.getTratte();
let listaTratteId = listaTratte.map(x => x.get('idTratta'));


//Qua vengono definiti i middleware da applicare alle varie rotte.
app.use('/nuovarilevazione/:postazione', jwtCheck('smartautovelox'), checkPostazione(listaPostId), checkTimestamp, checkFile, errorHandler);
app.use('listaveicoli/:tratta', jwtCheck("admin"), checkTratta(listaTratteId), checkDate, errorHandler);
app.use('/stat/:targa/:tratta', jwtCheck("admin"), checkTratta(listaTratteId), checkTarga, errorHandler);
app.use('/tratte', jwtCheck("admin"), errorHandler);
app.use('multa/:targa', jwtCheck("admin"), checkTarga, errorHandler);
app.use('/propriemulte', jwtCheck("car-owner"), checkTarghe, errorHandler);
app.use('/pagamento/:id_multa', jwtCheck("car-owner"), checkTarghe, errorHandler)

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
Questa funzione definisce la rotta /nuovarilevazione/:postazione che permette ad un utente smartautovelox di spedire una nuova 
rilevazione di passaggio di un'automobile. In questo caso l'autovelox spedisce un'immagine della targa
*/
app.post('/nuovarilevazione/:postazione', async (req, res) => {
    try {
        let file = req.files.file;
        let targa;
        var filePath = '../tmp/' + file.name;
        let error = false;
        file.mv(filePath, (err) => {
            if (err) error = true;
        });
        //SPEDISCO L'ERRORE O NO?
        if (error) return res.status(500).send({ "errore": "Errore interno del server" });
        else if (req.fileType == 'image') {
            let result = await Tesseract.recognize(filePath, 'eng');
            targa = result.data.text;
        }
        else {
            let jsonFile = require(filePath);
            if (!jsonFile.targa) return res.status(400).send({ 'errore': 'Targa mancante nel file JSON' });
            targa = jsonFile.targa;
        }
        let postId = parseInt(req.params.postazione);
        targa = targa.replace('-', '');
        targa = targa.replace('\n', '');
        let trattaId;
        let tipoPostazione;
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
            logError(`ERRORE:TARGA ILLEGGIBILE. Postazione: ${postId}. Tratta: ${trattaId}. Timestamp: ${timestamp}`);
            return res.sendStatus(200);
        }
        if (tipoPostazione === 'inizio') {
            await TransitoDao.aggiungiTransito(targa, trattaId, timestamp);
            return res.sendStatus(200);
        }
        else {
            let data = await TransitoDao.ricercaTransitoAperto(targa, trattaId);
            let transitoAperto = data.dataValues;
            if (!transitoAperto) {
                logError(`ERRORE:RILEVATO TRANSITO DI AUTOVETTURA ALLA FINE DI UN TRATTO SENZA LA PRECEDENTE RILEVAZIONE DI\
                ENTRATA NEL TRATTO. Postazione: ${postId}. Tratta: ${trattaId}. Timestamp: ${timestamp}`);
                return res.sendStatus(200); //FORSE MEGLIO NON OK
            }
            else {
                let timestampInizio = parseInt(transitoAperto.timestampInizio);
                let timestampFine = timestamp;
                let distanza;
                let limite;
                for (let tratta of listaTratte) {
                    if (tratta.get('idTratta') === trattaId) {
                        distanza = tratta.get('distanza');
                        limite = tratta.get('limite');
                        break;
                    }
                }
                //si moltiplica per 3.600.000 per averlo in km/h
                if (timestampInizio === timestampFine) {
                    logError(`ERRORE:RILEVATO TRANSITO DI AUTOVETTURA AD INIZIO E FINE TRATTA\
                        CON LO STESSO TIMESTAMP. Postazione: ${postId}. Tratta: ${trattaId}. Timestamp: ${timestamp}`)
                    return res.sendStatus(200);
                }
                let vel = ((distanza) / ((timestampFine - timestampInizio))) * 3600000;
                if (vel > limite) {
                    let importo;
                    if ((vel - limite < 10)) importo = 1;
                    else if (vel - limite < 40) importo = 2;
                    else if (vel - limite < 60) importo = 4;
                    else importo = 8;

                    await TransitoDao.chiudiTransito(transitoAperto.idTransito, vel, timestampFine);
                    await MultaDao.creaMulta(targa, importo);
                    return res.sendStatus(200);
                }
                else{
                    await TransitoDao.chiudiTransito(transitoAperto.idTransito, vel, timestampFine);
                    return res.sendStatus(200);
                }
            }
        }
    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ "errore": "Errore interno del server" });
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
            unlink(filePath, () => { });
        } catch (error) {
            console.error('Errore durante la cancellazione del file:', error.message);
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
        let transiti;
        if (timestampInizio === -1) listaTransiti = await TransitoDao.getTransitiTratta(tratta);
        else listaTransiti = await TransitoDao.getTransitiTrattaData(tratta, timestampInizio, timestampFine);
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
        return res.send(response)
    }
    catch (err) {
        return res.status(500).send({ "error": "Errore interno del server" });
    }
});

/*
Questa è la definizione della rotta /stat/:targa/:tratta, che serve ad un utente di tipo admin per richiedere le statitiche
riguardanti i viaggi di una particolare targa su una particolare targa
*/
app.get('/stat/:targa/:tratta', (req, res) => {
    let tratta = parseInt(req.params.tratta);
    let targa = req.targa;
    try {
        TransitoDao.getTransitiTarga(tratta, targa).then(({ data: { listaTransiti } }) => {
            let numeroTransiti = listaTransiti.length;
            if (numeroTransiti === 0) {
                return res.send("L'autovettura con la targa richiesta non ha mai attraversato la tratta");
            }
            else {
                var velocita = listaTransiti.map(x => x.get('velMedia'));
                var velMedia = velocita.reduce((prec, succ) => prec + succ, 0) / numeroTransiti;
                var velMax = Math.max(...velocita);
                var velMin = Math.min(...velocita);
                var velStd = Math.sqrt(velocita.map(x => Math.pow(x - velMedia, 2)).reduce((a, b) => a + b) / numeroTransiti);
                let response = JSON.stringify({ stat: { media: velMedia, max: velMax, min: velMin, std: velStd } });
                return res.send(response)
            }
        })
    }
    catch (err) {
       return  res.status(500).send({ "error": "Errore interno del server" });
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
Questa è la definizione della rotta /multa/:targa, che permette ad un utente admin di ottenere la lista di tutte le multe 
relative ad una particolare targa.
*/
app.get("/multa/:targa", async (req, res) => {
    let targa = req.params.targa;
    try {
        let data = await MultaDao.getMulte(targa);
        let listaMulte = data.dataValues;
        let response = { targa: targa, multe: listaMulte };
        return res.send(response);
    }
    catch (err) {
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
        let listaMulte=data.dataValues;
        let response = { multe: listaMulte };
        return res.send(response);
    }
    catch (err) {
        return res.status(500).send({ "error": "Errore interno del server" });
    }
})

/*
Questa funzione definisce la rotta /propriemulte, con cui un utente car-owner può controllare le proprie multe
*/
//MODIFICA PER AVERE SOLO UNA TARGA COME ARGOMENTO DI GETMULTE
app.get('/propriemulte', async (req, res) => {
    try {
        let listaMulte;
        for (let targa of req.targhe) {
            let data = await MultaDao.getMulte(targa);
            listaMulte = listaMulte.concat(data.dataValues);
        }
        let response = { multe: listaMulte };
        return res.send(response);
    } catch (error) {
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
        let targheUtente = req.targhe;
        let targaMulta = multa.targa;
        if (!targheUtente.includes(targaMulta))
            return res.status(403).send({ "error": "La multa relativa all'id fornito non appartiene a nessuna delle targhe dell'utente." });
        else if (multa.get('pagato'))
            return res.status(403).send({ "error": "La multa relativa all'id fornito è già stata pagata." });
        else{
            await MultaDao.pagaMulta(idMulta);
            return res.send("Pagamento eseguito");
        }
    } catch (error) {
        return res.status(500).send({ "error": "Errore interno del server" });
    }
});

/*È possibile che venga rilevato il passaggio di un veicolo all'ingresso di una tratta ma non della fine. Per evitare di mantenere 
transiti aperti per troppo tempo, si definisce un operazione che viene ripetuta ciclamente di pulizia del DB.
*/
/*
setInterval(() => {
    let date = new Date();
    TransitoDao.eliminaTransitiErrati(date.getTime());
}, 100000000000);
*/


app.listen(PORT, HOST, err => {
    if (err) return console.log(`Impossibile ascoltare sull host ${HOST} nella porta: ${PORT}`);
    console.log(`server in ascolto su: http://${HOST}:${PORT}/`);
});