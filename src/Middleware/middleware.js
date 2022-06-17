//Questo modulo contiene i middleware che vengono utilizzati dalle varie rotte dell'applicazione, definite in index.js.

import jwt from 'jsonwebtoken';
import pkg from 'jsonwebtoken'
const { verify } = jwt;
const {JsonWebTokenError} = pkg;
/*
Questa funzione è il middleware che controlla il jwt, che deve essere passato con la richiesta. 
Controlla prima di tutto la sua presenza,e successivamente controlla che corrisponda al ruolo 
corretto relativo alla rotta chiamata.

@param {string} role È la stringa che identifica il ruolo
*/
export function jwtCheck(role) {
    return function (req, res, next) {
        try {
            const bearerHeader = req.headers.authorization;
            if (typeof bearerHeader !== 'undefined') {
                const encodedToken = bearerHeader.split(' ')[1];
                let decodedToken = verify(encodedToken, process.env.SECRET_KEY);
                if (decodedToken.Role === role) {
                    req.token = decodedToken;
                    next();
                }
                else {
                    res.status(403).send("L'utente non è del ruolo corretto");
                }
            } else {
                res.status(403).send("Token jwt mancante");
            }
        }
        catch (err) {
            if (err instanceof JsonWebTokenError) res.status(403).send(err.message)
            else next(err)
        }
    }
}

/*
Questa funziona è il middleware che controlla che sia stato passato l'id corrispondente alla postazione.
Controlla che l'id sia stato passato nell'header della richiesta, 
e quindi controlla se è presente nella lista delle postazioni, che è passata come parametro.

@param postazioni {array}  La lista degli indici relativi alla tratta o alla postazione, a dipendenza della rotta chiamata
*/
export function checkPostazione(postazioni) {
    return function (req, res, next) {
        try {
            if (!req.params.hasOwnProperty('postazione')) {
                let err = new Error("Id della postazione mancante");
                res.status(400).send({ error: err.message });
            }
            let id = parseInt(req.params.postazione);
            if (postazioni.includes(id)) next();
            else {
                let err = new Error("La postazione fornita non esiste");
                res.status(404).send({ error: err.message });
            }
        }
        catch (err) {
            next(err);
        }
    }
}

/*
Questa funziona è il middleware che controlla che sia stato passato l'id corrispondente alla tratta.
Controlla che l'id sia stato passato nell'header della richiesta, 
e quindi controlla se è presente nella lista delle tratte, che è passata come parametro.

@param tratte {array}  La lista degli indici relativi alla tratta o alla postazione, a dipendenza della rotta chiamata
*/
export function checkTratta(tratte) {
    return function (req, res, next) {
        try {
            if (!req.params.hasOwnProperty('tratta')) {
                let err = new Error("Id della tratta mancante");
                res.status(400).send({ error: err.message });
            }
            let id = parseInt(req.params.tratta);
            if (tratte.includes(id)) next();
            else {
                let err = new Error("La tratta fornita non esiste");
                res.status(404).send({ error: err.message });
            }
        }
        catch (err) {
            next(err);
        }
    }
}


/*
Questa funzione è il middleware che controlla la presenza e la forma del timestamp.
Il timestamp deve essere in formato Unix epoch, ovvero un semplice numero intero non negativo. 
*/
export function checkTimestamp(req, res, next) {
    try {
        if (!req.headers.hasOwnProperty('timestamp')) {
            let err = new Error("Timestamp non presente");
            res.status(400).send({ error: err.message });
        }
        let timestamp = parseInt(req.headers.timestamp);
        if (typeof (timestamp) === "number" && Number.isInteger(timestamp) && timestamp >= 0) next();
        else {
            let err = new Error("Il timestamp è invalido");
            res.status(422).send({ error: err.message });
        }
    }
    catch (err) {
        next(err);
    }
}

/*
Questa funzione è il middleware che controlla la presenza e la forma delle date di inizio e fine di un intervallo.
È possibile non specificare alcuna data, ma se una è presente lo deve essere anche l'altra.
Queste date devono essere strettamente della forma anno-mese-giorno. Per esempio: 2022-06-13. 
*/
export function checkDate(req, res, next) {
    try {
        if ((!req.headers.hasOwnProperty('inizio') && req.headers.hasOwnProperty('fine')) || (req.headers.hasOwnProperty('inizio') && !req.headers.hasOwnProperty('fine'))) {
            let err = new Error("Una delle due date risulta assente");
            res.status(400).send({ error: err.message });
        }
        else if (!req.headers.hasOwnProperty('inizio') && !req.headers.hasOwnProperty('fine')) {
            req.timestampInizio = -1;
            req.timestampFine = -1;
            next();
        }
        else{
            const dataInizio = req.headers.inizio;
            const dataFine = req.headers.fine;
            let regex = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}$");
            if (!regex.test(dataInizio) || !regex.test(dataFine)) {
                let err = new Error("Almeno una delle date risulta mal formattata");
                res.status(422).send({ error: err.message });
            }
            const dataInizioObject = new Date(dataInizio);
            const dataFineObject = new Date(dataFine);
            if (dataInizioObject.toString() === 'Invalid Date' || dataFineObject.toString() === 'Invalid Date') {
                let err = new Error("Almeno una delle date risulta mal formattata");
                res.status(422).send({ error: err.message });
            }
            const dataInizioTimestamp = dataInizioObject.getTime();
            const dataFineTimestamp = dataFineObject.getTime();
            req.timestampInizio = dataInizioTimestamp;
            req.timestampFine = dataFineTimestamp;
            next();
        }
    }
    catch (err) {
        next(err)
    }
}

/*
Questa funzione è il middleware che controlla che sia presente un file allegato e che sia di tipo jpeg, png o json
*/
export function checkFile(req, res, next) {
    try {
        console.log(req.files)
        if (!req.files || Object.keys(req.files).length === 0) {
            let err = new Error("Nessun file presente");
            res.status(422).send({ error: err.message });
        }
        if (Object.keys(req.files).length !== 1) {
            let err = new Error("Solo un file è ammesso");
            res.status(422).send({ error: err.message });
        }
        if (req.files.file.mimetype === 'application/json') {
            req.fileType = 'json';
            next();
        }
        if (req.files.file.mimetype === 'image/jpeg' || req.files.file.mimetype === 'image/png') {
            req.fileType = 'image';
            next();
        }
        else {
            let err = new Error("Solamente file json sono ammessi");
            res.status(415).send({ error: err.message });
        }
    }
    catch (err) {
        next(err);
    }
}

/*
Questa funzione è il middleware che controlla la presenza e il formato delle targhe all'interno del jwt
*/
export function checkTarghe(req, res, next) {
    if (!req.token.hasOwnProperty('targhe')) {
        let err = new Error("Targhe non presenti");
        res.status(400).send({ error: err.message });
    }
    let targhe = req.token.targhe;
    let flag = false;
    let regex = new RegExp("^[A-Z0-9]{7}$");
    for (let targa in targhe) {
        if (typeof (targa) !== "string" || targa === '' || !regex.test(targa)) flag = true;
    }
    if (flag) {
        let err = new Error("Una o più targhe invalide")
        res.status(422).send({ error: err.message });
    }
    else {
        req.targhe = targhe;
        next();
    }
}

/*
Questa funzione è il middleware che controlla la presenza e il formato della targa passata dall'utente admin 
quando ricerca le multe relative ad una targa
*/
export function checkTarga(req, res, next) {
    if (!req.params.hasOwnProperty('targa')) {
        let err = new Error("Targa non presente");
        res.status(400).send({ error: err.message });
    }
    let targa = req.params.targa;
    let regex = new RegExp("^[A-Z0-9]{7}$");
    if (typeof (targa) !== "string" || targa === '' || !regex.test(targa)) {
        let err = new Error("Targa invalida")
        res.status(422).send({ error: err.message });
    }
    else next();
}

/*
Questo middleware parte nel caso in cui i precedenti trovino una situazione di errore generica.
Viene fornito a chi ha chiamato la rotta erronamente una risposta con un HTTP status 500 e un messaggio d'errore.
*/
export function errorHandler(err, req, res, next) {
    res.status(500).send({ error: err.message });
}