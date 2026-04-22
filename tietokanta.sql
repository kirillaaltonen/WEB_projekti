DROP TABLE IF EXISTS TILAUSRIVIT;
DROP TABLE IF EXISTS TILAUKSET;
DROP TABLE IF EXISTS TUOTTEET;
DROP TABLE IF EXISTS KAYTTAJAT;

CREATE TABLE KAYTTAJAT (
    kayttaja_id     INTEGER     PRIMARY KEY AUTO_INCREMENT,
    nimi            TEXT        NOT NULL,
    sahkoposti      VARCHAR(255) NOT NULL UNIQUE,
    salasana        TEXT        NOT NULL,
    opiskelijanumero VARCHAR(50) UNIQUE,
    rooli           ENUM('opiskelija', 'henkilokunta', 'admin') NOT NULL DEFAULT 'opiskelija'
);

CREATE TABLE TUOTTEET (
    tuote_id    INTEGER     PRIMARY KEY AUTO_INCREMENT,
    nimi        TEXT        NOT NULL,
    kuvaus      TEXT,
    hinta       REAL        NOT NULL CHECK (hinta >= 0),
    kategoria   TEXT        NOT NULL
);

CREATE TABLE TILAUKSET (
    tilaus_id   INTEGER     PRIMARY KEY AUTO_INCREMENT,
    kayttaja_id INTEGER     NOT NULL,
    tila        ENUM('odottaa', 'valmistetaan', 'valmis', 'noudettu', 'peruutettu') NOT NULL DEFAULT 'odottaa',
    paivamaara  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kayttaja_id) REFERENCES KAYTTAJAT(kayttaja_id)
);

CREATE TABLE TILAUSRIVIT (
    tilaus_id   INTEGER     NOT NULL,
    tuote_id    INTEGER     NOT NULL,
    maara       INTEGER     NOT NULL DEFAULT 1 CHECK (maara > 0),
    PRIMARY KEY (tilaus_id, tuote_id),
    FOREIGN KEY (tilaus_id) REFERENCES TILAUKSET(tilaus_id),
    FOREIGN KEY (tuote_id)  REFERENCES TUOTTEET(tuote_id)
);