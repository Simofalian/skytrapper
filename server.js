const mongoose = require("mongoose");

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION * SHUTTING DOWN....");
  console.log(err.name, err.message);

  process.exit(1);
});

const app = require("./app");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connection to MongoDb successful");
  });

const port = process.env.PORT || 8000;

const server = app.listen(port, () => {
  console.log(`app Listening on port ${port}`);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 🌟🌟🌟🌟 SHUTTING DOWN....");
  console.log(err.name, err.message);

  server.close(() => {
    process.exit(1);
  });
});
