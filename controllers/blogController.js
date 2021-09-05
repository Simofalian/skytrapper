const mongoose = require("mongoose");
const catchAsync = require("../Utils/catchAsync");
const Blog = require("./../models/blogModel");
const AppError = require("./../Utils/appError");
const validateBlogInput = require("./../validation/blog");
const validateCommentInput = require("./../validation/comment");
const Profile = require("./../models/profileModel");
// @Route GET api/v1/blogs
// @desc create new blog
// @access public
exports.getAllBlogs = async (req, res) => {
  const errors = {};
  try {
    const blogs = await Blog.find().sort({ date: -1 });
    res.status(200).json({
      status: "success",
      result: blogs.length,
      data: {
        blogs,
      },
    });
  } catch (err) {
    res.status(404).json({
      blog: "There were no blogs found",
    });
  }
};

// @Route POST api/v1/blogs
// @desc create new blog
// @access private
exports.createBlog = catchAsync(async (req, res) => {
  // validate blog inputs
  const { errors, isValid } = validateBlogInput(req.body);

  // check for errors
  if (!isValid) {
    // if errors send 400 error with the object errors
    return res.status(400).json(errors);
  }
  const newBlog = await Blog.create({
    title: req.body.title,
    snippet: req.body.snippet,
    body: req.body.body,
    user: req.user.id,
  });

  res.status(201).json({
    status: "success",
    data: {
      data: newBlog,
    },
  });
});

// @Route GET api/v1/blogs/:id
// @desc get one blog by id
// @access public
exports.getOneBlog = catchAsync(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return next(new AppError("Blog not found", 404));
  res.status(200).json({
    status: "success",
    data: {
      blog,
    },
  });
});
// @Route PATCH api/v1/blogs/:id
// @desc update blog
// @access private
exports.updateBlog = catchAsync(async (req, res) => {
  const newBlog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidation: true,
  });
  if (!newBlog) return next(new AppError("Blog not found", 404));
  res.status(201).json({
    status: "success",
    data: {
      blogs: newBlog,
    },
  });
});

// @Route DELETE api/v1/blogs/:id
// @desc delete owner blog
// @access private
exports.deleteBlog = catchAsync(async (req, res, next) => {
  const errors = {};
  await Profile.findOne({ user: req.user.id }).then((profile) => {
    Blog.findById(req.params.id)
      .then((blog) => {
        // check for post owner

        if (blog.user.toString() !== req.user.id) {
          errors.notauthorized = "User not authorized";
          return next(new AppError(errors.notauthorized, 401));
        }
        blog.remove().then(() => {
          res.status(200).json({ success: true });
        });
      })
      .catch((err) => {
        res.json(err);
      });
  });
});

// @Route POST api/v1/blogs/like/:id
// @desc post likes for a blog
// @access private
exports.likeBlog = catchAsync(async (req, res, next) => {
  const errors = {};
  await Profile.findOne({ user: req.user.id }).then((profile) => {
    Blog.findById(req.params.id)
      .then((blog) => {
        // check if the user already liked this blog
        if (
          blog.likes.filter((like) => like.user.toString() === req.user.id)
            .length > 0
        ) {
          errors.alreadyliked = "You have already liked this blog";
          return next(new AppError(errors.alreadyliked, 400));
        }
        blog.likes.unshift({ user: req.user.id });
        blog.save().then((blog) => res.json(blog));
      })
      .catch((err) => {
        res.json(err);
      });
  });
});

// @Route POST api/v1/blogs/unlike/:id
// @desc post unlikes for a blog
// @access private
exports.unlikeBlog = catchAsync(async (req, res, next) => {
  const errors = {};
  await Profile.findOne({ user: req.user.id }).then((profile) => {
    Blog.findById(req.params.id)
      .then((blog) => {
        // check if the user already liked this blog
        if (
          blog.likes.filter((like) => like.user.toString() === req.user.id)
            .length === 0
        ) {
          errors.notliked = "You have not yet liked this blog";
          return next(new AppError(errors.notliked, 400));
        }
        //get remove index
        const removeIndex = blog.likes
          .map((item) => item.user.toString())
          .indexOf(req.user.id);
        //Splice out of arrayish

        blog.likes.splice(removeIndex, 1);

        //save blog
        blog.save().then((blog) => res.json(blog));
      })
      .catch((err) => {
        res.json(err);
      });
  });
});

// @Route POST api/v1/blogs/comment/:id
// @desc post comment for a blog
// @access private
exports.postComment = catchAsync(async (req, res, next) => {
  const { errors, isValid } = validateCommentInput(req.body);

  // check for errors
  if (!isValid) {
    // if errors send 400 error with the object errors
    return res.status(400).json(errors);
  }

  await Blog.findById(req.params.id)
    .then((blog) => {
      const newComment = {
        body: req.body.body,
        name: req.body.name,
        avatar: req.body.avatar,
        user: req.user.id,
      };
      // add to comment arrayish

      blog.comments.unshift(newComment);

      //save blog
      blog.save().then((blog) => res.json(blog));
    })
    .catch((err) => {
      errors.noblog = "Blog not found";
      return next(new AppError(errors.noblog, 404));
    });
});

// @Route DELETE api/v1/blogs/comment/:id
// @desc delete comment from a blog
// @access private
exports.deleteComment = catchAsync(async (req, res, next) => {
  const errors = {};

  await Blog.findById(req.params.id)
    .then((blog) => {
      // check if comment exist
      if (
        blog.comments.filter(
          (comment) => comment._id.toString() === req.params.comment_id
        ).length === 0
      ) {
        errors.commentnotexists = `There is no comment with this ${comment_id} id`;
        return next(new AppError(errors.commentnotexists, 404));
      }
      //get remove index
      const removeIndex = blog.comments
        .map((item) => item._id.toString())
        .indexOf(req.params.comment_id);
      //Splice out of arrayish

      blog.comments.splice(removeIndex, 1);

      //save blog
      blog.save().then((blog) => res.json(blog));
    })
    .catch((err) => {
      errors.noblog = "Blog not found";
      return next(new AppError(errors.noblog, 404));
    });
});
