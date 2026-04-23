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

// GET /api/admin/orders - Hae kaikki tilaukset
router.get("/orders", verifyAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT T.tilaus_id, T.tila, T.paivamaara, K.nimi as asiakas 
      FROM TILAUKSET T 
      JOIN KAYTTAJAT K ON T.kayttaja_id = K.kayttaja_id 
      ORDER BY T.paivamaara DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Tilausten haku epäonnistui" });
  }
});

// PUT /api/admin/orders/:id - Päivitä tilauksen tila (esim. 'valmis')
router.put("/orders/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { tila } = req.body; // Esim: { "tila": "valmistettu" }

  try {
    await db.query("UPDATE TILAUKSET SET tila = ? WHERE tilaus_id = ?", [
      tila,
      id,
    ]);
    res.json({ message: "Tilauksen tila päivitetty" });
  } catch (err) {
    res.status(500).json({ error: "Päivitys epäonnistui" });
  }
});

// --- RUOKALISTAN HALLINTA ---

// POST /api/admin/menu - Lisää uusi tuote
router.post("/menu", verifyAdmin, async (req, res) => {
  const { nimi, kuvaus, hinta, kategoria } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO TUOTTEET (nimi, kuvaus, hinta, kategoria) VALUES (?, ?, ?, ?)",
      [nimi, kuvaus, hinta, kategoria],
    );
    res
      .status(201)
      .json({ message: "Tuote lisätty", tuote_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: "Tuotteen lisäys epäonnistui" });
  }
});

// DELETE /api/admin/menu/:id - Poista tuote
router.delete("/menu/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM TUOTTEET WHERE tuote_id = ?", [id]);
    res.json({ message: "Tuote poistettu" });
  } catch (err) {
    res.status(500).json({ error: "Poisto epäonnistui" });
  }
});

export default router;
