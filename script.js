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

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('action-btn').addEventListener('click', startFishing);
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

function updateUI() {
    let currentSum = state.catches.reduce((s, c) => s + c.weight, 0);
    const score = document.getElementById('score');
    if (score) score.innerText = `Улов: ${currentSum.toFixed(1)} кг | Попыток: ${state.attempts}`;
}

function startFishing() {
    if (state.attempts <= 0) return;

    if (!(state.bonuses.filter && Math.random() < 0.3)) state.attempts--;
    
    updateUI();
    document.getElementById('action-btn').disabled = true;

    setTimeout(() => {
        let rand = Math.random();
        let trashChance = (state.weather === 'storm') ? 0.7 : 0.4;
        
        if (state.bonuses.mask) {
            catchFish(true);
            state.bonuses.mask = false;
        } else if (rand < getBonusChance()) {
            handleBonus();
        } else if (rand < trashChance) {
            let item = trash[Math.floor(Math.random() * trash.length)];
            logCatch(item, 0, true, 'catch');
            document.getElementById('message').innerText = `Поймал: ${item}`;
        } else {
            catchFish(state.weather === 'rain');
        }

        triggerDebuff();
        updateUI();
        document.getElementById('action-btn').disabled = false;
        if (state.attempts === 0) endGame();
    }, 600);
}

function getBonusChance() { return (state.weather === 'calm') ? 0.3 : 0.1; }

// Исправленная логика Утки и РАКа
function catchFish(isLargeBonus) {
    let isDuck = state.activeDebuffs.some(d => d.includes("Утка"));
    let isRak = state.activeDebuffs.some(d => d.includes("Рак"));
    
    let name, weight;

    // Если утка: 50% шанс на хлам, 50% шанс на мелкую рыбу (до 0.5кг)
    if (isDuck && Math.random() < 0.5) {
        name = trash[Math.floor(Math.random() * trash.length)];
        weight = 0;
    } else {
        name = fishes[Math.floor(Math.random() * fishes.length)];
        if (isDuck) {
            weight = parseFloat((Math.random() * 0.5).toFixed(1));
        } else {
            let minW = (isLargeBonus) ? 8.0 : 0.1;
            weight = parseFloat((minW + Math.random() * (9.9 - minW)).toFixed(1));
        }
    }
    
    if (isRak && weight > 2.5) weight = 2.5;
    
    logCatch(name, weight, (weight === 0), 'catch');
    document.getElementById('message').innerText = `Поймал: ${name} ${weight > 0 ? '(' + weight.toFixed(1) + ' кг)' : ''}`;
}

function handleBonus() {
    let b = Math.random();
    if (b < 0.25) { state.attempts++; alert("Катушка! +1 попытка"); updateUI(); logCatch("Бонус: Катушка (+1)", 0, true, 'bonus'); }
    else if (b < 0.5) { state.bonuses.fins = true; alert("Ласты! x2 улов"); logCatch("Бонус: Ласты (x2)", 0, true, 'bonus'); }
    else if (b < 0.75) { state.bonuses.mask = true; alert("Маска!"); showModal(); logCatch("Бонус: Маска", 0, true, 'bonus'); }
    else { state.bonuses.aqua = true; alert("Акваланг! Бонус к макс. рыбе"); logCatch("Бонус: Акваланг", 0, true, 'bonus'); }
}

function triggerDebuff() {
    if (state.weather === 'storm' || Math.random() > 0.25) return;
    let type = Math.random();
    let debuffText = "";
    if (type < 0.33 && state.weather === 'calm') debuffText = "Дебаф: Рак (вес до 2.5кг)";
    else if (type < 0.66 && state.weather === 'sunny') {
        let fishesInCatch = state.catches.filter(c => !c.isTrash);
        if (fishesInCatch.length > 0) {
            state.catches.splice(state.catches.indexOf(fishesInCatch[0]), 1);
            debuffText = "Дебаф: Чайка стащила рыбу!";
        }
    } else if (state.weather === 'rain') debuffText = "Дебаф: Утка (только хлам)";

    if (debuffText && !state.activeDebuffs.includes(debuffText)) {
        state.activeDebuffs.push(debuffText);
        logCatch(debuffText, 0, true, 'debuff');
        document.getElementById('status-effects').innerHTML = state.activeDebuffs.map(d => `<div>${d}</div>`).join('');
    }
}

function logCatch(name, weight, isTrash, type) {
    if (weight > 0 || type !== 'catch') {
        state.catches.push({name, weight, isTrash});
    }
    const li = document.createElement('li');
    li.className = type === 'bonus' ? 'log-bonus' : (type === 'debuff' ? 'log-debuff' : 'log-catch');
    li.innerText = `${name} ${weight > 0 ? weight.toFixed(1)+' кг' : ''}`;
    document.getElementById('history-list').appendChild(li);
}

function showModal() {
    document.getElementById('action-btn').disabled = true;
    const list = document.getElementById('modal-fish-list');
    list.innerHTML = '';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'fish-btn';
    cancelBtn.innerText = "Ничего не удалять";
    cancelBtn.onclick = () => { document.getElementById('modal').classList.add('hidden'); document.getElementById('action-btn').disabled = false; };
    list.appendChild(cancelBtn);
    state.catches.forEach((c, index) => {
        const btn = document.createElement('button');
        btn.className = 'fish-btn';
        btn.innerText = `Удалить: ${c.name} (${c.weight > 0 ? c.weight.toFixed(1)+' кг' : 'хлам'})`;
        btn.onclick = () => { state.catches.splice(index, 1); document.getElementById('modal').classList.add('hidden'); document.getElementById('action-btn').disabled = false; updateUI(); };
        list.appendChild(btn);
    });
    document.getElementById('modal').classList.remove('hidden');
}

function endGame() {
    document.getElementById('action-btn').disabled = true;
    let total = state.catches.reduce((s, c) => s + c.weight, 0);
    if (state.bonuses.fins) total *= 2;
    if (state.bonuses.aqua && state.catches.length > 0) total += Math.max(...state.catches.map(c => c.weight)) * 2;
    total = Math.round(total * 100) / 100;
    document.getElementById('final-result').innerHTML = `<strong>Итог: ${total.toFixed(2)} кг</strong>`;
    document.getElementById('final-result').classList.remove('hidden');
}
