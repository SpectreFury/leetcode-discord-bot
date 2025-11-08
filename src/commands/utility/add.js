const { SlashCommandBuilder } = require("discord.js");
const User = require("../../db/models/User");
const Problem = require("../../db/models/Problem");
const Reminder = require("../../db/models/Reminder");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add")
    .setDescription("Add a problem to your leetcode tracking")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Problem title or URL to add to tracking")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("Problem URL to add to tracking")
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const title = interaction.options.getString("title");
      const url = interaction.options.getString("url");

      // Check if the user exists
      const existingUser = await User.findOne({ id: interaction.user.id });
      if (!existingUser) {
        return interaction.reply(
          "You need to join leetcode tracking first using /join command."
        );
      }

      // Add the problem to the user tracked problem
      const problem = await Problem.create({
        title,
        url,
        user: existingUser._id,
      });

        // Create reminders. In normal mode we schedule by days; in test mode
        // (set REMINDER_TEST_MODE=true) we'll schedule minute-based reminders
        // to make testing faster.
        const isTest = process.env.REMINDER_TEST_MODE === "true";

        if (isTest) {
          // test schedule: 1 minute after add (you can extend this array for more tests)
          const testOffsets = [{ minutes: 1, label: "1 minute" }];
          const reminders = testOffsets.map(({ minutes, label }) => ({
            user: existingUser._id,
            problem: problem._id,
            dueAt: new Date(Date.now() + minutes * 60 * 1000),
            offsetDays: 0,
            offsetLabel: label,
          }));
          await Reminder.insertMany(reminders);
        } else {
          // Create reminders at fixed intervals — days after creation
          // Schedule: 1 day, 2 days, 1 week, 2 weeks, 1 month, 3 months
          const offsets = [
            { days: 1, label: "1 day" },
            { days: 2, label: "2 days" },
            { days: 7, label: "1 week" },
            { days: 14, label: "2 weeks" },
            { days: 30, label: "1 month" },
            { days: 90, label: "3 months" },
          ];

          const reminders = offsets.map(({ days, label }) => ({
            user: existingUser._id,
            problem: problem._id,
            dueAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
            offsetDays: days,
            offsetLabel: label,
          }));

          await Reminder.insertMany(reminders);
        }

      await interaction.reply(`${title} has been added to your tracked problems`);
    } catch (err) {
      console.error(err);
      await interaction.reply("There was an error adding the problem.");
    }
  },
};
