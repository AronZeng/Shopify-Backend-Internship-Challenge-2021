const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = Schema({
  username: { type: String, unique: true },
  password: String,
  email: { type: String, unique: true },
  balance: Number,
});

const User = mongoose.model("user", userSchema);

module.exports = User;
