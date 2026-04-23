import express from "express";
import db from "../db.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware: Tarkistaa, että pyynnön mukana tulee pätevä JWT-token, eli käyttäjä on kirjautunut sisään
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Etsii muotoa "Bearer TOKEN"
  if (!token)
    return res
      .status(401)
      .json({ error: "Pääsy kielletty, kirjaudu sisään ensin" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.kayttaja = decoded; // Tallennetaan käyttäjän tiedot (kuten kayttaja_id) pyyntöön
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ error: "Virheellinen tai vanhentunut token" });
  }
};

// POST /api/orders - Uuden tilauksen tekeminen
router.post("/", verifyToken, async (req, res) => {
  const { ostoskori } = req.body; // Frontend lähettää: [{ tuote_id: 1, maara: 2 }, ...]
  const kayttaja_id = req.kayttaja.kayttaja_id;

  if (!ostoskori || ostoskori.length === 0) {
    return res.status(400).json({ error: "Ostoskori on tyhjä" });
  }

  // Haetaan tietokantayhteys transaktiota varten (jos jokin menee vikaan, mikään ei tallennu)
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Haetaan käyttäjän tiedot alennuksia varten
    const [userRows] = await connection.query(
      "SELECT nimi, opiskelijanumero FROM KAYTTAJAT WHERE kayttaja_id = ?",
      [kayttaja_id],
    );
    const kayttaja = userRows[0];

    // 2. Luodaan tilaus TILAUKSET-tauluun
    const [tilausResult] = await connection.query(
      "INSERT INTO TILAUKSET (kayttaja_id, tila) VALUES (?, ?)",
      [kayttaja_id, "odottaa"],
    );
    const tilaus_id = tilausResult.insertId;

    // 3. Lisätään tuotteet TILAUSRIVIT-tauluun ja lasketaan samalla kokonaishinta
    let yhteishinta = 0;

    for (const item of ostoskori) {
      // Haetaan tuotteen oikea hinta tietokannasta (turvallisuussyistä emme luota frontendin hintoihin)
      const [tuoteRows] = await connection.query(
        "SELECT hinta FROM TUOTTEET WHERE tuote_id = ?",
        [item.tuote_id],
      );
      if (tuoteRows.length > 0) {
        yhteishinta += tuoteRows[0].hinta * item.maara;
        await connection.query(
          "INSERT INTO TILAUSRIVIT (tilaus_id, tuote_id, maara) VALUES (?, ?, ?)",
          [tilaus_id, item.tuote_id, item.maara],
        );
      }
    }

    // 4. Määritetään lopullinen hinta erikoisvaatimusten mukaisesti
    let lopullinenHinta = yhteishinta;
    let alennusViesti = "";

    if (
      kayttaja.nimi === "Ilkka Kylmäniemi" ||
      kayttaja.nimi === "Juha Tauriainen"
    ) {
      lopullinenHinta = 0;
      alennusViesti = "Opettaja-alennus 100% (Ilmainen tilaus!)";
    } else if (kayttaja.opiskelijanumero) {
      lopullinenHinta = yhteishinta * 0.9; // 10% opiskelija-alennus
      alennusViesti = "Opiskelija-alennus 10% sovellettu";
    }

    // 5. Hyväksytään tietokantatapahtuma (Tallennetaan oikeasti)
    await connection.commit();

    res.status(201).json({
      message: "Tilaus vastaanotettu onnistuneesti!",
      tilaus_id: tilaus_id,
      alkuperainenHinta: yhteishinta.toFixed(2),
      lopullinenHinta: lopullinenHinta.toFixed(2),
      info: alennusViesti,
    });
  } catch (error) {
    await connection.rollback(); // Perutaan muutokset virhetilanteessa
    console.error(error);
    res.status(500).json({ error: "Virhe tilauksen luonnissa" });
  } finally {
    connection.release(); // Vapautetaan yhteys
  }
});

// GET /api/orders/my-orders - Kirjautuneen käyttäjän omien tilausten haku
router.get("/my-orders", verifyToken, async (req, res) => {
  const kayttaja_id = req.kayttaja.kayttaja_id;
  try {
    const [tilaukset] = await db.query(
      "SELECT tilaus_id, tila, paivamaara FROM TILAUKSET WHERE kayttaja_id = ? ORDER BY paivamaara DESC",
      [kayttaja_id],
    );
    res.json(tilaukset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Tilausten haku epäonnistui" });
  }
});

export default router;
