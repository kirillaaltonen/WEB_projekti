import express from "express";
import db from "../db.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware: Tarkistaa tokenin ja admin-oikeudet
const verifyAdmin = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Kirjaudu sisään ensin" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.rooli !== "admin") {
      return res
        .status(403)
        .json({ error: "Pääsy kielletty: Vain ylläpitäjille" });
    }
    req.kayttaja = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Virheellinen token" });
  }
};

// --- TILAUSTEN HALLINTA ---

// GET /api/admin/orders
// Palauttaa kaikki tilaukset kokonaishinnalla ja tuotelistalla
router.get("/orders", verifyAdmin, async (req, res) => {
  try {
    const [tilaukset] = await db.query(`
      SELECT
        T.tilaus_id,
        T.tila,
        T.paivamaara,
        K.nimi AS asiakas
      FROM TILAUKSET T
             JOIN KAYTTAJAT K ON T.kayttaja_id = K.kayttaja_id
      ORDER BY T.paivamaara DESC
    `);

    if (tilaukset.length === 0) {
      return res.json([]);
    }

    const tilausIdt = tilaukset.map((t) => t.tilaus_id);
    const [rivit] = await db.query(
      `SELECT
        TR.tilaus_id,
        P.nimi,
        TR.maara,
        P.hinta,
        (P.hinta * TR.maara) AS rivi_hinta
       FROM TILAUSRIVIT TR
       JOIN TUOTTEET P ON TR.tuote_id = P.tuote_id
       WHERE TR.tilaus_id IN (?)`,
      [tilausIdt],
    );

    const riviMap = {};
    rivit.forEach((r) => {
      if (!riviMap[r.tilaus_id]) riviMap[r.tilaus_id] = [];
      riviMap[r.tilaus_id].push(r);
    });

    const tulos = tilaukset.map((t) => {
      const omat = riviMap[t.tilaus_id] || [];
      const kokonaishinta = omat.reduce(
        (s, r) => s + parseFloat(r.rivi_hinta),
        0,
      );
      const tuotteetStr = omat.map((r) => `${r.nimi} ×${r.maara}`).join(", ");
      return {
        tilaus_id: t.tilaus_id,
        asiakas: t.asiakas,
        tila: t.tila,
        paivamaara: t.paivamaara,
        kokonaishinta: kokonaishinta.toFixed(2),
        tuotteet: tuotteetStr || "–",
      };
    });

    res.json(tulos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Tilausten haku epäonnistui" });
  }
});

// PUT /api/admin/orders/:id - Päivitä tilauksen tila
router.put("/orders/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { tila } = req.body;

  const sallitutTilat = [
    "odottaa",
    "valmistetaan",
    "valmis",
    "noudettu",
    "peruutettu",
  ];
  if (!sallitutTilat.includes(tila)) {
    return res.status(400).json({ error: "Virheellinen tila" });
  }

  try {
    const [result] = await db.query(
      "UPDATE TILAUKSET SET tila = ? WHERE tilaus_id = ?",
      [tila, id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Tilausta ei löydy" });
    }
    res.json({ message: "Tilauksen tila päivitetty", tila });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Päivitys epäonnistui" });
  }
});

// --- RUOKALISTAN HALLINTA ---

// POST /api/admin/menu - Lisää uusi tuote
router.post("/menu", verifyAdmin, async (req, res) => {
  const { nimi, kuvaus, hinta, kategoria, viikonpaiva, erityisruokavaliot } =
    req.body;

  if (!nimi || !hinta || !kategoria) {
    return res
      .status(400)
      .json({ error: "Nimi, hinta ja kategoria ovat pakollisia" });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO TUOTTEET (nimi, kuvaus, hinta, kategoria, viikonpaiva, erityisruokavaliot) VALUES (?, ?, ?, ?, ?, ?)",
      [
        nimi,
        kuvaus || null,
        hinta,
        kategoria,
        viikonpaiva || null,
        erityisruokavaliot || null,
      ],
    );
    res
      .status(201)
      .json({ message: "Tuote lisätty", tuote_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Tuotteen lisäys epäonnistui" });
  }
});
// GET /api/admin/users - Hae kaikki käyttäjät
router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT kayttaja_id, nimi, sahkoposti, opiskelijanumero, rooli
      FROM KAYTTAJAT
      ORDER BY kayttaja_id DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Käyttäjien haku epäonnistui" });
  }
});

// PUT /api/admin/users/:id/role - Päivitä käyttäjän rooli
router.put("/users/:id/role", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { rooli } = req.body;

  const sallitutRoolit = ["opiskelija", "admin"];

  if (!sallitutRoolit.includes(rooli)) {
    return res.status(400).json({ error: "Virheellinen rooli" });
  }

  try {
    const [result] = await db.query(
      "UPDATE KAYTTAJAT SET rooli = ? WHERE kayttaja_id = ?",
      [rooli, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Käyttäjää ei löydy" });
    }

    res.json({ message: "Rooli päivitetty", rooli });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Roolin päivitys epäonnistui" });
  }
});
// PUT /api/admin/menu/:id - Muokkaa tuotetta
router.put("/menu/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { nimi, kuvaus, hinta, kategoria, viikonpaiva, erityisruokavaliot } =
    req.body;

  try {
    await db.query(
      "UPDATE TUOTTEET SET nimi=?, kuvaus=?, hinta=?, kategoria=?, viikonpaiva=?, erityisruokavaliot=? WHERE tuote_id=?",
      [
        nimi,
        kuvaus || null,
        hinta,
        kategoria,
        viikonpaiva || null,
        erityisruokavaliot || null,
        id,
      ],
    );
    res.json({ message: "Tuote päivitetty" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Päivitys epäonnistui" });
  }
});

// DELETE /api/admin/menu/:id - Poista tuote
router.delete("/menu/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM TUOTTEET WHERE tuote_id = ?", [id]);
    res.json({ message: "Tuote poistettu" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Poisto epäonnistui" });
  }
});
router.get("/stats", verifyAdmin, async (req, res) => {
  try {
    const [[users]] = await db.query("SELECT COUNT(*) AS count FROM KAYTTAJAT");

    res.json({
      usersCount: users.count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Tilastojen haku epäonnistui" });
  }
});
export default router;
