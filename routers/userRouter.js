const express = require("express");
const router = express.Router();
const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController");
const passport = require("passport");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);
router.patch(
  "/updateMyPassword",
  authController.protect,
  authController.updatePassword
);
router.patch("/updateMe", authController.protect, userController.updateMe);
router.delete("/deleteMe", authController.protect, userController.deleteMe);

router.route("/").get(userController.getAllUsers);
router
  .route("/current")
  .get(
    passport.authenticate("jwt", { session: false }),
    authController.current
  );

router.get("/me", authController.isLoggedIn);

router.route("/register").post(userController.registerUser);
router
  .route("/:id")
  .get(userController.getUser)
  .delete(
    authController.protect,
    authController.restrictTo("admin", "manager"),
    userController.deleteUser
  );

module.exports = router;
