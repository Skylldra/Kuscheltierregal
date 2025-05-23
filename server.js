const express = require("express");
const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

// 🧸 Kuscheltier-Konfiguration
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

// Image extensions to check
const IMAGE_EXTENSIONS = [".webp", ".jpg", ".jpeg", ".png"];

const TOTAL_PLUSHIES = Object.keys(plushies).length;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 📦 Statische Dateien
app.use("/plushie", express.static(path.join(__dirname, "plushie")));
app.use(express.static("."));

// 🔎 Verbesserte Route zum Erkennen des Dateityps
app.get("/get-image/:id/:type", (req, res) => {
  const { id, type } = req.params;
  const isBlurred = type === "blurred";
  
  // Mögliche Dateiformate prüfen
  for (const ext of IMAGE_EXTENSIONS) {
    // Verschiedene Dateimuster prüfen
    const filePatterns = [
      `${id}${isBlurred ? "_blurred" : ""}${ext}`,
      `${id.toLowerCase()}${isBlurred ? "_blurred" : ""}${ext}`
    ];
    
    for (const pattern of filePatterns) {
      const filePath = path.join(__dirname, "plushie", pattern);
      if (fs.existsSync(filePath)) {
        return res.json({ path: `/plushie/${pattern}` });
      }
    }
  }
  
  // Wenn nichts gefunden wurde, prüfe beide ID-Varianten ohne Blur-Suffix
  for (const ext of IMAGE_EXTENSIONS) {
    const normalPatterns = [
      `${id}${ext}`,
      `${id.toLowerCase()}${ext}`
    ];
    
    for (const pattern of normalPatterns) {
      const filePath = path.join(__dirname, "plushie", pattern);
      if (fs.existsSync(filePath)) {
        return res.json({ path: `/plushie/${pattern}` });
      }
    }
  }
  
  res.status(404).json({ error: "Bild nicht gefunden" });
});

// 🎁 Route zum Ziehen eines zufälligen Plüschtiers
app.get("/getrandom", async (req, res) => {
  const username = req.query.user;
  if (!username) return res.status(400).send("Bitte gib einen Benutzernamen an.");
  
  const plushieId = Math.floor(Math.random() * TOTAL_PLUSHIES) + 1;
  const plushieName = plushies[plushieId];
  
  try {
    await pool.query(
      "INSERT INTO plushie_collection (username, plushie, draw_date) VALUES ($1, $2, NOW())",
      [username, plushieId]
    );
    res.send(`🎁🧸 Du hast ${plushieName} gezogen!`);
  } catch (err) {
    console.error("Fehler beim Speichern:", err);
    res.status(500).send("Fehler beim Speichern.");
  }
});

// 📚 Route zur Anzeige der Sammlung eines Nutzers
app.get("/:username", async (req, res) => {
  const username = req.params.username;
  
  // Wenn der Browser HTML will → HTML-Seite ausliefern
  if (req.headers.accept && req.headers.accept.includes("text/html")) {
    res.sendFile(path.join(__dirname, "index.html"));
    return;
  }
  
  // Ansonsten → API-Antwort mit Sammlung im JSON-Format
  try {
    const result = await pool.query(
      "SELECT plushie, draw_date FROM plushie_collection WHERE LOWER(username) = LOWER($1)",
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
    console.error("Fehler beim Abrufen der Sammlung:", err);
    res.status(500).send("Fehler beim Abrufen der Sammlung.");
  }
});

// 🌐 Server starten
app.listen(port, () => {
  console.log(`Server läuft unter https://kuscheltierregal.onrender.com`);
});
