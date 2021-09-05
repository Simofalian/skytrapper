const Validator = require("validator");
const isEmpty = require("./is-empty");
module.exports = function validateRegisterInput(data) {
  let errors = {};

  data.name = !isEmpty(data.name) ? data.name : "";
  data.email = !isEmpty(data.email) ? data.email : "";
  data.password = !isEmpty(data.password) ? data.password : "";
  data.passwordConfirm = !isEmpty(data.passwordConfirm)
    ? data.passwordConfirm
    : "";

  if (!Validator.isLength(data.name, { min: 2, max: 32 })) {
    errors.name = "Name must be between 2 and 32 characters";
  }
  if (Validator.isEmpty(data.name)) {
    errors.name = "Name field is required";
  }
  if (Validator.isEmpty(data.email)) {
    errors.email = "Email field is required";
  }
  if (!Validator.isEmail(data.email)) {
    errors.email = "Email is invalid";
  }
  if (Validator.isEmpty(data.password)) {
    errors.password = "Password field is required";
  }
  if (!Validator.isLength(data.password, { min: 6, max: 30 })) {
    errors.password =
      "Password must be at least 6 characters long and at most 30 characters long";
  }
  if (Validator.isEmpty(data.passwordConfirm)) {
    errors.passwordConfirm = "Confirm password field is required";
  }
  if (!Validator.equals(data.passwordConfirm, data.password)) {
    errors.passwordConfirm = "Passwords must match";
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};
