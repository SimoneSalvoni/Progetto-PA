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
IF ((SELECT COUNT(*) FROM Tratta)=0) INSERT INTO Tratta (limite, distanza) VALUES
(70, 20),
(50, 10),
(40, 5),
(90, 30),
(110, 50);
IF ((SELECT COUNT(*) FROM Postazione)=0) INSERT INTO Postazione (tipo, idTratta) VALUES
('inizio', 1),
('fine', 1),
('inizio', 2),
('fine', 2),
('inizio', 3),
('fine', 3),
('inizio', 4),
('fine', 4),
('inizio', 5),
('fine', 5);