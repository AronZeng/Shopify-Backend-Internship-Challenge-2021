module.exports = {
  transactionStatus: {
    ORDER_RECEIVED: 0,
    ORDER_SHIPPED: 1,
    ORDER_ARRIVED: 2,
    ORDER_RETURNED: 3,
  },

  statusCodes: {
    200: "OK",
    201: "Created",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
    412: "Precondition Failed",
    500: "Internal Server Error",
  },
};
