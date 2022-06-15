CREATE DATABASE Rilevazioni;
\c Rilevazioni
CREATE TABLE IF NOT EXISTS Tratta (
IdTratta INTEGER AUTO_INCREMENT=1 PRIMARY KEY,
Limite INTEGER,
        Distanza NUMERIC(6, 2 )
       );


CREATE TABLE IF NOT EXISTS Postazione (
IdPostazione INTEGER AUTO_INCREMENT=1 PRIMARY KEY,
Tipo VARCHAR(6),
        IdTratta INTEGER REFERENCES Tratta (IdTratta)
       );


CREATE TABLE IF NOT EXISTS Transito (
IdTransito INTEGER AUTO_INCREMENT=1 PRIMARY KEY,
Apertura BOOLEAN,
TempoIniziale VARCHAR(20),
TempoFinale VARCHAR(20),
        VelocitaMedia NUMERIC(6 , 2 ),
Targa VARCHAR(7),
Tratta INTEGER REFERENCES Tratta (IdTratta)
      );


CREATE TABLE IF NOT EXISTS Multa (
IdMulta INTEGER AUTO_INCREMENT=1,
Importo INTEGER,
Targa VARCHAR(7),
        Pagato BOOLEAN
       );




INSERT INTO Tratta (Limite, Distanza)
    VALUES(
(70, 20),
(50, 10),
(40, 5),
(90, 30),
(110, 50))




INSERT INTO Postazione (Tipo, IdTratta)
    VALUES(
('inizio', 1),
('fine', 1),
('inizio', 2),
('fine', 2),
('inizio', 3),
('fine', 3),
('inizio', 4),
('fine', 4),
('inizio', 5),
('fine', 5),