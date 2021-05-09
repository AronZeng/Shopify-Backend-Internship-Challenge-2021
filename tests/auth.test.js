const request = require("supertest");
const dbHelper = require("./db-helper");
const app = require("../app");
const { expect } = require("chai");
const User = require("../model/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const user = {
  username: "Aron",
  password: "Password1",
  email: "aron@test.com",
  balance: 1000,
};

describe("Auth Tests", () => {
  //connect to the in memory database
  before(async () => {
    await dbHelper.connect();
  });

  //empty the database after each test case
  afterEach(async () => await dbHelper.clearDatabase());

  //when all the tests finish running then we close the database
  after(async () => await dbHelper.closeDatabase());

  //the user tests start here
  it("Can login", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({ ...user, password: hashedPassword });

    let res = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    const decodedToken = jwt.decode(res.body.data.token);
    //Assertions
    expect(res.statusCode).to.equal(200);
    expect(decodedToken.userId).to.equal(savedUser._id.toString());
    //our token expiry time is in 10 hours so we verify that the token's expiry time and issued at time difference is that
    //note the units are in seconds so the difference should be 36000 seconds
    expect(decodedToken.exp - decodedToken.iat).to.equal(36000);
  });
});
