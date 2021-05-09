const { statusCodes } = require("./constants");

const generateResponse = function (responseObject, statusCode, data, message) {
  if (!message || message == undefined)
    message = statusCodes[statusCode.toString()];
  let resObj = {
    data: data,
    message: message,
  };
  return responseObject.status(statusCode).json(resObj);
};

module.exports = generateResponse;
