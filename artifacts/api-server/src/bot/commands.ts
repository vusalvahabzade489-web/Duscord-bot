import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { BUTTON_IDS, COLORS } from "./config.js";
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
  await interaction.deferReply({ ephemeral: true });

  const targetChannel =
    (interaction.options.getChannel("kanal") as TextChannel | null) ??
    (interaction.channel as TextChannel);

  if (!targetChannel || !("send" in targetChannel)) {
    await interaction.editReply({ content: "❌ Geçersiz kanal!" });
    return;
  }

  const panelEmbed = new EmbedBuilder()
    .setColor(COLORS.BLURPLE)
    .setTitle("🎫 Destek Merkezi")
    .setDescription(
      "Herhangi bir konuda yardıma mı ihtiyacın var?\n\n" +
        "Aşağıdaki **Ticket Aç** butonuna tıklayarak sana özel bir destek kanalı oluşturabilirsin.\n\n" +
        "**📌 Lütfen dikkat:**\n" +
        "• Gereksiz ticket açmayın\n" +
        "• Sorununuzu net ve anlaşılır şekilde belirtin\n" +
        "• Destek ekibi en kısa sürede yanıt verecektir",
    )
    .setThumbnail(interaction.guild?.iconURL() ?? null)
    .setFooter({
      text: `${interaction.guild?.name ?? "Sunucu"} Destek Sistemi`,
      iconURL: interaction.guild?.iconURL() ?? undefined,
    })
    .setTimestamp();

  const openRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(BUTTON_IDS.OPEN_TICKET)
      .setLabel("📩 Ticket Aç")
      .setStyle(ButtonStyle.Primary),
  );

  await targetChannel.send({
    embeds: [panelEmbed],
    components: [openRow],
  });

  await interaction.editReply({
    content: `✅ Ticket paneli ${targetChannel} kanalına başarıyla gönderildi!`,
  });

  logger.info(
    { guild: interaction.guild?.name, channel: targetChannel.name },
    "Ticket panel set up",
  );
}
