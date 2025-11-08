require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const { Client, Events, Collection, GatewayIntentBits } = require("discord.js");
const token = process.env.DISCORD_TOKEN;
const { connectToDB } = require("./db/db.js");
const { startReminderWorker } = require("./reminderWorker");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async (readyClient) => {
  try {
    await connectToDB();

    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    // start background reminder worker which will check due reminders and post to configured channel
    // Optional environment variable REMINDER_POLL_INTERVAL_MS can be used to shorten the interval for testing (milliseconds)
    const pollMs = process.env.REMINDER_POLL_INTERVAL_MS
      ? parseInt(process.env.REMINDER_POLL_INTERVAL_MS, 10)
      : undefined;
    startReminderWorker(readyClient, pollMs);
  } catch (err) {
    console.log("Unable to set up discord bot: ", err);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.log(error);
  }
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);

    const command = require(filePath);

    const commandModule = command.default || command;

    if ("data" in commandModule && "execute" in commandModule) {
      client.commands.set(commandModule.data.name, commandModule);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

client.login(token);
