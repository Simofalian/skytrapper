const express = require("express");
const cors = require("cors");
const app = express();
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const globalErrorHandler = require("./controllers/errorController");
const AppError = require("./Utils/appError");
const passport = require("passport");

//global middlewares
//allow corejs2
app.use(cors({ credentials: true }));
//set Security HTTP headers
app.use(helmet());
//set morgan to work under NODE_ENV === 'development'/logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
console.log(process.env.NODE_ENV);
//set limit for req from same ip
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this ip, please try again in an hour",
});
app.use("/api", limiter);
//allow access control
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"),
    res.header(
      "Access-Control_Allow-Header",
      "origin, X-Requested-With, Content-type, Accept"
    );

  next();
});
//body parser , reading data from body into req.body
app.use(bodyParser.urlencoded({ extended: false, limit: "10kb" }));
app.use(bodyParser.json({ limit: "10kb" }));

//cookie parser
app.use(cookieParser());
//data  sanitization against noSQL query injections
app.use(mongoSanitize()); //looks at all req and filter out all dollar signs and hence prevent polutions

//data sanitization against xss
app.use(xss());

//prevent parameter polutions
app.use(
  hpp({
    //whitelist is a list of fields that can be used in qeuries eg filtering by duration of 5 years and 10years
    whitelist: ["duration", "title", "createdAt", "ratingQuantity"],
  })
);

//serving static files
app.use(express.static(`${__dirname}/public`));
//passport middleware
app.use(passport.initialize());

//passport strategy
require("./config/passport")(passport);

//test middleware - useful for example testing headers
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  // console.log(req.cookies);
  next();
});

const blogRouter = require("./routers/blogRouter");
const userRouter = require("./routers/userRouter");
const profileRouter = require("./routers/profileRouter");

app.use("/api/v1/blogs", blogRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/profile", profileRouter);

//to handle unhandled route errors
app.all("*", (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on the server`), 404);
});
//global error handling middleware
app.use(globalErrorHandler);
module.exports = app;
