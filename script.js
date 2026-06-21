let tg; 
try { tg = window.Telegram.WebApp; tg.ready(); tg.expand(); } catch (e) { tg = { HapticFeedback: { impactOccurred: () => {} } }; }

let state = {
    attempts: 3,
    catches: [],
    bonuses: { mask: false, aqua: false, filter: false, fins: false },
    activeDebuffs: [],
    weather: 'sunny'
};

const fishes = ["Палтус", "Палия", "Белый амур", "Щука", "Семга", "Солнечник", "Подкаменщик", "Сом", "Окунь"];
const trash = ["Старый башмак", "Спутанная леска", "Сломанный поплавок", "Ржавый крючок", "Половина блесны", "Размокший кусок бумаги"];

// Ждем загрузки всех элементов DOM перед стартом
document.addEventListener('DOMContentLoaded', () => {
    console.log("Игра загружается...");
    
    const btn = document.getElementById('action-btn');
    if (btn) {
        btn.addEventListener('click', startFishing);
        btn.disabled = false; // Принудительно включаем
    }

    updateWeather();
    setInterval(updateWeather, 7200000);
    updateUI();
});

function updateWeather() {
    const weathers = ['sunny', 'rain', 'calm', 'storm'];
    state.weather = weathers[Math.floor(Math.random() * weathers.length)];
    const icon = document.getElementById('weather-icon');
    if (icon) icon.innerText = {'sunny':'☀️', 'rain':'🌧️', 'calm':'🌊', 'storm':'🌪️'}[state.weather];
}

function startFishing() {
    console.log("Заброс...");
    if (state.attempts <= 0) return;

    if (!(state.bonuses.filter && Math.random() < 0.3)) state.attempts--;

    let rand = Math.random();
    let trashChance = (state.weather === 'storm') ? 0.7 : 0.4;
    
    if (state.bonuses.mask) {
        catchFish(true);
        state.bonuses.mask = false;
    } else if (rand < getBonusChance()) {
        handleBonus();
    } else if (rand < trashChance) {
        let item = trash[Math.floor(Math.random() * trash.length)];
        logCatch(item, 0, true);
        document.getElementById('message').innerText = `Поймал: ${item}`;
    } else {
        catchFish(state.weather === 'rain');
    }

    triggerDebuff();
    updateUI();
    if (state.attempts === 0) endGame();
}

function getBonusChance() { return (state.weather === 'calm') ? 0.3 : 0.1; }

function catchFish(isLargeBonus) {
    let fish = fishes[Math.floor(Math.random() * fishes.length)];
    let isDuck = state.activeDebuffs.some(d => d.includes("Утка"));
    let isRak = state.activeDebuffs.some(d => d.includes("Рак"));
    
    let weight = isDuck ? parseFloat((Math.random() * 0.5).toFixed(1)) : 
                 parseFloat(((isLargeBonus ? 8.0 : 0.1) + Math.random() * 9.8).toFixed(1));
    if (isRak && weight > 2.5) weight = 2.5;
    
    logCatch(fish, weight, false);
    document.getElementById('message').innerText = `Поймал: ${fish} (${weight.toFixed(1)} кг)`;
}

function handleBonus() {
    let b = Math.random();
    if (b < 0.25) { state.attempts++; alert("Катушка! +1 попытка"); updateUI(); }
    else if (b < 0.5) { state.bonuses.fins = true; alert("Ласты! x2 улов"); }
    else if (b < 0.75) { 
        state.bonuses.mask = true; 
        alert("Маска! Можно удалить предмет.");
        document.getElementById('action-btn').disabled = true;
        showModal();
    }
    else { state.bonuses.aqua = true; alert("Акваланг! Бонус к макс. рыбе"); }
}

function logCatch(name, weight, isTrash) {
    state.catches.push({name, weight, isTrash});
    const li = document.createElement('li');
    li.innerText = `${name} ${weight > 0 ? weight.toFixed(1)+' кг' : ''}`;
    const list = document.getElementById('history-list');
    if (list) list.appendChild(li);
}

function updateUI() {
    let currentSum = state.catches.reduce((s, c) => s + c.weight, 0);
    const score = document.getElementById('score');
    if (score) score.innerText = `Улов: ${currentSum.toFixed(1)} кг | Попыток: ${state.attempts}`;
}

// ... (остальные функции: triggerDebuff, endGame, showModal оставь как были)
