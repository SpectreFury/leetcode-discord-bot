const mongoose = require("mongoose");

const ReminderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  problem: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: true },
  dueAt: { type: Date, required: true },
  offsetDays: { type: Number, required: true },
  offsetLabel: { type: String },
  sent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Reminder", ReminderSchema);
