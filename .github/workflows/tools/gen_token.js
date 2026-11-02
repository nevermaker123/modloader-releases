const crypto = require('crypto');

async function main() {
    console.log("1. Начинаем генерацию...");
    const privDer = Buffer.from(process.env.PRIVATE_KEY_BASE64, 'base64');
    let privateKey;
    try {
        privateKey = crypto.createPrivateKey({ key: privDer, format: 'der', type: 'pkcs8' });
    } catch (e) {
        console.error("❌ ОШИБКА: Не удалось прочитать PRIVATE_KEY_BASE64. Проверь секреты в GitHub.");
        return;
    }

    const username = process.env.USERNAME || "Player";
    const days = parseInt(process.env.DAYS || "30", 10);
    
    const expires = Math.floor(Date.now() / 1000) + (days * 86400);
    const payload = `${username}|${expires}`;
    const signature = crypto.sign('sha256', Buffer.from(payload), {
        key: privateKey, dsaEncoding: 'ieee-p1363'
    });
    
    // Собираем токен в формате base64url (без знаков =,+ и /)
    const token = `${Buffer.from(payload).toString('base64url')}.${signature.toString('base64url')}`;
    console.log(`2. Токен сгенерирован: ${token}`);

    const tgToken = process.env.TG_BOT_TOKEN;
    const chatId = process.env.TG_CHAT_ID;
    
    if (!tgToken || !chatId) {
        console.error("❌ ОШИБКА: Не заданы TG_BOT_TOKEN или TG_CHAT_ID в секретах GitHub.");
        return;
    }

    console.log(`3. Отправляем в Telegram (chat_id: ${chatId})...`);
    const text = `✅ Токен для ${username} на ${days} дней:\n\n\`${token}\``;
    
    try {
        const resp = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' })
        });
        
        const data = await resp.json();
        if (resp.ok && data.ok) {
            console.log("✅ Токен успешно отправлен в Telegram!");
        } else {
            console.error("❌ ОШИБКА ОТ TELEGRAM:", JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error("❌ ОШИБКА СЕТИ:", err.message);
    }
}

main().catch(console.error);
