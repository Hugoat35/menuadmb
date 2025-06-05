// database.js
const { Pool } = require('pg'); // Utiliser le module pg

// La connexion se fera via une variable d'environnement DATABASE_URL fournie par Render
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false, // Nécessaire pour les connexions SSL sur Render
});

async function initializeDb() {
    const client = await pool.connect();
    try {
        console.log('Connecté à la base de données PostgreSQL.');

        // Table des Catégories
        // SERIAL PRIMARY KEY est l'équivalent PostgreSQL de INTEGER PRIMARY KEY AUTOINCREMENT
        // TEXT est compatible. CHECK contrainte est compatible. ON DELETE CASCADE est compatible.
        await client.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                displayOrder INTEGER DEFAULT 0,
                type TEXT DEFAULT 'food' NOT NULL CHECK(type IN ('food', 'drink'))
            );
        `);
        console.log("Table 'categories' PostgreSQL prête.");

        // Table des Plats (MenuItems)
        await client.query(`
            CREATE TABLE IF NOT EXISTS dishes (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                categoryId INTEGER,
                imageUrl TEXT,
                isAvailable BOOLEAN DEFAULT TRUE,
                displayOrder INTEGER DEFAULT 0,
                FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
            );
        `);
        console.log("Table 'dishes' PostgreSQL prête.");

    } catch (err) {
        console.error("Erreur lors de l'initialisation de la base de données PostgreSQL:", err.stack);
    } finally {
        client.release(); // Toujours relâcher le client vers le pool
    }
}

// Exporter le pool pour l'utiliser dans les requêtes, et la fonction d'initialisation
module.exports = {
    query: (text, params) => pool.query(text, params),
    initializeDb, // Exporter pour potentiellement l'appeler au démarrage du serveur si besoin
    pool // Exporter le pool directement si des transactions plus complexes sont nécessaires
};