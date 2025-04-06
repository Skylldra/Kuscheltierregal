const express = require("express");
const { Pool } = require("pg");
const path = require("path");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
const TOTAL_PLUSHIES = 12;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.static("plushie"));
app.use(express.static("."));

app.get("/getrandom", async (req, res) => {
  const username = req.query.user;
  if (!username) return res.status(400).send("Kein Nutzername angegeben.");

  const plushieNumber = Math.floor(Math.random() * TOTAL_PLUSHIES) + 1;

  try {
    await pool.query(
      "INSERT INTO plushie_collection (username, plushie) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [username, plushieNumber]
    );
    res.json({ user: username, plushie: plushieNumber });
  } catch (err) {
    console.error(err);
    res.status(500).send("Fehler beim Speichern.");
  }
});

app.get("/:username", async (req, res) => {
  const username = req.params.username;

  try {
    const result = await pool.query(
      "SELECT plushie FROM plushie_collection WHERE username = $1",
      [username]
    );
    const owned = result.rows.map(row => row.plushie.toString());
    res.json({ owned, total: TOTAL_PLUSHIES });
  } catch (err) {
    console.error(err);
    res.status(500).send("Fehler beim Abrufen der Sammlung.");
  }
});

app.listen(port, () => {
  console.log(`Server läuft auf Port ${port}`);
});
