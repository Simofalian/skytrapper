const { promisify } = require("util");
const User = require("./../models/userModel");
const catchAsync = require("./../Utils/catchAsync");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const sendEmail = require("./../Utils/email");
const crypto = require("crypto");
const AppError = require("../Utils/appError");
//load  Validation Error
const validateRegisterInput = require("./../validation/register");
const validateLoginInput = require("./../validation/login");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 60 * 1000,
  });
};
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);

  //cookies
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);
  //to remove the password from the output
  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    _id: user._id,
    name: user.name,
    role: user.role,
    token: token,
    avatar: user.avatar,
    data: {
      user,
    },
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const { errors, isValid } = validateRegisterInput(req.body);

  //check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const { name, email, password, passwordConfirm, passwordChangedAt, role } =
    req.body;
  const user = await User.findOne({ email });
  if (user) {
    errors.email = "User already exists";
    return next(new AppError(errors.email, 400));
  }

  const avatar = gravatar.url(email, {
    s: "200", //size
    r: "pg", //rating
    d: "mm", //default
  });
  const newUser = await User.create({
    name,
    email,
    avatar,
    password,
    passwordConfirm,
    passwordChangedAt,
    role,
  });
  createSendToken(newUser, 200, res);
});

exports.login = catchAsync(async (req, res, next) => {
  //check if email and password exist - validate req.body
  const { errors, isValid } = validateLoginInput(req.body);

  //check for valid email and password
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const { email, password } = req.body;

  //check if user exist and password is correct
  const user = await User.findOne({ email }).select("+password"); //(the api does noes not send password when get method is used because the select option in the model has been set to false to enable it to be selected when login in use "+password")

  if (!user || !(await user.correctPassword(password, user.password))) {
    errors.password = "incorrect user or password";
    return next(new AppError(errors.password, 401));
  }
  console.log("login requesst made");
  //if everything is ok send token
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //1st Get the token and check of its there

  let token;

  //get token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // console.log(token);

  //check if it exists
  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to gain access", 401)
    );
  }

  //2nd Verification of the token is

  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY
  );
  //console.log(decoded);

  //3rd check if the user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token does not exist", 401)
    );
  }
  //4th check if user changed password after the token was issued use instance method in userModel

  if (currentUser.passwordChangedAfter(decoded.iat)) {
    return next(
      new AppError(
        "The user recently changed the password! Please log in again",
        401
      )
    );
  }
  //GRANT ACCESS TO PROTECTED ROUTERS
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  //1) Getting token and check if it exist and

  if (req.cookies.jwt) {
    //2) Verification of token---- promisify is an inbuilt util module in node but need to be required at the top
    const decoded = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET_KEY
    );
    console.log(decoded);

    //3) check if the user still exists
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return next();
    }

    //4) check if user changed password after token was issued ---use model instance method
    if (currentUser.passwordChangedAfter(decoded.iat)) {
      return next();
    }

    //upto this point it means the everything is okay and user has full authorization
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  }
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
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (Valid for 10 min",
      message: `Forgot your password? submit a patch request with your new password and passwordConfirm to : ${resetUrl}. \n If you did not forget your email please ignore this email!`,
    });
    res.status(200).json({
      status: "success",
      message: "Token sent to your email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("there was an error sending the email, Try again later", 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //2)if the token has not expired, and thre is user, set new passwordConfirm
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //3)update changedPasswordAt property for users

  //4)Log the user in, send JWT

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1)get user from collection
  const { email, passwordCurrent, newPassword } = req.body;
  //check if email and password exist and
  if (!email || !passwordCurrent || !newPassword)
    return next(
      new AppError(
        "Please provide an email and a current password and new password",
        404
      )
    );
  //check if user exist and password is correct
  const user = await User.findOne({ email }).select("+password"); //(the api does noes not send password when get method is used because the select option in the model has been set to false to enable it to be selected when login in use "+password")

  //2)check if posted current password is correctPassword
  if (!user || !(await user.correctPassword(passwordCurrent, user.password))) {
    return next(new AppError("Incorrect user or current password", 401));
  }
  //3)if so , update password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //4) log user in se
  createSendToken(user, 200, res);
});

//@ Description: return current user
//@ router: users/current
//@ access: private
exports.current = (req, res) => {
  res.json({ msg: "Success" });
};
