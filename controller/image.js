const Image = require("../model/image");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const generateResponse = require("../helper/generateResponse");
const { request } = require("express");

exports.readOne = async function (req, res, next) {
  try {
    const image = await Image.findById(req.params.id);
    if (
      jwt.decode(req.headers["authorization"]).userId == image.owner.toString()
    ) {
      return generateResponse(res, 200, image);
    } else {
      return generateResponse(res, 401);
    }
  } catch (err) {
    return generateResponse(res, 500);
  }
};

exports.readMany = async function (req, res, next) {
  try {
    let filters = [];
    const limit = parseInt(req.query.limit) || 10;
    const skip = req.query.page ? (parseInt(req.query.page) - 1) * limit : 0;

    if (req.query) {
      for (const [filter, value] of Object.entries(req.query)) {
        switch (filter) {
          case "name":
            filters.push({ name: { $regex: value.toString(), $options: "i" } });
            break;
          case "tag":
            filters.push({
              tags: { $elemMatch: { $regex: value.toString(), $options: "i" } },
            });
            break;
          case "description":
            filters.push({
              description: { $regex: value.toString(), $options: "i" },
            });
            break;
          case "discount":
            filters.push({
              discount: { $gte: value },
            });
            break;
          case "inventory":
            filters.push({
              inventory: { $gte: value },
            });
            break;
        }
      }
    }
    const userId = await jwt.decode(req.headers["authorization"]).userId;
    const query = filters.length
      ? {
          $and: [
            { isAvailable: true },
            { $or: [{ owner: userId }, { public: true }] },
            { $or: filters },
          ],
        }
      : {
          $and: [
            { isAvailable: true },
            { $or: [{ owner: userId }, { public: true }] },
          ],
        };
    const images = await Image.find(query).skip(skip).limit(limit);
    return generateResponse(res, 200, images);
  } catch (err) {
    return generateResponse(res, 500);
  }
};

exports.create = async function (req, res, next) {
  try {
    req.body.image = {
      data: req.file.buffer,
      contentType: "image/jpg",
    };
    const newImage = await Image.create({
      ...req.body,
      owner: jwt.decode(req.headers["authorization"]).userId,
    });
    return generateResponse(res, 201, newImage);
  } catch (err) {
    return generateResponse(res, 500);
  }
};

exports.update = async function (req, res, next) {
  try {
    const updatedImage = await Image.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    return generateResponse(res, 200, updatedImage);
  } catch (err) {
    return generateResponse(res, 500);
  }
};
