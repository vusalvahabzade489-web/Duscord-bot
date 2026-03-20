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
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { BUTTON_IDS, COLORS, TICKET_CATEGORY_NAME } from "./config.js";
import { logger } from "../lib/logger.js";

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

export async function openTicket(
  interaction: Interaction,
): Promise<void> {
  if (!interaction.isButton()) return;

  const guild = interaction.guild;
  const member = interaction.member as GuildMember;

  if (!guild || !member) {
    await interaction.reply({
      content: "❌ Bu işlem sadece sunucularda yapılabilir.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const existingTicket = guild.channels.cache.find(
    (c) =>
      c.type === ChannelType.GuildText &&
      c.name === `ticket-${member.user.username.toLowerCase().replace(/\s+/g, "-")}`,
  ) as TextChannel | undefined;

  if (existingTicket) {
    await interaction.editReply({
      content: `❌ Zaten açık bir ticketın var: ${existingTicket}`,
    });
    return;
  }

  const category = await getOrCreateCategory(guild);

  const ticketChannel = await guild.channels.create({
    name: `ticket-${member.user.username.toLowerCase().replace(/\s+/g, "-")}`,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
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
    ],
  });

  const supportRole = guild.roles.cache.find((r) => r.name === "Support");
  if (supportRole) {
    await ticketChannel.permissionOverwrites.create(supportRole, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    });
  }

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

  const openEmbed = new EmbedBuilder()
    .setColor(COLORS.BLURPLE)
    .setTitle("🎫 Destek Talebi Oluşturuldu")
    .setDescription(
      `Merhaba ${member}! Destek ekibimiz en kısa sürede sana yardımcı olacak.\n\n` +
        `Lütfen sorununuzu detaylı bir şekilde açıklayın.`,
    )
    .addFields(
      { name: "👤 Ticket Sahibi", value: `${member}`, inline: true },
      {
        name: "📅 Açılış Tarihi",
        value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
        inline: true,
      },
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setFooter({ text: "Ticket sistemi • Kapatmak için aşağıdaki butonu kullan" })
    .setTimestamp();

  const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(BUTTON_IDS.CLOSE_TICKET)
      .setLabel("🔒 Ticketı Kapat")
      .setStyle(ButtonStyle.Danger),
  );

  await ticketChannel.send({
    content: `${member} ${supportRole ? supportRole : ""}`,
    embeds: [openEmbed],
    components: [closeRow],
  });

  await interaction.editReply({
    content: `✅ Ticketın oluşturuldu: ${ticketChannel}`,
  });

  logger.info(
    { user: member.user.tag, channel: ticketChannel.name },
    "Ticket opened",
  );
}

export async function closeTicketPrompt(
  interaction: Interaction,
): Promise<void> {
  if (!interaction.isButton()) return;

  const member = interaction.member as GuildMember;
  const channel = interaction.channel as TextChannel;

  if (!member || !channel) return;

  await interaction.deferReply({ ephemeral: false });

  const confirmEmbed = new EmbedBuilder()
    .setColor(COLORS.YELLOW)
    .setTitle("⚠️ Ticket Kapatılıyor")
    .setDescription(
      "Bu ticketı kapatmak istediğinizden emin misiniz?\n\n" +
        "Ticket kapatıldıktan sonra kanal **5 saniye** içinde silinecektir.",
    )
    .setFooter({ text: `Kapatma isteği: ${member.user.tag}` })
    .setTimestamp();

  const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(BUTTON_IDS.CONFIRM_CLOSE)
      .setLabel("✅ Evet, Kapat")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(BUTTON_IDS.CANCEL_CLOSE)
      .setLabel("❌ İptal")
      .setStyle(ButtonStyle.Secondary),
  );

  await interaction.editReply({
    embeds: [confirmEmbed],
    components: [confirmRow],
  });
}

export async function confirmCloseTicket(
  interaction: Interaction,
): Promise<void> {
  if (!interaction.isButton()) return;

  const member = interaction.member as GuildMember;
  const channel = interaction.channel as TextChannel;

  if (!member || !channel) return;

  const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
  const isTicketOwner = channel.name.includes(
    member.user.username.toLowerCase().replace(/\s+/g, "-"),
  );

  if (!isAdmin && !isTicketOwner) {
    await interaction.reply({
      content: "❌ Bu ticketı kapatma yetkin yok!",
      ephemeral: true,
    });
    return;
  }

  const closedEmbed = new EmbedBuilder()
    .setColor(COLORS.RED)
    .setTitle("🔒 Ticket Kapatıldı")
    .setDescription(`Ticket **${member.user.tag}** tarafından kapatıldı.\n\nKanal **5 saniye** içinde silinecek...`)
    .setTimestamp();

  await interaction.update({
    embeds: [closedEmbed],
    components: [],
  });

  logger.info(
    { user: member.user.tag, channel: channel.name },
    "Ticket closed",
  );

  setTimeout(async () => {
    try {
      await channel.delete(`Ticket kapatıldı - ${member.user.tag}`);
    } catch (err) {
      logger.error({ err, channel: channel.name }, "Failed to delete ticket channel");
    }
  }, 5000);
}

export async function cancelClose(interaction: Interaction): Promise<void> {
  if (!interaction.isButton()) return;

  await interaction.update({
    content: "✅ İptal edildi. Ticket açık kalmaya devam ediyor.",
    embeds: [],
    components: [],
  });
}
