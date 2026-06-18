const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Настройки игры
let attempts = 3;
let totalWeight = 0;
let hasMask = false;
let multiplier = 1;

const CHANCE_CATCH = 0.60;
const CHANCE_TRASH = 0.30;
const CHANCE_BONUS = 0.10;

const fishes = ["Палтус", "Палия", "Белый амур", "Щука", "Семга", "Солнечник", "Подкаменщик", "Сом", "Окунь"];
const trash = ["Старый башмак", "Спутанная леска", "Сломанный поплавок", "Ржавый крючок", "Половина блесны", "Размокший кусок бумаги"];

// Функция, которая сработает, когда страница полностью загрузится
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('action-btn');
    const message = document.getElementById('message');
    const scoreDisplay = document.getElementById('score');

    function updateUI() {
        scoreDisplay.innerText = `Улов: ${(totalWeight * multiplier).toFixed(1)} кг | Попыток: ${attempts}`;
    }

    function canPlayToday() {
        const lastPlayDate = localStorage.getItem('lastPlayDate');
        const today = new Date().toDateString();
        return lastPlayDate !== today;
    }

    function startFishing() {
        if (!canPlayToday()) {
            message.innerText = "Ты уже рыбачил сегодня. Приходи завтра!";
            btn.disabled = true;
            return;
        }

        attempts--;
        btn.disabled = true;
        message.innerText = "Рыба клюет...";

        setTimeout(() => {
            const rand = Math.random();

            if (rand < CHANCE_BONUS) {
                const bonusRand = Math.random();
                if (bonusRand < 0.33) {
                    attempts++;
                    message.innerText = "Удача! Поймал катушку (+1 попытка)!";
                } else if (bonusRand < 0.66) {
                    multiplier = 2;
                    message.innerText = "Нашел ласты! Весь улов x2!";
                } else {
                    hasMask = true;
                    message.innerText = "Нашел маску! Следующая рыба будет крупной!";
                }
            } else if (rand < CHANCE_BONUS + CHANCE_TRASH) {
                const item = trash[Math.floor(Math.random() * trash.length)];
                message.innerText = `Ты поймал ${item}. Это хлам!`;
            } else {
                const fish = fishes[Math.floor(Math.random() * fishes.length)];
                const weight = hasMask ? (Math.random() * 3.4 + 6.5) : (Math.random() * 9.8 + 0.1);
                totalWeight += weight;
                hasMask = false;
                message.innerText = `Поймал ${fish}! Вес: ${weight.toFixed(1)} кг.`;
            }

            updateUI();
            btn.disabled = false;

            if (attempts <= 0) {
                message.innerText = "Попытки закончились! Итог: " + (totalWeight * multiplier).toFixed(1) + " кг.";
                btn.disabled = true;
                localStorage.setItem('lastPlayDate', new Date().toDateString());
            }
        }, 1500);
    }

    // Проверка при старте
    if (!canPlayToday()) {
        message.innerText = "Ты уже рыбачил сегодня. Возвращайся завтра!";
        btn.disabled = true;
    } else {
        updateUI();
        btn.addEventListener('click', startFishing);
    }
});
