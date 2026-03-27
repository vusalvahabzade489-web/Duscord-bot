import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CategoryChannel,
  ChannelType,
  EmbedBuilder,
  Guild,
  GuildMember,
  Interaction,
  MessageFlags,
  PermissionFlagsBits,
  TextChannel,
  time,
  TimestampStyles,
  StringSelectMenuBuilder, // Yeni eklendi
} from "discord.js";
import {
  BUTTON_IDS,
  CATEGORIES,
  CategoryValue,
  COLORS,
  SERVER_NAME,
  STAFF_ROLE_ID,
  TICKET_CATEGORY_NAME,
} from "./config.js";
import { logger } from "../lib/logger.js";

const LOG_KANAL_ID = "1465752031292821599";
const BANNER_URL = "https://cdn.discordapp.com/attachments/1458795608453414965/1486283995158286427/1774366273895.png?ex=69c642d6&is=69c4f156&hm=9593f51d20c2637b293e8ccf3820b48f0acad79b6e5e33d05c7d7aa15b2bf600&";

// --- YENİ: BU FONKSİYON ANA MENÜYÜ FOTOĞRAFLA GÖNDERİR ---
export async function sendTicketMenu(channel: TextChannel) {
  const setupEmbed = new EmbedBuilder()
    .setColor(COLORS.BLURPLE)
    .setTitle(`${SERVER_NAME} DESTEK MERKEZİ`)
    .setDescription(
      "**Bir sorun mu yaşıyorsunuz?**\n\n" +
      "Aşağıdaki menüden size en uygun kategoriyi seçerek bizimle iletişime geçebilirsiniz.\n\n" +
      "🎮 **Oyun İçi Destek:** Oyun içinde yaşanan problemler için.\n" +
      "🛠️ **Oyun Dışı Destek:** Teknik hatalar, bug ve şikayet için.\n" +
      "💎 **Bağış (Donate):** Sunucuya destek olmak ve ortaklık için."
    )
    .setImage(BANNER_URL) // İSTEDİĞİN FOTOĞRAF BURADA
    .setFooter({ text: `${SERVER_NAME} | Profesyonel Destek Hattı` });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("ticket_category_select")
    .setPlaceholder("Kategori seçerek biletinizi oluşturun...")
    .addOptions(
      CATEGORIES.map((cat) => ({
        label: cat.label,
        value: cat.value,
        emoji: cat.displayEmoji,
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  const resetBtn = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("reset_ticket_select")
      .setLabel("Seçenekleri Sıfırla")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🛠️")
  );

  await channel.send({ embeds: [setupEmbed], components: [row, resetBtn] });
}
// -------------------------------------------------------

async function getOrCreateCategory(guild: Guild): Promise<CategoryChannel> {
  const existing = guild.channels.cache.find(
    (c) =>
      c.type === ChannelType.GuildCategory &&
      c.name.toUpperCase() === TICKET_CATEGORY_NAME.toUpperCase(),
  ) as CategoryChannel | undefined;

  if (existing) return existing;

  return guild.channels.create({
    name: TICKET_CATEGORY_NAME,
    type: ChannelType.GuildCategory,
  }) as Promise<CategoryChannel>;
}

function getCategoryLabel(value: CategoryValue): string {
  const cat = CATEGORIES.find((c) => c.value === value);
  if (!cat) return value;
  return `${cat.displayEmoji} ${cat.label}`;
}

function getAccountAge(createdAt: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffYears = Math.floor(diffDays / 365);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffYears > 0) return `${diffYears} yıl önce`;
  if (diffMonths > 0) return `${diffMonths} ay önce`;
  return `${diffDays} gün önce`;
}

function buildTicketButtons(claimedBy?: string, claimedById?: string): ActionRowBuilder<ButtonBuilder> {
  const claimButton = new ButtonBuilder()
    .setCustomId(BUTTON_IDS.CLAIM_TICKET)
    .setStyle(claimedBy ? ButtonStyle.Success : ButtonStyle.Primary)
    .setLabel(claimedBy ? `✅ ${claimedBy} Devraldı` : "🙋 Devral")
    .setDisabled(!!claimedBy);

  const closeButton = new ButtonBuilder()
    .setCustomId(claimedById ? `${BUTTON_IDS.CLOSE_TICKET}_${claimedById}` : BUTTON_IDS.CLOSE_TICKET)
    .setLabel("Kapat")
    .setStyle(ButtonStyle.Danger)
    .setEmoji({ id: "1484836777067020428" });

  return new ActionRowBuilder<ButtonBuilder>().addComponents(claimButton, closeButton);
}

export async function openTicket(
  interaction: Interaction,
  categoryValue: CategoryValue,
): Promise<void> {
  if (!interaction.isStringSelectMenu()) return;

  const guild = interaction.guild;
  const member = interaction.member as GuildMember;

  if (!guild || !member) {
    await interaction.reply({
      content: "❌ Bu işlem sadece sunucularda yapılabilir.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const safeName = member.user.username.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const existingTicket = guild.channels.cache.find(
    (c) =>
      c.type === ChannelType.GuildText &&
      c.name === `🎫・ticket-${safeName}`,
  ) as TextChannel | undefined;

  if (existingTicket) {
    await interaction.editReply({
      content: `❌ Zaten açık bir ticketın var: ${existingTicket}`,
    });
    return;
  }

  const category = await getOrCreateCategory(guild);

  const ticketChannel = await guild.channels.create({
    name: `🎫・ticket-${safeName}`,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: member.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
        ],
      },
      {
        id: guild.members.me!.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
      {
        id: STAFF_ROLE_ID,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ],
  });

  const adminRoles = guild.roles.cache.filter(
    (r) => r.permissions.has(PermissionFlagsBits.Administrator) && !r.managed,
  );

  for (const [, adminRole] of adminRoles) {
    await ticketChannel.permissionOverwrites.create(adminRole, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      ManageChannels: true,
    });
  }

  const accountAge = getAccountAge(member.user.createdAt);
  const joinedAt = member.joinedAt
    ? time(member.joinedAt, TimestampStyles.RelativeTime)
    : "Bilinmiyor";

  const openEmbed = new EmbedBuilder()
    .setColor(COLORS.BLURPLE)
    .setAuthor({
      name: `Yeni Destek Talebi: ${member.user.username}`,
      iconURL: guild.iconURL() ?? undefined,
    })
    .setDescription(
      `Selam ${member}, biletin başarıyla açıldı.\n\n` +
        `Yetkililerimiz biletini devralana kadar lütfen sorununun ne olduğunu **detaylıca** yaz. Gereksiz etiketlerden kaçınmalısın.\n\n` +
        `*Bilet devralındığında butonlar güncellenecektir.*`,
    )
    .setImage(BANNER_URL) // BİLET İÇİNDEKİ FOTOĞRAF
    .addFields(
      { name: "📁 Kategori", value: getCategoryLabel(categoryValue), inline: true },
      { name: "⏳ Hesap Yaşı", value: accountAge, inline: true },
      { name: "📅 Katılım", value: joinedAt, inline: true },
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setFooter({ text: `${SERVER_NAME} | Destek Sistemi` })
    .setTimestamp();

  const actionRow = buildTicketButtons();

  await ticketChannel.send({
    content: `${member} <@&${STAFF_ROLE_ID}>`,
    embeds: [openEmbed],
    components: [actionRow],
  });

  await interaction.editReply({
    content: `✅ Ticketın oluşturuldu: ${ticketChannel}`,
  });

  logger.info({ user: member.user.tag, channel: ticketChannel.name, category: categoryValue }, "Ticket opened");
}

// ... (claimTicket, closeTicketPrompt, handleRating ve resetSelect fonksiyonları değişmeden buraya gelir)
export async function claimTicket(interaction: Interaction): Promise<void> {
  if (!interaction.isButton()) return;
  const member = interaction.member as GuildMember;
  const channel = interaction.channel as TextChannel;
  if (!member || !channel) return;
  const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
  const hasSupport = member.roles.cache.some((r) => r.id === STAFF_ROLE_ID) || isAdmin;
  if (!hasSupport) {
    await interaction.reply({ content: "❌ Bu ticketi devralmak için yetkili rolüne sahip olmalısın!", flags: MessageFlags.Ephemeral });
    return;
  }
  const updatedRow = buildTicketButtons(member.user.username, member.id);
  await interaction.update({ components: [updatedRow] });
  const claimEmbed = new EmbedBuilder().setColor(COLORS.GREEN).setDescription(`🎫 Yetkiliniz ${member} biletinizi devraldı.\n\nŞu andan itibaren sorununuzu çözmek için sizinle iletişimde olacak. Lütfen sabırla bekleyin.`).setFooter({ text: `${SERVER_NAME} | Destek Sistemi` }).setTimestamp();
  await channel.send({ embeds: [claimEmbed] });
}

export async function closeTicketPrompt(interaction: Interaction): Promise<void> {
  if (!interaction.isButton()) return;
  const parts = interaction.customId.split("_");
  const staffId = parts.length > 2 ? parts.slice(2).join("_") : "Bilinmiyor";
  await interaction.reply({
    embeds: [new EmbedBuilder().setColor(COLORS.YELLOW).setTitle("💛 Hizmetimizi Puanlayın").setDescription("Bileti kapatmadan önce yetkilinin performansını değerlendirin.").setFooter({ text: `${SERVER_NAME} | Destek Sistemi` })],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(`${BUTTON_IDS.RATING_1}_${staffId}`).setLabel("⭐ 1 Yıldız").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`${BUTTON_IDS.RATING_2}_${staffId}`).setLabel("⭐ 2 Yıldız").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`${BUTTON_IDS.RATING_3}_${staffId}`).setLabel("⭐ 3 Yıldız").setStyle(ButtonStyle.Primary),
      ),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(`${BUTTON_IDS.RATING_4}_${staffId}`).setLabel("⭐ 4 Yıldız").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`${BUTTON_IDS.RATING_5}_${staffId}`).setLabel("⭐ 5 Yıldız").setStyle(ButtonStyle.Primary),
      ),
    ],
  });
}

export async function handleRating(interaction: Interaction, stars: number): Promise<void> {
  if (!interaction.isButton()) return;
  const member = interaction.member as GuildMember;
  const channel = interaction.channel as TextChannel;
  const guild = interaction.guild;
  if (!member || !channel || !guild) return;
  const parts = interaction.customId.split("_");
  const staffId = parts.length > 2 ? parts.slice(2).join("_") : "Bilinmiyor";
  const staffMember = staffId !== "Bilinmiyor" ? await guild.members.fetch(staffId).catch(() => null) : null;
  const starDisplay = "⭐".repeat(stars) + "✩".repeat(5 - stars);
  const logChannel = guild.channels.cache.get(LOG_KANAL_ID) as TextChannel | undefined;
  if (logChannel) {
    const logEmbed = new EmbedBuilder().setColor(COLORS.BLURPLE).setTitle("📊 Yeni Puanlama").addFields({ name: "👤 Puanlayan", value: `${member} (${member.user.tag})`, inline: true }, { name: "👮 Puan Alan", value: staffMember ? `${staffMember} (${staffMember.user.tag})` : "Belirlenemedi", inline: true }, { name: "⭐ Puan", value: `${starDisplay} (${stars}/5)`, inline: false }).setTimestamp().setFooter({ text: `${SERVER_NAME} | Puanlama Sistemi` });
    await logChannel.send({ embeds: [logEmbed] });
  }
  const ratedEmbed = new EmbedBuilder().setColor(COLORS.RED).setTitle("🔒 Ticket Kapatıldı").setDescription(`Değerlendirmeniz için teşekkürler!\n\n**Puan:** ${starDisplay} (${stars}/5)\n\nTicket **${member.user.tag}** tarafından kapatıldı. Kanal **5 saniye** içinde silinecek...`).setFooter({ text: `${SERVER_NAME} | Destek Sistemi` }).setTimestamp();
  await interaction.update({ embeds: [ratedEmbed], components: [] });
  setTimeout(async () => { await channel.delete().catch(() => {}); }, 5000);
}

export async function resetSelect(interaction: Interaction): Promise<void> {
  if (!interaction.isButton()) return;
  await interaction.reply({ content: "🔧 Seçim sıfırlandı. Tekrar bir kategori seçebilirsiniz.", flags: MessageFlags.Ephemeral });
}