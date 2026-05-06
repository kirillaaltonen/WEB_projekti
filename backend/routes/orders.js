import express from "express";
import db from "../db.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware: Tarkistaa, että pyynnön mukana tulee pätevä JWT-token
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token)
    return res
      .status(401)
      .json({ error: "Pääsy kielletty, kirjaudu sisään ensin" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.kayttaja = decoded;
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ error: "Virheellinen tai vanhentunut token" });
  }
};

// POST /api/orders — Uuden tilauksen tekeminen
// Body: { ostoskori: [{ tuote_id: number, maara: number }, ...] }
// cart.js lähettää tässä muodossa, yhteensopiva.
router.post("/", verifyToken, async (req, res) => {
  const { ostoskori } = req.body;
  const kayttaja_id = req.kayttaja.kayttaja_id;

  if (!ostoskori || ostoskori.length === 0) {
    return res.status(400).json({ error: "Ostoskori on tyhjä" });
  }

  // db on pool.promise() — getConnection() toimii suoraan sillä
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Käyttäjän tiedot alennuksia varten
    const [userRows] = await connection.query(
      "SELECT nimi, opiskelijanumero FROM KAYTTAJAT WHERE kayttaja_id = ?",
      [kayttaja_id],
    );
    const kayttaja = userRows[0];

    if (!kayttaja) {
      await connection.rollback();
      return res.status(404).json({ error: "Käyttäjää ei löydy" });
    }

    // 2. Luodaan tilaus
    const [tilausResult] = await connection.query(
      "INSERT INTO TILAUKSET (kayttaja_id, tila) VALUES (?, ?)",
      [kayttaja_id, "odottaa"],
    );
    const tilaus_id = tilausResult.insertId;

    // 3. Lisätään tilausrivit ja lasketaan kokonaishinta
    let yhteishinta = 0;
    let lisattyjaRiveja = 0;

    for (const item of ostoskori) {
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
        lisattyjaRiveja++;
      }
    }

    if (lisattyjaRiveja === 0) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "Yhtään tuotetta ei löytynyt tietokannasta" });
    }

    // 4. Alennuslogiikka
    let lopullinenHinta = yhteishinta;
    let alennusViesti = "";

    if (
      kayttaja.nimi === "Ilkka Kylmäniemi" ||
      kayttaja.nimi === "Juha Tauriainen"
    ) {
      lopullinenHinta = 0;
      alennusViesti = "Opettaja-alennus 100% (Ilmainen tilaus!)";
    } else if (kayttaja.opiskelijanumero) {
      lopullinenHinta = yhteishinta * 0.9;
      alennusViesti = "Opiskelija-alennus 10% sovellettu";
    }

    // 5. Commit
    await connection.commit();

    res.status(201).json({
      message: "Tilaus vastaanotettu onnistuneesti!",
      tilaus_id,
      alkuperainenHinta: yhteishinta.toFixed(2),
      lopullinenHinta: lopullinenHinta.toFixed(2),
      info: alennusViesti,
    });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: "Virhe tilauksen luonnissa" });
  } finally {
    connection.release();
  }
});

// GET /api/orders/my-orders — Kirjautuneen käyttäjän tilaukset
router.get("/my-orders", verifyToken, async (req, res) => {
  const kayttaja_id = req.kayttaja.kayttaja_id;

  try {
    const [rows] = await db.query(
      `
      SELECT
        T.tilaus_id,
        T.tila,
        T.paivamaara,
        COALESCE(SUM(TR.maara * P.hinta), 0) AS kokonaishinta
      FROM TILAUKSET T
      LEFT JOIN TILAUSRIVIT TR ON T.tilaus_id = TR.tilaus_id
      LEFT JOIN TUOTTEET P ON TR.tuote_id = P.tuote_id
      WHERE T.kayttaja_id = ?
      GROUP BY T.tilaus_id, T.tila, T.paivamaara
      ORDER BY T.paivamaara DESC
      `,
      [kayttaja_id],
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Tilausten haku epäonnistui" });
  }
});

export default router;
