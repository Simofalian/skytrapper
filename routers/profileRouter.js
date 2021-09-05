const express = require("express");
const passport = require("passport");

const profileController = require("./../controllers/profileController");

const router = express.Router();

router.route("/all").get(profileController.getAllProfiles);
router.route("/handle/:handle").get(profileController.getProfileByHandle);
router.route("/user/:user_id").get(profileController.getProfileByUserId);
router
  .route("/experience")
  .post(
    passport.authenticate("jwt", { session: false }),
    profileController.addExperience
  );
router
  .route("/education")
  .post(
    passport.authenticate("jwt", { session: false }),
    profileController.addEducation
  );
router
  .route("/experience/:exp_id")
  .delete(
    passport.authenticate("jwt", { session: false }),
    profileController.deleteExperience
  );
router
  .route("/education/:edu_id")
  .delete(
    passport.authenticate("jwt", { session: false }),
    profileController.deleteEducation
  );

router
  .route("/")
  .get(
    passport.authenticate("jwt", { session: false }),
    profileController.getProfile
  )
  .post(
    passport.authenticate("jwt", { session: false }),
    profileController.createProfile
  )
  .delete(
    passport.authenticate("jwt", { session: false }),
    profileController.deleteProfile
  );

module.exports = router;
