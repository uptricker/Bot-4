const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const cookies = JSON.parse(fs.readFileSync('fbstate.json', 'utf-8'));
    await page.setCookie(...cookies);

    await page.goto('https://www.messenger.com/t/24292795350336668', { waitUntil: 'networkidle2' });

    console.log('✅ Logged in and opened group chat');

    let lastSeenMessage = "";

    async function sendMessage(msg) {
        await page.type('[contenteditable="true"]', msg);
        await page.keyboard.press('Enter');
    }

    await page.exposeFunction('handleMessages', async () => {
        const messages = await page.$$eval('div[role="row"]', rows =>
            rows.map(row => row.innerText).filter(msg => msg)
        );

        const lastMessage = messages[messages.length - 1] || '';
        if (lastMessage === lastSeenMessage) return;
        lastSeenMessage = lastMessage;

        console.log("📩 New message:", lastMessage);

        if (lastMessage.includes('/bot')) {
            await sendMessage('🤖 Bot is active!');
        } else if (lastMessage.includes('/hello')) {
            await sendMessage('👋 Hello from the bot!');
        } else if (lastMessage.includes('/wanana')) {
            await sendMessage('🎉 Wanana is here!');
        } else if (lastMessage.includes('/uid')) {
            const uid = "100034518066687";
            await sendMessage(`🆔 Your UID is: ${uid}`);
        }
    });

    // Auto Welcome messages based on time
    setInterval(async () => {
        const hour = new Date().getHours();
        if (hour === 7) {
            await sendMessage("🌞 Good morning group!");
        } else if (hour === 13) {
            await sendMessage("🍱 Lunch time! Enjoy your meal 😋");
        } else if (hour === 18) {
            await sendMessage("🌇 Good evening everyone!");
        }
    }, 3600000); // check every 1 hour

    // Command handler runs every 5 seconds
    setInterval(async () => {
        try {
            await page.evaluate(async () => { await window.handleMessages(); });
        } catch (e) {
            console.error("❌ Error handling message:", e.message);
        }
    }, 5000);
})();
