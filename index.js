const express = require("express");
const app = express();

// UptimeRobot için site
app.get("/", (req, res) => {
  res.send("Bot aktif!");
});

app.listen(3000, () => {
  console.log("Web server çalışıyor");
});


// Discord bot
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
  console.log(`Bot aktif: ${client.user.tag}`);
});

client.login(process.env.TOKEN);
