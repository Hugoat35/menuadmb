// public/js/admin.js
document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('admin-login-section');
    const adminContentSection = document.getElementById('admin-content-section');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username'); // S'assurer que cet ID existe dans admin.html
    const passwordInput = document.getElementById('password'); // S'assurer que cet ID existe dans admin.html
    const loginErrorMessage = document.getElementById('login-error-message');
    const logoutButton = document.getElementById('logout-button');

    // --- Éléments du DOM pour les catégories et plats ---
    const categoryForm = document.getElementById('category-form');
    const categoryIdInput = document.getElementById('categoryId');
    const categoryNameInput = document.getElementById('categoryName');
    const categoryDescriptionInput = document.getElementById('categoryDescription');
    const categoryTypeInput = document.getElementById('categoryType');
    const categoryOrderInput = document.getElementById('categoryOrder');
    const categoriesList = document.getElementById('categories-list');
    const clearCategoryFormButton = document.getElementById('clearCategoryForm');

    const dishForm = document.getElementById('dish-form');
    const dishIdInput = document.getElementById('dishId');
    const dishNameInput = document.getElementById('dishName');
    const dishDescriptionInput = document.getElementById('dishDescription');
    const dishPriceInput = document.getElementById('dishPrice');
    const dishCategorySelect = document.getElementById('dishCategory');
    const dishImageUrlInput = document.getElementById('dishImageUrl');
    const dishOrderInput = document.getElementById('dishOrder');
    const dishIsAvailableInput = document.getElementById('dishIsAvailable');
    const dishesList = document.getElementById('dishes-list');
    const clearDishFormButton = document.getElementById('clearDishForm');

    const API_BASE_URL = '/api/admin';

    // --- Fonctions d'affichage ---
    function showLogin() {
        if (loginSection) loginSection.style.display = 'block';
        if (adminContentSection) adminContentSection.style.display = 'none';
        if (loginErrorMessage) loginErrorMessage.style.display = 'none';
    }

    function showAdminContent() {
        if (loginSection) loginSection.style.display = 'none';
        if (adminContentSection) adminContentSection.style.display = 'block';
        // Charger les données admin une fois authentifié
        if (typeof loadCategories === 'function') loadCategories();
        if (typeof loadDishes === 'function') loadDishes();
    }

    // --- Vérification de l'état d'authentification au chargement ---
    async function checkAuthStatus() {
        try {
            const response = await fetch('/admin/auth-status');
            if (!response.ok) {
                console.error("Erreur réseau ou serveur lors de la vérification du statut d'authentification:", response.status, response.statusText);
                showLogin();
                return;
            }
            const data = await response.json();
            if (data.isAuthenticated) {
                showAdminContent();
            } else {
                showLogin();
            }
        } catch (error) {
            console.error("Erreur lors du fetch pour auth-status:", error);
            showLogin(); // En cas d'erreur (serveur inaccessible), afficher le login
        }
    }

    // --- Gestion de la Connexion ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (loginErrorMessage) loginErrorMessage.style.display = 'none';
            const username = usernameInput.value;
            const password = passwordInput.value;

            try {
                const response = await fetch('/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json();

                if (response.ok && data.success) {
                    showAdminContent();
                } else {
                    if (loginErrorMessage) {
                        loginErrorMessage.textContent = data.message || "Identifiants incorrects ou erreur serveur.";
                        loginErrorMessage.style.display = 'block';
                    } else {
                        alert(data.message || "Identifiants incorrects ou erreur serveur.");
                    }
                }
            } catch (error) {
                console.error("Erreur lors de la tentative de connexion:", error);
                if (loginErrorMessage) {
                    loginErrorMessage.textContent = "Erreur de communication avec le serveur.";
                    loginErrorMessage.style.display = 'block';
                } else {
                    alert("Erreur de communication avec le serveur.");
                }
            }
        });
    }

    // --- Gestion de la Déconnexion ---
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                const response = await fetch('/admin/logout');
                const data = await response.json();
                if (response.ok && data.success) {
                    checkAuthStatus(); // Re-vérifier (devrait montrer le login)
                } else {
                    alert(data.message || "Erreur lors de la déconnexion.");
                }
            } catch (error) {
                console.error("Erreur lors de la déconnexion:", error);
                alert("Erreur de communication pour la déconnexion.");
            }
        });
    }

    // --- Gestion des Catégories ---
    async function loadCategories() {
        try {
            const response = await fetch(`${API_BASE_URL}/categories`);
            if (!response.ok) { // Gérer le cas où la session a expiré ou l'accès est refusé
                 if(response.status === 401) {
                    checkAuthStatus(); // Redirige vers le login si non autorisé
                    return;
                 }
                 throw new Error(`Erreur HTTP: ${response.status}`);
            }
            const categories = await response.json();
            
            if (categoriesList) categoriesList.innerHTML = '';
            if (dishCategorySelect) dishCategorySelect.innerHTML = '<option value="">-- Choisir une catégorie --</option>';

            categories.forEach(cat => {
                if (categoriesList) {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${cat.name} (${cat.type === 'drink' ? 'Boisson' : 'Nourriture'}) - Ordre: ${cat.displayOrder || 0}</span>
                        <div>
                            <button class="edit-cat" data-id="${cat.id}">Modifier</button>
                            <button class="delete-cat" data-id="${cat.id}">Supprimer</button>
                        </div>
                    `;
                    categoriesList.appendChild(li);
                }
                if (dishCategorySelect) {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = `${cat.name} (${cat.type === 'drink' ? 'Boisson' : 'Nourriture'})`;
                    dishCategorySelect.appendChild(option);
                }
            });
        } catch (error) {
            console.error("Erreur chargement catégories:", error);
            // Ne pas afficher d'alerte ici si c'est juste un problème d'auth géré par checkAuthStatus
            if (categoriesList && error.message.includes("Failed to fetch")) { // Exemple de gestion d'erreur réseau
                 categoriesList.innerHTML = '<li>Erreur de connexion au serveur pour charger les catégories.</li>';
            } else if (categoriesList) {
                 // categoriesList.innerHTML = '<li>Erreur de chargement des catégories.</li>';
            }
        }
    }

    if (categoryForm) {
        categoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = categoryIdInput.value;
            const categoryData = {
                name: categoryNameInput.value,
                description: categoryDescriptionInput.value,
                type: categoryTypeInput.value,
                displayOrder: parseInt(categoryOrderInput.value) || 0
            };

            // console.log("Données de catégorie à envoyer (frontend):", categoryData); // Log de debug
            // console.log("Type sélectionné dans le formulaire (frontend):", categoryTypeInput.value); // Log de debug

            if (!categoryData.name || !categoryData.type) {
                alert("Le nom et le type de la catégorie sont requis.");
                return;
            }
            
            try {
                const method = id ? 'PUT' : 'POST';
                const url = id ? `${API_BASE_URL}/categories/${id}` : `${API_BASE_URL}/categories`;
                
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(categoryData)
                });

                if (!response.ok) {
                    if(response.status === 401) { checkAuthStatus(); return; }
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Erreur ${response.status}`);
                }
                
                alert(`Catégorie ${id ? 'mise à jour' : 'ajoutée'} !`);
                clearCategoryForm();
                loadCategories(); 
                loadDishes(); 
            } catch (error) {
                console.error("Erreur sauvegarde catégorie:", error);
                alert("Erreur: " + error.message);
            }
        });
    }

    if (categoriesList) {
        categoriesList.addEventListener('click', async (e) => {
            const target = e.target;
            const id = target.dataset.id;

            if (target.classList.contains('edit-cat')) {
                try {
                    const catResponse = await fetch(`${API_BASE_URL}/categories`);
                    if (!catResponse.ok) {
                        if(catResponse.status === 401) { checkAuthStatus(); return; }
                        throw new Error(`Erreur HTTP: ${catResponse.status}`);
                    }
                    const categories = await catResponse.json();
                    const catToEdit = categories.find(c => c.id == id);

                    if (catToEdit) {
                        categoryIdInput.value = catToEdit.id;
                        categoryNameInput.value = catToEdit.name;
                        categoryDescriptionInput.value = catToEdit.description || '';
                        categoryTypeInput.value = catToEdit.type;
                        categoryOrderInput.value = catToEdit.displayOrder || 0;
                    } else {
                        alert("Catégorie non trouvée pour modification.");
                    }
                } catch (error) {
                    alert("Erreur pour charger la catégorie à modifier: " + error.message);
                }
            } else if (target.classList.contains('delete-cat')) {
                if (confirm("Voulez-vous vraiment supprimer cette catégorie ? Cela supprimera aussi les plats associés !")) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/categories/${id}`, { method: 'DELETE' });
                        if (!response.ok) {
                            if(response.status === 401) { checkAuthStatus(); return; }
                            const errorData = await response.json();
                            throw new Error(errorData.error || `Erreur ${response.status}`);
                        }
                        alert("Catégorie supprimée !");
                        loadCategories(); 
                        loadDishes(); 
                    } catch (error) {
                        console.error("Erreur suppression catégorie:", error);
                        alert("Erreur: " + error.message);
                    }
                }
            }
        });
    }
    
    function clearCategoryForm() {
        if(categoryForm) categoryForm.reset();
        if(categoryIdInput) categoryIdInput.value = '';
        if(categoryTypeInput) categoryTypeInput.value = 'food';
    }
    if (clearCategoryFormButton) clearCategoryFormButton.addEventListener('click', clearCategoryForm);

    // --- Gestion des Plats ---
    async function loadDishes() {
        try {
            const response = await fetch(`${API_BASE_URL}/dishes`);
            if (!response.ok) {
                if(response.status === 401) { checkAuthStatus(); return; }
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            const dishes = await response.json();
            if(dishesList) dishesList.innerHTML = '';

            dishes.forEach(dish => {
                if(dishesList) {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span style="flex-basis: 60%;">${dish.name} (${dish.categoryName || 'N/A'}) - ${parseFloat(dish.price).toFixed(2)}€ ${dish.isAvailable ? '' : '<em style=\"color:red;\">(Non dispo.)</em>'} (Ordre: ${dish.displayOrder || 0})</span>
                        <div>
                            <button class="edit-dish" data-id="${dish.id}">Modifier</button>
                            <button class="delete-dish" data-id="${dish.id}">Supprimer</button>
                        </div>
                    `;
                    dishesList.appendChild(li);
                }
            });
        } catch (error) {
            console.error("Erreur chargement plats:", error);
            if (dishesList && error.message.includes("Failed to fetch")) {
                 dishesList.innerHTML = '<li>Erreur de connexion au serveur pour charger les plats.</li>';
            } else if (dishesList) {
                // dishesList.innerHTML = '<li>Erreur de chargement des plats.</li>';
            }
        }
    }

    if (dishForm) {
        dishForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = dishIdInput.value;
            const dishData = {
                name: dishNameInput.value,
                description: dishDescriptionInput.value,
                price: parseFloat(dishPriceInput.value),
                categoryId: parseInt(dishCategorySelect.value),
                imageUrl: dishImageUrlInput.value,
                isAvailable: dishIsAvailableInput.checked,
                displayOrder: parseInt(dishOrderInput.value) || 0
            };

            if (!dishData.name || isNaN(dishData.price) || isNaN(dishData.categoryId) || !dishData.categoryId) {
                alert("Nom, prix et catégorie sont requis et doivent être valides.");
                return;
            }
            
            try {
                const method = id ? 'PUT' : 'POST';
                const url = id ? `${API_BASE_URL}/dishes/${id}` : `${API_BASE_URL}/dishes`;
                
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dishData)
                });

                if (!response.ok) {
                    if(response.status === 401) { checkAuthStatus(); return; }
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Erreur ${response.status}`);
                }
                
                alert(`Plat ${id ? 'mis à jour' : 'ajouté'} !`);
                clearDishForm();
                loadDishes();
            } catch (error) {
                console.error("Erreur sauvegarde plat:", error);
                alert("Erreur: " + error.message);
            }
        });
    }

    if (dishesList) {
        dishesList.addEventListener('click', async (e) => {
            const target = e.target;
            const id = target.dataset.id;

            if (target.classList.contains('edit-dish')) {
                 try {
                    const dishResponse = await fetch(`${API_BASE_URL}/dishes`);
                    if (!dishResponse.ok) {
                        if(dishResponse.status === 401) { checkAuthStatus(); return; }
                        throw new Error(`Erreur HTTP: ${dishResponse.status}`);
                    }
                    const dishes = await dishResponse.json();
                    const dishToEdit = dishes.find(d => d.id == id);

                    if (dishToEdit) {
                        dishIdInput.value = dishToEdit.id;
                        dishNameInput.value = dishToEdit.name;
                        dishDescriptionInput.value = dishToEdit.description || '';
                        dishPriceInput.value = parseFloat(dishToEdit.price).toFixed(2);
                        dishCategorySelect.value = dishToEdit.categoryId;
                        dishImageUrlInput.value = dishToEdit.imageUrl || '';
                        dishIsAvailableInput.checked = dishToEdit.isAvailable;
                        dishOrderInput.value = dishToEdit.displayOrder || 0;
                    } else {
                         alert("Plat non trouvé pour modification.");
                    }
                } catch (error) {
                    alert("Erreur pour charger le plat à modifier: " + error.message);
                }
            } else if (target.classList.contains('delete-dish')) {
                if (confirm("Voulez-vous vraiment supprimer ce plat ?")) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/dishes/${id}`, { method: 'DELETE' });
                         if (!response.ok) {
                            if(response.status === 401) { checkAuthStatus(); return; }
                            const errorData = await response.json();
                            throw new Error(errorData.error || `Erreur ${response.status}`);
                        }
                        alert("Plat supprimé !");
                        loadDishes();
                    } catch (error) {
                        console.error("Erreur suppression plat:", error);
                        alert("Erreur: " + error.message);
                    }
                }
            }
        });
    }
    
    function clearDishForm() {
        if(dishForm) dishForm.reset();
        if(dishIdInput) dishIdInput.value = '';
        if(dishIsAvailableInput) dishIsAvailableInput.checked = true;
    }
    if (clearDishFormButton) clearDishFormButton.addEventListener('click', clearDishForm);

    // Initialisation : vérifier l'état d'authentification
    checkAuthStatus();
});