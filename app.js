// import and instantiate express
const express = require("express"); // CommonJS import style!
const app = express(); // instantiate an Express object
const path = require("path");

// import some useful middleware
const multer = require("multer"); // middleware to handle HTTP POST requests with file uploads
const axios = require("axios"); // middleware for making requests to APIs
require("dotenv").config({ silent: true }); // load environmental variables from a hidden file named .env
const morgan = require("morgan"); // middleware for nice logging of incoming HTTP requests

/**
 * Typically, all middlewares would be included before routes
 * In this file, however, most middlewares are after most routes
 * This is to match the order of the accompanying slides
 */

// use the morgan middleware to log all incoming http requests
app.use(morgan("dev")); // morgan has a few logging default styles - dev is a nice concise color-coded style

// use express's builtin body-parser middleware to parse any data included in a request
app.use(express.json()); // decode JSON-formatted incoming POST data
app.use(express.urlencoded({ extended: true })); // decode url-encoded incoming POST data

// make 'public' directory publicly readable with static content
app.use("/static", express.static("public"));

// route for HTTP GET requests to the root document
app.get("/", (req, res) => {
  res.send("Goodbye world!");
});

// route for HTTP GET requests to /html-example
app.get("/html-example", (req, res) => {
  res.sendFile("/public/some-page.html", { root: __dirname });
});

// route for HTTP GET requests to /json-example
app.get("/json-example", (req, res) => {
  // assemble an object with the data we want to send
  const body = {
    title: "Hello!",
    heading: "Hello!",
    message: "Welcome to this JSON document, served up by Express",
    imagePath: "/static/images/donkey.jpg",
  };

  // send the response as JSON to the client
  res.json(body);
});

// custom middleware - first
app.use("/middleware-example", (req, res, next) => {
  // make a modification to either the req or res objects
  res.addedStuff = "First middleware function run!";
  // run the next middleware function, if any
  next();
});

// custom middleware - second
app.use("/middleware-example", (req, res, next) => {
  // make a modification to either the req or res objects
  res.addedStuff += " Second middleware function run!";
  // run the next middleware function, if any
  next();
});

// route for HTTP GET requests to /middleware-example
app.get("/middleware-example", (req, res) => {
  // grab data passed by the middleware, if available
  const message = res.addedStuff
    ? res.addedStuff
    : "Sorry, the middleware did not work!";
  // use the data added by the middleware in some way
  res.send(message);
});

// receive POST data from the client
app.post("/post-example", (req, res) => {
  // now do something amazing with the data we received from the client
  const data = {
    status: "amazing success!",
    message: "congratulations on sending us this data!",
    your_data: {
      name: req.body.your_name,
      email: req.body.your_email,
      agree: req.body.agree,
    },
  };
  // ... then send a response of some kind to client
  res.json(data);
});

// enable file uploads saved to disk in a directory named 'public/uploads'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    // take apart the uploaded file's name so we can create a new one based on it
    const extension = path.extname(file.originalname);
    const basenameWithoutExtension = path.basename(
      file.originalname,
      extension
    );
    // create a new filename with a timestamp in the middle
    const newName = `${basenameWithoutExtension}-${Date.now()}${extension}`;
    // tell multer to use this new filename for the uploaded file
    cb(null, newName);
  },
});
const upload = multer({ storage: storage });

// route for HTTP POST requests for /upload-example
app.post("/upload-example", upload.array("my_files", 3), (req, res, next) => {
  // check whether anything was uploaded
  if (!req.files || req.files.length == 0) {
    // failure!
    const error = new Error("Please upload some files!");
    error.httpStatusCode = 400;
    res.json({
      status: "you fail!!!",
      message: "rejected your files... try harder",
    });
    // return next(error)
  } else if (req.files.length > 3) {
    res.json({
      status: "you fail!!!",
      message: "rejected your files... try harder",
    });
  } else {
    // success
    // send a message back to the client, for example, a simple JSON object
    const data = {
      status: "all good",
      message: "files were uploaded!!!",
      files: req.files,
    };
    res.json(data);
  }
});

// proxy requests to/from an API
app.get("/proxy-example", (req, res, next) => {
  // use axios to make a request to an API for animal data
  axios
    .get("https://my.api.mockaroo.com/animals.json?key=d9ddfc40&num=10")
    .then(apiResponse => res.json(apiResponse.data)) // pass data along directly to client
    .catch(err => next(err)); // pass any errors to express
});

// same route as above, but using environmental variables for secret credentials
app.get("/dotenv-example", async (req, res, next) => {
  try {
    // insert the environmental variable into the URL we're requesting
    const response = await axios.get(
      `${process.env.API_BASE_URL}?key=${process.env.API_SECRET_KEY}&num=10`
    );
    res.json(response.data); // pass data along directly to client
  } catch (err) {
    res.json({
      success: false,
      error: `Oops... In order to use the dotenv module, you must first make a file named .env on your server - see the .env.example file for example.`,
    });
  }
});

// a route with parameter ... animalId is a parameter
// the code here is similar to the dotenv-example route above... but...
// using async/await in this route to show another way of dealing with asynchronous requests to an external API or database
app.get("/parameter-example/:animalId", async (req, res) => {
  // use axios to make a request to an API to fetch a single animal's data
  // we use a Mock API here, but imagine we passed the animalId to a real API and received back data about that animal
  try {
    const apiResponse = await axios.get(
      `${process.env.API_BASE_URL}?key=${process.env.API_SECRET_KEY}&num=1&id=${req.params.animalId}`
    );

    // express places parameters into the req.params object
    const responseData = {
      status: "wonderful",
      message: `Imagine we got the data from the API for animal #${req.params.animalId}`,
      animalId: req.params.animalId,
      animal: apiResponse.data,
    };

    // send the data in the response
    res.json(responseData);
  } catch (err) {
    // send an error JSON object back to the browser
    res.json(err);
  }
});

// export the express app we created to make it available to other modules
module.exports = app; // CommonJS export style!
