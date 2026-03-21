import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  TextChannel,
} from "discord.js";
import { BUTTON_IDS, CATEGORIES, COLORS, SELECT_IDS, SERVER_NAME } from "./config.js";
import { logger } from "../lib/logger.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Ticket panelini bir kanala gönder")
    .addChannelOption((opt) =>
      opt
        .setName("kanal")
        .setDescription("Panelin gönderileceği kanal")
        .setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),
];

export async function handleSetup(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const targetChannel =
    (interaction.options.getChannel("kanal") as TextChannel | null) ??
    (interaction.channel as TextChannel);

  if (!targetChannel || !("send" in targetChannel)) {
    await interaction.editReply({ content: "❌ Geçersiz kanal!" });
    return;
  }

  const panelEmbed = new EmbedBuilder()
    .setColor(COLORS.BLURPLE)
    .setTitle(`${SERVER_NAME.toUpperCase()} DESTEK MERKEZİ 🎫`)
    .setDescription(
      "**Bir sorun mu yaşıyorsunuz?**\n\n" +
        "Aşağıdaki menüden size en uygun kategoriyi seçerek bizimle iletişime geçebilirsiniz.\n\n" +
        CATEGORIES.map((c) => `${c.displayEmoji} **${c.label}:** ${c.description}`).join("\n"),
    )
    .setThumbnail(interaction.guild?.iconURL() ?? null)
    .setFooter({
      text: `${SERVER_NAME} | Profesyonel Destek Hattı`,
      iconURL: interaction.guild?.iconURL() ?? undefined,
    })
    .setTimestamp();

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(SELECT_IDS.TICKET_CATEGORY)
    .setPlaceholder("Kategori seçerek biletinizi oluşturun...")
    .addOptions(
      CATEGORIES.map((c) => ({
        label: c.label,
        value: c.value,
        description: c.description,
        emoji: c.emoji,
      })),
    );

  const selectRow =
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  const resetRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(BUTTON_IDS.RESET_SELECT)
      .setLabel("🔧 Seçenekleri Sıfırla")
      .setStyle(ButtonStyle.Secondary),
  );

  await targetChannel.send({
    embeds: [panelEmbed],
    components: [selectRow, resetRow],
  });

  await interaction.editReply({
    content: `✅ Ticket paneli ${targetChannel} kanalına başarıyla gönderildi!`,
  });

  logger.info(
    { guild: interaction.guild?.name, channel: targetChannel.name },
    "Ticket panel set up",
  );
}
