let tg; try { tg = window.Telegram.WebApp; tg.ready(); tg.expand(); } catch (e) { tg = { HapticFeedback: { impactOccurred: () => {} } }; }

let state = {
    attempts: 3,
    catches: [],
    bonuses: { mask: false, aqua: false, filter: false, fins: false },
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
    state.catches.filter(c => !c.isTrash).forEach((c, index) => {
        const btn = document.createElement('button');
        btn.className = 'fish-btn';
        btn.innerText = `${c.name} (${c.weight.toFixed(1)} кг)`;
        btn.onclick = () => {
            state.catches.splice(state.catches.indexOf(c), 1);
            document.getElementById('modal').classList.add('hidden');
            document.getElementById('action-btn').disabled = false;
            updateUI();
            document.getElementById('message').innerText = "Рыба удалена! Можно бросать.";
        };
        list.appendChild(btn);
    });
    document.getElementById('modal').classList.remove('hidden');
}

function startFishing() {
    if (state.attempts <= 0) return;

    if (state.attempts === 1 && Math.random() < 0.3) {
        document.getElementById('action-btn').disabled = true;
        showModal();
        return;
    }

    if (!(state.bonuses.filter && Math.random() < 0.3)) {
        state.attempts--;
    }

    let rand = Math.random();
    if (rand < 0.1) {
        let b = Math.random();
        if (b < 0.25) { state.attempts++; alert("Катушка! +1 попытка"); }
        else if (b < 0.5) { state.bonuses.fins = true; alert("Ласты! x2 улов"); }
        else if (b < 0.75) { state.bonuses.mask = true; alert("Маска! Следующая крупная"); }
        else { state.bonuses.aqua = true; alert("Акваланг! Бонус к макс. рыбе"); }
    } else if (rand < 0.4) {
        let item = trash[Math.floor(Math.random() * trash.length)];
        logCatch(item, 0, true);
        document.getElementById('message').innerText = `Поймал: ${item}`;
    } else {
        let fish = fishes[Math.floor(Math.random() * fishes.length)];
        let weight = state.bonuses.mask ? (6.5 + Math.random() * 3.4) : (0.1 + Math.random() * 9.8);
        state.bonuses.mask = false;
        logCatch(fish, weight, false);
        document.getElementById('message').innerText = `Поймал: ${fish} (${weight.toFixed(1)} кг)`;
    }

    updateUI();
    if (state.attempts === 0) endGame();
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
    document.getElementById('final-result').innerHTML = `<strong>Итог: ${total.toFixed(2)} кг</strong><br>Время: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    document.getElementById('final-result').classList.remove('hidden');
    localStorage.setItem('lastPlayDate', new Date().toDateString());
}

function updateUI() {
    document.getElementById('score').innerText = `Улов: ${state.catches.reduce((s, c)=>s+c.weight,0).toFixed(1)} кг | Попыток: ${state.attempts}`;
}

document.getElementById('action-btn').addEventListener('click', startFishing);
updateWeather();
setInterval(updateWeather, 7200000);
