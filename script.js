document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('action-btn');
    if (!btn) {
        alert("Ошибка: Кнопка 'action-btn' не найдена в HTML!");
        return;
    }
    
    btn.addEventListener('click', () => {
        alert("Кнопка работает!");
        console.log("Нажатие зафиксировано");
    });
    
    btn.disabled = false;
    console.log("Скрипт загружен, кнопка активна");
});
