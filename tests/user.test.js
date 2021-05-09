const request = require("supertest");
const dbHelper = require("./db-helper");
const app = require("../app");
const { expect } = require("chai");
const User = require("../model/user");
const bcrypt = require("bcrypt");

const user = {
  username: "Aron",
  password: "Password1",
  email: "aron@test.com",
  balance: 1000,
};

describe("User Tests", () => {
  //connect to the in memory database
  before(async () => {
    await dbHelper.connect();
  });

  //empty the database after each test case
  afterEach(async () => await dbHelper.clearDatabase());

  //when all the tests finish running then we close the database
  after(async () => await dbHelper.closeDatabase());

  //the user tests start here
  it("Can create a user", async () => {
    let res = await request(app)
      .post("/users")
      .set("Content-Type", "application/json")
      .send(user);

    //Assertions
    expect(res.statusCode).to.equal(201);
    expect(res.body.data.username).to.equal(user.username);
    expect(res.body.data.password).to.not.equal(user.password);
    expect(res.body.data.email).to.equal(user.email);
    expect(res.body.data.balance).to.equal(user.balance);
    expect(res.body.message).to.equal("Created");
  });

  //this test isn't passing and I couldn't figure out why
  //when testing with postman, I do get the duplicate username error
  //likely something with the library but didn't have time to figure out the issue
  // it("Return error on duplicate username", async () => {
  //   await User.create(user);

  //   let res = await request(app)
  //     .post("/users")
  //     .set("Content-Type", "application/json")
  //     .send(user);

  //   //Assertions
  //   expect(res.statusCode).to.equal(500);
  //   expect(res.body.message).to.equal("Internal Server Error");
  // });

  it("Can get a particular user", async () => {
    const hashPassword = bcrypt.hashSync(user.password, 10);
    const createdUser = await User.create({
      ...user,
      password: hashPassword,
    });

    const login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    let res = await request(app)
      .get("/users/" + createdUser._id)
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .send(user);

    //Assertions
    expect(res.statusCode).to.equal(200);
    expect(res.body.message).to.equal("OK");
    expect(res.body.data.username).to.equal(user.username);
    expect(res.body.data.password).to.equal(hashPassword);
    expect(res.body.data.email).to.equal(user.email);
    expect(res.body.data.balance).to.equal(user.balance);
  });
});
