// --- КОНФИГУРАЦИЯ ЗВУКОВ --- 
const baseUrl = 'https://raw.githubusercontent.com/furbolog-hub/Fish_game/main/sounds/'; 

const sounds = { 
    throw: new Audio(baseUrl + '
```throw.ogg'), 
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
    diceMultiplier: 1,
    filtersUsed: 0,
    wasAttacked: false,
    transmutedCount: 0
}; 

const fishes = ["Палтус", "Палия", "Белый амур", "Щука", "Семга", "Солнечник", "Подкаменщик", "Сом", "Окунь", "Плотва", "Кижуч", "Семотилус", "Меланотения", "Горчак", "Жерех", "Ринихт", "Лосось", "Корюшка", "Судак", "Арктический голец", "Красноперка", "Золотая форель", "Фундулюс", "Озерный сиг", "Карпиодес"]; 
const trash = ["Старый башмак", "Спутанная леска", "Сломанный поплавок", "Ржавый крючок", "Половина блесны", "Размокший кусок бумаги"]; 
const legendaryItems = ["Чешуя Левиафана", "Послание в бутылке", "Компас потерянных глубин", "Запечатанный сундук"]; 
const uniqueItems = ["Глубоководное нечто", "Игральная кость"]; 

const icons = { 
    "Палтус": "🐟", "Палия": "🐠", "Белый амур": "🐟", "Щука": "🦈", "Семга": "🍣", "Солнечник": "☀️", "Подкаменщик": "🐡", "Сом": "〰️", "Окунь": "🐟", "Плотва": "🐟", "Кижуч": "🐠", "Семотилус": "🐟", "Меланотения": "🌈", "Горчак": "🐟", "Жерех": "🐟", "Ринихт": "🐟", "Лосось": "🎣", "Корюшка": "🐟", "Судак": "🐟", "Арктический голец": "❄️", "Красноперка": "🎈", "Золотая форель": "✨", "Фундулюс": "🐟", "Озерный сиг": "🐟", "Карпиодес": "🐟", "Старый башмак": "👞", "Спутанная леска": "🧵", "Сломанный поплавок": "🪡", "Ржавый крючок": "🪝", "Половина блесны": "🪙", "Размокший кусок бумаги": "📄", "Чешуя Левиафана": "🐉", "Послание в бутылке": "📜", "Компас потерянных глубин": "🧭", "Запечатанный сундук": "📦", "Глубоководное нечто": "🐙", "Игральная кость": "🎲" 
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
    const actionBtn = document.getElementById('action-btn');
    const handbookBtn = document.getElementById('handbook-btn');
    const weatherIcon = document.getElementById('weather-icon');

    if (actionBtn) actionBtn.addEventListener('click', startFishing); 
    if (handbookBtn) handbookBtn.addEventListener('click', toggleHandbook);
    if (weatherIcon) weatherIcon.onclick = toggleWeatherHelp; 

    updateWeather(); 
    setInterval(updateWeather, 7200000); 
    updateUI(); 
}); 

function toggleHandbook() {
    const modal = document.getElementById('handbook-modal');
    if (modal) modal.classList.toggle('hidden', !modal.classList.contains('hidden'));
    renderHandbook();
}

function renderHandbook() {
    const container = document.getElementById('handbook-data');
    if (!container || container.innerHTML !== "") return;
    if (typeof gameHandbook === 'undefined') {
        container.innerHTML = "Ошибка: Данные справочника не найдены.";
        return;
    }
    let html = "<h1>Справочник рыбака</h1>";
    for (let section in gameHandbook) {
        const data = gameHandbook[section];
        html += `<h2>${data.title}</h2><ul>`;
        if (Array.isArray(data.items)) {
            data.items.forEach(item => { html += `<li>${item}</li>`; });
        } else {
            for (let key in data.items) { html += `<li><strong>${key}:</strong> ${data.items[key]}</li>`; }
        }
        html += "</ul>";
    }
    container.innerHTML = html;
}

function toggleWeatherHelp() { 
    const el = document.getElementById('weather-help'); 
    if (!el) return;
    if (!el.classList.contains('active')) { 
        const helpText = { 
            'sunny': '☀️ Солнечно: Шанс атаки чайки!', 
            'rain': '🌧️ Дождь: Появление утки.', 
            'calm': '🌊 Штиль: Высокий шанс бонусов.', 
            'storm': '🌪️ Шторм: Много хлама, дебаффы отключены.', 
            'fog': '🌫️ Туман: Повышенный шанс легендарных предметов.',
            'eclipse': '🌑 Затмение: Шанс уникальных артефактов удвоен!',
            'golden': '✨ Золотой час: Рыба весит больше на +2.0 кг.',
            'thunder': '⚡ Гроза: Риск молнии без Акваланга.'
        }; 

        let htmlContent = `<p>${helpText[state.weather]}</p>`; 
        if (state.hasCompass) { 
            htmlContent += `<button onclick="changeWeather()" style="width:100%; padding:10px; margin-top:10px; border-radius:10px;">Сменить погоду</button>`; 
        } 

        document.getElementById('help-text').innerHTML = htmlContent; 
        el.classList.add('active'); 
    } else { 
        el.classList.remove('active'); 
    } 
} 

function changeWeather() { 
    updateWeather(); 
    const el = document.getElementById('weather-help');
    if (el) el.classList.remove('active'); 
} 

function updateWeather() { 
    const weathers = ['sunny', 'rain', 'calm', 'storm', 'fog', 'eclipse', 'golden', 'thunder']; 
    state.weather = weathers[Math.floor(Math.random() * weathers.length)]; 

    const iconEl = document.getElementById('weather-icon');
    if (iconEl) {
        iconEl.innerText = { 
            'sunny': '☀️', 'rain': '🌧️', 'calm': '🌊', 'storm': '🌪️', 'fog': '🌫️', 'eclipse': '🌑', 'golden': '✨', 'thunder': '⚡' 
        }[state.weather]; 
    }
} 

function startFishing() { 
    playSound('throw'); 
    if (state.attempts <= 0) return; 

    const actionBtn = document.getElementById('action-btn');
    if (actionBtn) actionBtn.disabled = true; 

    if (state.weather === 'thunder' && Math.random() < 0.2 && state.bonuses.aquaCount === 0) {
        alert("⚡ Молния ударила в воду! Попытка потеряна.");
        state.attempts--;
        updateUI();
        if (actionBtn) actionBtn.disabled = false;
        return;
    }

    setTimeout(() => { 
        let rand = Math.random(); 
        let legendaryChance = (state.weather === 'fog') ? 0.03 : 0.01; 
        let uniqueChance = (state.weather === 'eclipse') ? 0.006 : 0.003;

        if (rand < uniqueChance) { 
            playSound('unique'); 
            handleUnique(); 
        } else if (rand < legendaryChance) { 
            playSound('legendary'); 
            handleLegendary(); 
        } else if (state.bonuses.mask) { 
            catchFish(true); 
            state.bonuses.mask = false; 
            state.attempts--; 
        } else if (rand < getBonusChance()) { 
            playSound('bonus'); 
            handleBonus(); 
        } else if (rand < ((state.weather === 'storm' || state.weather === 'thunder') ? 0.7 : 0.4)) { 
            let item = trash[Math.floor(Math.random() * trash.length)]; 
            logCatch(item, 0, true, 'catch'); 
            if (state.bonuses.filter) { 
                state.bonuses.filter = false; 
                state.filtersUsed++;
            } else { 
                state.attempts--; 
            } 
        } else { 
            catchFish(false); 
            state.attempts--; 
        } 

        triggerDebuff(); 
        updateUI(); 
        renderHistory(); 

        const modal = document.getElementById('modal');
        if (state.attempts === 0 && (!modal || modal.classList.contains('hidden'))) { 
            endGame(); 
        } else if (actionBtn) { 
            actionBtn.disabled = false; 
        } 
    }, 600); 
} 

function handleUnique() { 
    let uItem = uniqueItems[Math.floor(Math.random() * uniqueItems.length)]; 
    logCatch(uItem, 0, false, 'unique'); 
    if (uItem === "Глубоководное нечто") { 
        let count = 0;
        state.catches.forEach(c => { 
            if (c.isTrash) { 
                c.name = fishes[Math.floor(Math.random() * fishes.length)]; 
                c.weight = parseFloat((20 + Math.random() * 10).toFixed(1)); 
                c.isTrash = false; 
                c.type = 'catch'; 
                count++;
            } 
        }); 
        state.transmutedCount += count;
        alert(`🐙 Глубоководное нечто превратило ${count} ед. хлама в гигантов!`); 
    } else { 
        showDiceModal(); 
    } 
} 

function showDiceModal() { 
    const modal = document.getElementById('modal'); 
    const list = document.getElementById('modal-fish-list'); 
    if (!modal || !list) return;

    list.innerHTML = '<h3>Игральная кость</h3>'; 
    const rollBtn = document.createElement('button'); 
    rollBtn.className = 'fish-btn'; 
    rollBtn.innerText = "Бросить кость"; 
    rollBtn.onclick = () => { 
        let points = Math.floor(Math.random() * 6) + 1; 
        list.innerHTML = `<p>Выпало: ${points}</p>`; 
        const btn1 = document.createElement('button'); 
        btn1.className = 'fish-btn'; 
        btn1.innerText = `+${points} попыток`; 
        btn1.onclick = () => { state.attempts += points; closeDice(); }; 
        const btn2 = document.createElement('button'); 
        btn2.className = 'fish-btn'; 
        btn2.innerText = `Множитель x${(1 + (points * 0.1)).toFixed(1)}`; 
        btn2.onclick = () => { state.diceMultiplier = (1 + (points * 0.1)); closeDice(); }; 
        list.appendChild(btn1); list.appendChild(btn2); 
    }; 
    list.appendChild(rollBtn); 
    modal.classList.remove('hidden'); 
} 

function closeDice() { 
    const modal = document.getElementById('modal');
    if (modal) modal.classList.add('hidden'); 
    const actionBtn = document.getElementById('action-btn');
    if (actionBtn) actionBtn.disabled = false; 
    updateUI(); 
} 

function handleLegendary() { 
    let item = legendaryItems[Math.floor(Math.random() * legendaryItems.length)]; 
    logCatch(item, 0, false, 'legendary'); 
    if (item === "Чешуя Левиафана") { 
        state.attempts += 5; state.leviathanBonus = 2.0; alert("Чешуя Левиафана! (+5 попыток, бонус к весу)"); 
    } else if (item === "Послание в бутылке") { 
        state.hasMessageInBottle = true; alert("Послание в бутылке! (Защита от краж)"); 
    } else if (item === "Компас потерянных глубин") { 
        state.hasCompass = true; alert("Компас потерянных глубин! (Управление погодой)"); 
    } else if (item === "Запечатанный сундук") { 
        let count = 3 + Math.floor(Math.random() * 3); 
        for(let i = 0; i < count; i++) { catchFish(false, true); } 
        alert("Запечатанный сундук! Внутри много рыбы"); 
    } 
} 

function catchFish(isMasked, isFromChest = false) { 
    let isDuck = state.activeDebuffs.some(d => d.includes("Утка")); 
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
    if (state.weather === 'golden') weight += 2.0;
    weight += state.leviathanBonus; 
    if (weight >= 10.0) playSound('successfull'); 
    logCatch(name, weight, (weight === 0), 'catch', false, 0, isFromChest); 
    const msg = document.getElementById('message');
    if (msg) msg.innerText = `Поймал: ${name} (${weight.toFixed(1)} кг)`; 
} 

function handleBonus() { 
    state.bonusCount++; 
    let b = Math.random(); 
    if (b < 0.2) { state.attempts++; alert("Катушка! +1 попытка"); } 
    else if (b < 0.4) { state.bonuses.fins = true; alert("Ласты! x2"); } 
    else if (b < 0.6) { state.bonuses.mask = true; alert("Маска!"); showModal(); } 
    else if (b < 0.8) { state.bonuses.aquaCount++; alert("Акваланг!"); } 
    else { state.bonuses.filter = true; alert("Фильтр!"); } 
} 

function getBonusChance() { return (state.weather === 'calm') ? 0.3 : 0.15; } 

function triggerDebuff() { 
    if (state.weather === 'storm' || state.weather === 'thunder' || Math.random() > 0.25) return; 
    let debuffText = ""; 
    if (state.weather === 'sunny') { 
        let fish = state.catches.find(c => !c.isTrash && !c.isStolen && c.type === 'catch'); 
        if (fish) { fish.isStolen = true; debuffText = "Дебаф: Чайка стащила рыбу!"; state.wasAttacked = true; } 
    } else if (state.weather === 'rain') { 
        debuffText = "Дебаф: Утка мешает клёву!"; state.wasAttacked = true;
    } 
    if (debuffText && !state.activeDebuffs.includes(debuffText)) { 
        playSound('debuff'); state.activeDebuffs.push(debuffText); logCatch(debuffText, 0, true, 'debuff'); 
    } 
} 

function logCatch(name, weight, isTrash, type, isRemoved = false, bonusWeight = 0, isFromChest = false) { 
    state.catches.push({ name, weight, isTrash, type, isStolen: false, isRemoved, bonusWeight, isFromChest }); 
} 

function renderHistory() { 
    const list = document.getElementById('history-list'); 
    if (!list) return;
    list.innerHTML = ''; 
    state.catches.forEach(c => { 
        const li = document.createElement('li'); 
        const icon = icons[c.name] || "🎣"; 
        const weightRank = getWeightIcon(c.weight); 
        if (c.isRemoved) { 
            li.style.color = "#ffc107"; li.style.textDecoration = "line-through"; li.innerText = `${icon} ${c.name} (Удалено)`; 
        } else if (c.isStolen) { 
            if (state.hasMessageInBottle) { li.innerText = `${icon} ${c.name} (Вернуто: ${c.weight.toFixed(1)} кг)`; } 
            else { li.className = 'strikethrough'; li.innerText = `${icon} ${c.name} (Украдено: ${c.weight.toFixed(1)} кг)`; } 
        } else { 
            li.className = uniqueItems.includes(c.name) ? 'log-unique' : (legendaryItems.includes(c.name) ? 'log-legendary' : (c.type === 'bonus' ? 'log-bonus' : (c.type === 'debuff' ? 'log-debuff' : ''))); 
            li.innerHTML = `${c.isFromChest ? "📦 " : ""}${icon} ${weightRank} ${c.name} ${c.weight > 0 ? c.weight.toFixed(1)+' кг' : ''}`; 
        } 
        list.appendChild(li); 
    }); 
} 

function updateUI() { 
    let currentSum = state.catches 
    .filter(c => !c.isRemoved && (c.type !== 'catch' || !c.isStolen || state.hasMessageInBottle)) 
    .reduce((s, c) => s + c.weight, 0); 
    const scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.innerText = `Улов: ${(currentSum * state.diceMultiplier).toFixed(1)} кг | Попыток: ${state.attempts}`; 
} 

function showModal() { 
    const actionBtn = document.getElementById('action-btn');
    if (actionBtn) actionBtn.disabled = true; 
    const list = document.getElementById('modal-fish-list'); 
    const modal = document.getElementById('modal');
    if (!list || !modal) return;

    list.innerHTML = ''; 
    const cancelBtn = document.createElement('button'); 
    cancelBtn.className = 'fish-btn'; cancelBtn.innerText = "Ничего не удалять"; 
    cancelBtn.onclick = () => { 
        modal.classList.add('hidden'); 
        if (state.attempts === 0) endGame(); 
        else if (actionBtn) actionBtn.disabled = false; 
    }; 
    list.appendChild(cancelBtn); 
    state.catches.filter(c => !c.isStolen && !c.isRemoved && c.type === 'catch').forEach((c) => { 
        const btn = document.createElement('button'); btn.className = 'fish-btn'; 
        btn.innerText = `Удалить: ${c.name} (${c.weight.toFixed(1)} кг)`; 
        btn.onclick = () => { 
            c.isRemoved = true; 
            modal.classList.add('hidden'); 
            updateUI(); 
            renderHistory(); 
            if (state.attempts === 0) endGame(); 
            else if (actionBtn) actionBtn.disabled = false; 
        }; 
        list.appendChild(btn); 
    }); 
    modal.classList.remove('hidden'); 
} 

function endGame() { 
    let validCatches = state.catches.filter(c => !c.isRemoved && (c.type === 'catch' && (!c.isStolen || state.hasMessageInBottle)) && c.weight > 0); 
    let totalBase = validCatches.reduce((s, c) => s + c.weight, 0); 
    let maxWeight = validCatches.length > 0 ? Math.max(...validCatches.map(c => c.weight)) : 0; 
    let total = totalBase * state.diceMultiplier; 
    if (state.bonuses.aquaCount > 0 && validCatches.length > 0) { 
        total = ((totalBase - maxWeight) + (maxWeight * 3 * state.bonuses.aquaCount)) * state.diceMultiplier; 
    } 
    if (state.bonuses.fins) total *= 2; 

    let achs = []; 
    if (state.luckyFisher) achs.push("🏆 Удачливый рыбак"); 
    if (state.bonusCount >= 3) achs.push("✨ Любимчик Фортуны"); 
    if (validCatches.length > 0 && validCatches.every(c => c.weight >= 10.0)) achs.push("🦈 Акула бизнеса"); 
    if (state.transmutedCount >= 5) achs.push("🔬 Трансмутатор"); 
    if (!state.wasAttacked && state.catches.length > 5) achs.push("🛡️ Неуловимый"); 
    if (total >= 500) achs.push("🐘 Тяжеловес"); 
    if (state.filtersUsed >= 2) achs.push("🌿 Эколог"); 

    if (achs.length > 0) playSound('achievement'); 
    const now = new Date(); 
    const dStr = now.toLocaleDateString('ru-RU'); 
    const tStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }); 

    const finalEl = document.getElementById('final-result');
    if (finalEl) {
        finalEl.innerHTML = ` 
            <strong>Итог: ${total.toFixed(2)} кг</strong> 
            <div style="margin-top:10px;">${achs.join('<br>')}</div> 
            <div style="margin-top: 10px; padding: 5px; background: rgba(128, 128, 128, 0.2); border-radius: 5px; color: #fff; font-weight: bold;">
            ${dStr} | ${tStr}</div>`; 
        finalEl.classList.remove('hidden'); 
    }
}
