const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

let attempts = 3;
let totalWeight = 0;
let hasMask = false;
let multiplier = 1;

const fishes = ["Палтус", "Палия", "Белый амур", "Щука", "Семга", "Солнечник", "Подкаменщик", "Сом", "Окунь"];
const trash = ["Старый башмак", "Спутанная леска", "Сломанный поплавок", "Ржавый крючок", "Половина блесны", "Размокший кусок бумаги"];

const btn = document.getElementById('action-btn');
const message = document.getElementById('message');
const scoreDisplay = document.getElementById('score');
const historyList = document.getElementById('history-list');

function updateUI() {
    scoreDisplay.innerText = `Улов: ${(totalWeight * multiplier).toFixed(1)} кг | Попыток: ${attempts}`;
}

function addToHistory(text) {
    const li = document.createElement('li');
    li.innerText = text;
    historyList.appendChild(li);
}

function canPlayToday() {
    return localStorage.getItem('lastPlayDate') !== new Date().toDateString();
}

btn.addEventListener('click', () => {
    if (attempts <= 0) return;

    attempts--;
    btn.disabled = true;
    message.innerText = "Рыба клюет...";

    setTimeout(() => {
        const rand = Math.random();

        if (rand < 0.10) { // Бонусы (10%)
            const b = Math.random();
            if (b < 0.33) {
                attempts++;
                message.innerText = "Удача! Катушка (+1 попытка).";
                addToHistory("Катушка (+1 попытка)");
            } else if (b < 0.66) {
                multiplier = 2;
                message.innerText = "Ласты! Улов x2.";
                addToHistory("Ласты (Улов x2)");
            } else {
                hasMask = true;
                message.innerText = "Маска! Следующая рыба будет крупной.";
                addToHistory("Подводная маска");
            }
        } else if (rand < 0.40) { // Мусор (30%)
            const item = trash[Math.floor(Math.random() * trash.length)];
            message.innerText = `Ты поймал ${item}.`;
            addToHistory(item);
        } else { // Рыба (60%)
            const fish = fishes[Math.floor(Math.random() * fishes.length)];
            const w = hasMask ? (Math.random() * 3.4 + 6.5) : (Math.random() * 9.8 + 0.1);
            totalWeight += w;
            hasMask = false;
            message.innerText = `Поймал ${fish} (${w.toFixed(1)} кг)!`;
            addToHistory(`${fish} — ${w.toFixed(1)} кг`);
        }

        updateUI();
        btn.disabled = false;

        if (attempts <= 0) {
            message.innerText = "Игра окончена! Итог: " + (totalWeight * multiplier).toFixed(1) + " кг.";
            btn.disabled = true;
            localStorage.setItem('lastPlayDate', new Date().toDateString());
        }
    }, 1500);
});

if (!canPlayToday()) {
    message.innerText = "Ты уже рыбачил сегодня. Возвращайся завтра!";
    btn.disabled = true;
} else {
    updateUI();
}
