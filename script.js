let tg; try { tg = window.Telegram.WebApp; tg.ready(); tg.expand(); } catch (e) { tg = { HapticFeedback: { impactOccurred: () => {} } }; }

let state = { attempts: 3, catches: [], bonuses: { mask: false, aquaCount: 0, filter: false, fins: false }, activeDebuffs: [], weather: 'sunny', luckyFisher: false, bonusCount: 0 };
const fishes = ["Палтус", "Палия", "Белый амур", "Щука", "Семга", "Солнечник", "Подкаменщик", "Сом", "Окунь"];
const trash = ["Старый башмак", "Спутанная леска", "Сломанный поплавок", "Ржавый крючок", "Половина блесны", "Размокший кусок бумаги"];
const icons = {
    "Палтус": "🐟", "Палия": "🐠", "Белый амур": "🐟", "Щука": "🦈", 
    "Семга": "🍣", "Солнечник": "☀️", "Подкаменщик": "🐡", "Сом": "〰️", "Окунь": "🐟",
    "Старый башмак": "👞", "Спутанная леска": "🧶", "Сломанный поплавок": "🪡", 
    "Ржавый крючок": "🪝", "Половина блесны": "🪙", "Размокший кусок бумаги": "📄"
};

function getMedalEmoji(weight) {
    if (weight <= 4.5) return "🥉";
    if (weight <= 7.5) return "🥈";
    if (weight <= 9.9) return "🥇";
    return "🏆";
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('action-btn').addEventListener('click', startFishing);
    document.getElementById('weather-icon').onclick = toggleWeatherHelp;
    updateWeather();
    setInterval(updateWeather, 7200000);
    updateUI();
});

function toggleWeatherHelp() {
    const el = document.getElementById('weather-help');
    if (!el.classList.contains('active')) {
        const helpText = {
            'sunny': '☀️ Солнечно: Шанс атаки чайки!',
            'rain': '🌧️ Дождь: Появление утки (снижает вес).',
            'calm': '🌊 Штиль: Высокий шанс бонусов.',
            'storm': '🌪️ Шторм: Много хлама, дебаффы не работают.'
        };
        document.getElementById('help-text').innerText = helpText[state.weather];
        el.classList.add('active');
    } else {
        el.classList.remove('active');
    }
}

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
            catchFish(true);
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
        if (state.attempts === 0 && document.getElementById('modal').classList.contains('hidden')) {
            endGame();
        } else {
            document.getElementById('action-btn').disabled = false;
        }
    }, 600);
}

function handleBonus() {
    state.bonusCount++;
    let b = Math.random();
    if (b < 0.2) { alert("Катушка!"); logCatch("Бонус: Катушка (+1)", 0, true, 'bonus'); state.attempts++; }
    else if (b < 0.4) { if (state.bonuses.fins) { alert("Ласты уже есть!"); } else { state.bonuses.fins = true; alert("Ласты! x2 улов"); } }
    else if (b < 0.6) { state.bonuses.mask = true; alert("Маска!"); showModal(); }
    else if (b < 0.8) { state.bonuses.aquaCount++; alert("Акваланг! (+x3 к макс)"); }
    else { state.bonuses.filter = true; alert("Фильтр! Защита от хлама"); }
}

function catchFish(isMasked) {
    let isDuck = state.activeDebuffs.some(d => d.includes("Утка"));
    let isRak = state.activeDebuffs.some(d => d.includes("Рак"));
    let name = fishes[Math.floor(Math.random() * fishes.length)];
    let weight;
    if (isDuck) {
        if (Math.random() < 0.5) { name = trash[Math.floor(Math.random() * trash.length)]; weight = 0; }
        else { weight = parseFloat((0.1 + Math.random() * 0.4).toFixed(1)); }
    } else {
        if (isMasked) { weight = parseFloat((6.5 + Math.random() * 3.4).toFixed(1)); }
        else if (Math.random() < 0.05) { weight = parseFloat((10.0 + Math.random() * 5.0).toFixed(1)); state.luckyFisher = true; }
        else { weight = parseFloat((0.1 + Math.random() * 6.4).toFixed(1)); }
    }
    if (isRak && weight > 2.5) weight = 2.5;
    logCatch(name, weight, (weight === 0), 'catch');
    let medal = (weight > 0) ? getMedalEmoji(weight) : "";
    document.getElementById('message').innerText = `Поймал: ${name} ${weight > 0 ? '(' + weight.toFixed(1) + ' кг) ' + medal : ''}`;
}

function getBonusChance() { return (state.weather === 'calm') ? 0.3 : 0.15; }

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

function logCatch(name, weight, isTrash, type, isRemoved = false) { state.catches.push({name, weight, isTrash, type, isStolen: false, isRemoved: isRemoved}); }

function renderHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    state.catches.forEach(c => {
        const li = document.createElement('li');
        const icon = icons[c.name] || "🎣";
        if (c.isRemoved) li.style.color = "#ffc107";
        else if (c.isStolen) li.className = 'strikethrough';
        let medal = (c.weight > 0 && !c.isTrash) ? getMedalEmoji(c.weight) : "";
        li.innerText = `${icon} ${c.name} ${c.weight > 0 ? c.weight.toFixed(1)+' кг ' + medal : ''}`;
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
    cancelBtn.onclick = () => { document.getElementById('modal').classList.add('hidden'); if (state.attempts === 0) endGame(); else document.getElementById('action-btn').disabled = false; };
    list.appendChild(cancelBtn);
    state.catches.filter(c => !c.isStolen && !c.isRemoved && c.weight > 0).forEach((c) => {
        const btn = document.createElement('button');
        btn.className = 'fish-btn';
        btn.innerText = `Удалить: ${c.name} (${c.weight.toFixed(1)} кг)`;
        btn.onclick = () => { c.isRemoved = true; document.getElementById('modal').classList.add('hidden'); updateUI(); renderHistory(); if (state.attempts === 0) endGame(); else document.getElementById('action-btn').disabled = false; };
        list.appendChild(btn);
    });
    document.getElementById('modal').classList.remove('hidden');
}

function endGame() {
    let validCatches = state.catches.filter(c => !c.isStolen && !c.isRemoved && c.weight > 0);
    let totalBase = validCatches.reduce((s, c) => s + c.weight, 0);
    let maxWeight = validCatches.length > 0 ? Math.max(...validCatches.map(c => c.weight)) : 0;
    let total = totalBase;
    if (state.bonuses.aquaCount > 0 && validCatches.length > 0) total = (totalBase - maxWeight) + (maxWeight * 3 * state.bonuses.aquaCount);
    if (state.bonuses.fins) total *= 2;
    let achs = [];
    if (state.luckyFisher) achs.push("🏆 Удачливый рыбак");
    if (state.bonusCount >= 3) achs.push("✨ Любимчик Фортуны");
    if (validCatches.length > 0 && validCatches.every(c => c.weight >= 8.5)) achs.push("🦈 Акула бизнеса");
    if (validCatches.length > 0 && validCatches.every(c => c.weight < 2.5)) achs.push("🐱 Аквариумный мастер");
    if (state.catches.length > 0 && state.catches.every(c => c.isTrash || c.isStolen)) achs.push("🗑️ Повелитель башмаков");
    const now = new Date();
    const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('final-result').innerHTML = `<div class="timestamp">${dateStr}</div><strong>Итог: ${total.toFixed(2)} кг</strong><div style="margin-top:10px;">${achs.join('<br>')}</div>`;
    document.getElementById('final-result').classList.remove('hidden');
}
