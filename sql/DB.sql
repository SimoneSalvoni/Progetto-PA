DROP DATABASE IF EXISTS Rilevazioni;
CREATE DATABASE Rilevazioni;
USE Rilevazioni;
CREATE TABLE Tratta (
idTratta INTEGER AUTO_INCREMENT PRIMARY KEY, 
limite INTEGER, 
distanza INTEGER
);
CREATE TABLE Postazione (
idPostazione INTEGER AUTO_INCREMENT PRIMARY KEY, 
tipo VARCHAR(6), 
idTratta INTEGER REFERENCES Tratta (idTratta)
);
CREATE TABLE Transito (
idTransito INTEGER AUTO_INCREMENT PRIMARY KEY,
aperto BOOLEAN,
timestampInizio VARCHAR(20),
timestampFine VARCHAR(20),
velMedia NUMERIC(6 , 2 ),
targa VARCHAR(7),
tratta INTEGER REFERENCES Tratta (idTratta)
);
CREATE TABLE Multa (
idMulta INTEGER AUTO_INCREMENT PRIMARY KEY,
importo NUMERIC(4,2),
targa VARCHAR(7),
pagato BOOLEAN
);
INSERT INTO Tratta (limite, distanza) VALUES
(70, 20),
(50, 10),
(40, 5),
(90, 30),
(110, 50);
INSERT INTO Postazione (tipo, idTratta) VALUES
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