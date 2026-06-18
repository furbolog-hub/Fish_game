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

function updateUI() {
    scoreDisplay.innerText = `Улов: ${(totalWeight * multiplier).toFixed(1)} кг | Попыток: ${attempts}`;
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
            if (b < 0.33) { attempts++; message.innerText = "Катушка! +1 попытка."; }
            else if (b < 0.66) { multiplier = 2; message.innerText = "Ласты! Улов x2."; }
            else { hasMask = true; message.innerText = "Маска! Крупный улов гарантирован."; }
        } else if (rand < 0.40) { // Мусор (30%)
            message.innerText = `Попался ${trash[Math.floor(Math.random() * trash.length)]}.`;
        } else { // Рыба (60%)
            const w = hasMask ? (Math.random() * 3.4 + 6.5) : (Math.random() * 9.8 + 0.1);
            totalWeight += w;
            hasMask = false;
            message.innerText = `Поймал ${fishes[Math.floor(Math.random() * fishes.length)]} (${w.toFixed(1)} кг)!`;
        }

        updateUI();
        btn.disabled = false;

        if (attempts <= 0) {
            message.innerText = "Игра окончена! Твой результат: " + (totalWeight * multiplier).toFixed(1) + " кг.";
            localStorage.setItem('lastPlayDate', new Date().toDateString());
        }
    }, 1500);
});
