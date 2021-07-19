const gravatar = require("gravatar");
const User = require("./../models/userModel");
const catchAsync = require("./../Utils/catchAsync");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const AppError = require("./../Utils/appError");
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

exports.login = catchAsync(async (req, res, next) => {
  // const {email, password} = req.body

  const { email, password } = req.body;

  //find user by email
  await User.findOne({ email }).then((user) => {
    if (!user) {
      return next(new AppError("User not found", 404));
    }
    //check password match

    bcrypt.compare(password, user.password).then((isMatch) => {
      //user matched

      if (isMatch) {
        const payload = {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
        };
        jwt.sign(
          payload,
          process.env.JWT_SECRET_KEY,
          { expiresIn: process.env.JWT_EXPIRES_IN },
          (err, token) => {
            if (err) {
              return res.status(400).json({ error: err.message });
            } else {
              return res.json({
                status: "success",
                token: `Bearer : ${token}`,
              });
            }
          }
        );
      } else {
        return res
          .status(400)
          .json({ user: "User not found or incorrect password" });
      }
    });
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById({ _id: req.params.id }).then((user) => {
    if (!user) return next(new AppError("user not found", 404));
    res.status(200).json({
      status: "success",
      data: { user },
    });
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  await User.findByIdAndDelete({ _id: req.params.id }).then((user) => {
    res.status(200).json({
      status: "success",
      message: "user deleted successfully",
    });
  });
});
