import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { nimi, sahkoposti, salasana, opiskelijanumero } = req.body;
  if (!nimi || !sahkoposti || !salasana) {
    return res
      .status(400)
      .json({ error: "Nimi, sähköposti ja salasana ovat pakollisia" });
  }

  try {
    const saltRounds = 10;
    const salasanaHash = await bcrypt.hash(salasana, saltRounds);
    const [result] = await db.query(
      "INSERT INTO KAYTTAJAT (nimi, sahkoposti, salasana, opiskelijanumero) VALUES (?, ?, ?, ?)",
      [nimi, sahkoposti, salasanaHash, opiskelijanumero || null],
    );
    res.status(201).json({
      message: "Käyttäjä luotu onnistuneesti!",
      kayttaja_id: result.insertId,
    });
  } catch (error) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ error: "Sähköposti tai opiskelijanumero on jo käytössä" });
    }
    res.status(500).json({ error: "Palvelinvirhe rekisteröinnissä" });
  }
});

router.post("/login", async (req, res) => {
  const { sahkoposti, salasana } = req.body;
  try {
    const [rows] = await db.query(
      "SELECT * FROM KAYTTAJAT WHERE sahkoposti = ?",
      [sahkoposti],
    );
    const kayttaja = rows[0];

    if (!kayttaja)
      return res.status(401).json({ error: "Väärä sähköposti tai salasana" });

    const salasanaOikein = await bcrypt.compare(salasana, kayttaja.salasana);
    if (!salasanaOikein)
      return res.status(401).json({ error: "Väärä sähköposti tai salasana" });

    const token = jwt.sign(
      { kayttaja_id: kayttaja.kayttaja_id, rooli: kayttaja.rooli },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      message: "Kirjautuminen onnistui",
      token,
      kayttaja: { nimi: kayttaja.nimi, rooli: kayttaja.rooli },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Palvelinvirhe kirjautumisessa" });
  }
});

export default router;
