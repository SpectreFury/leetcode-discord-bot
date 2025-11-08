require("dotenv").config();
const mongoose = require("mongoose");

const URI = process.env.MONGODB_URI;

async function connectToDB() {
  try {
    await mongoose.connect(URI);
    console.log("Connected to DB");
  } catch (err) {
    console.error(err);
  }
}

module.exports = { connectToDB };
