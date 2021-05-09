const express = require("express");
const router = express.Router();
const userController = require("../controller/user");
const { validateToken } = require("../middleware/validate");

router.get("/:id", validateToken, userController.readOne);
router.post("/", userController.create);

module.exports = router;
