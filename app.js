const express = require("express");
const app = express();
const userRoutes = require("./routes/user");
const authRoutes = require("./routes/auth");
const imageRoutes = require("./routes/image");
const transactionRoutes = require("./routes/transaction");
const mongoose = require("mongoose");
const http = require("http");
const generateResponse = require("./helper/generateResponse");

//express middleware for parsing requests
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//mount the routes
app.use("/users", userRoutes);
app.use("/login", authRoutes);
app.use("/images", imageRoutes);
app.use("/transactions", transactionRoutes);
app.use(function (req, res, next) {
  return generateResponse(res, 404);
});

//connect to mongo database
mongoose
  .connect("mongodb://localhost:27017", {
    dbName: "test",
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Connected to database");
  });

//listen on port 3000
var port = "3000";
var server = http.createServer(app);
server.listen(port, (err) => {
  if (err) throw err;
  console.log("Server listening on port", port);
});

module.exports = app;
