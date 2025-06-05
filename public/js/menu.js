// public/js/menu.js
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const menuType = urlParams.get('type');

    const menuTitleElement = document.getElementById('menu-title');
    if (menuTitleElement) {
        if (menuType === 'food') {
            menuTitleElement.textContent = 'Notre Nourriture';
            document.title = "Nourriture - Restaurant ADMB"; // Optionnel: changer le titre de l'onglet
        } else if (menuType === 'drink') {
            menuTitleElement.textContent = 'Nos Boissons';
            document.title = "Boissons - Restaurant ADMB"; // Optionnel
        } else {
            menuTitleElement.textContent = 'Notre Menu Complet'; // Si aucun type ou type invalide
            document.title = "Menu Complet - Restaurant ADMB"; // Optionnel
        }
    }
    fetchAndDisplayMenu(menuType);
});

async function fetchAndDisplayMenu(selectedType) {
    const menuContainer = document.getElementById('menu-container');
    menuContainer.innerHTML = '<p>Chargement du menu...</p>'; // Message pendant le chargement

    try {
        const response = await fetch('/api/menu');
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const data = await response.json();

        let categoriesToDisplay = data.menu;

        if (selectedType === 'food' || selectedType === 'drink') {
            categoriesToDisplay = data.menu.filter(category => category.type === selectedType);
        }
        // Si selectedType est null, undefined, ou une autre valeur, on affiche tout (categoriesToDisplay reste data.menu)

        if (categoriesToDisplay && categoriesToDisplay.length > 0) {
            menuContainer.innerHTML = '';

            categoriesToDisplay.forEach((category) => {
                if (category.dishes && category.dishes.length > 0) {
                    const categorySection = document.createElement('section');
                    categorySection.classList.add('category');

                    const categoryTitleH3 = document.createElement('h3'); // Renommé pour clarté

                    const titleTextSpan = document.createElement('span');
                    titleTextSpan.classList.add('category-title-text');
                    titleTextSpan.textContent = category.name;

                    const indicatorSpan = document.createElement('span');
                    indicatorSpan.classList.add('category-indicator');
                    indicatorSpan.textContent = '❯';

                    categoryTitleH3.appendChild(titleTextSpan);
                    categoryTitleH3.appendChild(indicatorSpan);
                    categorySection.appendChild(categoryTitleH3);

                    if (category.description) {
                        const categoryDescP = document.createElement('p');
                        categoryDescP.classList.add('category-description');
                        categoryDescP.textContent = category.description;
                        categorySection.appendChild(categoryDescP);
                    }

                    const dishesListUl = document.createElement('ul');
                    dishesListUl.classList.add('dishes-list');
                    // Les listes sont pliées par défaut grâce au CSS (max-height: 0)

                    category.dishes.forEach(dish => {
                        const dishItemLi = document.createElement('li');
                        dishItemLi.classList.add('dish-item');
                        dishItemLi.innerHTML = `
                            ${dish.imageUrl ? `<img src="${dish.imageUrl}" alt="${dish.name}" class="dish-image">` : ''}
                            <div class="dish-info">
                                <h4>${dish.name}</h4>
                                ${dish.description ? `<p class="dish-description">${dish.description}</p>` : ''}
                            </div>
                            <div class="dish-price">
                                ${parseFloat(dish.price).toFixed(2).replace('.', ',')} €
                            </div>
                        `;
                        dishesListUl.appendChild(dishItemLi);
                    });
                    categorySection.appendChild(dishesListUl);
                    menuContainer.appendChild(categorySection);

                    categoryTitleH3.addEventListener('click', () => {
                        dishesListUl.classList.toggle('expanded');
                        categoryTitleH3.classList.toggle('active');
                    });
                }
            });
        } else {
            if (selectedType === 'food' || selectedType === 'drink') {
                 menuContainer.innerHTML = `<p>Aucun élément à afficher pour cette sélection. Veuillez <a href="selection.html" style="color: #333; text-decoration: underline;">choisir une autre option</a> ou voir notre <a href="index.html" style="color: #333; text-decoration: underline;">menu complet</a>.</p>`;
            } else {
                menuContainer.innerHTML = '<p>Aucun plat disponible pour le moment. Veuillez <a href="selection.html" style="color: #333; text-decoration: underline;">visiter notre page de sélection</a>.</p>';
            }
        }
    } catch (error) {
        console.error("Impossible de charger le menu:", error);
        menuContainer.innerHTML = '<p>Erreur lors du chargement du menu. Veuillez réessayer plus tard.</p>';
    }
}