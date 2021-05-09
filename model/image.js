const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const imageSchema = Schema({
  name: String,
  description: String,
  tags: [{ type: String }],
  public: { type: Boolean, default: false },
  owner: { type: Schema.Types.ObjectId, ref: "user", required: true },
  discount: { type: Number, default: 0 },
  inventory: Number,
  image: {
    data: Buffer,
    contentType: String,
  },
  isAvailable: { type: Boolean, default: true },
});

const Image = mongoose.model("image", imageSchema);

module.exports = Image;
