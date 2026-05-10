// app.js - Main Application Logic

// ==========================================
// STATE MANAGEMENT
// ==========================================
const DEFAULT_STATE = {
    stats: { csBase: 10, csBonus: 0, epMax: 20, epCurrent: 20, gold: 0 },
    disciplines: [],
    inventory: { weapons: [], backpack: [], special: [] },
    journal: [],
    checkpoints: [],
    combat: { round: 0, log: [], active: false },
    disciplinesLocked: true
};

const WEAPONS_TABLE = ["Daga", "Lanza", "Maza", "Espada corta", "Martillo de guerra", "Espada", "Hacha", "Espada", "Estaca", "Espadón"];

let loboProfiles = JSON.parse(localStorage.getItem('loboProfiles')) || [];
let activeProfileId = null;
let gameState = null;
// Navigation Map removed for 550-section edition
let navigationMap = {};

function saveState() {
    if (activeProfileId !== null) {
        const profileIdx = loboProfiles.findIndex(p => p.id === activeProfileId);
        if (profileIdx > -1) {
            loboProfiles[profileIdx].state = JSON.parse(JSON.stringify(gameState));
        }
        localStorage.setItem('loboProfiles', JSON.stringify(loboProfiles));
    }
    updateUI();
}

function showMainMenu() {
    document.getElementById('main-menu').classList.remove('hidden');
    document.getElementById('app-container').classList.add('hidden');
    document.getElementById('wizard-modal').classList.add('hidden');
    document.getElementById('book-selection').classList.add('hidden');
    
    const list = document.getElementById('profiles-list');
    list.innerHTML = '';
    
    if (loboProfiles.length === 0) {
        list.innerHTML = '<p style="color: #666; font-style: italic;">No hay aventuras guardadas.</p>';
    } else {
        loboProfiles.forEach(prof => {
            const card = document.createElement('div');
            card.className = 'profile-card';
            card.innerHTML = `
                <div class="profile-info">
                    <h4>${prof.name}</h4>
                    <p>CS: ${prof.state.stats.csBase + prof.state.stats.csBonus} | EP: ${prof.state.stats.epCurrent}/${prof.state.stats.epMax} | Oro: ${prof.state.stats.gold}</p>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-play-profile"><i class="fa-solid fa-play"></i> Continuar</button>
                    <button class="btn-delete-profile" style="background: var(--danger); color: #fff; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;" title="Borrar partida"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            card.querySelector('.btn-play-profile').addEventListener('click', () => {
                loadProfile(prof.id);
            });
            card.querySelector('.btn-delete-profile').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`¿Borrar la partida de "${prof.name}"? Esta acción no se puede deshacer.`)) {
                    loboProfiles = loboProfiles.filter(p => p.id !== prof.id);
                    localStorage.setItem('loboProfiles', JSON.stringify(loboProfiles));
                    showMainMenu();
                }
            });
            list.appendChild(card);
        });
    }
}

function loadProfile(id) {
    const prof = loboProfiles.find(p => p.id === id);
    if(prof) {
        activeProfileId = prof.id;
        gameState = JSON.parse(JSON.stringify(prof.state));
        
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        
        document.querySelectorAll('.nav-links li').forEach(n => n.classList.remove('active'));
        document.querySelector('.nav-links li[data-tab="character"]').classList.add('active');
        document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
        document.getElementById('tab-character').classList.add('active');
        
        updateUI();
    }
}

document.getElementById('btn-back-menu').addEventListener('click', () => {
    showMainMenu();
});

// ==========================================
// BOOK SELECTION
// ==========================================
const BOOKS_KAI = [
    { id: 1, title: "Huida de la Oscuridad", icon: "fa-solid fa-moon-stars", available: true },
    { id: 2, title: "Fuego sobre el Agua", icon: "fa-solid fa-fire-glow", available: false },
    { id: 3, title: "Las Cavernas de Kalte", icon: "fa-solid fa-icicles", available: false },
    { id: 4, title: "El Abismo Maldito", icon: "fa-solid fa-skull", available: false },
    { id: 5, title: "El Desierto de las Sombras", icon: "fa-solid fa-sun", available: false }
];

const BOOKS_MAGNAKAI = [
    { id: 6, title: "La Piedra de la Ciencia", icon: "fa-solid fa-gem", available: false },
    { id: 7, title: "Muerte en el Castillo", icon: "fa-solid fa-fort-awesome", available: false },
    { id: 8, title: "La Jungla de los Horrores", icon: "fa-solid fa-tree", available: false },
    { id: 9, title: "El Caldero del Miedo", icon: "fa-solid fa-cauldron", available: false },
    { id: 10, title: "Las Mazmorras de Torgar", icon: "fa-solid fa-dungeon", available: false },
    { id: 11, title: "Prisioneros del Tiempo", icon: "fa-solid fa-hourglass", available: false },
    { id: 12, title: "Los Señores de la Oscuridad", icon: "fa-solid fa-dragon", available: false }
];

function showBookSelection() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('book-selection').classList.remove('hidden');
    
    renderBookGrid('grid-kai', BOOKS_KAI);
    renderBookGrid('grid-magnakai', BOOKS_MAGNAKAI);
}

document.getElementById('btn-menu-new').addEventListener('click', () => {
    showBookSelection();
});

function renderBookGrid(containerId, books) {
    const grid = document.getElementById(containerId);
    grid.innerHTML = '';
    
    books.forEach(book => {
        const card = document.createElement('div');
        card.className = `book-card ${book.available ? '' : 'locked'}`;
        card.innerHTML = `
            <i class="${book.icon}"></i>
            <h3>${book.title}</h3>
            ${book.available ? '' : '<div class="soon-badge">Próximamente</div>'}
        `;
        
        if (book.available) {
            card.addEventListener('click', () => {
                startWizard(book);
            });
        }
        
        grid.appendChild(card);
    });
}

document.getElementById('btn-cancel-book').addEventListener('click', () => {
    showMainMenu();
});
// ==========================================
// CHARACTER WIZARD (ONBOARDING)
// ==========================================
let wizTempState = {};

function startWizard(book) {
    wizTempState = { 
        csRoll: 0, 
        epRoll: 0, 
        disciplines: [], 
        gold: 0, 
        item: '', 
        creationMethod: 'random',
        bookId: book.id,
        currentStep: 1
    };
    
    // Reset inputs
    document.getElementById('wiz-input-name').value = '';
    document.getElementById('wiz-val-cs-total').textContent = '';
    document.getElementById('wiz-val-ep-total').textContent = '';
    document.getElementById('wiz-val-gold').textContent = '?';
    
    // Reset visibility
    document.getElementById('wiz-cs-result-anim').classList.add('hidden');
    document.getElementById('wiz-ep-result-anim').classList.add('hidden');
    document.getElementById('wiz-next-2').classList.add('hidden');
    document.getElementById('wiz-next-3').classList.add('hidden');
    document.getElementById('wiz-btn-cs-roll').classList.remove('hidden');
    document.getElementById('wiz-btn-ep-roll').classList.remove('hidden');
    document.getElementById('wiz-gold-area').classList.add('hidden');
    document.getElementById('btn-finish-wizard').classList.add('hidden');
    
    document.getElementById('book-selection').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    document.getElementById('wizard-modal').classList.remove('hidden');
    
    goToWizardStep(1);
    renderWizDisciplines();
}

function renderWizDisciplines() {
    const grid = document.getElementById('wiz-disciplines-grid');
    grid.innerHTML = '';
    
    ALL_DISCIPLINES.forEach(disc => {
        const card = document.createElement('div');
        card.className = 'wiz-disc-card';
        card.innerHTML = `
            <i class="${getDiscIcon(disc.name)}"></i>
            <div class="wiz-disc-card-info">
                <strong>${disc.name}</strong>
                <p>${disc.desc}</p>
            </div>
        `;
        
        card.addEventListener('click', () => {
            const idx = wizTempState.disciplines.indexOf(disc.name);
            if (idx > -1) {
                wizTempState.disciplines.splice(idx, 1);
                card.classList.remove('selected');
            } else if (wizTempState.disciplines.length < 5) {
                wizTempState.disciplines.push(disc.name);
                card.classList.add('selected');
            }
            
            document.getElementById('wiz-count-num').textContent = wizTempState.disciplines.length;
            document.getElementById('wiz-next-4').disabled = wizTempState.disciplines.length !== 5;
        });
        
        grid.appendChild(card);
    });
}

function getDiscIcon(name) {
    const icons = {
        "Camuflaje": "fa-solid fa-mask",
        "Caza": "fa-solid fa-wheat-awn",
        "Sexto sentido": "fa-solid fa-eye",
        "Rastreo": "fa-solid fa-route",
        "Curación": "fa-solid fa-heart-pulse",
        "Dominio en el manejo de armas": "fa-solid fa-khanda",
        "Defensa psíquica": "fa-solid fa-shield-halved",
        "Ataque psíquico": "fa-solid fa-brain",
        "Afinidad animal": "fa-solid fa-paw",
        "Poder mental sobre la materia": "fa-solid fa-wand-sparkles"
    };
    return icons[name] || "fa-solid fa-medal";
}

function goToWizardStep(step) {
    wizTempState.currentStep = step;
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
    document.getElementById(`wizard-step-${step}`).classList.add('active');
    
    // Step specific logic
    if (step === 2) {
        if (wizTempState.creationMethod === 'manual') {
            document.getElementById('wiz-cs-random-area').classList.add('hidden');
            document.getElementById('wiz-cs-manual-area').classList.remove('hidden');
            document.getElementById('wiz-next-2').classList.remove('hidden');
        } else {
            document.getElementById('wiz-cs-random-area').classList.remove('hidden');
            document.getElementById('wiz-cs-manual-area').classList.add('hidden');
        }
    }
    if (step === 3) {
        if (wizTempState.creationMethod === 'manual') {
            document.getElementById('wiz-ep-random-area').classList.add('hidden');
            document.getElementById('wiz-ep-manual-area').classList.remove('hidden');
            document.getElementById('wiz-next-3').classList.remove('hidden');
        } else {
            document.getElementById('wiz-ep-random-area').classList.remove('hidden');
            document.getElementById('wiz-ep-manual-area').classList.add('hidden');
        }
    }
    if (step === 5) {
        if (wizTempState.creationMethod === 'random') {
            document.getElementById('wiz-gold-area').classList.remove('hidden');
            document.getElementById('wiz-manual-inventory').classList.add('hidden');
            revealEquipment();
        } else {
            document.getElementById('wiz-gold-area').classList.add('hidden');
            document.getElementById('wiz-manual-inventory').classList.remove('hidden');
            document.getElementById('btn-finish-wizard').classList.remove('hidden');
        }
    }
}

async function revealEquipment() {
    const area = document.getElementById('wiz-equipment-reveal');
    area.innerHTML = '';
    
    const items = [
        { icon: 'fa-solid fa-axe', text: 'Comienzas con un HACHA (Arma)' },
        { icon: 'fa-solid fa-map', text: 'MAPA de Sommerlund (Objeto Especial)' },
        { icon: 'fa-solid fa-utensils', text: '1 COMIDA (Mochila)' }
    ];

    for (const item of items) {
        const div = document.createElement('div');
        div.className = 'reveal-item';
        div.innerHTML = `<i class="${item.icon}"></i> <span>${item.text}</span>`;
        area.appendChild(div);
        await new Promise(r => setTimeout(r, 100));
        div.classList.add('visible');
        await new Promise(r => setTimeout(r, 800));
    }
    
    // If weapon mastery
    if (wizTempState.disciplines.includes("Dominio en el manejo de armas")) {
        const roll = rollDice();
        wizTempState.weaponMastery = WEAPONS_TABLE[roll];
        const div = document.createElement('div');
        div.className = 'reveal-item';
        div.style.borderLeftColor = 'var(--success)';
        div.innerHTML = `<i class="fa-solid fa-star"></i> <span>Dominio en el manejo de armas: <strong>${wizTempState.weaponMastery}</strong></span>`;
        area.appendChild(div);
        await new Promise(r => setTimeout(r, 100));
        div.classList.add('visible');
    }
}

// Event Listeners for Wizard
document.getElementById('method-random').addEventListener('click', () => {
    wizTempState.creationMethod = 'random';
    document.getElementById('method-random').classList.add('active');
    document.getElementById('method-manual').classList.remove('active');
});

document.getElementById('method-manual').addEventListener('click', () => {
    wizTempState.creationMethod = 'manual';
    document.getElementById('method-random').classList.remove('active');
    document.getElementById('method-manual').classList.add('active');
});

document.getElementById('wiz-next-1').addEventListener('click', () => goToWizardStep(2));
document.getElementById('wiz-next-2').addEventListener('click', () => goToWizardStep(3));
document.getElementById('wiz-next-3').addEventListener('click', () => goToWizardStep(4));
document.getElementById('wiz-next-4').addEventListener('click', () => goToWizardStep(5));

document.getElementById('wiz-btn-cs-roll').addEventListener('click', () => {
    animatedRollDice('wiz-cs-dice', (result) => {
        wizTempState.csRoll = result;
        document.getElementById('wiz-val-cs-total').textContent = 10 + result;
        document.getElementById('wiz-cs-result-anim').classList.remove('hidden');
        document.getElementById('wiz-btn-cs-roll').classList.add('hidden');
        document.getElementById('wiz-next-2').classList.remove('hidden');
    });
});

document.getElementById('wiz-btn-ep-roll').addEventListener('click', () => {
    animatedRollDice('wiz-ep-dice', (result) => {
        wizTempState.epRoll = result;
        document.getElementById('wiz-val-ep-total').textContent = 20 + result;
        document.getElementById('wiz-ep-result-anim').classList.remove('hidden');
        document.getElementById('wiz-btn-ep-roll').classList.add('hidden');
        document.getElementById('wiz-next-3').classList.remove('hidden');
    });
});

document.getElementById('wiz-btn-gold-roll').addEventListener('click', () => {
    animatedRollDice('wiz-val-gold', (result) => {
        let gold = result;
        if (result === 0) gold = 10;
        wizTempState.gold = gold;
        document.getElementById('wiz-val-gold').textContent = gold;
        document.getElementById('wiz-btn-gold-roll').classList.add('hidden');
        document.getElementById('btn-finish-wizard').classList.remove('hidden');
    });
});

document.getElementById('btn-finish-wizard').addEventListener('click', () => {
    const charName = document.getElementById('wiz-input-name').value.trim() || "Lobo Solitario";
    gameState = JSON.parse(JSON.stringify(DEFAULT_STATE));

    if (wizTempState.creationMethod === 'random') {
        gameState.stats.csBase = 10 + wizTempState.csRoll;
        gameState.stats.epMax = 20 + wizTempState.epRoll;
        gameState.stats.epCurrent = gameState.stats.epMax;
        gameState.stats.gold = wizTempState.gold;
    } else {
        gameState.stats.csBase = parseInt(document.getElementById('wiz-manual-cs').value) || 10;
        gameState.stats.epMax = parseInt(document.getElementById('wiz-manual-ep').value) || 20;
        gameState.stats.epCurrent = gameState.stats.epMax;
        gameState.stats.gold = parseInt(document.getElementById('wiz-manual-gold').value) || 0;
        
        const manualItems = document.getElementById('wiz-manual-backpack').value.split(',').map(i => i.trim()).filter(i => i);
        manualItems.forEach(item => {
            if (gameState.inventory.backpack.length < 8) {
                gameState.inventory.backpack.push(item);
            }
        });
    }

    gameState.disciplines = wizTempState.disciplines;
    gameState.weaponMastery = wizTempState.weaponMastery;
    
    if (wizTempState.creationMethod === 'random' || gameState.inventory.backpack.length === 0) {
        gameState.inventory.weapons.push("Hacha");
        gameState.inventory.special.push("Mapa de Sommerlund");
        gameState.inventory.backpack.push("Comida");
    }

    const newProfile = {
        id: Date.now().toString(),
        name: charName,
        state: gameState
    };
    loboProfiles.push(newProfile);
    activeProfileId = newProfile.id;

    document.getElementById('wizard-modal').classList.add('hidden');
    saveState();
    addJournalEntry("Nueva aventura iniciada. ¡Buena suerte, " + charName + "!");
    document.getElementById('current-section-input').value = 1;
});

// ==========================================
// DICE ROLLER
// ==========================================
function rollDice() {
    // Lone Wolf random numbers are 0-9
    return Math.floor(Math.random() * 10);
}

function animatedRollDice(elementId, onComplete) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    el.classList.add('rolling');
    let rolls = 0;
    const maxRolls = 15;
    const interval = setInterval(() => {
        el.textContent = Math.floor(Math.random() * 10);
        rolls++;
        if (rolls >= maxRolls) {
            clearInterval(interval);
            el.classList.remove('rolling');
            const result = rollDice();
            el.textContent = result;
            if (onComplete) onComplete(result);
        }
    }, 60);
}

document.getElementById('btn-roll-dice').addEventListener('click', () => {
    const diceEl = document.getElementById('dice-result');
    diceEl.textContent = '-';
    animatedRollDice('dice-result');
});

// ==========================================
// TAB NAVIGATION
// ==========================================
document.querySelectorAll('.nav-links li').forEach(li => {
    li.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-links li').forEach(n => n.classList.remove('active'));
        li.classList.add('active');
        
        const tabId = li.getAttribute('data-tab');
        document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
        document.getElementById('tab-' + tabId).classList.add('active');
    });
});

// ==========================================
// CHARACTER SHEET
// ==========================================
const ALL_DISCIPLINES = [
    { name: "Camuflaje", desc: "Permite ocultarse y confundirse con el medio, o pasar por un nativo." },
    { name: "Caza", desc: "No necesitas raciones de comida en entornos salvajes." },
    { name: "Sexto sentido", desc: "Avisa de peligro inminente o revela las verdaderas intenciones." },
    { name: "Rastreo", desc: "Ayuda a elegir el sendero correcto y descifrar huellas." },
    { name: "Curación", desc: "Recuperas 1 punto de RESISTENCIA por cada sección sin combate." },
    { name: "Dominio en el manejo de armas", desc: "+2 a la DESTREZA EN EL COMBATE al usar un arma específica." },
    { name: "Defensa psíquica", desc: "Te inmuniza contra los ataques mentales enemigos." },
    { name: "Ataque psíquico", desc: "+2 a la DESTREZA EN EL COMBATE atacando con la mente." },
    { name: "Afinidad animal", desc: "Permite comunicarte con animales y adivinar sus intenciones." },
    { name: "Poder mental sobre la materia", desc: "Mueve pequeños objetos concentrando tu mente." }
];

function adjustStat(stat, amount) {
    if(stat === 'cs') {
        gameState.stats.csBase += amount;
    } else if(stat === 'ep') {
        gameState.stats.epCurrent += amount;
        if(gameState.stats.epCurrent > gameState.stats.epMax) gameState.stats.epCurrent = gameState.stats.epMax;
        if(gameState.stats.epCurrent < 0) gameState.stats.epCurrent = 0;
        
        checkHealthAlerts();
    }
    saveState();
}

function adjustGold(amount) {
    gameState.stats.gold += amount;
    if(gameState.stats.gold > 50) gameState.stats.gold = 50;
    if(gameState.stats.gold < 0) gameState.stats.gold = 0;
    saveState();
}

function toggleDiscipline(disc) {
    if (gameState.disciplinesLocked) {
        // Notification instead of simple alert
        addNotification({
            title: "Habilidad Bloqueada",
            body: "No puedes cambiar tus disciplinas durante la partida. Esto va contra las normas del Kai.",
            type: 'danger'
        });
        return;
    }

    const idx = gameState.disciplines.indexOf(disc);
    if(idx > -1) {
        gameState.disciplines.splice(idx, 1);
    } else {
        if(gameState.disciplines.length < 5) {
            gameState.disciplines.push(disc);
        } else {
            alert("Ya tienes 5 disciplinas seleccionadas.");
            return;
        }
    }
    recalculateBonuses();
    saveState();
}

document.getElementById('btn-unlock-disciplines').addEventListener('click', () => {
    if (confirm("¿Estás SEGURO de que quieres editar tus disciplinas? Esto va contra las normas del juego y solo debería usarse para corregir errores.")) {
        gameState.disciplinesLocked = false;
        updateUI(); // This will handle showing/hiding buttons
    }
});

document.getElementById('btn-lock-disciplines').addEventListener('click', () => {
    gameState.disciplinesLocked = true;
    saveState();
    updateUI();
    addNotification({
        title: "Cambios Guardados",
        body: "Tus disciplinas han sido actualizadas y bloqueadas de nuevo.",
        type: 'success'
    });
});

function recalculateBonuses() {
    let bonus = 0;
    // Regla oficial: -4 CS si no llevas ningún arma
    if (gameState.inventory.weapons.length === 0) {
        bonus -= 4;
    }
    if(gameState.disciplines.includes("Ataque psíquico")) bonus += 2;
    if(gameState.disciplines.includes("Dominio en el manejo de armas") && gameState.weaponMastery) {
        if(gameState.inventory.weapons.includes(gameState.weaponMastery)) {
            bonus += 2;
        }
    } 
    gameState.stats.csBonus = bonus;
}

function renderDisciplines() {
    const list = document.getElementById('disciplines-list');
    list.innerHTML = '';
    ALL_DISCIPLINES.forEach(disc => {
        const div = document.createElement('div');
        div.className = 'discipline-item' + 
                        (gameState.disciplines.includes(disc.name) ? ' selected' : '') +
                        (gameState.disciplinesLocked ? ' locked' : '');
        
        let title = disc.name;
        if(disc.name === "Dominio en el manejo de armas" && gameState.weaponMastery) {
            title += ` (${gameState.weaponMastery})`;
        }
        
        div.innerHTML = `
            <div>
                <strong>${title}</strong>
                <p class="disc-item-desc">${disc.desc}</p>
                ${gameState.disciplinesLocked ? '<div class="lock-overlay"><i class="fa-solid fa-lock"></i></div>' : ''}
            </div>
        `;
        div.onclick = () => toggleDiscipline(disc.name);
        list.appendChild(div);
    });
}

// ==========================================
// INVENTORY
// ==========================================
function addItem(category) {
    const input = document.getElementById(`input-${category}`);
    const val = input.value.trim();
    if(!val) return;

    if(category === 'backpack' && gameState.inventory.backpack.length >= 8) {
        alert("La mochila está llena (Máx 8 objetos).");
        return;
    }
    if(category === 'weapons' && gameState.inventory.weapons.length >= 2) {
        showInventoryFullAlert('weapons', val);
        return;
    }

    gameState.inventory[category].push(val);
    
    if (input.tagName === 'SELECT') {
        input.selectedIndex = 0;
    } else {
        input.value = '';
    }
    
    saveState();
}

function showInventoryFullAlert(category, newItem) {
    const catName = category === 'weapons' ? 'armero' : 'mochila';
    const limit = category === 'weapons' ? 2 : 8;
    
    addNotification({
        title: "¡Inventario Lleno!",
        body: `Tu ${catName} está llena (máx ${limit}). Elimina un objeto existente para añadir "${newItem}".`,
        type: 'danger',
        action: {
            text: "Ver Inventario",
            callback: () => {
                const invTab = document.querySelector('.nav-links li[data-tab="inventory"]');
                if (invTab) invTab.click();
            }
        }
    });
}

function removeItem(category, index) {
    gameState.inventory[category].splice(index, 1);
    saveState();
}

function renderInventory() {
    ['weapons', 'backpack', 'special'].forEach(cat => {
        const ul = document.getElementById(`inv-${cat}`);
        ul.innerHTML = '';
        gameState.inventory[cat].forEach((item, index) => {
            const li = document.createElement('li');
            
            let useBtn = '';
            let itemExtra = '';
            const itemName = item.toLowerCase();
            
            // Check for use actions
            if (itemName.includes('poción') || itemName.includes('pocion') || itemName.includes('laumspur')) {
                useBtn = `<button class="btn-use" style="background: var(--success); color: #fff; padding: 4px 8px; border-radius: 4px; border: none; cursor: pointer; margin-right: 5px;" onclick="useItem('${cat}', ${index})"><i class="fa-solid fa-flask"></i> Beber</button>`;
            } else if (itemName.includes('comida')) {
                useBtn = `<button class="btn-use" style="background: #a67c52; color: #fff; padding: 4px 8px; border-radius: 4px; border: none; cursor: pointer; margin-right: 5px;" onclick="useItem('${cat}', ${index})"><i class="fa-solid fa-utensils"></i> Comer</button>`;
            }
            
            // Visual numbers for weapons
            if (cat === 'weapons') {
                const mastery = gameState.disciplines.includes("Dominio en el manejo de armas") && gameState.weaponMastery && item.includes(gameState.weaponMastery);
                itemExtra = `<span class="weapon-stat" style="color: ${mastery ? 'var(--primary-color)' : '#888'}; margin-left: 10px; font-size: 0.8rem;">[${mastery ? '+2 CS' : '+0 CS'}]</span>`;
            }

            li.innerHTML = `<span>${item}${itemExtra}</span> <div>${useBtn}<button class="btn-delete" onclick="removeItem('${cat}', ${index})"><i class="fa-solid fa-trash"></i></button></div>`;
            ul.appendChild(li);
        });
    });
    document.getElementById('backpack-count').textContent = gameState.inventory.backpack.length;
}

function useItem(category, index) {
    const item = gameState.inventory[category][index].toLowerCase();
    
    if (item.includes('poción') || item.includes('pocion') || item.includes('laumspur')) {
        adjustStat('ep', 4);
        alert("Te bebes la poción. Recuperas 4 puntos de Resistencia.");
        addJournalEntry("Te has bebido una poción curativa (+4 EP).");
    } else if (item.includes('comida')) {
        alert("Te comes la ración de comida.");
        addJournalEntry("Te has comido una ración de comida.");
    }
    
    removeItem(category, index);
}

// ==========================================
// COMBAT ENGINE
// ==========================================
document.getElementById('btn-start-combat').addEventListener('click', () => {
    const name = document.getElementById('enemy-name').value || 'Enemigo';
    const ep = parseInt(document.getElementById('enemy-ep').value) || 20;
    
    // Clear previous combat state completely
    gameState.combat = {
        active: true,
        name: name,
        epTotal: ep,
        epCurrent: ep,
        log: [],
        round: 0
    };
    
    document.getElementById('combat-active').classList.remove('hidden');
    document.getElementById('combat-end-actions').classList.add('hidden');
    
    // Force UI to update immediately (clears old bars/log)
    renderCombatState();
    
    saveState();
    logCombat(`Combate iniciado contra ${name}.`);
});


document.getElementById('btn-combat-round').addEventListener('click', () => {
    if(!gameState.combat.active) return;
    if(gameState.combat.epCurrent <= 0 || gameState.stats.epCurrent <= 0) return;

    const btn = document.getElementById('btn-combat-round');
    btn.disabled = true;

    // Use a temporary dice in the combat area or just the sidebar one
    const diceEl = document.getElementById('dice-result');
    diceEl.textContent = '-';
    
    animatedRollDice('dice-result', (rand) => {
        const myCS = gameState.stats.csBase + gameState.stats.csBonus;
        const enemyCS = parseInt(document.getElementById('enemy-cs').value) || 10;
        
        let effectiveCS = myCS;
        const immune = document.getElementById('enemy-immune-mindblast').checked;
        if(immune && gameState.disciplines.includes("Ataque psíquico")) {
            effectiveCS -= 2; 
        }

        const ratio = effectiveCS - enemyCS;
        const result = resolveCombatRound(ratio, rand);
        
        gameState.combat.round++;
        let logStr = `<span class="log-round">Asalto ${gameState.combat.round}:</span> Tirada Suerte = <strong>${rand}</strong>. Ratio = ${ratio}. `;
        
        // Enemy damage
        if(result.e === "k") {
            gameState.combat.epCurrent = 0;
            logStr += `¡Muerte instantánea del enemigo! `;
        } else {
            gameState.combat.epCurrent -= result.e;
            if(gameState.combat.epCurrent < 0) gameState.combat.epCurrent = 0;
            logStr += `Enemigo pierde ${result.e} EP. `;
        }

        // LS damage
        if(result.ls === "k") {
            gameState.stats.epCurrent = 0;
            logStr += `<span class="log-death">¡Lobo Solitario ha muerto!</span>`;
        } else {
            gameState.stats.epCurrent -= result.ls;
            if(gameState.stats.epCurrent < 0) gameState.stats.epCurrent = 0;
            logStr += `Pierdes ${result.ls} EP.`;
        }

        logCombat(logStr);
        showCombatImpact(result.ls, result.e);

        if(gameState.combat.epCurrent === 0 && gameState.stats.epCurrent > 0) {
            logCombat(`<span class="log-victory">¡Has vencido a ${gameState.combat.name}!</span>`);
            gameState.combat.active = false;
            document.getElementById('combat-end-actions').classList.remove('hidden');
        } else if(gameState.stats.epCurrent === 0) {
            logCombat(`<span class="log-death">FIN DE LA AVENTURA.</span>`);
            gameState.combat.active = false;
            document.getElementById('combat-end-actions').classList.remove('hidden');
        }
        
        checkHealthAlerts();
        renderCombatState();
        saveState();
        btn.disabled = false;
    });
});

document.getElementById('btn-combat-flee').addEventListener('click', () => {
    if(confirm("¿Seguro que quieres eludir el combate? Recibirás el daño del último asalto (calculado automáticamente sin dañar al enemigo).")) {
        // Implement flee logic if needed, simplified to just ending combat
        logCombat(`Has eludido el combate.`);
        gameState.combat.active = false;
        document.getElementById('combat-end-actions').classList.remove('hidden');
        saveState();
    }
});

document.getElementById('btn-save-combat-journal').addEventListener('click', () => {
    if(!gameState || !gameState.combat) return;
    const msg = `Combate finalizado contra ${gameState.combat.name}. Asaltos: ${gameState.combat.round}. Resistencia restante: ${gameState.stats.epCurrent}/${gameState.stats.epMax}.`;
    addJournalEntry(msg);
    document.getElementById('combat-end-actions').classList.add('hidden');
    alert("Resultado del combate guardado en tu Diario.");
});

function logCombat(htmlMsg) {
    gameState.combat.log.push(htmlMsg);
    renderCombatLog();
}

function renderCombatLog() {
    const logEl = document.getElementById('combat-log');
    logEl.innerHTML = '';
    gameState.combat.log.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'log-entry';
        div.innerHTML = msg;
        logEl.appendChild(div);
    });
    logEl.scrollTop = logEl.scrollHeight;
}

function renderCombatState() {
    // Ratio
    const myCS = gameState.stats.csBase + gameState.stats.csBonus;
    const enemyCS = parseInt(document.getElementById('enemy-cs').value) || 10;
    
    let effectiveCS = myCS;
    const immune = document.getElementById('enemy-immune-mindblast').checked;
    if(immune && gameState.disciplines.includes("Ataque psíquico")) {
        effectiveCS -= 2; 
    }
    
    const ratio = effectiveCS - enemyCS;
    document.getElementById('combat-ratio').textContent = (ratio > 0 ? "+" : "") + ratio;
    document.getElementById('combat-ratio-details').textContent = `Tu CS (${effectiveCS}) - Enemigo CS (${enemyCS})`;

    if(gameState.combat.active || gameState.combat.log.length > 0) {
        document.getElementById('combat-active').classList.remove('hidden');
        document.getElementById('combat-enemy-name-display').textContent = gameState.combat.name || 'Enemigo';
        document.getElementById('combat-wolf-ep').textContent = gameState.stats.epCurrent;
        document.getElementById('combat-enemy-ep').textContent = gameState.combat.epCurrent;
        
        // Bars
        const wolfPct = (gameState.stats.epCurrent / gameState.stats.epMax) * 100;
        const enemyPct = (gameState.combat.epCurrent / gameState.combat.epTotal) * 100;
        
        document.getElementById('wolf-hp-bar').style.width = `${Math.max(0, wolfPct)}%`;
        document.getElementById('enemy-hp-bar').style.width = `${Math.max(0, enemyPct)}%`;
        
        renderCombatLog();
        
        document.getElementById('btn-combat-round').disabled = !gameState.combat.active;
        document.getElementById('btn-combat-flee').disabled = !gameState.combat.active;
    } else {
        document.getElementById('combat-active').classList.add('hidden');
    }
}

function showCombatImpact(lsDamage, enemyDamage) {
    const overlay = document.getElementById('combat-impact-overlay');
    const lsVal = document.getElementById('impact-val-ls');
    const enemyVal = document.getElementById('impact-val-enemy');
    
    lsVal.textContent = lsDamage === "k" ? "☠" : `-${lsDamage}`;
    enemyVal.textContent = enemyDamage === "k" ? "☠" : `-${enemyDamage}`;
    
    overlay.classList.remove('hidden');
    
    // Shake screen if LS takes significant damage
    if (lsDamage > 0 || lsDamage === "k") {
        document.getElementById('app-container').classList.add('shake');
        setTimeout(() => document.getElementById('app-container').classList.remove('shake'), 400);
    }
    
    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 1500);
}

// ==========================================
// JOURNAL & CHECKPOINTS
// ==========================================
function addJournalEntry(text) {
    if(!text.trim()) return;
    const entry = {
        time: new Date().toLocaleString(),
        text: text
    };
    gameState.journal.unshift(entry);
    saveState();
}

document.getElementById('btn-add-log').addEventListener('click', () => {
    const input = document.getElementById('input-log');
    addJournalEntry(input.value);
    input.value = '';
});

document.getElementById('btn-save-checkpoint').addEventListener('click', () => {
    const cpName = prompt("Nombre para este punto de guardado (Ej: Inicio Sección 14):");
    if(cpName) {
        const cpState = JSON.parse(JSON.stringify(gameState));
        cpState.checkpoints = []; // Don't nest checkpoints
        
        gameState.checkpoints.unshift({
            name: cpName,
            time: new Date().toLocaleString(),
            data: cpState
        });
        saveState();
        alert("Punto de guardado creado.");
    }
});

function loadCheckpoint(index) {
    if(confirm("¿Cargar este punto de guardado? Perderás el progreso actual no guardado.")) {
        const cp = gameState.checkpoints[index];
        const cps = gameState.checkpoints; // Keep all checkpoints
        gameState = JSON.parse(JSON.stringify(cp.data));
        gameState.checkpoints = cps;
        saveState();
        alert("Partida cargada.");
    }
}

function renderJournal() {
    const tl = document.getElementById('journal-timeline');
    tl.innerHTML = '';
    
    // First list checkpoints
    gameState.checkpoints.forEach((cp, idx) => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.style.borderColor = 'var(--success)';
        div.innerHTML = `
            <div class="timeline-time">${cp.time} - <strong>CHECKPOINT</strong></div>
            <p>${cp.name}</p>
            <button class="checkpoint-btn" onclick="loadCheckpoint(${idx})"><i class="fa-solid fa-rotate-left"></i> Cargar</button>
        `;
        tl.appendChild(div);
    });

    // Then logs
    gameState.journal.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.innerHTML = `
            <div class="timeline-time">${entry.time}</div>
            <p>${entry.text}</p>
        `;
        tl.appendChild(div);
    });
}

// ==========================================
// ASSISTANT (SEMANTIC SEARCH via Fuse.js)
// ==========================================
let fuse;
if(typeof RULES_DATA !== 'undefined' && typeof Fuse !== 'undefined') {
    fuse = new Fuse(RULES_DATA, {
        keys: ['title', 'content'],
        threshold: 0.4,
        ignoreLocation: true
    });
}

document.getElementById('input-search').addEventListener('input', (e) => {
    const q = e.target.value;
    const resEl = document.getElementById('search-results');
    resEl.innerHTML = '';
    
    if(!q || !fuse) return;
    
    const results = fuse.search(q);
    results.forEach(res => {
        const div = document.createElement('div');
        div.className = 'result-card';
        
        // Highlight snippet
        const content = res.item.content;
        const matchIdx = content.toLowerCase().indexOf(q.toLowerCase());
        let snippet = content;
        if(matchIdx > -1) {
            const start = Math.max(0, matchIdx - 50);
            const end = Math.min(content.length, matchIdx + 150);
            snippet = (start > 0 ? '...' : '') + content.substring(start, end) + '...';
            // highlight the word
            const regex = new RegExp(`(${q})`, 'gi');
            snippet = snippet.replace(regex, '<strong style="color:var(--primary-color)">$1</strong>');
        } else {
            snippet = content.substring(0, 150) + '...';
        }

        div.innerHTML = `<h3 class="result-title">${res.item.title}</h3><p>${snippet}</p>`;
        resEl.appendChild(div);
    });
});

// ==========================================
// UI UPDATER
// ==========================================
function updateUI() {
    if(!gameState) return;
    recalculateBonuses();
    
    // Populate weapons select if not done
    const wpSelect = document.getElementById('input-weapons');
    if (wpSelect && wpSelect.options.length === 0) {
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = '— Selecciona un arma —';
        placeholder.disabled = true;
        placeholder.selected = true;
        wpSelect.appendChild(placeholder);
        const uniqueWeapons = [...new Set(WEAPONS_TABLE)];
        uniqueWeapons.forEach(w => {
            const opt = document.createElement('option');
            opt.value = w;
            opt.textContent = w;
            wpSelect.appendChild(opt);
        });
    }
    
    const currentProfile = loboProfiles.find(p => p.id === activeProfileId);
    if (currentProfile) {
        document.getElementById('char-name-display').textContent = `Nombre: ${currentProfile.name}`;
    }
    
    document.getElementById('char-cs').textContent = gameState.stats.csBase + gameState.stats.csBonus;
    document.getElementById('char-cs-base').textContent = gameState.stats.csBase;
    document.getElementById('char-cs-bonus').textContent = gameState.stats.csBonus > 0 ? `(+${gameState.stats.csBonus} Disciplinas)` : gameState.stats.csBonus < 0 ? `(${gameState.stats.csBonus} Sin arma)` : '';
    
    document.getElementById('char-ep').textContent = gameState.stats.epCurrent;
    document.getElementById('char-ep-max').textContent = gameState.stats.epMax;
    document.getElementById('char-gold').textContent = gameState.stats.gold;
    
    // Update EP bar
    const epBar = document.getElementById('char-ep-bar');
    if (epBar) {
        const pct = (gameState.stats.epCurrent / gameState.stats.epMax) * 100;
        epBar.style.width = `${Math.max(0, pct)}%`;
        epBar.style.backgroundColor = pct < 25 ? 'var(--danger)' : pct < 50 ? 'orange' : 'var(--success)';
    }

    // Update Disciplines Lock UI
    const unlockBtn = document.getElementById('btn-unlock-disciplines');
    const lockBtn = document.getElementById('btn-lock-disciplines');
    const lockWarning = document.getElementById('lock-warning-text');
    
    if (gameState.disciplinesLocked) {
        if (unlockBtn) unlockBtn.classList.remove('hidden');
        if (lockBtn) lockBtn.classList.add('hidden');
        if (lockWarning) lockWarning.classList.add('hidden');
    } else {
        if (unlockBtn) unlockBtn.classList.add('hidden');
        if (lockBtn) lockBtn.classList.remove('hidden');
        if (lockWarning) lockWarning.classList.remove('hidden');
    }

    renderDisciplines();
    renderInventory();
    renderCombatState();
    renderJournal();
}

// ==========================================
// SMART SECTION & NOTIFICATIONS
// ==========================================
function selectChoice(target) {
    if (!target) return;
    const input = document.getElementById('current-section-input');
    input.value = target;
    markSectionAsRead();
}

function markSectionAsRead() {
    const input = document.getElementById('current-section-input');
    const sectionNum = input.value;
    const infoArea = document.getElementById('section-info');
    
    addJournalEntry(`Sección ${sectionNum} alcanzada.`);
    
    infoArea.innerHTML = `
        <div class="section-manual-panel">
            <span class="section-title-tag">Sección ${sectionNum}</span>
            <p class="placeholder-text">Estás leyendo la sección ${sectionNum} en tu libro físico.</p>
            
            <div class="manual-actions-grid">
                <button class="btn-secondary btn-sm" onclick="showManualCombat()"><i class="fa-solid fa-swords"></i> Iniciar Combate</button>
                <button class="btn-secondary btn-sm" onclick="showManualLoot()"><i class="fa-solid fa-gift"></i> Añadir Botín</button>
            </div>
        </div>
    `;
    
    updateMapPosition(sectionNum);
    
    // Disciplina de Curación: +1 EP por sección (manual)
    if (gameState.disciplines.includes("Curación")) {
        if (gameState.stats.epCurrent < gameState.stats.epMax) {
            gameState.stats.epCurrent += 1;
            saveState();
            addNotification({
                title: "Curación Kai",
                body: `Tu disciplina de Curación te restaura 1 punto de Resistencia. (EP: ${gameState.stats.epCurrent}/${gameState.stats.epMax})`,
                type: 'success'
            });
        }
    }
}

function showManualCombat() {
    const combatTab = document.querySelector('.nav-links li[data-tab="combat"]');
    if (combatTab) combatTab.click();
    addNotification({ title: "Motor de Combate", body: "Introduce los datos del enemigo de tu libro.", type: 'primary' });
}

function showManualLoot() {
    const invTab = document.querySelector('.nav-links li[data-tab="inventory"]');
    if (invTab) invTab.click();
    addNotification({ title: "Inventario", body: "Añade los objetos encontrados en esta sección.", type: 'primary' });
}

function autoAddItem(item) {
    const lowerItem = item.toLowerCase();
    
    // Special case: Gold Coronas
    if (lowerItem.includes('coronas de oro')) {
        // Try to extract number if present, e.g., "12 Coronas de oro"
        const goldMatch = item.match(/(\d+)/);
        const amount = goldMatch ? parseInt(goldMatch[1]) : 1; // Default to 1 if no number
        
        gameState.stats.gold = Math.min(50, gameState.stats.gold + amount);
        saveState();
        addNotification({ title: "Oro Recogido", body: `Has añadido ${amount} Coronas a tu bolsa. Total: ${gameState.stats.gold}`, type: 'success' });
        updateUI();
        return;
    }

    // Basic logic to determine category
    let category = 'backpack';
    if (lowerItem.includes('espada') || lowerItem.includes('hacha') || lowerItem.includes('maza') || lowerItem.includes('lanza') || lowerItem.includes('daga')) {
        category = 'weapons';
    } else if (lowerItem.includes('especial') || lowerItem.includes('gema') || lowerItem.includes('mapa') || lowerItem.includes('cota') || lowerItem.includes('casco')) {
        category = 'special';
    }

    if (category === 'backpack' && gameState.inventory.backpack.length >= 8) {
        showInventoryFullAlert('backpack', item);
        return;
    }
    if (category === 'weapons' && gameState.inventory.weapons.length >= 2) {
        showInventoryFullAlert('weapons', item);
        return;
    }

    gameState.inventory[category].push(item);
    saveState();
    addNotification({ title: "Objeto Añadido", body: `${item} se ha guardado en tu ${category}.`, type: 'success' });
    updateUI();
}

function prepareCombat(name, cs, ep) {
    // Reset combat state to neutral to clear previous fight UI immediately
    gameState.combat = {
        active: false,
        name: "",
        epTotal: 0,
        epCurrent: 0,
        log: [],
        round: 0
    };
    renderCombatState();

    document.getElementById('enemy-name').value = name;
    document.getElementById('enemy-cs').value = cs;
    document.getElementById('enemy-ep').value = ep;
    document.getElementById('enemy-immune-mindblast').checked = false;
    
    // Switch to combat tab
    const combatTab = document.querySelector('.nav-links li[data-tab="combat"]');
    if (combatTab) combatTab.click();
    
    addNotification({ title: "Preparado para el Combate", body: "Los datos del enemigo han sido pre-cargados.", type: 'success' });
}

function updateMapPosition(sectionNum) {
    const num = parseInt(sectionNum);
    let region = { name: "Ruta de la Aventura", x: 50, y: 50 };
    
    // Simplificamos las regiones para el mapa general
    if (num <= 100) region = { name: "Monasterio Kai y Alrededores", x: 15, y: 25 };
    else if (num <= 250) region = { name: "Tierras Salvajes de Sommerlund", x: 35, y: 40 };
    else if (num <= 400) region = { name: "Llanuras Centrales", x: 60, y: 55 };
    else region = { name: "Cerca de la Capital", x: 85, y: 80 };
    
    const regName = document.getElementById('map-region-name');
    if (regName) regName.textContent = `Región actual: ${region.name}`;
    
    const marker = document.getElementById('map-marker');
    if (marker) {
        marker.style.left = `${region.x}%`;
        marker.style.top = `${region.y}%`;
    }
}

function addNotification({ title, body, type = 'primary', action = null }) {
    const container = document.getElementById('notification-container');
    const balloon = document.createElement('div');
    balloon.className = `notification-balloon ${type === 'danger' ? 'danger' : ''}`;
    
    let actionBtn = '';
    if (action) {
        const btnId = 'btn-notify-' + Date.now();
        actionBtn = `<button id="${btnId}" class="btn-primary" style="padding: 5px 12px; font-size: 0.85rem;">${action.text}</button>`;
        setTimeout(() => {
            const btn = document.getElementById(btnId);
            if (btn) btn.addEventListener('click', () => {
                action.callback();
                balloon.classList.add('fade-out');
                setTimeout(() => balloon.remove(), 500);
            });
        }, 10);
    }

    balloon.innerHTML = `
        <div class="notification-header">
            <i class="fa-solid ${type === 'danger' ? 'fa-triangle-exclamation' : 'fa-circle-info'}"></i>
            <span>${title}</span>
        </div>
        <div class="notification-body">${body}</div>
        <div class="notification-footer">
            ${actionBtn}
            <button class="btn-secondary btn-close-notify" style="padding: 5px 12px; font-size: 0.85rem;">Cerrar</button>
        </div>
    `;

    container.appendChild(balloon);
    
    balloon.querySelector('.btn-close-notify').addEventListener('click', () => {
        balloon.classList.add('fade-out');
        setTimeout(() => balloon.remove(), 500);
    });

    // Auto remove after 10s if no action
    if (!action) {
        setTimeout(() => {
            if (balloon.parentElement) {
                balloon.classList.add('fade-out');
                setTimeout(() => balloon.remove(), 500);
            }
        }, 8000);
    }
}

function checkHealthAlerts() {
    if (!gameState) return;
    const threshold = gameState.stats.epMax / 2;
    if (gameState.stats.epCurrent < threshold && gameState.stats.epCurrent > 0) {
        // Find if user has a potion
        const hasPotionIdx = gameState.inventory.backpack.findIndex(i => i.toLowerCase().includes('poción') || i.toLowerCase().includes('laumspur'));
        
        if (hasPotionIdx > -1) {
            addNotification({
                title: "¡Resistencia Baja!",
                body: "Tu resistencia está por debajo de la mitad. Tienes una poción curativa, ¿quieres beberla ahora?",
                type: 'danger',
                action: {
                    text: "Beber Poción",
                    callback: () => useItem('backpack', hasPotionIdx)
                }
            });
        } else {
            addNotification({
                title: "¡Resistencia Baja!",
                body: "¡Cuidado! Tu salud está en niveles críticos. Busca comida o descanso.",
                type: 'danger'
            });
        }
    }
}

// Global Event Listeners
document.getElementById('enemy-cs').addEventListener('input', renderCombatState);
document.getElementById('enemy-immune-mindblast').addEventListener('change', renderCombatState);
document.getElementById('btn-section-read').addEventListener('click', markSectionAsRead);

document.getElementById('btn-finish-adventure').addEventListener('click', () => {
    if (!confirm("¿Deseas concluir tu crónica actual? Se generará un resumen de tu viaje y se guardará como un hito en tu diario.")) return;
    
    const journalCount = gameState.journal.length;
    const combatCount = gameState.journal.filter(j => j.text.includes("Combate finalizado")).length;
    const goldFound = gameState.stats.gold;
    
    const summary = `
        <h3>📜 Crónica de Lobo Solitario</h3>
        <p>Tu viaje ha sido documentado en los anales del Monasterio Kai.</p>
        <ul style="text-align: left; margin: 20px 0; list-style: none; padding: 0;">
            <li style="margin-bottom: 10px;"><i class="fa-solid fa-feather" style="color: var(--primary-color)"></i> <strong>Hitos alcanzados:</strong> ${journalCount}</li>
            <li style="margin-bottom: 10px;"><i class="fa-solid fa-swords" style="color: var(--primary-color)"></i> <strong>Combates superados:</strong> ${combatCount}</li>
            <li style="margin-bottom: 10px;"><i class="fa-solid fa-coins" style="color: var(--primary-color)"></i> <strong>Riqueza acumulada:</strong> ${goldFound} Coronas</li>
            <li style="margin-bottom: 10px;"><i class="fa-solid fa-medal" style="color: var(--primary-color)"></i> <strong>Disciplinas maestreadas:</strong> ${gameState.disciplines.length}</li>
        </ul>
        <p style="font-style: italic; color: var(--text-muted);">"Que el espíritu de tus ancestros guíe tu siguiente paso."</p>
    `;
    
    addNotification({
        title: "Crónica Finalizada",
        body: "Has concluido tu aventura. El resumen se ha añadido permanentemente a tu diario.",
        type: 'success'
    });
    
    addJournalEntry(summary);
});

// Init
showMainMenu();
// Remove old loboState if present to avoid confusion
localStorage.removeItem('loboState');

// ==========================================
// CLOUD SYNC UI LOGIC
// ==========================================
document.getElementById('btn-menu-sync').addEventListener('click', () => {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('sync-modal').classList.remove('hidden');
    renderSyncUploadList();
});

document.getElementById('btn-close-sync').addEventListener('click', () => {
    document.getElementById('sync-modal').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    showMainMenu(); // Refresh main list
});

function renderSyncUploadList() {
    const list = document.getElementById('sync-upload-list');
    list.innerHTML = '';
    
    if (loboProfiles.length === 0) {
        list.innerHTML = '<p style="color: #666; font-style: italic; font-size: 0.8rem;">No hay partidas para subir.</p>';
        return;
    }
    
    loboProfiles.forEach(prof => {
        const item = document.createElement('div');
        item.className = 'profile-card';
        item.style.padding = '10px';
        item.style.marginBottom = '8px';
        item.innerHTML = `
            <div style="flex-grow: 1;">
                <h4 style="margin: 0; font-size: 0.9rem;">${prof.name}</h4>
                <p style="margin: 0; font-size: 0.75rem; color: #888;">${prof.state.disciplines.length} Disciplinas</p>
            </div>
            <button class="btn-primary btn-sm" style="padding: 5px 10px;"><i class="fa-solid fa-cloud-arrow-up"></i> Subir</button>
        `;
        
        item.querySelector('button').addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            
            try {
                const code = await uploadToCloud(prof);
                addNotification({
                    title: "Partida en la Nube!",
                    body: `Tu código de sincronización es: ${code}. Úsalo en otro dispositivo para bajar la partida.`,
                    type: 'success'
                });
                alert(`TU CÓDIGO DE SINCRONIZACIÓN:\n\n${code}\n\nAnótalo o cópialo.`);
            } catch (err) {
                console.error(err);
                alert("Error al subir a la nube. Revisa tu conexión.");
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Subir';
            }
        });
        list.appendChild(item);
    });
}

document.getElementById('btn-cloud-download').addEventListener('click', async () => {
    const input = document.getElementById('sync-code-input');
    const code = input.value.trim().toUpperCase();
    
    if (!code.startsWith('LOBO-')) {
        alert("El código debe empezar por LOBO-");
        return;
    }
    
    const btn = document.getElementById('btn-cloud-download');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    
    try {
        const downloadedProfile = await downloadFromCloud(code);
        if (downloadedProfile) {
            const exists = loboProfiles.some(p => p.id === downloadedProfile.id);
            if (exists) {
                if (!confirm("Ya tienes una partida con el mismo ID. ¿Deseas sobreescribirla?")) {
                    btn.disabled = false;
                    btn.innerHTML = 'Bajar';
                    return;
                }
                loboProfiles = loboProfiles.filter(p => p.id !== downloadedProfile.id);
            }
            
            loboProfiles.push(downloadedProfile);
            localStorage.setItem('loboProfiles', JSON.stringify(loboProfiles));
            
            addNotification({
                title: "Sincronización Éxito!",
                body: `La partida de "${downloadedProfile.name}" ha sido descargada.`,
                type: 'success'
            });
            input.value = '';
            document.getElementById('btn-close-sync').click();
        } else {
            alert("Código no encontrado o caducado.");
        }
    } catch (err) {
        console.error(err);
        alert("Error al descargar. Revisa el código o tu conexión.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Bajar';
    }
});

document.getElementById('btn-sync-current-cloud').addEventListener('click', async (e) => {
    if (!activeProfileId || !gameState) return;
    
    const btn = e.currentTarget;
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ...';
    
    try {
        const profileToUpload = {
            id: activeProfileId,
            name: document.getElementById('char-name-display').textContent.replace('Nombre: ', '') || 'Lobo Solitario',
            state: gameState
        };
        
        const code = await uploadToCloud(profileToUpload);
        alert(`PARTIDA SINCRONIZADA\n\nCdigo: ${code}\n\nUsa este cdigo en otro dispositivo para continuar tu aventura.`);
    } catch (err) {
        console.error(err);
        alert("Error al sincronizar con la nube.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
});
