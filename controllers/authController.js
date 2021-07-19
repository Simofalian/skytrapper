const { promisify } = require("util");
const User = require("./../models/userModel");
const catchAsync = require("./../Utils/catchAsync");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const AppError = require("../Utils/appError");
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  await User.findOne({ email: req.body.email }).then((user) => {
    if (user) {
      return next(new AppError("User already exists", 400));
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
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role,
      });
      const token = signToken(newUser._id);
      return res.status(201).json({
        status: "success",
        token: token,
        msg: "User successfully signed up",
        data: {
          user: newUser,
        },
      });
    }
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //check if email and password exist and
  if (!email || !password)
    return next(new AppError("Please provide an email and a password", 404));
  //check if user exist and password is correct
  const user = await User.findOne({ email }).select("+password"); //(the api does noes not send password when get method is used because the select option in the model has been set to false to enable it to be selected when login in use "+password")

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("incorrect user or password", 401));
  }

  //if everything is ok send token
  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  //1) Getting token and check if it exist and
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // if no token,
  if (!token) {
    return res
      .status(401)
      .json({ message: "You are not logged in please login to gain access" });
  }
  //2) Verification of token---- promisify is an inbuilt util module in node but need to be required at the top
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY
  );

  console.log(decoded);
  //3) check if the user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(new AppError("The user for the token cannot be found", 401));
  }

  //4) check if user changed password after token was issued ---use model instance method
  if (currentUser.passwordChangedAfter(decoded.iat)) {
    return next(
      new AppError(
        "The password was changed recently. Please login again to gain access",
        401
      )
    );
  }

  //upto this point it means the everything is okay and user has full authorization
  req.user = currentUser;
  next();
});
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array and could be ['admin','manager']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perfom this role", 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) find user based on posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError("There is no user with that email", 404));
  }
  //2) Generate random reset signToken
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3) send the token to user's email address
});

exports.resetPassword = catchAsync(async (req, res, next) => {});
