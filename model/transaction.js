const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const statuses = [0, 1, 2, 3];

const transactionSchema = Schema({
  buyer: { type: Schema.Types.ObjectId, ref: "user", required: true },
  seller: { type: Schema.Types.ObjectId, ref: "user", required: true },
  price: Number,
  image: { type: Schema.Types.ObjectId, ref: "image", required: true },
  date: { type: Date, default: new Date() },
  quantity: {
    type: Number,
    min: 1,
    validate: {
      validator: Number.isInteger,
      message: "quantity must be an integer",
    },
  },
  isDeleted: { type: Boolean, default: false },
  status: { type: Number, default: 0, enum: statuses },
});

const Transaction = mongoose.model("transaction", transactionSchema);

module.exports = Transaction;
