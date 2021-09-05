const fs = require("fs");

const mongoose = require("mongoose");

const dotenv = require("dotenv");

const Blog = require("../models/blogModel");

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
    console.log("DB connection successful");
  });

//read json file

const blogs = JSON.parse(fs.readFileSync(`${__dirname}/blogs.json`, "utf-8"));

//IMPORT DATA into DB

const importData = async () => {
  try {
    await Blog.create(blogs);

    console.log("Data imported successfully");
    process.exit(0);
  } catch (err) {
    console.log(err);
  }
};

//DELETE all data from db collections

const deleteData = async () => {
  try {
    await Blog.deleteMany();

    console.log("deleted successfully");
    process.exit(0);
  } catch (err) {
    console.log(err);
  }
};

if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}
//console.log(process.argv);
