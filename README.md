# Shopify-Backend-Internship-Challenge-2021

## Background 
This is a Node application created for Shopify's Fall 2021 backend developer intern challenge. It is meant to act as a backend server for an online image shop.
Before I get to the details of the application, I just want to say thanks for taking the time to consider my application :smiley:

## Project Structure
The application is initiated through the `app.js` file. This file contains the entry point for the application where the express application is created. In 
addition, the routes are created, the middleware is mounted, and the connection to mongoDB is made. 

The `model` folder contains the schema for the mongo database. They are used to ensure that the data being saved to the database is in a format that 
conforms with the business logic of the application. There are three data objects which are `users`, `images`, and `transactions`. They correspond to the
users of the application, the images made available by the users, and the transactions between users (i.e the sale of images from one user to another). The
following are the schemas for the described data objects. 

```javascript
const userSchema = Schema({
  username: { type: String, unique: true },
  password: String,
  email: { type: String, unique: true },
  balance: Number, //balance in dollars or whatever currency it may be
});
```

```javascript
const imageSchema = Schema({
  name: String,
  description: String,
  tags: [{ type: String }], //tags that can be used to group different types of images
  public: { type: Boolean, default: false }, //describes whether users other than the owner may view this image
  owner: { type: Schema.Types.ObjectId, ref: "user", required: true }, 
  discount: { type: Number, default: 0 }, //discount in dollars or whatever currency it may be
  inventory: Number, //number of images avaialble for sale
  image: {
    data: Buffer,
    contentType: String,
  }, //used to store the actual file in the database
  isAvailable: { type: Boolean, default: true }, //describes whether the image is for sale
});
```

```javascript
const transactionSchema = Schema({
  buyer: { type: Schema.Types.ObjectId, ref: "user", required: true },
  seller: { type: Schema.Types.ObjectId, ref: "user", required: true },
  price: Number,
  image: { type: Schema.Types.ObjectId, ref: "image", required: true },
  date: { type: Date, default: new Date() },
  quantity: {
    type: Number,
    min: 1,
    validate: {
      validator: Number.isInteger,
      message: "quantity must be an integer",
    },
  },
  isDeleted: { type: Boolean, default: false },
  status: { type: Number, default: 0, enum: statuses }, //status of the transaction (one of RECEIVED, SHIPPED, ARRIVED, RETURNED)
});
```

Next, the `routes` folder contains the endpoints that are made available by the application. There is a route for each of the models. In addition, there is also
a file named `auth.js` for user authentication (i.e logging in). Each of the models have their corresponding GET, POST, PUT, and DELETE endpoints in their
respective route file. 

The `controller` folder contains the controllers that are pointed to by the routes. They contain the CREATE, READ, UPDATE, and DELETE operations. Majority of the
business rules are also found here. For example, the transaction controller checks that the seller of an image is actually the owner of an image prior to creating 
the transaction. 

Lastly, there is the `tests` folder :sweat_smile:. I'll be honest and say that I didn't adopt TDD at first because I was eager to start creating the application... 
but I quickly found many mistakes after a basic iteration was created so I started writing the tests mid way through the completion of this application. Better
late than never right? :wink: It makes use of an in memory mongodb library (`mongodb-memory-server-core`) and the database is cleared between test cases to ensure
modularity. One thing I would have liked to done is to somehow insert the images directly into the mongo database so that I wouldn't have to rely on another 
endpoint when I was testing something else (but I couldn't get it to work :sob:) There are test cases that can be added but I think the ones now cover the basics 
well. 

## Running The Application Locally
Now that you have a good understanding of how this project is structured, lets talk about how you can run this on your own machine. Here are the things you will
need to get this application up and running: 
1. Have node installed (I'm running version 12.18.0)
2. Have mongodb installed (I'm running version 4.2.0)

Now we can proceed with the project. Follow these steps: 
1. Start mongo with `mongod --dbpath <path of folder where you want the data to be stored>` by default it will be running on localhost:27017 which is what the
application assumes 
2. Install the required libraries by navigating to the root of the application directory and running `npm install`
3. To start the application run `npm start` but if you want to run the tests please use `npm test`

Typically, I would put certain values into the environment variables but to keep it simple and easy for anyone to run locally, many the values such as the server
port, database name, and token secret have been hard coded.

## API Documentation
### POST /login
Used to log a user into the application. 
Requires `username` and `password` in the body.
Example: 
```javascript
{
  username: "Aron",
  password: "password"
}
```

### GET /users/:id
Used to fetch a specific user using their id.
Requires `id` of the user in the params.

### POST /users
Used to create a new user.
Requires `username`, `password`, `email`, and `balance` in the body.
Example: 
```javascript
{
  username: "Aron",
  password: "password",
  email: "aron@test.com",
  balance: 1000
}
```

### GET /images/:id 
Used to get a specific image 
Requires `id` in the params

### GET /images
Used to get multiple images
Query accepts `limit`, `page`, `name`, `tag`, `description`, `discount`, and `inventory`. Please see test cases for examples on how they are used.

### POST /images
Used to create a new image
See test cases on how to call this endpoint

### PUT /images/:id
Used to update an existing image 
Body accepts same fields as POST /images

### GET /transactions/:id
Used to fetch a specific transaction

### GET /transactions
Used to fetch many transactions
Query accepts `limit`, `page`, `image`, `buyer`, `seller`, `startDate`, and `endDate`. Please see test cases for examples on how they are used.

### POST /transactions
Used to create a transaction
See test cases on how to call this endpoint 

### PUT /transactions/:id
Used to update an existing transaction 
Body accepts the same fields as POST /transactions
