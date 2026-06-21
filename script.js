let state = { attempts: 3, catches: [], activeDebuffs: [], weather: 'sunny' };
const fishes = ["Палтус", "Окунь", "Щука"];
const trash = ["Башмак", "Леска"];

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('action-btn');
    if (btn) {
        btn.addEventListener('click', startFishing);
        console.log("Кнопка успешно инициализирована");
    }
});

function startFishing() {
    if (state.attempts <= 0) return;
    
    state.attempts--;
    updateUI();
    
    // Логика рыбалки
    let name = fishes[Math.floor(Math.random() * fishes.length)];
    let weight = parseFloat((0.5 + Math.random() * 9).toFixed(1));
    
    // Утка-дебаф
    if (state.activeDebuffs.some(d => d.includes("Утка"))) {
        name = trash[Math.floor(Math.random() * trash.length)];
        weight = 0.2;
    }

    logCatch(name, weight, false);
}

function logCatch(name, weight, isTrash) {
    state.catches.push({name, weight, type: 'catch'});
    const li = document.createElement('li');
    li.innerText = `${name} ${weight} кг`;
    document.getElementById('history-list').appendChild(li);
}

function updateUI() {
    const score = document.getElementById('score');
    if (score) score.innerText = `Улов: ${state.catches.reduce((s, c) => s + c.weight, 0).toFixed(1)} кг | Попыток: ${state.attempts}`;
}
