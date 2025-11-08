const mongoose = require("mongoose");

const ProblemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

module.exports = mongoose.model("Problem", ProblemSchema);
