const crypto = require("crypto"); //inbuilt node module
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: [true, "please provide a valid email"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    role: { type: String, enum: ["user", "admin", "manager"], default: "user" },
    photo: { type: String },
    company: { type: String },
    profession: { type: Array },
    twitter: { type: String },
    facebook: { type: String },
    tiktok: { type: String },
    instagram: { type: String },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, "Please confirm your password"],
      validate: {
        //this works on Create and Save only

        validator: function (el) {
          return el === this.password;
        },
        message: "passwords do no match",
      },
    },
    avatar: { type: String },
    dateofbirth: { type: Date },
    skillsets: { type: Array },
    gender: { type: String },

    date: {
      type: Date,
      default: Date.now,
    },
    passwordChangedAt: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    active: { type: Boolean, default: true, select: false },
  },
  { timestamps: true }
);
userSchema.pre("save", async function (next) {
  // only run this function if the password was modified
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  //delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1500;
  next();
});

userSchema.pre(/^find/, function (next) {
  // this poing to current query that start with find
  this.find({ active: { $ne: false } });
  next();
});
//instance method ---meaning it can be accessed from any user related resource as eg user.correctPassword()

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword); //candidatePassword=req.body.email
};

userSchema.methods.passwordChangedAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // console.log(changedTimeStamp, JWTTimestamp);
    return changedTimeStamp > JWTTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  //encrypt the resettoken as follows using crypto

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("user", userSchema);

module.exports = User;
