DROP TABLE IF EXISTS TILAUSRIVIT;
DROP TABLE IF EXISTS TILAUKSET;
DROP TABLE IF EXISTS TUOTTEET;
DROP TABLE IF EXISTS KAYTTAJAT;

CREATE TABLE KAYTTAJAT (
                         kayttaja_id INT PRIMARY KEY AUTO_INCREMENT,
                         nimi VARCHAR(255) NOT NULL,
                         sahkoposti VARCHAR(255) NOT NULL UNIQUE,
                         salasana TEXT NOT NULL,
                         opiskelijanumero VARCHAR(50) UNIQUE,
                         rooli ENUM('opiskelija', 'henkilokunta', 'admin') NOT NULL DEFAULT 'opiskelija'
);

CREATE TABLE TUOTTEET (
                        tuote_id INT PRIMARY KEY AUTO_INCREMENT,
                        nimi VARCHAR(255) NOT NULL,
                        kuvaus TEXT,
                        hinta DECIMAL(10,2) NOT NULL CHECK (hinta >= 0),
                        kategoria VARCHAR(100) NOT NULL,
                        viikonpaiva VARCHAR(20),
                        erityisruokavaliot TEXT
);

CREATE TABLE TILAUKSET (
                         tilaus_id INT PRIMARY KEY AUTO_INCREMENT,
                         kayttaja_id INT NOT NULL,
                         tila ENUM('odottaa', 'valmistetaan', 'valmis', 'noudettu', 'peruutettu') NOT NULL DEFAULT 'odottaa',
                         paivamaara DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         FOREIGN KEY (kayttaja_id) REFERENCES KAYTTAJAT(kayttaja_id)
);

CREATE TABLE TILAUSRIVIT (
                           tilaus_id INT NOT NULL,
                           tuote_id INT NOT NULL,
                           maara INT NOT NULL DEFAULT 1 CHECK (maara > 0),
                           PRIMARY KEY (tilaus_id, tuote_id),
                           FOREIGN KEY (tilaus_id) REFERENCES TILAUKSET(tilaus_id) ON DELETE CASCADE,
                           FOREIGN KEY (tuote_id) REFERENCES TUOTTEET(tuote_id)
);

INSERT INTO TUOTTEET (nimi, kuvaus, hinta, kategoria, viikonpaiva, erityisruokavaliot) VALUES
                                                                                         ('Margherita Classica', 'Tomaatti, mozzarella, tuore basilika', 8.90, 'lounas', 'maanantai', 'kasvis,maitoa'),
                                                                                         ('Pollo Pesto', 'Kana, pestokastike, kirsikkatomaatti, parmesan', 10.90, 'lounas', 'maanantai', 'maitoa'),
                                                                                         ('Diavola', 'Salami piccante, tomaatti, mozzarella, chili', 11.50, 'lounas', 'tiistai', 'maitoa'),
                                                                                         ('Veggie Delight', 'Kasvikset, aurinkokuivattu tomaatti, rucolapesto', 9.90, 'lounas', 'tiistai', 'kasvis,gluteeniton'),
                                                                                         ('Metro Special', 'Kinkku, sieni, oliivi, paprika, mozzarella', 10.50, 'lounas', 'keskiviikko', 'maitoa'),
                                                                                         ('Quattro Formaggi', 'Neljä juustoa, hunaja, saksanpähkinä', 11.90, 'lounas', 'keskiviikko', 'kasvis,maitoa'),
                                                                                         ('Salmone', 'Savulohi, kapris, punasipuli, tuorejuusto', 12.90, 'lounas', 'keskiviikko', 'maitoa,gluteeniton'),
                                                                                         ('Prosciutto e Rucola', 'Parmankinkku, rucola, parmesan, sitruuna', 13.50, 'lounas', 'torstai', 'maitoa'),
                                                                                         ('Calzone Metro', 'Täytetty pizza: ricotta, kinkku, sieni', 12.50, 'lounas', 'perjantai', 'maitoa'),
                                                                                         ('Bufala', 'Puhvelinmozzarella, tomaatti, tuore basilika', 12.00, 'lounas', 'perjantai', 'kasvis,maitoa');

-- Admin-käyttäjä.
-- Salasana riippuu hashista, joten helpoin tapa on:
-- 1. rekisteröi käyttäjä frontendissä
-- 2. aja UPDATE KAYTTAJAT SET rooli='admin' WHERE sahkoposti='...';
