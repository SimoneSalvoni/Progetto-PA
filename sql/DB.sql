CREATE DATABASE IF NOT EXISTS Rilevazioni;
USE Rilevazioni;
CREATE TABLE IF NOT EXISTS Tratta (
idTratta INTEGER AUTO_INCREMENT PRIMARY KEY, 
limite INTEGER, 
distanza INTEGER
);
CREATE TABLE IF NOT EXISTS Postazione (
idPostazione INTEGER AUTO_INCREMENT PRIMARY KEY, 
tipo VARCHAR(6), 
idTratta INTEGER REFERENCES Tratta (idTratta)
);
CREATE TABLE IF NOT EXISTS Transito (
idTransito INTEGER AUTO_INCREMENT PRIMARY KEY,
aperto BOOLEAN,
timestampInizio VARCHAR(20),
timestampFine VARCHAR(20),
velMedia NUMERIC(6 , 2 ),
targa VARCHAR(7),
tratta INTEGER REFERENCES Tratta (idTratta)
);
CREATE TABLE IF NOT EXISTS Multa (
idMulta INTEGER AUTO_INCREMENT PRIMARY KEY,
importo NUMERIC(4,2),
targa VARCHAR(7),
timestamp VARCHAR(20),
pagato BOOLEAN
);
INSERT INTO Tratta (limite, distanza)
SELECT * FROM (SELECT '70' `limite`, '20' `distanza` UNION ALL
SELECT '50' `Limite`, '10' `Distanza` UNION ALL
SELECT '40' `limite`, '5' `distanza` UNION ALL
SELECT '90' `limite`, '30' `distanza` UNION ALL
SELECT '110' `limite`, '50' `distanza`) A
WHERE NOT EXISTS (SELECT * FROM Tratta);

INSERT INTO Postazione (tipo, idTratta)
SELECT * FROM (SELECT 'inizio' `tipo`, '1' `idTratta` UNION ALL
SELECT 'fine' `tipo`, '1' `idTratta` UNION ALL
SELECT 'inizio' `tipo`, '2' `idTratta` UNION ALL
SELECT 'fine' `tipo`, '2' `idTratta` UNION ALL
SELECT 'inizio' `tipo`, '3' `idTratta` UNION ALL
SELECT 'fine' `tipo`, '3' `idTratta` UNION ALL
SELECT 'inizio' `tipo`, '4' `idTratta` UNION ALL
SELECT 'fine' `tipo`, '4' `idTratta` UNION ALL
SELECT 'inizio' `tipo`, '5' `idTratta` UNION ALL
SELECT 'fine' `tipo`, '5' `idTratta`) A
WHERE NOT EXISTS (SELECT * FROM Postazione);

INSERT INTO Transito(aperto, timestampInizio, timestampFine, velMedia, targa, tratta)
SELECT * FROM (SELECT '0' `aperto`, '1655113800000' `timestampInizio`,  '1655114916000' `timestampFine`, '64.52' `velMedia`,  'DW367BX' `targa`, '1' `tratta` UNION ALL
SELECT '0' `aperto`, '1655212043000' `timestampInizio`,  '1655212843000' `timestampFine`, '135.00' `velMedia`,  'DW367BX' `targa`, '4' `tratta` UNION ALL
SELECT '0' `aperto`, '1655220078000' `timestampInizio`,  '1655220588000' `timestampFine`, '35.29' `velMedia`,  'AA123AA' `targa`, '3' `tratta` UNION ALL
SELECT '0' `aperto`, '1655279219000' `timestampInizio`,  '1655279819000' `timestampFine`, '60.00' `velMedia`,  'AA123AA' `targa`, '2' `tratta` UNION ALL
SELECT '0' `aperto`, '1655583307000' `timestampInizio`,  '1655584867000' `timestampFine`, '115.38' `velMedia`,  'BP482MN' `targa`, '5' `tratta` UNION ALL
SELECT '0' `aperto`, '1655743656000' `timestampInizio`,  '1655744856000' `timestampFine`, '60.00' `velMedia`,  'AA123AA' `targa`, '1' `tratta` UNION ALL
SELECT '0' `aperto`, '1655759293000' `timestampInizio`,  '1655760337000' `timestampFine`, '68.97' `velMedia`,  'BP482MN' `targa`, '1' `tratta`) A
WHERE NOT EXISTS (SELECT * FROM Transito);

INSERT INTO Multa(importo, targa, timestamp, pagato)
SELECT * FROM (SELECT '4' `importo`, 'DW367BX' `targa`,  '1655212843000' `timestamp`, '0' `pagato` UNION ALL
SELECT '2' `importo`, 'AA123AA' `targa`,  '1655279819000' `timestamp`, '1' `pagato` UNION ALL
SELECT '1' `importo`, 'BP482MN' `targa`,  '1655584867000' `timestamp`, '1' `pagato`) A
WHERE NOT EXISTS (SELECT * FROM Multa);
