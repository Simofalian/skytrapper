const mongoose = require("mongoose");

const reviewSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);
const blogSchema = mongoose.Schema(
  {
    title: {
      type: String,

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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },

    category: {
      type: String,
      required: true,
      default: "relationship",
    },
    likes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
      },
    ],
    comments: [
      {
        body: { type: String, required: true },
        name: { type: String },
        avatar: { type: String },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
        date: { type: Date, default: Date.now },
      },
    ],
    rating: { type: Number, required: true, default: 1 },
    reviews: [reviewSchema],
    numReviews: {
      type: Number,
      required: true,
      default: 2,
    },
  },
  { timestamps: true }
);

const Blog = mongoose.model("Blog", blogSchema);
module.exports = Blog;
