const catchAsync = require("./../Utils/catchAsync");
const Profile = require("./../models/profileModel");
const User = require("./../models/userModel");
const AppError = require("./../Utils/appError");
const validateProfileInput = require("./../validation/profile");
const validateExperienceInput = require("./../validation/experience");
const validateEducationInput = require("./../validation/education");
// @Route GET api/v1/profile
// @desc get all profiles
// @access private
exports.getAllProfiles = catchAsync(async (req, res, next) => {
  const errors = {};

  await Profile.find()
    .populate("user", ["name", "avatar"])
    .then((profiles) => {
      if (!profiles) {
        errors.noprofile = "There are no profiles";
        return next(new AppError(errors.noprofile, 404));
      }
      res.status(200).json({
        status: "Sucess",
        result: profiles.length,
        data: {
          profiles,
        },
      });
    })
    .catch((err) => {
      errors.profile = err.message;
      return next(new AppError(errors.profile, 500));
    });
});

// @Route GET api/v1/profile/handle/:handle
// @desc get profile by handle
// @access public
exports.getProfileByHandle = catchAsync(async (req, res, next) => {
  const errors = {};
  await Profile.findOne({ handle: req.params.handle })
    .populate("user", ["name", "avatar"])
    .then((profile) => {
      if (!profile) {
        errors.noprofile = `There is no profile for ${req.params.handle}`;
        return next(new AppError(errors.noprofile, 404));
      }

      res.status(200).json(profile);
    })
    .catch((err) => {
      res.status(500).json(err);
    });
});

// @Route GET api/v1/profile/user/:user_id
// @desc get profile by user id
// @access public
exports.getProfileByUserId = catchAsync(async (req, res, next) => {
  const errors = {};
  await Profile.findOne({ user: req.params.user_id })
    .populate("user", ["name", "avatar"])
    .then((profile) => {
      if (!profile) {
        errors.noprofile = `There is no profile for ${req.params.handle}`;
        return next(new AppError(errors.noprofile, 404));
      }

      res.status(200).json(profile);
    })
    .catch((err) => {
      res.status(500).json({ profile: "there is no profile for this user" });
    });
});
// @Route post api/v1/profile
// @desc create or update profiles
// @access private
exports.createProfile = catchAsync(async (req, res, next) => {
  const { errors, isValid } = validateProfileInput(req.body);

  //check validation
  if (!isValid) {
    //   return any errors
    return res.status(400).json(errors);
  }
  //get fieldofstudy
  const profileFields = {};

  profileFields.user = req.user.id;
  if (req.body.handle) profileFields.handle = req.body.handle;
  if (req.body.company) profileFields.company = req.body.company;
  if (req.body.website) profileFields.website = req.body.website;
  if (req.body.location) profileFields.location = req.body.location;
  if (req.body.bio) profileFields.bio = req.body.bio;
  if (req.body.status) profileFields.status = req.body.status;
  if (req.body.githubusername)
    profileFields.githubusername = req.body.githubusername;
  //  Skills split into array of fields
  if (typeof req.body.skills !== "undefined") {
    profileFields.skills = req.body.skills.split(",");
  }
  //social
  profileFields.social = {};

  if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
  if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
  if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
  if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
  if (req.body.instagram) profileFields.social.instagram = req.body.instagram;

  await Profile.findOne({ user: req.user.id })
    .then((profile) => {
      if (profile) {
        //update
        Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        ).then((profile) => res.json(profile));
      }
      //create
      //check if handle exist

      Profile.findOne({ handle: profileFields.handle }).then((profile) => {
        if (profile) {
          errors.handle = "That handle already exists";
          return next(new AppError(errors.handle, 400));
        }
        //save new profile
        new Profile(profileFields).save().then((profile) => res.json(profile));
      });
    })
    .catch((err) => res.status(404).json(err));
});

// @Route FET api/v1/profile
// @desc get all profiles
// @access private
exports.getProfile = catchAsync(async (req, res, next) => {
  const errors = {};
  await Profile.findOne({ user: req.user.id })
    .populate("user", ["name", "avatar"])
    .then((profile) => {
      if (!profile) {
        errors.noprofile = "Profile not found";
        return next(new AppError(errors.noprofile, 404));
      }
      res.status(200).json(profile);
    })
    .catch((err) => res.status(404).json(err));
});

// @Route POST api/v1/profile/experience
// @desc add experience to profile
// @access private
exports.addExperience = catchAsync(async (req, res, next) => {
  const { errors, isValid } = validateExperienceInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }
  await Profile.findOne({ user: req.user.id })
    .then((profile) => {
      const newExp = {
        title: req.body.title,
        company: req.body.company,
        location: req.body.location,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description,
      };
      if (!profile) {
        errors.noprofile = `There is no profile for ${req.user.id} `;
        return next(new AppError(errors.noprofile, 404));
      }

      //Add to experience array
      profile.experience.unshift(newExp);

      profile.save().then((profile) => res.json(profile));
    })
    .catch((err) => {
      res.status(500).json(err);
    });
});

// @Route POST api/v1/profile/education
// @desc add education to profile
// @access private
exports.addEducation = catchAsync(async (req, res, next) => {
  const { errors, isValid } = validateEducationInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  await Profile.findOne({ user: req.user.id })
    .then((profile) => {
      const newEdu = {
        school: req.body.school,
        degree: req.body.degree,
        fieldofstudy: req.body.fieldofstudy,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description,
      };
      if (!profile) {
        errors.noprofile = `There is no profile for ${req.user.id} `;
        return next(new AppError(errors.noprofile, 404));
      }

      //Add to education array
      profile.education.unshift(newEdu);

      profile.save().then((profile) => res.json(profile));
    })
    .catch((err) => {
      res.status(500).json(err);
    });
});

// @Route Delete api/v1/profile/experience/:exp_id
// @desc delete experience from profile
// @access private
exports.deleteExperience = catchAsync(async (req, res, next) => {
  await Profile.findOne({ user: req.user.id })
    .then((profile) => {
      //GET remove index from
      const removeIndex = profile.experience
        .map((item) => item.id)
        .indexOf(req.params.exp_id);

      //Splice out od array to remove
      profile.experience.splice(removeIndex, 1);

      //save the updated profiles
      profile.save().then((profile) => res.json(profile));
    })
    .catch((err) => res.status(404).json(err));
});

// @Route Delete api/v1/profile/Education/:edu_id
// @desc delete education from profile
// @access private
exports.deleteEducation = catchAsync(async (req, res, next) => {
  await Profile.findOne({ user: req.user.id })
    .then((profile) => {
      //GET remove index from
      const removeIndex = profile.education
        .map((item) => item.id)
        .indexOf(req.params.edu_id);

      //Splice out od array to remove
      profile.education.splice(removeIndex, 1);

      //save the updated profiles
      profile.save().then((profile) => res.json(profile));
    })
    .catch((err) => res.status(404).json(err));
});

// @Route Delete api/v1/profile
// @desc delete user profile
// @access private

exports.deleteProfile = catchAsync(async (req, res, next) => {
  await Profile.findOneAndUpdate({ user: req.user.id }, { active: false })

    .then(async () => {
      await User.findByIdAndUpdate({ _id: req.user.id }, { active: false });

      res.status(200).json({ profile: "Profile deleted successfully" });
    })
    .catch((err) => res.status(404).json(err));
});
