import {
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
} from "discord.js";
import { logger } from "../lib/logger.js";
import { BUTTON_IDS } from "./config.js";
import { commands, handleSetup } from "./commands.js";
import {
  cancelClose,
  closeTicketPrompt,
  confirmCloseTicket,
  openTicket,
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

      if (interaction.isButton()) {
        switch (interaction.customId) {
          case BUTTON_IDS.OPEN_TICKET:
            await openTicket(interaction);
            break;
          case BUTTON_IDS.CLOSE_TICKET:
            await closeTicketPrompt(interaction);
            break;
          case BUTTON_IDS.CONFIRM_CLOSE:
            await confirmCloseTicket(interaction);
            break;
          case BUTTON_IDS.CANCEL_CLOSE:
            await cancelClose(interaction);
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
