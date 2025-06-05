// server.js
const express = require('express');
const cors = require('cors');
const db = require('./database.js');
const session = require('express-session'); // Ajout de express-session

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration des sessions
app.use(session({
    secret: 'CHANGE_THIS_TO_A_VERY_LONG_RANDOM_SECRET_STRING', // !!! CHANGEZ CECI !!!
    resave: false,
    saveUninitialized: false, 
    cookie: {
        secure: false, // Mettre à true si vous êtes en HTTPS pour la production
        httpOnly: true, 
        maxAge: 24 * 60 * 60 * 1000 // Durée de vie du cookie (ici, 1 jour)
    }
}));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Identifiants Admin (NE PAS FAIRE EN PRODUCTION - Utiliser des variables d'environnement et des mots de passe hashés)
const ADMIN_USERNAME = 'admin'; // Changez ceci
const ADMIN_PASSWORD = 'admbmenu35'; // Changez ceci et utilisez un vrai système en production

// --- Routes d'Authentification Admin ---
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    // console.log("Tentative de connexion admin avec:", username); 

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAdmin = true; 
        // console.log("Connexion admin réussie pour:", username);
        res.json({ success: true, message: "Connexion réussie." });
    } else {
        // console.log("Échec de la connexion admin pour:", username);
        res.status(401).json({ success: false, message: "Identifiants incorrects." });
    }
});

app.get('/admin/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Erreur lors de la déconnexion:", err);
            return res.status(500).json({ message: "Erreur lors de la déconnexion" });
        }
        // console.log("Admin déconnecté.");
        res.clearCookie('connect.sid'); 
        res.json({ success: true, message: "Déconnexion réussie." });
    });
});

app.get('/admin/auth-status', (req, res) => {
    if (req.session.isAdmin) {
        res.json({ isAuthenticated: true });
    } else {
        res.json({ isAuthenticated: false });
    }
});

// Middleware de protection des routes Admin
function requireAdminAuth(req, res, next) {
    if (req.session.isAdmin) {
        next(); 
    } else {
        // console.log("Accès non autorisé à une route admin API.");
        res.status(401).json({ error: "Accès non autorisé. Veuillez vous connecter." });
    }
}

// --- API Endpoints pour le Menu Client (inchangé) ---
app.get('/api/menu', (req, res) => {
    const sqlCategories = "SELECT * FROM categories ORDER BY displayOrder, name";
    db.all(sqlCategories, [], (err, categories) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        const sqlDishes = "SELECT * FROM dishes WHERE isAvailable = TRUE ORDER BY categoryId, displayOrder, name";
        db.all(sqlDishes, [], (err, dishes) => {
            if (err) {
                res.status(500).json({ "error": err.message });
                return;
            }
            const menu = categories.map(category => ({
                ...category,
                dishes: dishes.filter(dish => dish.categoryId === category.id)
            }));
            res.json({ menu });
        });
    });
});

// --- API Endpoints pour l'Administration (maintenant protégés) ---
// CATEGORIES
app.get('/api/admin/categories', requireAdminAuth, (req, res) => {
    db.all("SELECT * FROM categories ORDER BY displayOrder, name", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/admin/categories', requireAdminAuth, (req, res) => {
    const { name, description, displayOrder, type } = req.body;
    // console.log("Requête POST reçue pour /api/admin/categories (backend):", req.body); // Log de debug
    // console.log("Type reçu (backend - POST):", type); // Log de debug

    if (!name) return res.status(400).json({ error: "Le nom de la catégorie est requis." });
    if (!type || !['food', 'drink'].includes(type)) {
        return res.status(400).json({ error: "Le type de catégorie ('food' ou 'drink') est requis et doit être valide." });
    }
    const sql = "INSERT INTO categories (name, description, displayOrder, type) VALUES (?, ?, ?, ?)";
    db.run(sql, [name, description, displayOrder || 0, type], function(err) {
        if (err) {
            console.error("Erreur SQL INSERT catégorie (backend):", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, name, description, displayOrder, type });
    });
});

app.put('/api/admin/categories/:id', requireAdminAuth, (req, res) => {
    const { name, description, displayOrder, type } = req.body;
    // console.log(`Requête PUT reçue pour /api/admin/categories/${req.params.id} (backend):`, req.body); // Log de debug
    // console.log("Type reçu (backend - PUT):", type); // Log de debug

    if (!type || !['food', 'drink'].includes(type)) {
        return res.status(400).json({ error: "Le type de catégorie ('food' ou 'drink') doit être valide." });
    }
    const sql = "UPDATE categories SET name = ?, description = ?, displayOrder = ?, type = ? WHERE id = ?";
    db.run(sql, [name, description, displayOrder || 0, type, req.params.id], function(err) {
        if (err) {
            console.error(`Erreur SQL UPDATE catégorie ${req.params.id} (backend):`, err.message);
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) return res.status(404).json({ error: "Catégorie non trouvée."})
        res.json({ message: "Catégorie mise à jour", id: req.params.id, name, description, displayOrder, type });
    });
});

app.delete('/api/admin/categories/:id', requireAdminAuth, (req, res) => {
    db.run("DELETE FROM categories WHERE id = ?", req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Catégorie non trouvée."})
        res.json({ message: "Catégorie supprimée", changes: this.changes });
    });
});

// PLATS (DISHES)
app.get('/api/admin/dishes', requireAdminAuth, (req, res) => {
    db.all("SELECT d.*, c.name as categoryName FROM dishes d LEFT JOIN categories c ON d.categoryId = c.id ORDER BY d.categoryId, d.displayOrder, d.name", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/admin/dishes', requireAdminAuth, (req, res) => {
    const { name, description, price, categoryId, imageUrl, isAvailable, displayOrder } = req.body;
    if (!name || price === undefined || categoryId === undefined) {
        return res.status(400).json({ error: "Nom, prix et ID de catégorie sont requis." });
    }
    const sql = "INSERT INTO dishes (name, description, price, categoryId, imageUrl, isAvailable, displayOrder) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.run(sql, [name, description, parseFloat(price), parseInt(categoryId), imageUrl, isAvailable === undefined ? true : isAvailable, displayOrder || 0], function(err) {
        if (err) {
            console.error("Erreur SQL INSERT plat (backend):", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, name, description, price, categoryId, imageUrl, isAvailable, displayOrder });
    });
});

app.put('/api/admin/dishes/:id', requireAdminAuth, (req, res) => {
    const { name, description, price, categoryId, imageUrl, isAvailable, displayOrder } = req.body;
    const sql = `UPDATE dishes SET
                    name = ?, description = ?, price = ?, categoryId = ?,
                    imageUrl = ?, isAvailable = ?, displayOrder = ?
                 WHERE id = ?`;
    db.run(sql, [name, description, parseFloat(price), parseInt(categoryId), imageUrl, isAvailable === undefined ? true : isAvailable, displayOrder || 0, req.params.id], function(err) {
        if (err) {
            console.error(`Erreur SQL UPDATE plat ${req.params.id} (backend):`, err.message);
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) return res.status(404).json({ error: "Plat non trouvé."})
        res.json({ message: "Plat mis à jour", id: req.params.id, name, description, price, categoryId, imageUrl, isAvailable, displayOrder });
    });
});

app.delete('/api/admin/dishes/:id', requireAdminAuth, (req, res) => {
    db.run("DELETE FROM dishes WHERE id = ?", req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Plat non trouvé."})
        res.json({ message: "Plat supprimé", changes: this.changes });
    });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
    console.log(`Page de sélection : http://localhost:${PORT}/selection.html`);
    console.log(`Page admin (accès direct) : http://localhost:${PORT}/admin.html`);
});