const express = require("express");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const globalErrorHandler = require("./controllers/errorController");
const AppError = require("./Utils/appError");
app.use(morgan("dev"));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"),
    res.header(
      "Access-Control_Allow-Header",
      "origin, X-Requested-With, Content-type, Accept"
    );

  next();
});
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(express.json());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();

  next();
});
const blogRouter = require("./routers/blogRouter");
const userRouter = require("./routers/userRouter");

app.use("/api/v1/blogs", blogRouter);
app.use("/api/v1/users", userRouter);

//to handle unhandled route errors
app.all("*", (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on the server`), 404);
});
//global error handling middleware
app.use(globalErrorHandler);
module.exports = app;
