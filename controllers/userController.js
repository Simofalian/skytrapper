const gravatar = require("gravatar");
const User = require("./../models/userModel");
const catchAsync = require("./../Utils/catchAsync");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const AppError = require("./../Utils/appError");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

exports.registerUser = catchAsync(async (req, res, next) => {
  await User.findOne({ email: req.body.email }).then((user) => {
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    } else {
      const avatar = gravatar.url(req.body.email, {
        s: "200", //size
        r: "pg", //rating
        d: "mm", //default
      });
      const newUser = User.create({
        name: req.body.name,
        email: req.body.email,
        avatar,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
      });

      return res.status(201).json({
        status: "success",
        data: {
          user,
        },
      });
    }
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById({ _id: req.params.id }).then((user) => {
    if (!user) return next(new AppError("user not found", 404));
    res.status(200).json({
      status: "success",
      _id: user._id,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      data: {
        user,
      },
    });
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  //1) create error if the user try to change password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for changing password, please login and use "update my password" to change your password',
        401
      )
    );
  }

  //2) get user using id and
  const filteredBody = filterObj(req.body, "name", "email");
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidator: true,
  });
  res.status(200).json({
    status: "success",
    data: { user: updatedUser },
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({
    status: "success",
    data: null,
  });
});
exports.deleteUser = catchAsync(async (req, res, next) => {
  await User.findByIdAndDelete({ _id: req.params.id }).then((user) => {
    res.status(204).json({
      status: "success",
      message: "user deleted successfully",
    });
  });
});
