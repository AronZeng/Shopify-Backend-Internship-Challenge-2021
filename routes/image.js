const express = require("express");
const router = express.Router();
const imageController = require("../controller/image");
const { validateToken } = require("../middleware/validate");

const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

router.get("/:id", validateToken, imageController.readOne);
router.get("/", validateToken, imageController.readMany);
router.post("/", validateToken, upload.single("file"), imageController.create);
router.put("/:id", validateToken, imageController.update);

module.exports = router;
