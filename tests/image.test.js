const request = require("supertest");
const dbHelper = require("./db-helper");
const app = require("../app");
const { expect } = require("chai");
const User = require("../model/user");
const bcrypt = require("bcrypt");
const path = require("path");
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

const image_three = {
  name: "Tokyo Skyline",
  description: "Picture taken from a rooftop in Tokyo",
  tags: ["Japan", "scenary", "city"],
  inventory: 300,
};
const imagePath = path.join(__dirname + "/images/" + "pizza.jpg");

describe("Image Tests", () => {
  //connect to the in memory database
  before(async () => {
    await dbHelper.connect();
  });

  //empty the database after each test case
  afterEach(async () => await dbHelper.clearDatabase());

  //when all the tests finish running then we close the database
  after(async () => await dbHelper.closeDatabase());

  //the image tests start here
  it("Can create image", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({ ...user, password: hashedPassword });

    const login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    const res = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(201);
    //js equality is kind of weird so chai provides the alternative "eql" for checking arrays
    expect(res.body.data.tags).to.eql(image_one.tags);
    expect(res.body.data.name).to.equal(image_one.name);
    expect(res.body.data.description).to.equal(image_one.description);
    expect(res.body.data.inventory).to.equal(image_one.inventory);
    expect(res.body.data.owner).to.equal(savedUser._id.toString());
    expect(res.body.data.image.data).to.have.property("data");
  });

  //TODO: find a way to upload the image to the database without using the endpoint to keep things more modular
  it("Can get a specific image", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({
      ...user,
      password: hashedPassword,
    });

    const login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    const image = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    const res = await request(app)
      .get("/images/" + image.body.data._id.toString())
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      });

    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(200);
    //js equality is kind of weird so chai provides the alternative "eql"
    expect(res.body.data.tags).to.eql(image_one.tags);
    expect(res.body.data.name).to.equal(image_one.name);
    expect(res.body.data.description).to.equal(image_one.description);
    expect(res.body.data.inventory).to.equal(image_one.inventory);
    expect(res.body.data.owner).to.equal(savedUser._id.toString());
    expect(res.body.data.image.data).to.have.property("data");
  });

  it("Cannot get a private image belonging to another user", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    await User.create({
      ...user,
      password: hashedPassword,
    });

    await User.create({
      ...user2,
      password: hashedPassword,
    });

    const login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    const image = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    const unauthLogin = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user2.username, password: user2.password });

    const res = await request(app)
      .get("/images/" + image.body.data._id.toString())
      .set({
        "Content-Type": "application/json",
        Authorization: unauthLogin.body.data.token,
      });

    //Assertions
    expect(res.statusCode).to.equal(401);
    expect(res.body.message).to.equal("Unauthorized");
  });

  it("Can get multiple images that is available to a particular user", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({
      ...user,
      password: hashedPassword,
    });

    await User.create({
      ...user2,
      password: hashedPassword,
    });

    const userLogin = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: userLogin.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: userLogin.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_two);

    const user2Login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user2.username, password: user2.password });

    await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: user2Login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_three);

    const res = await request(app).get("/images").set({
      "Content-Type": "application/json",
      Authorization: userLogin.body.data.token,
    });

    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(200);
    expect(res.body.data.length).to.equal(2);
    //js equality is kind of weird so chai provides the alternative "eql"
    expect(res.body.data[0].tags).to.eql(image_one.tags);
    expect(res.body.data[0].name).to.equal(image_one.name);
    expect(res.body.data[0].description).to.equal(image_one.description);
    expect(res.body.data[0].inventory).to.equal(image_one.inventory);
    expect(res.body.data[0].owner).to.equal(savedUser._id.toString());
    expect(res.body.data[0].image.data).to.have.property("data");
    expect(res.body.data[1].tags).to.eql(image_two.tags);
    expect(res.body.data[1].name).to.equal(image_two.name);
    expect(res.body.data[1].description).to.equal(image_two.description);
    expect(res.body.data[1].inventory).to.equal(image_two.inventory);
    expect(res.body.data[1].owner).to.equal(savedUser._id.toString());
    expect(res.body.data[1].image.data).to.have.property("data");
  });

  it("Can update an image", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({
      ...user,
      password: hashedPassword,
    });

    const login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    const createImageResponse = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    const res = await request(app)
      .put("/images/" + createImageResponse.body.data._id.toString())
      .set({
        "Content-Type": "application/json",
        Authorization: login.body.data.token,
      })
      .send(image_two);
    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(200);
    //js equality is kind of weird so chai provides the alternative "eql"
    expect(res.body.data.tags).to.eql(image_two.tags);
    expect(res.body.data.name).to.equal(image_two.name);
    expect(res.body.data.description).to.equal(image_two.description);
    expect(res.body.data.inventory).to.equal(image_two.inventory);
    expect(res.body.data.owner).to.equal(savedUser._id.toString());
    expect(res.body.data.image.data).to.have.property("data");
  });

  it("Can get multiple images with the description filter", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({
      ...user,
      password: hashedPassword,
    });

    await User.create({
      ...user2,
      password: hashedPassword,
    });

    const userLogin = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: userLogin.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: userLogin.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_two);

    const user2Login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user2.username, password: user2.password });

    await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: user2Login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_three);

    const res = await request(app)
      .get("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: userLogin.body.data.token,
      })
      .query({
        description: "pizza",
      });

    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(200);
    expect(res.body.data.length).to.equal(1);
    //js equality is kind of weird so chai provides the alternative "eql"
    expect(res.body.data[0].tags).to.eql(image_one.tags);
    expect(res.body.data[0].name).to.equal(image_one.name);
    expect(res.body.data[0].description).to.equal(image_one.description);
    expect(res.body.data[0].inventory).to.equal(image_one.inventory);
    expect(res.body.data[0].owner).to.equal(savedUser._id.toString());
    expect(res.body.data[0].image.data).to.have.property("data");
  });
  it("Can get multiple images with the name filter", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({
      ...user,
      password: hashedPassword,
    });

    await User.create({
      ...user2,
      password: hashedPassword,
    });

    const userLogin = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: userLogin.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: userLogin.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_two);

    const user2Login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user2.username, password: user2.password });

    await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: user2Login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_three);

    const res = await request(app)
      .get("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: userLogin.body.data.token,
      })
      .query({
        name: "pizza",
      });

    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(200);
    expect(res.body.data.length).to.equal(1);
    //js equality is kind of weird so chai provides the alternative "eql"
    expect(res.body.data[0].tags).to.eql(image_one.tags);
    expect(res.body.data[0].name).to.equal(image_one.name);
    expect(res.body.data[0].description).to.equal(image_one.description);
    expect(res.body.data[0].inventory).to.equal(image_one.inventory);
    expect(res.body.data[0].owner).to.equal(savedUser._id.toString());
    expect(res.body.data[0].image.data).to.have.property("data");
  });
  it("Can get multiple images with the tag filter", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({
      ...user,
      password: hashedPassword,
    });

    await User.create({
      ...user2,
      password: hashedPassword,
    });

    const userLogin = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: userLogin.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: userLogin.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_two);

    const user2Login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user2.username, password: user2.password });

    await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: user2Login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_three);

    const res = await request(app)
      .get("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: userLogin.body.data.token,
      })
      .query({
        tag: "mcm",
      });

    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(200);
    expect(res.body.data.length).to.equal(1);
    //js equality is kind of weird so chai provides the alternative "eql"
    expect(res.body.data[0].tags).to.eql(image_two.tags);
    expect(res.body.data[0].name).to.equal(image_two.name);
    expect(res.body.data[0].description).to.equal(image_two.description);
    expect(res.body.data[0].inventory).to.equal(image_two.inventory);
    expect(res.body.data[0].owner).to.equal(savedUser._id.toString());
    expect(res.body.data[0].image.data).to.have.property("data");
  });

  it("Can get multiple images with the inventory filter", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({
      ...user,
      password: hashedPassword,
    });

    await User.create({
      ...user2,
      password: hashedPassword,
    });

    const userLogin = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: userLogin.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: userLogin.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_two);

    const user2Login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user2.username, password: user2.password });

    await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: user2Login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_three);

    const res = await request(app)
      .get("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: userLogin.body.data.token,
      })
      .query({
        inventory: 1000,
      });

    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(200);
    expect(res.body.data.length).to.equal(1);
    //js equality is kind of weird so chai provides the alternative "eql"
    expect(res.body.data[0].tags).to.eql(image_two.tags);
    expect(res.body.data[0].name).to.equal(image_two.name);
    expect(res.body.data[0].description).to.equal(image_two.description);
    expect(res.body.data[0].inventory).to.equal(image_two.inventory);
    expect(res.body.data[0].owner).to.equal(savedUser._id.toString());
    expect(res.body.data[0].image.data).to.have.property("data");
  });

  it("Can get multiple images with the discount filter", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({
      ...user,
      password: hashedPassword,
    });

    await User.create({
      ...user2,
      password: hashedPassword,
    });

    const userLogin = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: userLogin.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: userLogin.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_two);

    const user2Login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user2.username, password: user2.password });

    await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: user2Login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_three);

    const res = await request(app)
      .get("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: userLogin.body.data.token,
      })
      .query({
        discount: 0,
      });

    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(200);
    expect(res.body.data.length).to.equal(2);
    //js equality is kind of weird so chai provides the alternative "eql"
    expect(res.body.data[0].tags).to.eql(image_one.tags);
    expect(res.body.data[0].name).to.equal(image_one.name);
    expect(res.body.data[0].description).to.equal(image_one.description);
    expect(res.body.data[0].inventory).to.equal(image_one.inventory);
    expect(res.body.data[0].owner).to.equal(savedUser._id.toString());
    expect(res.body.data[0].image.data).to.have.property("data");
    expect(res.body.data[1].tags).to.eql(image_two.tags);
    expect(res.body.data[1].name).to.equal(image_two.name);
    expect(res.body.data[1].description).to.equal(image_two.description);
    expect(res.body.data[1].inventory).to.equal(image_two.inventory);
    expect(res.body.data[1].owner).to.equal(savedUser._id.toString());
    expect(res.body.data[1].image.data).to.have.property("data");
  });
  it("Read all endpoint with pagination filters", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const savedUser = await User.create({
      ...user,
      password: hashedPassword,
    });

    await User.create({
      ...user2,
      password: hashedPassword,
    });

    const userLogin = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: userLogin.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: userLogin.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_two);

    const user2Login = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user2.username, password: user2.password });

    await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: user2Login.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_three);

    const res = await request(app)
      .get("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: userLogin.body.data.token,
      })
      .query({
        limit: 1,
        page: 2,
      });

    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(200);
    expect(res.body.data.length).to.equal(1);
    //js equality is kind of weird so chai provides the alternative "eql"
    expect(res.body.data[0].tags).to.eql(image_two.tags);
    expect(res.body.data[0].name).to.equal(image_two.name);
    expect(res.body.data[0].description).to.equal(image_two.description);
    expect(res.body.data[0].inventory).to.equal(image_two.inventory);
    expect(res.body.data[0].owner).to.equal(savedUser._id.toString());
    expect(res.body.data[0].image.data).to.have.property("data");
  });
  it("Can delete an image", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    await User.create({
      ...user,
      password: hashedPassword,
    });

    const userLogin = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    const userImageOne = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: userLogin.body.data.token,
      })
      .attach("file", imagePath)
      .field(image_one);

    const res = await request(app)
      .delete("/images/" + userImageOne.body.data._id.toString())
      .set({
        "Content-Type": "application/json",
        Authorization: userLogin.body.data.token,
      });

    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(200);
  });
  it("Cannot get a deleted image", async () => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    await User.create({
      ...user,
      password: hashedPassword,
    });

    const userLogin = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send({ username: user.username, password: user.password });

    const userImageOne = await request(app)
      .post("/images")
      .set({
        "Content-Type": "application/json",
        Authorization: userLogin.body.data.token,
      })
      .attach("file", imagePath)
      .field({ ...image_one, isDeleted: true });

    const res = await request(app)
      .get("/images/" + userImageOne.body.data._id.toString())
      .set({
        "Content-Type": "application/json",
        Authorization: userLogin.body.data.token,
      });

    //Assertions
    //TODO: find a way to compare the file returned from the api and the original uploaded file
    expect(res.statusCode).to.equal(400);
    expect(res.body.message).to.equal("The image was deleted");
  });
});
