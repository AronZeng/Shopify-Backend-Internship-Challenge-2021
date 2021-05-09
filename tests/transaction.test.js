const request = require("supertest");
const dbHelper = require("./db-helper");
const app = require("../app");
const { expect } = require("chai");
const User = require("../model/user");
const bcrypt = require("bcrypt");
const path = require("path");
const Transaction = require("../model/transaction");
const { transactionStatus } = require("../helper/constants");
const user = {
  username: "Aron",
  password: "Password1",
  email: "aron@test.com",
  balance: 1000,
};

const user2 = {
  username: "Danny",
  password: "Password1",
  email: "danny@test.com",
  balance: 9000,
};

const user3 = {
  username: "Brian",
  password: "Password1",
  email: "brian@test.com",
  balance: 2,
};

const image_one = {
  name: "Pizza",
  description: "Picture of pepperoni pizza",
  tags: ["food", "pizza", "hungry"],
  inventory: 100,
};

const image_two = {
  name: "Aron",
  description: "A good looking fella",
  tags: ["mcm", "model"],
  inventory: 9000,
};

const transaction_one = {
  price: 100,
  quantity: 1,
  status: 0,
  date: new Date("May 4, 2021"),
};

const transaction_two = {
  price: 200,
  quantity: 2,
  status: 0,
  date: new Date("May 5, 2021"),
};

const transaction_three = {
  price: 300,
  quantity: 3,
  status: 0,
  date: new Date("May 6, 2021"),
};
const imagePath = path.join(__dirname + "/images/" + "pizza.jpg");

describe("Transaction Tests", () => {
  //connect to the in memory database
  before(async () => {
    await dbHelper.connect();
  });

  //empty the database after each test case
  afterEach(async () => await dbHelper.clearDatabase());

  //when all the tests finish running then we close the database
  after(async () => await dbHelper.closeDatabase());

  //the user tests start here
  it("Can create transaction", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({ ...user, password: hashedPassword });
    const savedUser2 = await User.create({
      ...user2,
      password: hashedPassword,
    });

    const login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    const imageCreateResponse = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    const res = await request(app)
      .post("/transactions")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .send({
        ...transaction_one,
        image: imageCreateResponse.body.data._id.toString(),
        seller: savedUser._id.toString(),
        buyer: savedUser2._id.toString(),
      });

    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(201);
    expect(res.body.data.transaction.price).to.equal(transaction_one.price);
    expect(res.body.data.transaction.quantity).to.equal(
      transaction_one.quantity
    );
    expect(res.body.data.transaction.status).to.equal(transaction_one.status);
    expect(res.body.data.transaction.image).to.equal(
      imageCreateResponse.body.data._id.toString()
    );
    expect(res.body.data.transaction.buyer).to.equal(savedUser2._id.toString());
    expect(res.body.data.transaction.seller).to.equal(savedUser._id.toString());
    expect(res.body.data.buyer.balance).to.equal(
      user2.balance - transaction_one.price * transaction_one.quantity
    );
    expect(res.body.data.seller.balance).to.equal(
      user.balance + transaction_one.price * transaction_one.quantity
    );
  });

  it("Cannot create transaction where seller does not own image", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({
      ...user,
      password: hashedPassword,
    });
    const savedUser2 = await User.create({
      ...user2,
      password: hashedPassword,
    });

    const login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    const imageCreateResponse = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    const res = await request(app)
      .post("/transactions")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .send({
        ...transaction_one,
        image: imageCreateResponse.body.data._id.toString(),
        seller: savedUser2._id.toString(),
        buyer: savedUser._id.toString(),
      });

    //Assertions
    expect(res.statusCode).to.equal(400);
  });

  it("Cannot create a transaction if the buyer does not have a sufficient balance", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({
      ...user,
      password: hashedPassword,
    });
    const savedUser2 = await User.create({
      ...user3,
      password: hashedPassword,
    });

    const login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    const imageCreateResponse = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    const res = await request(app)
      .post("/transactions")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .send({
        ...transaction_one,
        image: imageCreateResponse.body.data._id.toString(),
        seller: savedUser._id.toString(),
        buyer: savedUser2._id.toString(),
      });

    //Assertions
    expect(res.statusCode).to.equal(400);
  });
  it("Can get a specific transaction", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({
      ...user,
      password: hashedPassword,
    });
    const savedUser2 = await User.create({
      ...user2,
      password: hashedPassword,
    });

    const login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    const imageCreateResponse = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    const transaction = await Transaction.create({
      ...transaction_one,
      image: imageCreateResponse.body.data._id,
      seller: savedUser._id.toString(),
      buyer: savedUser2._id.toString(),
    });

    const res = await request(app)
      .get("/transactions/" + transaction._id.toString())
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      });

    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(200);
    expect(res.body.data.price).to.equal(transaction_one.price);
    expect(res.body.data.quantity).to.equal(transaction_one.quantity);
    expect(res.body.data.status).to.equal(transaction_one.status);
    expect(res.body.data.image).to.equal(
      imageCreateResponse.body.data._id.toString()
    );
    expect(res.body.data.buyer).to.equal(savedUser2._id.toString());
    expect(res.body.data.seller).to.equal(savedUser._id.toString());
  });
  it("Cannot get a specific transaction if it does not belong to the user", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({
      ...user,
      password: hashedPassword,
    });
    const savedUser2 = await User.create({
      ...user2,
      password: hashedPassword,
    });
    const savedUser3 = await User.create({
      ...user3,
      password: hashedPassword,
    });

    const login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    const imageCreateResponse = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    const user3Login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user3.username, password: user3.password });

    const transaction = await Transaction.create({
      ...transaction_one,
      image: imageCreateResponse.body.data._id,
      seller: savedUser._id.toString(),
      buyer: savedUser2._id.toString(),
    });

    const res = await request(app)
      .get("/transactions/" + transaction._id.toString())
      .set({
        "Content-Type": "application/json",
        Authorization: user3Login.body.data.token,
      });

    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(401);
    expect(res.body.message).to.equal("Unauthorized");
  });

  it("Can update transaction", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({
      ...user,
      password: hashedPassword,
    });
    const savedUser2 = await User.create({
      ...user2,
      password: hashedPassword,
    });

    const login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    const imageCreateResponse = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    const transaction = await Transaction.create({
      ...transaction_one,
      image: imageCreateResponse.body.data._id.toString(),
      seller: savedUser._id.toString(),
      buyer: savedUser2._id.toString(),
    });

    const res = await request(app)
      .put("/transactions/" + transaction._id.toString())
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .send({
        price: 20000,
      });

    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(200);
    expect(res.body.data.transaction.price).to.equal(20000);
  });

  it("Can update user and image upon returning", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({
      ...user,
      password: hashedPassword,
    });
    const savedUser2 = await User.create({
      ...user2,
      password: hashedPassword,
    });

    const login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    const imageCreateResponse = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    const transaction = await Transaction.create({
      ...transaction_one,
      image: imageCreateResponse.body.data._id.toString(),
      seller: savedUser._id.toString(),
      buyer: savedUser2._id.toString(),
    });

    const res = await request(app)
      .put("/transactions/" + transaction._id.toString())
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .send({
        status: transactionStatus.ORDER_RETURNED,
      });

    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(200);
    expect(res.body.data.transaction.status).to.equal(
      transactionStatus.ORDER_RETURNED
    );
    expect(res.body.data.seller.balance).to.equal(
      user.balance - transaction.quantity * transaction.price
    );
    expect(res.body.data.buyer.balance).to.equal(
      user2.balance + transaction.quantity * transaction.price
    );
    expect(res.body.data.image.inventory).to.equal(
      image_one.inventory + transaction.quantity
    );
  });

  it("Can get a many transactions", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({
      ...user,
      password: hashedPassword,
    });
    const savedUser2 = await User.create({
      ...user2,
      password: hashedPassword,
    });

    const savedUser3 = await User.create({
      ...user3,
      password: hashedPassword,
    });

    const login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    const imageCreateResponse = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    const transactionOne = await Transaction.create({
      ...transaction_one,
      image: imageCreateResponse.body.data._id,
      seller: savedUser._id.toString(),
      buyer: savedUser2._id.toString(),
    });
    const transactionTwo = await Transaction.create({
      ...transaction_two,
      image: imageCreateResponse.body.data._id,
      seller: savedUser._id.toString(),
      buyer: savedUser2._id.toString(),
    });
    const transactionThree = await Transaction.create({
      ...transaction_three,
      image: imageCreateResponse.body.data._id,
      seller: savedUser._id.toString(),
      buyer: savedUser3._id.toString(),
    });

    const res = await request(app).get("/transactions").set({
      "Content-Type": "application/json",
      Authorization: login.body.data.token,
    });

    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(200);
    expect(res.body.data.length).to.equal(3);
    expect(res.body.data[0].price).to.equal(transaction_one.price);
    expect(res.body.data[0].quantity).to.equal(transaction_one.quantity);
    expect(res.body.data[0].status).to.equal(transaction_one.status);
    expect(res.body.data[0].image).to.equal(
      imageCreateResponse.body.data._id.toString()
    );
    expect(res.body.data[0].buyer).to.equal(savedUser2._id.toString());
    expect(res.body.data[0].seller).to.equal(savedUser._id.toString());
    expect(res.body.data[1].price).to.equal(transaction_two.price);
    expect(res.body.data[1].quantity).to.equal(transaction_two.quantity);
    expect(res.body.data[1].status).to.equal(transaction_two.status);
    expect(res.body.data[1].image).to.equal(
      imageCreateResponse.body.data._id.toString()
    );
    expect(res.body.data[1].buyer).to.equal(savedUser2._id.toString());
    expect(res.body.data[1].seller).to.equal(savedUser._id.toString());
    expect(res.body.data[2].price).to.equal(transaction_three.price);
    expect(res.body.data[2].quantity).to.equal(transaction_three.quantity);
    expect(res.body.data[2].status).to.equal(transaction_three.status);
    expect(res.body.data[2].image).to.equal(
      imageCreateResponse.body.data._id.toString()
    );
    expect(res.body.data[2].buyer).to.equal(savedUser3._id.toString());
    expect(res.body.data[2].seller).to.equal(savedUser._id.toString());
  });

  it("Can get a many transactions with buyer filter", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({
      ...user,
      password: hashedPassword,
    });
    const savedUser2 = await User.create({
      ...user2,
      password: hashedPassword,
    });

    const savedUser3 = await User.create({
      ...user3,
      password: hashedPassword,
    });

    const login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    const imageCreateResponse = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    const transactionOne = await Transaction.create({
      ...transaction_one,
      image: imageCreateResponse.body.data._id,
      seller: savedUser._id.toString(),
      buyer: savedUser2._id.toString(),
    });
    const transactionTwo = await Transaction.create({
      ...transaction_two,
      image: imageCreateResponse.body.data._id,
      seller: savedUser._id.toString(),
      buyer: savedUser2._id.toString(),
    });
    const transactionThree = await Transaction.create({
      ...transaction_three,
      image: imageCreateResponse.body.data._id,
      seller: savedUser._id.toString(),
      buyer: savedUser3._id.toString(),
    });

    const res = await request(app)
      .get("/transactions")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .query({
        buyer: savedUser2._id.toString(),
      });

    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(200);
    expect(res.body.data.length).to.equal(2);
    expect(res.body.data[0].price).to.equal(transaction_one.price);
    expect(res.body.data[0].quantity).to.equal(transaction_one.quantity);
    expect(res.body.data[0].status).to.equal(transaction_one.status);
    expect(res.body.data[0].image).to.equal(
      imageCreateResponse.body.data._id.toString()
    );
    expect(res.body.data[0].buyer).to.equal(savedUser2._id.toString());
    expect(res.body.data[0].seller).to.equal(savedUser._id.toString());
    expect(res.body.data[1].price).to.equal(transaction_two.price);
    expect(res.body.data[1].quantity).to.equal(transaction_two.quantity);
    expect(res.body.data[1].status).to.equal(transaction_two.status);
    expect(res.body.data[1].image).to.equal(
      imageCreateResponse.body.data._id.toString()
    );
    expect(res.body.data[1].buyer).to.equal(savedUser2._id.toString());
    expect(res.body.data[1].seller).to.equal(savedUser._id.toString());
  });
  it("Can get a many transactions with seller filter", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({
      ...user,
      password: hashedPassword,
    });
    const savedUser2 = await User.create({
      ...user2,
      password: hashedPassword,
    });

    const savedUser3 = await User.create({
      ...user3,
      password: hashedPassword,
    });

    const login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    const imageCreateResponse = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    const transactionOne = await Transaction.create({
      ...transaction_one,
      image: imageCreateResponse.body.data._id,
      seller: savedUser._id.toString(),
      buyer: savedUser2._id.toString(),
    });
    const transactionTwo = await Transaction.create({
      ...transaction_two,
      image: imageCreateResponse.body.data._id,
      seller: savedUser._id.toString(),
      buyer: savedUser2._id.toString(),
    });
    const transactionThree = await Transaction.create({
      ...transaction_three,
      image: imageCreateResponse.body.data._id,
      seller: savedUser3._id.toString(),
      buyer: savedUser._id.toString(),
    });

    const res = await request(app)
      .get("/transactions")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .query({
        seller: savedUser._id.toString(),
      });

    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(200);
    expect(res.body.data.length).to.equal(2);
    expect(res.body.data[0].price).to.equal(transaction_one.price);
    expect(res.body.data[0].quantity).to.equal(transaction_one.quantity);
    expect(res.body.data[0].status).to.equal(transaction_one.status);
    expect(res.body.data[0].image).to.equal(
      imageCreateResponse.body.data._id.toString()
    );
    expect(res.body.data[0].buyer).to.equal(savedUser2._id.toString());
    expect(res.body.data[0].seller).to.equal(savedUser._id.toString());
    expect(res.body.data[1].price).to.equal(transaction_two.price);
    expect(res.body.data[1].quantity).to.equal(transaction_two.quantity);
    expect(res.body.data[1].status).to.equal(transaction_two.status);
    expect(res.body.data[1].image).to.equal(
      imageCreateResponse.body.data._id.toString()
    );
    expect(res.body.data[1].buyer).to.equal(savedUser2._id.toString());
    expect(res.body.data[1].seller).to.equal(savedUser._id.toString());
  });
  it("Can get a many transactions with image filter", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({
      ...user,
      password: hashedPassword,
    });
    const savedUser2 = await User.create({
      ...user2,
      password: hashedPassword,
    });

    const savedUser3 = await User.create({
      ...user3,
      password: hashedPassword,
    });

    const login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    const imageCreateResponse = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    const imageCreateResponse2 = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    const transactionOne = await Transaction.create({
      ...transaction_one,
      image: imageCreateResponse.body.data._id,
      seller: savedUser._id.toString(),
      buyer: savedUser2._id.toString(),
    });
    const transactionTwo = await Transaction.create({
      ...transaction_two,
      image: imageCreateResponse.body.data._id,
      seller: savedUser._id.toString(),
      buyer: savedUser2._id.toString(),
    });
    const transactionThree = await Transaction.create({
      ...transaction_three,
      image: imageCreateResponse2.body.data._id,
      seller: savedUser._id.toString(),
      buyer: savedUser3._id.toString(),
    });

    const res = await request(app)
      .get("/transactions")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .query({
        image: imageCreateResponse.body.data._id.toString(),
      });

    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(200);
    expect(res.body.data.length).to.equal(2);
    expect(res.body.data[0].price).to.equal(transaction_one.price);
    expect(res.body.data[0].quantity).to.equal(transaction_one.quantity);
    expect(res.body.data[0].status).to.equal(transaction_one.status);
    expect(res.body.data[0].image).to.equal(
      imageCreateResponse.body.data._id.toString()
    );
    expect(res.body.data[0].buyer).to.equal(savedUser2._id.toString());
    expect(res.body.data[0].seller).to.equal(savedUser._id.toString());
    expect(res.body.data[1].price).to.equal(transaction_two.price);
    expect(res.body.data[1].quantity).to.equal(transaction_two.quantity);
    expect(res.body.data[1].status).to.equal(transaction_two.status);
    expect(res.body.data[1].image).to.equal(
      imageCreateResponse.body.data._id.toString()
    );
    expect(res.body.data[1].buyer).to.equal(savedUser2._id.toString());
    expect(res.body.data[1].seller).to.equal(savedUser._id.toString());
  });

  it("Can get a many transactions with startDate filter", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({
      ...user,
      password: hashedPassword,
    });
    const savedUser2 = await User.create({
      ...user2,
      password: hashedPassword,
    });

    const savedUser3 = await User.create({
      ...user3,
      password: hashedPassword,
    });

    const login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    const imageCreateResponse = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    const imageCreateResponse2 = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    const transactionOne = await Transaction.create({
      ...transaction_one,
      image: imageCreateResponse.body.data._id,
      seller: savedUser._id.toString(),
      buyer: savedUser2._id.toString(),
    });
    const transactionTwo = await Transaction.create({
      ...transaction_two,
      image: imageCreateResponse.body.data._id,
      seller: savedUser._id.toString(),
      buyer: savedUser2._id.toString(),
    });
    const transactionThree = await Transaction.create({
      ...transaction_three,
      image: imageCreateResponse2.body.data._id,
      seller: savedUser._id.toString(),
      buyer: savedUser3._id.toString(),
    });

    const res = await request(app)
      .get("/transactions")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .query({
        startDate: new Date("May 5, 2021"),
      });

    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(200);
    expect(res.body.data.length).to.equal(2);
    expect(res.body.data[0].price).to.equal(transaction_two.price);
    expect(res.body.data[0].quantity).to.equal(transaction_two.quantity);
    expect(res.body.data[0].status).to.equal(transaction_two.status);
    expect(res.body.data[0].image).to.equal(
      imageCreateResponse.body.data._id.toString()
    );
    expect(res.body.data[0].buyer).to.equal(savedUser2._id.toString());
    expect(res.body.data[0].seller).to.equal(savedUser._id.toString());
    expect(res.body.data[1].price).to.equal(transaction_three.price);
    expect(res.body.data[1].quantity).to.equal(transaction_three.quantity);
    expect(res.body.data[1].status).to.equal(transaction_three.status);
    expect(res.body.data[1].image).to.equal(
      imageCreateResponse2.body.data._id.toString()
    );
    expect(res.body.data[1].buyer).to.equal(savedUser3._id.toString());
    expect(res.body.data[1].seller).to.equal(savedUser._id.toString());
  });

  it("Can get a many transactions with endDate filter", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({
      ...user,
      password: hashedPassword,
    });
    const savedUser2 = await User.create({
      ...user2,
      password: hashedPassword,
    });

    const savedUser3 = await User.create({
      ...user3,
      password: hashedPassword,
    });

    const login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    const imageCreateResponse = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    const imageCreateResponse2 = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    const transactionOne = await Transaction.create({
      ...transaction_one,
      image: imageCreateResponse.body.data._id,
      seller: savedUser._id.toString(),
      buyer: savedUser2._id.toString(),
    });
    const transactionTwo = await Transaction.create({
      ...transaction_two,
      image: imageCreateResponse.body.data._id,
      seller: savedUser._id.toString(),
      buyer: savedUser2._id.toString(),
    });
    const transactionThree = await Transaction.create({
      ...transaction_three,
      image: imageCreateResponse2.body.data._id,
      seller: savedUser._id.toString(),
      buyer: savedUser3._id.toString(),
    });

    const res = await request(app)
      .get("/transactions")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .query({
        endDate: new Date("May 4, 2021"),
      });

    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(200);
    expect(res.body.data.length).to.equal(1);
    expect(res.body.data[0].price).to.equal(transaction_one.price);
    expect(res.body.data[0].quantity).to.equal(transaction_one.quantity);
    expect(res.body.data[0].status).to.equal(transaction_one.status);
    expect(res.body.data[0].image).to.equal(
      imageCreateResponse.body.data._id.toString()
    );
    expect(res.body.data[0].buyer).to.equal(savedUser2._id.toString());
    expect(res.body.data[0].seller).to.equal(savedUser._id.toString());
  });

  it("Can get a many transactions with pagination", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({
      ...user,
      password: hashedPassword,
    });
    const savedUser2 = await User.create({
      ...user2,
      password: hashedPassword,
    });

    const savedUser3 = await User.create({
      ...user3,
      password: hashedPassword,
    });

    const login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    const imageCreateResponse = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    const imageCreateResponse2 = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    const transactionOne = await Transaction.create({
      ...transaction_one,
      image: imageCreateResponse.body.data._id,
      seller: savedUser._id.toString(),
      buyer: savedUser2._id.toString(),
    });
    const transactionTwo = await Transaction.create({
      ...transaction_two,
      image: imageCreateResponse.body.data._id,
      seller: savedUser._id.toString(),
      buyer: savedUser2._id.toString(),
    });
    const transactionThree = await Transaction.create({
      ...transaction_three,
      image: imageCreateResponse2.body.data._id,
      seller: savedUser._id.toString(),
      buyer: savedUser3._id.toString(),
    });

    const res = await request(app)
      .get("/transactions")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .query({
        limit: 2,
        page: 2,
      });

    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(200);
    expect(res.body.data.length).to.equal(1);
    expect(res.body.data[0].price).to.equal(transaction_three.price);
    expect(res.body.data[0].quantity).to.equal(transaction_three.quantity);
    expect(res.body.data[0].status).to.equal(transaction_three.status);
    expect(res.body.data[0].image).to.equal(
      imageCreateResponse2.body.data._id.toString()
    );
    expect(res.body.data[0].buyer).to.equal(savedUser3._id.toString());
    expect(res.body.data[0].seller).to.equal(savedUser._id.toString());
  });
  it("Can delete a transaction", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({
      ...user,
      password: hashedPassword,
    });
    const savedUser2 = await User.create({
      ...user2,
      password: hashedPassword,
    });

    const login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    const imageCreateResponse = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    const transactionOne = await Transaction.create({
      ...transaction_one,
      image: imageCreateResponse.body.data._id,
      seller: savedUser._id.toString(),
      buyer: savedUser2._id.toString(),
    });

    const res = await request(app)
      .delete("/transactions/" + transactionOne._id)
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      });

    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(200);
  });
});
