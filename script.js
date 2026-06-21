let tg; try { tg = window.Telegram.WebApp; tg.ready(); tg.expand(); } catch (e) { tg = { HapticFeedback: { impactOccurred: () => {} } }; }

let state = {
    attempts: 3,
    catches: [],
    bonuses: { mask: false, aqua: false, filter: false, fins: false },
    activeDebuffs: [], // Храним список активных дебафов
    weather: 'sunny'
};

const fishes = ["Палтус", "Палия", "Белый амур", "Щука", "Семга", "Солнечник", "Подкаменщик", "Сом", "Окунь"];
const trash = ["Старый башмак", "Спутанная леска", "Сломанный поплавок", "Ржавый крючок", "Половина блесны", "Размокший кусок бумаги"];

// Функция отображения всех активных дебафов
function updateDebuffsUI() {
    const el = document.getElementById('status-effects');
    el.innerHTML = state.activeDebuffs.map(d => `<div>${d}</div>`).join('');
}

function showModal() {
    const list = document.getElementById('modal-fish-list');
    list.innerHTML = '';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'fish-btn';
    cancelBtn.style.background = '#ffcccc';
    cancelBtn.innerText = "Ничего не удалять";
    cancelBtn.onclick = () => {
        document.getElementById('modal').classList.add('hidden');
        document.getElementById('action-btn').disabled = false;
    };
    list.appendChild(cancelBtn);

    state.catches.forEach((c, index) => {
        const btn = document.createElement('button');
        btn.className = 'fish-btn';
        btn.innerText = `Удалить: ${c.name} (${c.weight > 0 ? c.weight.toFixed(1)+' кг' : 'хлам'})`;
        btn.onclick = () => {
            state.catches.splice(index, 1);
            document.getElementById('modal').classList.add('hidden');
            document.getElementById('action-btn').disabled = false;
            updateUI();
        };
        list.appendChild(btn);
    });
    document.getElementById('modal').classList.remove('hidden');
}

function startFishing() {
    if (state.attempts <= 0) return;

    if (!(state.bonuses.filter && Math.random() < 0.3)) state.attempts--;

    let rand = Math.random();
    if (state.bonuses.mask) {
        catchFish(true);
        state.bonuses.mask = false;
    } else if (rand < 0.1) {
        handleBonus();
    } else if (rand < 0.4) {
        let item = trash[Math.floor(Math.random() * trash.length)];
        logCatch(item, 0, true);
        document.getElementById('message').innerText = `Поймал: ${item}`;
    } else {
        catchFish(false);
    }

    if (Math.random() < 0.25) triggerDebuff();

    updateUI();
    if (state.attempts === 0) endGame();
}

function catchFish(isLarge) {
    let fish = fishes[Math.floor(Math.random() * fishes.length)];
    // Учет дебафа РАКА
    let maxWeight = state.activeDebuffs.includes("Рак: крючок погнут (вес до 2.5кг)") ? 2.5 : 9.8;
    let weight = parseFloat((isLarge ? (6.5 + Math.random() * 3.4) : (0.1 + Math.random() * maxWeight)).toFixed(1));
    
    logCatch(fish, weight, false);
    document.getElementById('message').innerText = `Поймал: ${fish} (${weight.toFixed(1)} кг)`;
}

function triggerDebuff() {
    let type = Math.random();
    if (type < 0.33) {
        state.activeDebuffs.push("Рак: крючок погнут (вес до 2.5кг)");
    } else if (type < 0.66) {
        // Чайка: удаляет случайную рыбу из улова
        let fishesInCatch = state.catches.filter(c => !c.isTrash);
        if (fishesInCatch.length > 0) {
            let index = state.catches.indexOf(fishesInCatch[0]);
            state.catches.splice(index, 1);
            state.activeDebuffs.push("Чайка: стащила рыбу!");
            updateUI();
        }
    } else {
        state.activeDebuffs.push("Утка: распугала рыбу (только хлам)");
    }
    updateDebuffsUI();
}

// ... (остальные функции: handleBonus, logCatch, endGame, updateUI остаются прежними)
