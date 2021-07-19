const mongoose = require("mongoose");
const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    unique: true,
    required: [true, "must have a title"],
  },
  snippet: {
    type: String,
    trim: true,
    required: [true, "must have a title"],
  },
  body: {
    type: String,
    trim: true,
    required: [true, "must have a title"],
  },

  slug: String,
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
});

const Blog = mongoose.model("Blog", blogSchema);
module.exports = Blog;
