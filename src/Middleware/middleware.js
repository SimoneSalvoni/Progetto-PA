//Questo modulo contiene i middleware che vengono utilizzati dalle varie rotte dell'applicazione, definite in index.js.

const jwt = require('jsonwebtoken');

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
                let decodedToken = jwt.verify(encodedToken, process.env.SECRET_KEY);
                if (decodedToken.role === role) {
                    req.token = decodedToken;
                    next();
                }
                else {
                    res.sendStatus(403);
                }
            } else {
                res.sendStatus(403);
            }
        }
        catch (err) {
            next(err)
        }
    }
}

/*
Questa funziona è il middleware che controlla che sia stato passato l'id corrispondente alla tratta o alla postazione,
a dipendenza della rotta.Nello specifico, controlla che l'id sia stato passato nell'header della richiesta, 
e quindi controlla se è presente nella lista delle tratte/postazioni, che è passata come parametro.

@param exists {Object}  La lista degli indici relativi alla tratta o alla postazione, a dipendenza della rotta chiamata
*/
//FORSE IN UNA POST NON POSSO PASSARE L'ID NELL'HEADER???? IN CASO SERVE UN MIDDLEWARE SEPARATO
export function checkID(exists) {
    return function (req, res, next) {
        try {
            if (!req.hasOwnProperty('id')) {
                let err = new Error("L'id non è stato passato");
                res.status(422).send({ error: err.message });
            }
            if (exists.includes(req.id)) next();
            else {
                let err = new Error("L'id non esiste");
                res.status(422).send({ error: err.message });
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
        if (!req.hasOwnProperty('timestamp')) {
            let err = new Error("Timestamp non presente");
            res.status(422).send({ error: err.message });
        }
        let timestamp = req.timestamp;
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
Queste date devono essere strettamente della forma anno-mese-giorno. Per esempio: 2022-06-13. 
*/
export function checkDate(req, res, next) {
    try {
        if (!req.hasOwnProperty('inizio') || !req.hasOwnProperty('fine')) {
            let err = new Error("Almeno una delle date risulta assenti");
            res.status(422).send({ error: err.message });
        }
        const dataInizio = req.inizio;
        const dataFine = req.fine;
        if (!dataInizio.test("^[0-9]{4}-[0-9]{2}-[0-9]{2}$") || !dataFine.test("^[0-9]{4}-[0-9]{2}-[0-9]{2}$")) {
            let err = new Error("Almeno una delle date risulta mal formattata");
            res.status(422).send({ error: err.message });
        }
        const dataInizioTimestamp = (new Date(dataInizioStringa)).getTime();
        const dataFineTimestamp = (new Date(dataFineStringa)).getTime();
        req.timestampInizio = dataInizioTimestamp;
        req.timestampFine = dataFineTimestamp;
        next();
    }
    catch (err) {
        next(err)
    }
}

/*
Questa funzione è il middleware che controlla la presenza di un'immagine contenente la targa nella richiesta POST eseguita da un 
rilevatore. I formati ammessi sono jpg e png.
*/
export function checkImage(req, res, next) {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            let err = new Error("Nessun file presente");
            res.status(422).send({ error: err.message });
        }
        if (Object.keys(req.files).length !== 1) {
            let err = new Error("Solo un file è ammesso");
            res.status(422).send({ error: err.message });
        }
        if (req.files.file.mimetype === 'image/jpeg' || req.files.file.mimetype === 'image/png') {
            req.fileType = 'image';
            next();
        }
        else {
            let err = new Error("Solamente file jpg e png sono ammessi");
            res.status(422).send({ error: err.message });
        }
    }
    catch (err) {
        next(err);
    }
}

/*
Questa funzione è il middleware che controlla la presenza di un file json contenente la targa nella richiesta POST eseguita da un 
rilevatore.
*/
export function checkJson(req, res, next) {
    try {
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
        else {
            let err = new Error("Solamente file json sono ammessi");
            res.status(422).send({ error: err.message });
        }
    }
    catch (err) {
        next(err);
    }
}

/*
Questa funzione è il middleware che controlla la presenza e il formato delle targhe passate come 
argomento alle rotte che le richiedono.
*/
export function checkTarghe(req, res, next) {
    if (!req.hasOwnProperty('targhe')) {
        let err = new Error("Targhe non presenti");
        res.status(422).send({ error: err.message });
    }
    let targhe = req.token.targhe;
    flag = false;
    for (let targa in targhe) {
        if (typeof (targa) !== "string" || targa === '' || !targa.test("^[A-Z0-9]{7}$")) flag = true;
    }
    if (flag) {
        let err = new Error("Una o più targhe invalide")
        res.status(422).send({ error: err.message });
    }
}

/* QUA NON CI STA VERO?
export function checkFine(owner){

}
*/

/*
Questo middleware parte nel caso in cui i precedenti trovino una situazione di errore, al di fuori dell'errore relativo al jwt,
che richiede uno status di errore diverso ed è gestito nel relativo middleware. Viene fornito a chi ha chiamato la rotta
erronamente una risposta, con un HTTP status 500 e un messaggio d'errore.
*/
export function errorHandler(err, req, res, next) {
    res.status(500).send({ error: err.message });
}