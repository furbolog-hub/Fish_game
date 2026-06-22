// --- КОНФИГУРАЦИЯ ЗВУКОВ ---
const baseUrl = 'https://raw.githubusercontent.com/furbolog-hub/Fish_game/main/sounds/';
 
const sounds = {
    throw: new Audio(baseUrl + 'throw.ogg'),
    bonus: new Audio(baseUrl + 'bonus.ogg'),
    debuff: new Audio(baseUrl + 'debuff.ogg'),
    successfull: new Audio(baseUrl + 'successful.ogg'),
    achievement: new Audio(baseUrl + 'achievement.ogg'),
    legendary: new Audio(baseUrl + 'legendary.ogg'),
    unique: new Audio(baseUrl + 'unique.ogg')
};
 
function playSound(soundName) {
    if (sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(e => console.log("Audio play blocked:", e));
    }
}
 
// --- ИГРОВОЙ КОД ---
 
let tg;
try {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
} catch (e) {
    tg = { HapticFeedback: { impactOccurred: () => {} } };
}
 
let state = {
    attempts: 3,
    catches: [],
    bonuses: { mask: false, aquaCount: 0, filter: false, fins: false },
    activeDebuffs: [],
    weather: 'sunny',
    luckyFisher: false,
    bonusCount: 0,
    leviathanBonus: 0,
    hasMessageInBottle: false,
    hasCompass: false,
    diceMultiplier: 1
};
 
const fishes = ["Палтус", "Палия", "Белый амур", "Щука", "Семга", "Солнечник", "Подкаменщик", "Сом", "Окунь", "Плотва", "Кижуч", "Семотилус", "Меланотения", "Горчак", "Жерех", "Ринихт", "Лосось", "Корюшка", "Судак", "Арктический голец", "Красноперка", "Золотая форель", "Фундулюс", "Озерный сиг", "Карпиодес"];
const trash = ["Старый башмак", "Спутанная леска", "Сломанный поплавок", "Ржавый крючок", "Половина блесны", "Размокший кусок бумаги"];
const legendaryItems = ["Чешуя Левиафана", "Послание в бутылке", "Компас потерянных глубин", "Запечатанный сундук"];
const uniqueItems = ["Глубоководное нечто", "Игральная кость"];
 
const icons = {
    "Палтус": "🐟", "Палия": "🐠", "Белый амур": "🐟", "Щука": "🦈", "Семга": "🍣", "Солнечник": "☀️", "Подкаменщик": "🐡", "Сом": "〰️", "Окунь": "🐟",
    "Плотва": "🐟", "Кижуч": "🐠", "Семотилус": "🐟", "Меланотения": "🌈", "Горчак": "🐟", "Жерех": "🐟", "Ринихт": "🐟", "Лосось": "🎣", "Корюшка": "🐟", "Судак": "🐟",
    "Арктический голец": "🧊", "Красноперка": "🎏", "Золотая форель": "✨", "Фундулюс": "🐟", "Озерный сиг": "🐟", "Карпиодес": "🐟",
    "Старый башмак": "👞", "Спутанная леска": "🧶", "Сломанный поплавок": "🪡", "Ржавый крючок": "🪝", "Половина блесны": "🪙", "Размокший кусок бумаги": "📄",
    "Чешуя Левиафана": "🐉", "Послание в бутылке": "📜", "Компас потерянных глубин": "🧭", "Запечатанный сундук": "🧰",
    "Глубоководное нечто": "🐙", "Игральная кость": "🎲"
};
 
function getWeightIcon(weight) {
    if (weight === 0) return "";
    if (weight >= 20.0) return "👽";
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
 
function toggleWeatherHelp() {
    document.getElementById('weather-help').classList.toggle('hidden');
}
 
function updateWeather() {
    const weathers = ['sunny', 'sunny', 'rain', 'rain', 'calm', 'calm', 'storm', 'fog'];
    state.weather = weathers[Math.floor(Math.random() * weathers.length)];
    document.getElementById('weather-icon').innerText = {
        'sunny': '☀️', 'rain': '🌧️', 'calm': '🌊', 'storm': '🌪️', 'fog': '🌫️'
    }[state.weather];
}
 
function startFishing() {
    playSound('throw');
    if (state.attempts <= 0) return;
    document.getElementById('action-btn').disabled = true;
    setTimeout(() => {
        let rand = Math.random();
        let legendaryChance = (state.weather === 'fog') ? 0.03 : 0.01;
        if (rand < 0.003) { playSound('unique'); handleUnique(); }
        else if (rand < legendaryChance) { playSound('legendary'); handleLegendary(); }
        else if (state.bonuses.mask) { catchFish(true); state.bonuses.mask = false; state.attempts--; }
        else if (rand < getBonusChance()) { playSound('bonus'); handleBonus(); }
        else if (rand < ((state.weather === 'storm') ? 0.7 : 0.4)) {
            let item = trash[Math.floor(Math.random() * trash.length)];
            logCatch(item, 0, true, 'catch');
            if (state.bonuses.filter) state.bonuses.filter = false; else state.attempts--;
        } else { catchFish(false); state.attempts--; }
        triggerDebuff(); updateUI(); renderHistory();
        if (state.attempts === 0 && document.getElementById('modal').classList.contains('hidden')) endGame();
        else document.getElementById('action-btn').disabled = false;
    }, 600);
}
 
function handleUnique() {
    let uItem = uniqueItems[Math.floor(Math.random() * uniqueItems.length)];
    logCatch(uItem, 0, false, 'unique');
    alert("Редкий артефакт: " + uItem);
    if (uItem === "Глубоководное нечто") {
        state.catches.forEach(c => { if (c.isTrash) { c.name = fishes[Math.floor(Math.random() * fishes.length)]; c.weight = parseFloat((20 + Math.random() * 10).toFixed(1)); c.isTrash = false; c.type = 'catch'; } });
        alert("Хлам превращен в глубинных гигантов!");
    } else showDiceModal();
}
 
function showDiceModal() {
    document.getElementById('action-btn').disabled = true;
    const modal = document.getElementById('modal');
    const list = document.getElementById('modal-fish-list');
    list.innerHTML = '<h3>Игральная кость</h3>';
    const rollBtn = document.createElement('button');
    rollBtn.className = 'fish-btn'; rollBtn.innerText = "Бросить кость";
    rollBtn.onclick = () => {
        let points = Math.floor(Math.random() * 6) + 1;
        list.innerHTML = `<p>Выпало: ${points}</p>`;
        const btn1 = document.createElement('button'); btn1.innerText = `+${points} попыток`; btn1.onclick = () => { state.attempts += points; closeDice(); };
        const btn2 = document.createElement('button'); btn2.innerText = `Множитель x${(1 + (points * 0.1)).toFixed(1)}`; btn2.onclick = () => { state.diceMultiplier = (1 + (points * 0.1)); closeDice(); };
        list.appendChild(btn1); list.appendChild(btn2);
    };
    list.appendChild(rollBtn);
    modal.classList.remove('hidden');
}
 
function closeDice() { document.getElementById('modal').classList.add('hidden'); document.getElementById('action-btn').disabled = false; updateUI(); }
 
function handleLegendary() {
    let item = legendaryItems[Math.floor(Math.random() * legendaryItems.length)];
    logCatch(item, 0, false, 'legendary');
    if (item === "Чешуя Левиафана") { state.attempts += 5; state.leviathanBonus = 2.0; alert("Легендарная находка: Чешуя Левиафана! (+5 попыток, бонус к весу)"); }
    else if (item === "Послание в бутылке") { state.hasMessageInBottle = true; alert("Легендарная находка: Послание в бутылке!"); }
    else if (item === "Компас потерянных глубин") { state.hasCompass = true; alert("Легендарная находка: Компас!"); }
    else if (item === "Запечатанный сундук") { let count = 3 + Math.floor(Math.random() * 3); for(let i=0; i<count; i++) catchFish(false, true); alert("Сундук!"); }
}
 
function catchFish(isMasked, isFromChest = false) {
    let isDuck = state.activeDebuffs.some(d => d.includes("Утка"));
    let isRak = state.activeDebuffs.some(d => d.includes("Рак"));
    let name = fishes[Math.floor(Math.random() * fishes.length)];
    let weight;
    if (isDuck) {
        if (Math.random() < 0.5) { name = trash[Math.floor(Math.random() * trash.length)]; weight = 0; }
        else weight = parseFloat((0.1 + Math.random() * 0.4).toFixed(1));
    } else {
        if (isMasked) weight = parseFloat((6.5 + Math.random() * 3.4).toFixed(1));
        else if (Math.random() < 0.05) { weight = parseFloat((10.0 + Math.random() * 5.0).toFixed(1)); state.luckyFisher = true; }
        else weight = parseFloat((0.1 + Math.random() * 6.4).toFixed(1));
    }
    weight += state.leviathanBonus;
    let bonusWeight = 0;
    if (isRak) { if (weight > 2.5) weight = 2.5; if (state.hasMessageInBottle) { weight += 2.5; bonusWeight = 2.5; } }
    if (weight >= 10.0) playSound('successfull');
    logCatch(name, weight, (weight === 0), 'catch', false, bonusWeight, isFromChest);
    document.getElementById('message').innerText = `Поймал: ${name} (${weight.toFixed(1)} кг)`;
}
 
function handleBonus() {
    state.bonusCount++;
    let b = Math.random();
    if (b < 0.2) { state.attempts++; logCatch("Бонус: Катушка", 0, true, 'bonus'); }
    else if (b < 0.4) { state.bonuses.fins = true; logCatch("Бонус: Ласты", 0, true, 'bonus'); }
    else if (b < 0.6) { state.bonuses.mask = true; showModal(); logCatch("Бонус: Маска", 0, true, 'bonus'); }
    else if (b < 0.8) { state.bonuses.aquaCount++; logCatch("Бонус: Акваланг", 0, true, 'bonus'); }
    else { state.bonuses.filter = true; logCatch("Бонус: Фильтр", 0, true, 'bonus'); }
}
 
function getBonusChance() { return (state.weather === 'calm') ? 0.3 : 0.15; }
function triggerDebuff() {
    if (state.weather === 'storm' || Math.random() > 0.25) return;
    let type = Math.random(); let debuffText = "";
    if (type < 0.33 && state.weather === 'calm') debuffText = "Дебаф: Рак";
    else if (type < 0.66 && state.weather === 'sunny') { let fish = state.catches.find(c => !c.isTrash && !c.isStolen && c.type === 'catch'); if (fish) { fish.isStolen = true; debuffText = "Дебаф: Чайка!"; } }
    else if (state.weather === 'rain') debuffText = "Дебаф: Утка";
    if (debuffText && !state.activeDebuffs.includes(debuffText)) { playSound('debuff'); state.activeDebuffs.push(debuffText); logCatch(debuffText, 0, true, 'debuff'); }
}
 
function logCatch(name, weight, isTrash, type, isRemoved = false, bonusWeight = 0, isFromChest = false) {
    state.catches.push({ name, weight, isTrash, type, isStolen: false, isRemoved, bonusWeight, isFromChest });
}
 
function renderHistory() {
    const list = document.getElementById('history-list'); list.innerHTML = '';
    state.catches.forEach(c => {
        const li = document.createElement('li');
        const icon = icons[c.name] || "🎣";
        li.innerHTML = `${icon} ${c.name} ${c.weight > 0 ? c.weight.toFixed(1)+' кг' : ''}`;
        list.appendChild(li);
    });
}
 
function updateUI() {
    let currentSum = state.catches.filter(c => !c.isRemoved && (c.type !== 'catch' || !c.isStolen || state.hasMessageInBottle)).reduce((s, c) => s + c.weight, 0);
    document.getElementById('score').innerText = `Улов: ${(currentSum * state.diceMultiplier).toFixed(1)} кг | Попыток: ${state.attempts}`;
}
 
function endGame() {
    let validCatches = state.catches.filter(c => !c.isRemoved && (c.type !== 'catch' || !c.isStolen || state.hasMessageInBottle) && c.weight > 0);
    let totalBase = validCatches.reduce((s, c) => s + c.weight, 0);
    let total = totalBase * state.diceMultiplier;
    if (state.bonuses.fins) total *= 2;
    document.getElementById('final-result').innerHTML = `<strong>Итог: ${total.toFixed(2)} кг</strong>`;
    document.getElementById('final-result').classList.remove('hidden');
}
