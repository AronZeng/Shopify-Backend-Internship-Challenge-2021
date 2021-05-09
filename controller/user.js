const User = require("../model/user");
const bcrypt = require("bcrypt");
const generateResponse = require("../helper/generateResponse");

exports.readOne = async function (req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    generateResponse(res, 200, user);
  } catch (err) {
    generateResponse(res, 500);
  }
};

exports.create = async function (req, res, next) {
  const test = await User.find({});
  bcrypt.hash(req.body.password, 10, async function (err, hash) {
    try {
      const newUser = {
        username: req.body.username,
        password: hash,
        email: req.body.email,
        balance: req.body.balance,
      };
      const savedUser = await User.create(newUser);
      return generateResponse(res, 201, savedUser);
    } catch (err) {
      return generateResponse(res, 500);
    }
  });
};
