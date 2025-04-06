const express = require("express");
const { Pool } = require("pg");
const path = require("path");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Kuscheltier-Konfiguration
const plushies = {
  1: "Pilz-Plushie",
  2: "Bärchen-Plushie",
  3: "Fuchs-Plushie",
  4: "Dino-Plushie",
  5: "Katzen-Plushie",
  6: "Hund-Plushie",
  7: "Pinguin-Plushie",
  8: "Panda-Plushie",
  9: "Einhorn-Plushie",
  10: "Kuh-Plushie",
  11: "Koala-Plushie",
  12: "Frosch-Plushie"
};

const TOTAL_PLUSHIES = Object.keys(plushies).length;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.static("plushie"));
app.use(express.static("."));

// 👉 Route zum Ziehen eines zufälligen Plüschtiers
app.get("/getrandom", async (req, res) => {
  const username = req.query.user;
  if (!username) return res.status(400).send("Bitte gib einen Benutzernamen an.");

  const plushieId = Math.floor(Math.random() * TOTAL_PLUSHIES) + 1;
  const plushieName = plushies[plushieId];

  try {
    await pool.query(
      "INSERT INTO plushie_collection (username, plushie) VALUES ($1, $2)",
      [username, plushieId]
    );
    res.send(`🎁🧸 Du hast ${plushieName} gezogen!`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Fehler beim Speichern.");
  }
});

// 👉 Route zur Anzeige der Sammlung eines Nutzers
app.get("/:username", async (req, res) => {
  const username = req.params.username;

  try {
    const result = await pool.query(
      "SELECT plushie, draw_date FROM plushie_collection WHERE LOWER(username) = LOWER($1)"
      [username]
    );
    const ownedMap = new Map();
result.rows.forEach(row => {
  ownedMap.set(parseInt(row.plushie), row.draw_date);
});
    const response = [];

    for (let i = 1; i <= TOTAL_PLUSHIES; i++) {
      response.push({
  id: i,
  name: plushies[i],
  owned: ownedMap.has(i),
  date: ownedMap.get(i) || null
});
    }

    res.json({ username, collection: response });
  } catch (err) {
    console.error(err);
    res.status(500).send("Fehler beim Abrufen der Sammlung.");
  }
});

app.listen(port, () => {
  console.log(`Server läuft unter https://kuscheltierregal.onrender.com`);
});
