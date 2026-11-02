const crypto = require('crypto');
async function main() {
    const privDer = Buffer.from(process.env.PRIVATE_KEY_BASE64, 'base64');
    const privateKey = crypto.createPrivateKey({ key: privDer, format: 'der', type: 'pkcs8' });
    const username = process.env.USERNAME;
    const days = parseInt(process.env.DAYS, 10);
    
    const expires = Math.floor(Date.now() / 1000) + (days * 86400);
    const payload = `${username}|${expires}`;
    
    const signature = crypto.sign('sha256', Buffer.from(payload), {
        key: privateKey, dsaEncoding: 'ieee-p1363'
    });
    const token = `${Buffer.from(payload).toString('base64url')}.${signature.toString('base64url')}`;
    
    console.log(`TOKEN: ${token}`);
    
    const resp = await fetch(`https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            chat_id: process.env.TG_CHAT_ID, 
            text: `✅ Токен для ${username} на ${days} дней:\n\n\`${token}\``, 
            parse_mode: 'Markdown' 
        })
    });
    if (resp.ok) console.log("Токен отправлен в Telegram!");
}
main().catch(console.error);
