import {
  ActivityType,
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
} from "discord.js";
import { logger } from "../lib/logger.js";
import { BUTTON_IDS, CategoryValue, SELECT_IDS } from "./config.js";
import { commands, handleSetup } from "./commands.js";
import {
  claimTicket,
  closeTicketPrompt,
  handleRating,
  openTicket,
  resetSelect,
} from "./tickets.js";

export async function startBot(): Promise<void> {
  const token = process.env["DISCORD_TOKEN"];

  if (!token) {
    logger.error("DISCORD_TOKEN is not set. Bot will not start.");
    return;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
  });

  client.once(Events.ClientReady, async (c) => {
    logger.info({ tag: c.user.tag }, "Discord bot is ready");

    c.user.setPresence({
      status: "idle",
      activities: [
        {
          name: "🛡️ Sunucuyu koruyor",
          type: ActivityType.Watching,
        },
      ],
    });

    const rest = new REST().setToken(token);

    for (const guild of c.guilds.cache.values()) {
      try {
        await rest.put(Routes.applicationGuildCommands(c.user.id, guild.id), {
          body: commands,
        });
        logger.info({ guild: guild.name }, "Slash commands registered");
      } catch (err) {
        logger.error({ err, guild: guild.name }, "Failed to register commands");
      }
    }
  });

  client.on(Events.GuildCreate, async (guild) => {
    const rest = new REST().setToken(token);
    try {
      await rest.put(
        Routes.applicationGuildCommands(client.user!.id, guild.id),
        { body: commands },
      );
      logger.info({ guild: guild.name }, "Commands registered for new guild");
    } catch (err) {
      logger.error({ err, guild: guild.name }, "Failed to register commands for new guild");
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "setup") {
          await handleSetup(interaction);
        }
        return;
      }

      if (interaction.isStringSelectMenu()) {
        if (interaction.customId === SELECT_IDS.TICKET_CATEGORY) {
          const categoryValue = interaction.values[0] as CategoryValue;
          await openTicket(interaction, categoryValue);
        }
        return;
      }

      if (interaction.isButton()) {
        switch (interaction.customId) {
          case BUTTON_IDS.CLAIM_TICKET:
            await claimTicket(interaction);
            break;
          case BUTTON_IDS.CLOSE_TICKET:
            await closeTicketPrompt(interaction);
            break;
          case BUTTON_IDS.RATING_1:
            await handleRating(interaction, 1);
            break;
          case BUTTON_IDS.RATING_2:
            await handleRating(interaction, 2);
            break;
          case BUTTON_IDS.RATING_3:
            await handleRating(interaction, 3);
            break;
          case BUTTON_IDS.RATING_4:
            await handleRating(interaction, 4);
            break;
          case BUTTON_IDS.RATING_5:
            await handleRating(interaction, 5);
            break;
          case BUTTON_IDS.RESET_SELECT:
            await resetSelect(interaction);
            break;
        }
      }
    } catch (err) {
      logger.error({ err }, "Error handling interaction");
    }
  });

  client.on(Events.Error, (err) => {
    logger.error({ err }, "Discord client error");
  });

  await client.login(token);
}
