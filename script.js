let tg; try { tg = window.Telegram.WebApp; tg.ready(); tg.expand(); } catch (e) { tg = { HapticFeedback: { impactOccurred: () => {} } }; }

let state = {
    attempts: 3,
    catches: [],
    bonuses: { mask: false, aqua: false, filter: false, fins: false },
    activeDebuffs: [],
    weather: 'sunny'
};

const fishes = ["Палтус", "Палия", "Белый амур", "Щука", "Семга", "Солнечник", "Подкаменщик", "Сом", "Окунь"];
const trash = ["Старый башмак", "Спутанная леска", "Сломанный поплавок", "Ржавый крючок", "Половина блесны", "Размокший кусок бумаги"];

function updateWeather() {
    const weathers = ['sunny', 'rain', 'calm', 'storm'];
    state.weather = weathers[Math.floor(Math.random() * weathers.length)];
    document.getElementById('weather-icon').innerText = {'sunny':'☀️', 'rain':'🌧️', 'calm':'🌊', 'storm':'🌪️'}[state.weather];
}

function startFishing() {
    if (state.attempts <= 0) return;
    if (!(state.bonuses.filter && Math.random() < 0.3)) state.attempts--;

    let rand = Math.random();
    
    // Логика погоды: Шторм увеличивает шанс хлама
    let trashChance = (state.weather === 'storm') ? 0.7 : 0.4;
    
    if (state.bonuses.mask) {
        catchFish(true); // Маска дает рыбу
        state.bonuses.mask = false;
    } else if (rand < getBonusChance()) {
        handleBonus();
    } else if (rand < trashChance) {
        let item = trash[Math.floor(Math.random() * trash.length)];
        logCatch(item, 0, true);
        document.getElementById('message').innerText = `Поймал: ${item}`;
    } else {
        catchFish(state.weather === 'rain'); // Дождь увеличивает шанс крупной
    }

    triggerDebuff(); // Теперь дебафы зависят от погоды
    updateUI();
    if (state.attempts === 0) endGame();
}

function getBonusChance() {
    return (state.weather === 'calm') ? 0.3 : 0.1; // В штиль бонусы чаще
}

function triggerDebuff() {
    if (state.weather === 'storm') return; // В шторм дебафы не появляются

    let rand = Math.random();
    // Частота появления дебафов зависит от погоды
    let rakChance = (state.weather === 'calm') ? 0.4 : 0.2;
    let chaikaChance = (state.weather === 'sunny') ? 0.4 : 0.2;
    let utkaChance = (state.weather === 'rain') ? 0.4 : 0.2;

    if (rand < rakChance) {
        state.activeDebuffs.push("Рак: крючок погнут (вес до 2.5кг)");
    } else if (rand < rakChance + chaikaChance) {
        let fishesInCatch = state.catches.filter(c => !c.isTrash);
        if (fishesInCatch.length > 0) {
            state.catches.splice(state.catches.indexOf(fishesInCatch[0]), 1);
            state.activeDebuffs.push("Чайка: стащила рыбу!");
        }
    } else if (rand < rakChance + chaikaChance + utkaChance) {
        state.activeDebuffs.push("Утка: распугала рыбу (только хлам)");
    }
    
    // Обновляем список дебафов на экране
    document.getElementById('status-effects').innerHTML = state.activeDebuffs.map(d => `<div>${d}</div>`).join('');
}

function catchFish(isLargeBonus) {
    let fish = fishes[Math.floor(Math.random() * fishes.length)];
    let isDuck = state.activeDebuffs.includes("Утка: распугала рыбу (только хлам)");
    let isRak = state.activeDebuffs.includes("Рак: крючок погнут (вес до 2.5кг)");
    
    let weight;
    if (isDuck) {
        weight = parseFloat((Math.random() * 0.5).toFixed(1));
    } else {
        // Если Дождь или Маска - шанс крупной выше
        let minW = (isLargeBonus) ? 8.0 : 0.1;
        weight = parseFloat((minW + Math.random() * (9.9 - minW)).toFixed(1));
    }
    if (isRak && weight > 2.5) weight = 2.5;
    
    logCatch(fish, weight, false);
    document.getElementById('message').innerText = `Поймал: ${fish} (${weight.toFixed(1)} кг)`;
}

// ... (остальные функции: showModal, handleBonus, logCatch, endGame, updateUI остаются прежними)
