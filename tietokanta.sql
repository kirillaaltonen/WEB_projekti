DROP TABLE IF EXISTS TILAUSRIVIT;
DROP TABLE IF EXISTS TILAUKSET;
DROP TABLE IF EXISTS TUOTTEET;
DROP TABLE IF EXISTS KAYTTAJAT;


-- KAYTTAJAT
-- Käyttäjätaulu: opiskelijat ja henkilökunta

CREATE TABLE KAYTTAJAT (
    kayttaja_id     INTEGER     PRIMARY KEY AUTO_INCREMENT,
    nimi            TEXT        NOT NULL,
    sahkoposti      TEXT        NOT NULL UNIQUE,
    salasana        TEXT        NOT NULL,           -- bcrypt-hash
    opiskelijanumero TEXT       UNIQUE,             -- NULL sallittu henkilökunnalle
    rooli           TEXT        NOT NULL DEFAULT 'opiskelija'
                                CHECK (rooli IN ('opiskelija', 'henkilo kunta', 'admin'))
);

-- TUOTTEET
-- Tuoteluettelo: pizzat, juomat, lisät jne.
CREATE TABLE TUOTTEET (
    tuote_id    INTEGER     PRIMARY KEY AUTO_INCREMENT,
    nimi        TEXT        NOT NULL,
    kuvaus      TEXT,
    hinta       REAL        NOT NULL CHECK (hinta >= 0),
    kategoria   TEXT        NOT NULL
);

-- TILAUKSET
-- Yksi tilaus per käyttäjä per ostokerta
CREATE TABLE TILAUKSET (
    tilaus_id   INTEGER     PRIMARY KEY AUTO_INCREMENT,
    kayttaja_id INTEGER     NOT NULL,
    tila        TEXT        NOT NULL DEFAULT 'odottaa'
                            CHECK (tila IN ('odottaa', 'valmistetaan', 'valmis', 'noudettu', 'peruutettu')),
    paivamaara  DATETIME    NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (kayttaja_id) REFERENCES KAYTTAJAT(kayttaja_id)
);

-- TILAUSRIVIT
-- Liityntätaulu: mitä tuotteita tilauksessa on ja paljonko
-- Composite PK: (tilaus_id, tuote_id)
CREATE TABLE TILAUSRIVIT (
    tilaus_id   INTEGER     NOT NULL,
    tuote_id    INTEGER     NOT NULL,
    maara       INTEGER     NOT NULL DEFAULT 1 CHECK (maara > 0),

    PRIMARY KEY (tilaus_id, tuote_id),
    FOREIGN KEY (tilaus_id) REFERENCES TILAUKSET(tilaus_id),
    FOREIGN KEY (tuote_id)  REFERENCES TUOTTEET(tuote_id)
);