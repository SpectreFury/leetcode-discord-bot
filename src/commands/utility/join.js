const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Start your leetcode tracking journey"),
  async execute(interaction) {
    await interaction.reply("Join command is working correctly");
  },
};
