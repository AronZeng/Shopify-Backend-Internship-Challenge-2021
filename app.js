const express = require("express");
const app = express();
const userRoutes = require("./routes/user");
const authRoutes = require("./routes/auth");
const imageRoutes = require("./routes/image");
const transactionRoutes = require("./routes/transaction");
const mongoose = require("mongoose");
const http = require("http");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/users", userRoutes);
app.use("/login", authRoutes);
app.use("/images", imageRoutes);
app.use("/transactions", transactionRoutes);

mongoose
  .connect("mongodb://localhost:27017", {
    dbName: "test",
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Connected to database");
  });

var port = process.env.PORT || "3000";
var server = http.createServer(app);
server.listen(port, (err) => {
  if (err) throw err;
  console.log("Server listening on port", port);
});

module.exports = app;
