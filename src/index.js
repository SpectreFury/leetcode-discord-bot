require('dotenv').config()

const fs = require("node:fs");
const path = require("node:path");
const { Client, Events, Collection, GatewayIntentBits } = require("discord.js");
const token = process.env.DISCORD_TOKEN; 

const client = new Client({ intents: [GatewayIntentBits.Guilds] }); 

client.once(Events.ClientReady, (readyClient) => { 
  console.log(`Ready! Logged in as ${readyClient.user.tag}`); 
}); 

client.on(Events.InteractionCreate, async (interaction) => {
  if(!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if(!command) {
    console.error(`No command matching ${interaction.commandName} was found`)
    return;
  }

  try {
    await command.execute(interaction)
  }
  catch(error ) {
    console.log(error);
  }


  console.log(interaction)
})

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
