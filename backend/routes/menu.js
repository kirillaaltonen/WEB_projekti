import express from "express";
import db from "../db.js";

const router = express.Router();

/**
 * GET /api/menu
 * Palauttaa kaikki tuotteet JSON-muodossa.
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM TUOTTEET ORDER BY kategoria");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Tietokantavirhe" });
  }
});

/**
 * GET /api/menu/lounas
 * Palauttaa lounaslistan ryhmiteltynä viikonpäivän mukaan.
 */
router.get("/lounas", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM TUOTTEET WHERE kategoria = 'lounas' ORDER BY viikonpaiva",
    );

    const lounaslista = {};

    rows.forEach((tuote) => {
      const paiva = tuote.viikonpaiva || "muu";
      if (!lounaslista[paiva]) {
        lounaslista[paiva] = [];
      }
      lounaslista[paiva].push(tuote);
    });

    res.json(lounaslista);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Tietokantavirhe" });
  }
});

export default router;
