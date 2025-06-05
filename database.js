// database.js
const sqlite3 = require('sqlite3').verbose();

// Crée ou ouvre la base de données dans un fichier 'restaurant.db'
const db = new sqlite3.Database('./restaurant.db', (err) => {
    if (err) {
        console.error("Erreur à l'ouverture de la BDD", err.message);
    } else {
        console.log('Connecté à la base de données SQLite.');
        initializeDb();
    }
});

function initializeDb() {
    db.serialize(() => {
        // Table des Catégories
        db.run(`CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            displayOrder INTEGER DEFAULT 0,
            type TEXT DEFAULT 'food' NOT NULL CHECK(type IN ('food', 'drink'))
        )`, (err) => {
            if (err) console.error("Erreur création table categories", err.message);
            else console.log("Table 'categories' prête.");
        });

        // Table des Plats (MenuItems)
        db.run(`CREATE TABLE IF NOT EXISTS dishes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            categoryId INTEGER,
            imageUrl TEXT,
            isAvailable BOOLEAN DEFAULT TRUE,
            displayOrder INTEGER DEFAULT 0,
            FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
        )`, (err) => {
            if (err) console.error("Erreur création table dishes", err.message);
            else console.log("Table 'dishes' prête.");
        });
    });
}

module.exports = db;