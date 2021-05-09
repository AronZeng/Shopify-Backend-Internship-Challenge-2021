const express = require("express");
const router = express.Router();
const transactionController = require("../controller/transaction");
const { validateToken } = require("../middleware/validate");

router.get("/:id", validateToken, transactionController.readOne);
router.get("/", validateToken, transactionController.readMany);
router.post("/", validateToken, transactionController.create);
router.put("/:id", validateToken, transactionController.update);
router.delete("/:id", validateToken, transactionController.delete);

module.exports = router;
