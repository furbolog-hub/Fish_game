let tg; try { tg = window.Telegram.WebApp; tg.ready(); tg.expand(); } catch (e) { tg = { HapticFeedback: { impactOccurred: () => {} } }; }

let state = { attempts: 3, catches: [], bonuses: { mask: false, aquaCount: 0, filter: false, fins: false }, activeDebuffs: [], weather: 'sunny', luckyFisher: false };
const fishes = ["Палтус", "Палия", "Белый амур", "Щука", "Семга", "Солнечник", "Подкаменщик", "Сом", "Окунь"];
const trash = ["Старый башмак", "Спутанная леска", "Сломанный поплавок", "Ржавый крючок", "Половина блесны", "Размокший кусок бумаги"];

const icons = {
    "Палтус": "🐟", "Палия": "🐠", "Белый амур": "🐟", "Щука": "🦈", 
    "Семга": "🍣", "Солнечник": "☀️", "Подкаменщик": "🐡", "Сом": "〰️", "Окунь": "🐟",
    "Старый башмак": "👞", "Спутанная леска": "🧶", "Сломанный поплавок": "🪡", 
    "Ржавый крючок": "🪝", "Половина блесны": "🪙", "Размокший кусок бумаги": "📄",
    "Бонус: Катушка (+1)": "🧵", "Бонус: Ласты (x2)": "🤿", "Бонус: Маска": "🥽", 
    "Бонус: Акваланг (x3)": "🫁", "Бонус: Фильтр": "♻️",
    "Дебаф: Рак (вес до 2.5кг)": "🦀", "Дебаф: Чайка стащила рыбу!": "🦅", "Дебаф: Утка (малый вес/хлам)": "🦆"
};

// Функция определения ранга иконки по весу
function getWeightIcon(weight) {
    if (weight === 0) return "";
    if (weight >= 10.0) return "🏆";
    if (weight >= 7.6) return "🥇";
    if (weight >= 4.6) return "🥈";
    return "🥉";
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('action-btn').addEventListener('click', startFishing);
    updateWeather();
    setInterval(updateWeather, 7200000);
    updateUI();
});

function updateWeather() {
    const weathers = ['sunny', 'rain', 'calm', 'storm'];
    state.weather = weathers[Math.floor(Math.random() * weathers.length)];
    document.getElementById('weather-icon').innerText = {'sunny':'☀️', 'rain':'🌧️', 'calm':'🌊', 'storm':'🌪️'}[state.weather];
}

function startFishing() {
    if (state.attempts <= 0) return;
    document.getElementById('action-btn').disabled = true;

    setTimeout(() => {
        let rand = Math.random();
        let trashChance = (state.weather === 'storm') ? 0.7 : 0.4;
        
        if (state.bonuses.mask) {
            catchFish(false); // Маска больше не дает гарантированный бонус веса, если не нужно
            state.bonuses.mask = false;
            state.attempts--;
        } else if (rand < getBonusChance()) {
            handleBonus();
        } else if (rand < trashChance) {
            let item = trash[Math.floor(Math.random() * trash.length)];
            logCatch(item, 0, true, 'catch');
            document.getElementById('message').innerText = `Поймал: ${item}`;
            if (state.bonuses.filter) { state.bonuses.filter = false; } else { state.attempts--; }
        } else {
            catchFish(false);
            state.attempts--;
        }

        triggerDebuff();
        updateUI();
        renderHistory();
        document.getElementById('action-btn').disabled = false;
        if (state.attempts === 0) endGame();
    }, 600);
}

function catchFish(isLargeBonus) {
    let isDuck = state.activeDebuffs.some(d => d.includes("Утка"));
    let isRak = state.activeDebuffs.some(d => d.includes("Рак"));
    let name, weight;

    if (isDuck) {
        if (Math.random() < 0.5) { name = trash[Math.floor(Math.random() * trash.length)]; weight = 0; }
        else { name = fishes[Math.floor(Math.random() * fishes.length)]; weight = parseFloat((0.1 + Math.random() * 0.4).toFixed(1)); }
    } else {
        // Редкий случай (5%): 10.0 - 15.0 кг
        if (Math.random() < 0.05) {
            name = fishes[Math.floor(Math.random() * fishes.length)];
            weight = parseFloat((10.0 + Math.random() * 5.0).toFixed(1));
            state.luckyFisher = true;
        } else {
            // Обычный случай: 0.1 - 9.9 кг
            name = fishes[Math.floor(Math.random() * fishes.length)];
            weight = parseFloat((0.1 + Math.random() * 9.8).toFixed(1));
        }
    }
    
    if (isRak && weight > 2.5) weight = 2.5;
    logCatch(name, weight, (weight === 0), 'catch');
    document.getElementById('message').innerText = `Поймал: ${name} ${weight > 0 ? '(' + weight.toFixed(1) + ' кг)' : ''}`;
}

function getBonusChance() { return (state.weather === 'calm') ? 0.3 : 0.15; }

function handleBonus() {
    let b = Math.random();
    if (b < 0.2) { state.attempts++; alert("Катушка!"); logCatch("Бонус: Катушка (+1)", 0, true, 'bonus'); }
    else if (b < 0.4) { 
        if (state.bonuses.fins) { alert("Ласты уже есть!"); logCatch("Бонус: Ласты (уже есть)", 0, true, 'bonus'); } 
        else { state.bonuses.fins = true; alert("Ласты! x2 улов"); logCatch("Бонус: Ласты (x2)", 0, true, 'bonus'); }
    }
    else if (b < 0.6) { state.bonuses.mask = true; alert("Маска!"); showModal(); logCatch("Бонус: Маска", 0, true, 'bonus'); }
    else if (b < 0.8) { state.bonuses.aquaCount++; alert("Акваланг! (+x3 к макс)"); logCatch("Бонус: Акваланг (x3)", 0, true, 'bonus'); }
    else { state.bonuses.filter = true; alert("Фильтр! Защита от хлама"); logCatch("Бонус: Фильтр", 0, true, 'bonus'); }
}

function triggerDebuff() {
    if (state.weather === 'storm' || Math.random() > 0.25) return;
    let type = Math.random();
    let debuffText = "";
    if (type < 0.33 && state.weather === 'calm') debuffText = "Дебаф: Рак (вес до 2.5кг)";
    else if (type < 0.66 && state.weather === 'sunny') {
        let fish = state.catches.find(c => !c.isTrash && !c.isStolen);
        if (fish) { fish.isStolen = true; debuffText = "Дебаф: Чайка стащила рыбу!"; }
    } else if (state.weather === 'rain') debuffText = "Дебаф: Утка (малый вес/хлам)";
    
    if (debuffText && !state.activeDebuffs.includes(debuffText)) {
        state.activeDebuffs.push(debuffText);
        logCatch(debuffText, 0, true, 'debuff');
        document.getElementById('status-effects').innerHTML = state.activeDebuffs.map(d => `<div>${icons[d] || ''} ${d}</div>`).join('');
    }
}

function logCatch(name, weight, isTrash, type, isRemoved = false) {
    state.catches.push({name, weight, isTrash, type, isStolen: false, isRemoved: isRemoved});
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    state.catches.forEach(c => {
        const li = document.createElement('li');
        const icon = icons[c.name] || "🎣";
        const weightRank = getWeightIcon(c.weight);
        
        if (c.isRemoved) {
            li.style.color = "#ffc107";
            li.style.textDecoration = "line-through";
            li.innerText = `${icon} ${c.name === "..." ? "..." : c.name} (Удалено)`;
        } else if (c.isStolen) {
            li.className = 'strikethrough';
            li.innerText = `${icon} ${c.name} ${c.weight.toFixed(1)} кг (Украдено)`;
        } else {
            li.className = c.type === 'bonus' ? 'log-bonus' : (c.type === 'debuff' ? 'log-debuff' : '');
            li.innerText = `${icon} ${weightRank} ${c.name} ${c.weight > 0 ? c.weight.toFixed(1)+' кг' : ''}`;
        }
        list.appendChild(li);
    });
}

function updateUI() {
    let currentSum = state.catches.filter(c => !c.isStolen && !c.isRemoved).reduce((s, c) => s + c.weight, 0);
    document.getElementById('score').innerText = `Улов: ${currentSum.toFixed(1)} кг | Попыток: ${state.attempts}`;
}

function showModal() {
    document.getElementById('action-btn').disabled = true;
    const list = document.getElementById('modal-fish-list');
    list.innerHTML = '';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'fish-btn';
    cancelBtn.innerText = "Ничего не удалять";
    cancelBtn.onclick = () => { 
        logCatch("...", 0, false, 'catch', true); 
        document.getElementById('modal').classList.add('hidden'); 
        document.getElementById('action-btn').disabled = false; 
    };
    list.appendChild(cancelBtn);
    state.catches.filter(c => !c.isStolen && !c.isRemoved).forEach((c) => {
        const btn = document.createElement('button');
        btn.className = 'fish-btn';
        btn.innerText = `Удалить: ${c.name} ${c.weight > 0 ? '('+c.weight.toFixed(1)+' кг)' : ''}`;
        btn.onclick = () => { 
            c.isRemoved = true; 
            document.getElementById('modal').classList.add('hidden'); 
            document.getElementById('action-btn').disabled = false; 
            updateUI(); 
            renderHistory(); 
        };
        list.appendChild(btn);
    });
    document.getElementById('modal').classList.remove('hidden');
}

function endGame() {
    document.getElementById('action-btn').disabled = true;
    let validCatches = state.catches.filter(c => !c.isStolen && !c.isRemoved && c.weight > 0);
    let totalBase = validCatches.reduce((s, c) => s + c.weight, 0);
    let maxWeight = validCatches.length > 0 ? Math.max(...validCatches.map(c => c.weight)) : 0;
    
    let total = totalBase;
    if (state.bonuses.aquaCount > 0) {
        total = (totalBase - maxWeight) + (maxWeight * 3 * state.bonuses.aquaCount);
    }
    if (state.bonuses.fins) total *= 2;
    
    total = Math.round(total * 100) / 100;

    const now = new Date();
    const dateStr = now.toLocaleDateString('ru-RU');
    const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    let luckyText = state.luckyFisher ? '<div style="color: gold; margin-top:10px;">🏆 Удачливый рыбак</div>' : '';

    document.getElementById('final-result').innerHTML = `
        <strong>Итог: ${total.toFixed(2)} кг</strong>
        ${luckyText}
        <br><small style="color: #666;">${dateStr} в ${timeStr}</small>
    `;
    document.getElementById('final-result').classList.remove('hidden');
}
