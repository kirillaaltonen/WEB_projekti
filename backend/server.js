import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import ordersRoutes from "./routes/orders.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/orders", ordersRoutes);

const PORT = 3000;

app.post("/api/route", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.digitransit.fi/routing/v2/hsl/gtfs/v1",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "digitransit-subscription-key": process.env.HSL_API_KEY,
        },
        body: JSON.stringify(req.body),
      },
    );

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

import db from "./db.js";

app.get("/api/menu", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM TUOTTEET ORDER BY kategoria");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Tietokantavirhe" });
  }
});

app.get("/api/menu/lounas", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM TUOTTEET WHERE kategoria = 'lounas' ORDER BY viikonpaiva",
    );

    const lounaslista = {};
    rows.forEach((tuote) => {
      const paiva = tuote.viikonpaiva;
      if (!lounaslista[paiva]) lounaslista[paiva] = [];
      lounaslista[paiva].push(tuote);
    });

    res.json(lounaslista);
  } catch (err) {
    res.status(500).json({ error: "Tietokantavirhe" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
