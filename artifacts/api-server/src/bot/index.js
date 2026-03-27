// --- 1. ADIM: 7/24 AKTİF TUTMA SİSTEMİ (EXPRESS) ---
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Bot (Nexsus-) 7/24 Aktif!');
});

app.listen(port, () => {
  console.log(`Uptime linki hazır: http://localhost:${port}`);
});

// --- 2. ADIM: BOT KURULUMU ---
const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  EmbedBuilder, 
  REST, 
  Routes 
} = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Kanal ID'leriniz
const ADMIN_LOG_KANAL = '1484800776059486278';  
const SONUC_KANAL = '1481977630436622499';      

// Slash Komut Ayarı
const commands = [{ 
  name: 'başvuru-kur', 
  description: 'Admin başvuru butonunu kanala gönderir.' 
}];

// --- 3. ADIM: BOT HAZIR OLDUĞUNDA ---
client.once('ready', async () => {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log(`✅ Bot Aktif: ${client.user.tag}`);
  } catch (error) { console.error("Hata:", error); }
});

// --- 4. ADIM: ETKİLEŞİMLER (BUTON, MODAL, KOMUT) ---
client.on('interactionCreate', async (interaction) => {
  
  // Komut Kullanımı (/başvuru-kur)
  if (interaction.isChatInputCommand() && interaction.commandName === 'başvuru-kur') {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('form_ac').setLabel('Admin Başvuru Formu').setStyle(ButtonStyle.Success)
    );
    await interaction.reply({ content: 'Buton başarıyla kuruldu!', ephemeral: true });
    await interaction.channel.send({ content: 'Admin olmak için aşağıdaki formu doldurun:', components: [row] });
  }

  // Formu Açma (Butona basınca)
  if (interaction.isButton() && interaction.customId === 'form_ac') {
    const modal = new ModalBuilder().setCustomId('admin_modal').setTitle('Admin Başvuru Formu');
    
    const q1 = new TextInputBuilder().setCustomId('adYas').setLabel("Adın ve yaşın nedir?").setStyle(TextInputStyle.Short).setRequired(true);
    const q2 = new TextInputBuilder().setCustomId('tanit').setLabel("Bize kendini tanıtır mısın?").setStyle(TextInputStyle.Paragraph).setRequired(true);
    const q3 = new TextInputBuilder().setCustomId('neden').setLabel("Neden Admin olmak istiyorsun?").setStyle(TextInputStyle.Paragraph).setRequired(true);
    
    modal.addComponents(
      new ActionRowBuilder().addComponents(q1), 
      new ActionRowBuilder().addComponents(q2), 
      new ActionRowBuilder().addComponents(q3)
    );
    await interaction.showModal(modal);
  }

  // Formu Gönderme (Log Kanalına düşer)
  if (interaction.isModalSubmit() && interaction.customId === 'admin_modal') {
    const embed = new EmbedBuilder()
      .setTitle('Yeni Başvuru!')
      .addFields(
        { name: 'Aday', value: `<@${interaction.user.id}>` },
        { name: 'Ad/Yaş', value: interaction.fields.getTextInputValue('adYas') },
        { name: 'Tanıtım', value: interaction.fields.getTextInputValue('tanit') },
        { name: 'Neden?', value: interaction.fields.getTextInputValue('neden') }
      )
      .setColor('Blue')
      .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`onay_${interaction.user.id}`).setLabel('Onayla').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`red_${interaction.user.id}`).setLabel('Reddet').setStyle(ButtonStyle.Danger)
    );

    const logKanal = client.channels.cache.get(ADMIN_LOG_KANAL);
    if(logKanal) {
      await logKanal.send({ embeds: [embed], components: [buttons] });
    }
    await interaction.reply({ content: 'Başvurunuz başarıyla iletildi!', ephemeral: true });
  }

  // Onay veya Red Butonları
  if (interaction.isButton() && (interaction.customId.startsWith('onay_') || interaction.customId.startsWith('red_'))) {
    const [islem, hedefId] = interaction.customId.split('_');
    const sonucKanal = client.channels.cache.get(SONUC_KANAL);

    if (islem === 'onay') { 
      await sonucKanal?.send(`🎉 <@${hedefId}> başvurunuz onaylandı!`); 
    } else { 
      await sonucKanal?.send(`❌ <@${hedefId}> başvurunuz reddedildi.`); 
    }
    await interaction.update({ content: `✅ İşlem yapıldı.`, components: [] });
  }
});

// --- 5. ADIM: GİRİŞ ---
client.login(process.env.DISCORD_TOKEN);
