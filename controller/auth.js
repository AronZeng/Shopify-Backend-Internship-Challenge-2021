const bcrypt = require("bcrypt");
const User = require("../model/user");
const jwt = require("jsonwebtoken");
const generateResponse = require("../helper/generateResponse");

exports.login = async function (req, res, next) {
  const user = await User.findOne({ username: req.body.username });
  bcrypt.compare(
    req.body.password,
    user.password,
    async function (err, result) {
      if (result) {
        try {
          const token = await jwt.sign(
            { userId: user._id },
            "shopifyisthebest",
            { expiresIn: "10h" }
          );
          return generateResponse(res, 200, { token: token, user: user });
        } catch (err) {
          res.status(500);
        }
      } else {
        return generateResponse(res, 401, {}, "Invalid Login");
      }
    }
  );
};
