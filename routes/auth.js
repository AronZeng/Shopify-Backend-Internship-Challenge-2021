const express = require("express");
const router = express.Router();
const authController = require("../controller/auth");

router.post("/", authController.login);

module.exports = router;
