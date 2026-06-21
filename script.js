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
        document.getElementById('message').innerText = "Продолжаем рыбалку!";
    };
    list.appendChild(cancelBtn);

    state.catches.forEach((c, index) => {
        const btn = document.createElement('button');
        btn.className = 'fish-btn';
        btn.innerText = `Удалить: ${c.name} ${c.weight > 0 ? '('+c.weight.toFixed(1)+' кг)' : ''}`;
        btn.onclick = () => {
            state.catches.splice(index, 1);
            document.getElementById('modal').classList.add('hidden');
            document.getElementById('action-btn').disabled = false;
            updateUI();
            document.getElementById('message').innerText = "Предмет удален! Можно бросать.";
        };
        list.appendChild(btn);
    });
    document.getElementById('modal').classList.remove('hidden');
}

function startFishing() {
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

function getBonusChance() {
    return (state.weather === 'calm') ? 0.3 : 0.1;
}

function catchFish(isLargeBonus) {
    let fish = fishes[Math.floor(Math.random() * fishes.length)];
    let isDuck = state.activeDebuffs.some(d => d.includes("Утка"));
    let isRak = state.activeDebuffs.some(d => d.includes("Рак"));
    
    let weight;
    if (isDuck) {
        weight = parseFloat((Math.random() * 0.5).toFixed(1));
    } else {
        let minW = (isLargeBonus) ? 8.0 : 0.1;
        weight = parseFloat((minW + Math.random() * (9.9 - minW)).toFixed(1));
    }
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
        alert("Маска! Можно удалить предмет из улова.");
        document.getElementById('action-btn').disabled = true;
        showModal();
    }
    else { state.bonuses.aqua = true; alert("Акваланг! Бонус к макс. рыбе"); }
}

function triggerDebuff() {
    if (state.weather === 'storm') return;
    if (Math.random() > 0.25) return;

    let type = Math.random();
    let debuffText = "";

    if (type < 0.33 && state.weather === 'calm') {
        debuffText = "Рак: крючок погнут (вес до 2.5кг)";
    } else if (type < 0.66 && state.weather === 'sunny') {
        let fishesInCatch = state.catches.filter(c => !c.isTrash);
        if (fishesInCatch.length > 0) {
            state.catches.splice(state.catches.indexOf(fishesInCatch[0]), 1);
            debuffText = "Чайка: стащила рыбу!";
            updateUI();
        }
    } else if (state.weather === 'rain') {
        debuffText = "Утка: распугала рыбу (только хлам)";
    }

    if (debuffText && !state.activeDebuffs.includes(debuffText)) {
        state.activeDebuffs.push(debuffText);
        document.getElementById('status-effects').innerHTML = state.activeDebuffs.map(d => `<div>${d}</div>`).join('');
    }
}

function logCatch(name, weight, isTrash) {
    state.catches.push({name, weight, isTrash});
    const li = document.createElement('li');
    li.innerText = `${name} ${weight > 0 ? weight.toFixed(1)+' кг' : ''}`;
    document.getElementById('history-list').appendChild(li);
}

function endGame() {
    document.getElementById('action-btn').disabled = true;
    const now = new Date();
    let total = state.catches.reduce((s, c) => s + c.weight, 0);
    if (state.bonuses.fins) total *= 2;
    if (state.bonuses.aqua && state.catches.length > 0) {
        let max = Math.max(...state.catches.map(c => c.weight));
        total += max * 2;
    }
    total = Math.round(total * 100) / 100;
    document.getElementById('final-result').innerHTML = `<strong>Итог: ${total.toFixed(2)} кг</strong><br>Время: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    document.getElementById('final-result').classList.remove('hidden');
    localStorage.setItem('lastPlayDate', new Date().toDateString());
}

function updateUI() {
    let currentSum = state.catches.reduce((s, c) => s + c.weight, 0);
    document.getElementById('score').innerText = `Улов: ${currentSum.toFixed(1)} кг | Попыток: ${state.attempts}`;
}

document.getElementById('action-btn').addEventListener('click', startFishing);
updateWeather();
setInterval(updateWeather, 7200000);
