const mongoose = require("mongoose");

const User = new mongoose.Schema({
  id: {
    type: String,
    required: [true, "id is required"],
  },
  username: {
    type: String,
    required: [true, "username is required"],
  },
  globalName: {
    type: String,
    required: [true, "globalName is required"],
  },
});

const userModel = mongoose.model("User", User);

module.exports = userModel;
