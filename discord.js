const { Client, GatewayIntentBits } = require('discord.js');

// 1-ci BOTUN QURULMASI
const bot1 = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] 
});

bot1.on('ready', () => {
    console.log(`✅ 1-ci Bot Aktivdir: ${bot1.user.tag}`);
});

// 2-ci BOTUN QURULMASI
const bot2 = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] 
});

bot2.on('ready', () => {
    console.log(`✅ 2-ci Bot Aktivdir: ${bot2.user.tag}`);
});

// TOKENLƏRİ İŞƏ SALMAQ
// Secrets bölməsində adları necə yazmısınızsa, bura da elə yazın
bot1.login(process.env.DISCORD_TOKEN).catch(err => console.log("1-ci Bot xətası: " + err));
bot2.login(process.env.DISCORD_TOKEN_2).catch(err => console.log("2-ci Bot xətası: " + err));
