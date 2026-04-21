const express = require("express");
const router = express.Router();
const db = require("../db");

/**
 * @api {get} /api/menu Hae koko ruokalista
 * @apiDescription Palauttaa kaikki tuotteet JSON-muodossa kategorioittain
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM tuotteet ORDER BY kategoria");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Tietokantavirhe" });
  }
});

/**
 * @api {get} /api/menu/lounas Hae lounastaulukko viikonpäivittäin
 * @apiDescription Palauttaa lounaslistan ryhmiteltynä viikonpäivän mukaan
 */
router.get("/lounas", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM tuotteet WHERE kategoria = 'lounas' ORDER BY viikonpaiva",
    );

    // Ryhmitellään viikonpäivän mukaan
    const lounaslista = {};
    rows.forEach((tuote) => {
      const paiva = tuote.viikonpaiva;
      if (!lounaslista[paiva]) {
        lounaslista[paiva] = [];
      }
      lounaslista[paiva].push(tuote);
    });

    res.json(lounaslista);
  } catch (err) {
    res.status(500).json({ error: "Tietokantavirhe" });
  }
});

module.exports = router;
