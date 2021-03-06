const Transaction = require("../model/transaction");
const Image = require("../model/image");
const User = require("../model/user");
const jwt = require("jsonwebtoken");
const { transactionStatus } = require("../helper/constants");
const generateResponse = require("../helper/generateResponse");

exports.readOne = async function (req, res, next) {
  try {
    const userId = jwt.decode(req.headers["authorization"]).userId;
    const transaction = await Transaction.findById(req.params.id);
    //have to cast the buyer and seller to string since mongoose returns it in the ObjectId type
    if (
      transaction.buyer.toString() == userId ||
      transaction.seller.toString() == userId
    ) {
      return generateResponse(res, 200, transaction);
    } else {
      return generateResponse(res, 401);
    }
  } catch (err) {
    return generateResponse(res, 500);
  }
};

exports.readMany = async function (req, res, next) {
  //limit and skip are used for pagination
  const limit = parseInt(req.query.limit) || 10;
  const skip = req.query.page ? (parseInt(req.query.page) - 1) * limit : 0;
  try {
    const userId = await jwt.decode(req.headers["authorization"]).userId;
    let filters = [
      { $or: [{ buyer: userId }, { seller: userId }] },
      { isDeleted: false },
    ];
    if (req.query.image) {
      filters.push({ image: req.query.image });
    }
    if (req.query.buyer) {
      filters.push({ buyer: req.query.buyer });
    }
    if (req.query.seller) {
      filters.push({ seller: req.query.seller });
    }
    if (req.query.startDate) {
      filters.push({ date: { $gte: req.query.startDate } });
    }
    if (req.query.endDate) {
      filters.push({ date: { $lte: req.query.endDate } });
    }
    const transactions = await Transaction.find({
      $and: filters,
    })
      .skip(skip)
      .limit(limit);
    return generateResponse(res, 200, transactions);
  } catch (err) {
    console.log(err);
    return generateResponse(res, 500);
  }
};

exports.create = async function (req, res, next) {
  let resObj = {};
  try {
    const image = await Image.findOne({
      _id: req.body.image,
      owner: req.body.seller,
    });
    //validate the transaction (i.e the inventory is sufficient and the image is still available)
    if (image && image.isDeleted) {
      return generateResponse(res, 400, {}, "Image was deleted");
    }
    const buyer = await User.findById(req.body.buyer);
    if (
      image &&
      image.isAvailable &&
      image.inventory >= req.body.quantity &&
      buyer.balance >= req.body.quantity * req.body.price
    ) {
      resObj.image = await Image.findByIdAndUpdate(
        req.body.image,
        {
          $inc: { inventory: -1 * req.body.quantity },
        },
        { new: true }
      );
      resObj.buyer = await User.findByIdAndUpdate(
        req.body.buyer,
        {
          $inc: { balance: -1 * req.body.quantity * req.body.price },
        },
        { new: true }
      );
      resObj.seller = await User.findByIdAndUpdate(
        req.body.seller,
        {
          $inc: { balance: req.body.quantity * req.body.price },
        },
        { new: true }
      );
      resObj.transaction = await Transaction.create(req.body);
      return generateResponse(res, 201, resObj);
    }
    return generateResponse(res, 400);
  } catch (err) {
    return generateResponse(res, 500);
  }
};

exports.update = async function (req, res, next) {
  let resObj = {};
  try {
    const oldTransaction = await Transaction.findById(req.params.id);
    //if the images are returned then buyer, seller, and image have to be updated accordingly
    //buyer gets their money back (i.e incrementing their balance)
    //seller returns the money (i.e decrementing their balance)
    //image inventory is replenished (i.e incremening their inventory number)
    if (
      req.body &&
      oldTransaction.status != transactionStatus.ORDER_RETURNED &&
      req.body.status == transactionStatus.ORDER_RETURNED
    ) {
      resObj.image = await Image.findByIdAndUpdate(
        oldTransaction.image,
        {
          $inc: { inventory: oldTransaction.quantity },
        },
        { new: true }
      );
      resObj.buyer = await User.findByIdAndUpdate(
        oldTransaction.buyer,
        {
          $inc: {
            balance: oldTransaction.quantity * oldTransaction.price,
          },
        },
        { new: true }
      );
      resObj.seller = await User.findByIdAndUpdate(
        oldTransaction.seller,
        {
          $inc: {
            balance: -1 * oldTransaction.quantity * oldTransaction.price,
          },
        },
        { new: true }
      );
    }
    resObj.transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    return generateResponse(res, 200, resObj);
  } catch (err) {
    return generateResponse(res, 500);
  }
};

exports.delete = async function (req, res, next) {
  try {
    await Transaction.findByIdAndUpdate(req.params.id, { isDeleted: true });
    return generateResponse(res, 200);
  } catch (err) {
    return generateResponse(res, 500);
  }
};
