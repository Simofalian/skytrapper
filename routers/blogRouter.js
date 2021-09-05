const express = require("express");
const authController = require("./../controllers/authController");
const blogController = require("./../controllers/blogController");
const router = express.Router();
const passport = require("passport");

router
  .route("/")
  .get(blogController.getAllBlogs)
  .post(
    passport.authenticate("jwt", { session: false }),
    blogController.createBlog
  );
router
  .route("/like/:id")
  .post(
    passport.authenticate("jwt", { session: false }),
    blogController.likeBlog
  );
router
  .route("/unlike/:id")
  .post(
    passport.authenticate("jwt", { session: false }),
    blogController.unlikeBlog
  );
router
  .route("/comment/:id")
  .post(
    passport.authenticate("jwt", { session: false }),
    blogController.postComment
  );
router
  .route("/comment/:id/:comment_id")
  .delete(
    passport.authenticate("jwt", { session: false }),
    blogController.deleteComment
  );
router
  .route("/:id")
  .get(blogController.getOneBlog)
  .patch(
    passport.authenticate("jwt", { session: false }),
    blogController.updateBlog
  )
  .delete(
    passport.authenticate("jwt", { session: false }),
    blogController.deleteBlog
  );

module.exports = router;
