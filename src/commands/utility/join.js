const { SlashCommandBuilder } = require("discord.js");
const User = require("../../db/models/User");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Start your leetcode tracking journey"),
  async execute(interaction) {
    console.log(interaction);

    // Check if the user already exists
    const existingUser = await User.findOne({ id: interaction.user.id });

    if(existingUser) {
      return interaction.reply("You have already subscribed to leetcode tracking.");
    }

    // Save the user to the database
    const user = await User.create({
      id: interaction.user.id,
      username: interaction.user.username,
      globalName: interaction.user.globalName,
    });

    if(!user) {
      return interaction.reply("There was an error subscribing you to leetcode tracking. Please try again later.");
    }

    await interaction.reply("You have successfully subscribed to leetcode tracking!");
  },
};
