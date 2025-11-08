const Reminder = require("./db/models/Reminder");
const Problem = require("./db/models/Problem");
const User = require("./db/models/User");

let intervalId = null;

async function processDue(client) {
  const now = new Date();
  try {
    const reminders = await Reminder.find({ sent: false, dueAt: { $lte: now } })
      .populate("problem")
      .populate("user");

    for (const r of reminders) {
      try {
        const discordUserId = r.user.id;
        const channelId = process.env.DISCORD_REMINDER_CHANNEL_ID || process.env.DISCORD_REMINDER_CHANNEL;
        // Build a friendly interval label (daily, weekly, monthly...) when possible
        const whenLabel = r.offsetLabel || (r.offsetDays ? `${r.offsetDays} day${r.offsetDays > 1 ? "s" : ""}` : "");

        // Map common labels to natural words for the leading phrase
        function intervalWord(label) {
          if (!label) return "";
          const l = label.toLowerCase();
          if (l === "1 day") return "daily";
          if (l === "2 days") return "2-day";
          if (l === "1 week") return "weekly";
          if (l === "2 weeks") return "biweekly";
          if (l === "1 month") return "monthly";
          if (l === "3 months") return "3-month";
          if (l.includes("minute")) return l; // test-mode: keep as-is
          return l;
        }

        const friendly = intervalWord(whenLabel);

        // Message format requested: "Your daily revision for \"Problem name\" is due, this is your \"interval\" revision. <link>"
        const message = friendly
          ? `Your ${friendly} revision for "${r.problem.title}" is due — this is your "${whenLabel}" revision.\n${r.problem.url}`
          : `Your revision for "${r.problem.title}" is due — ${r.problem.url}`;

        if (!channelId) {
          // Channel is required for reminders — skip sending and leave the reminder unsent so it can be retried or fixed by configuration.
          console.error("DISCORD_REMINDER_CHANNEL_ID is not configured; skipping reminder", r._id);
          continue;
        }

        try {
          const channel = await client.channels.fetch(channelId);
          const mention = `<@${discordUserId}>`;
          await channel.send(`${mention} ${message}`);
          r.sent = true;
          await r.save();
        } catch (err) {
          // Do not fall back to DMs. Leave reminder unsent so it will retry on the next worker run.
          console.error("Failed to send reminder to channel", channelId, err);
        }
      } catch (err) {
        // If sending fails (user DMs closed), log and continue. We'll still mark as sent to avoid tight retry loops.
        console.error("Failed to send reminder for", r._id, err);
        r.sent = true;
        await r.save();
      }
    }
  } catch (err) {
    console.error("Error processing reminders", err);
  }
}

function startReminderWorker(client, intervalMs = 60_000) {
  // Run once immediately, then every interval
  processDue(client).catch((e) => console.error(e));
  intervalId = setInterval(() => processDue(client).catch((e) => console.error(e)), intervalMs);
  console.log("Reminder worker started, checking every", intervalMs, "ms");
  return () => {
    if (intervalId) clearInterval(intervalId);
  };
}

module.exports = { startReminderWorker };
