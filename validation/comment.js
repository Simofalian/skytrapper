const Validator = require("validator");
const isEmpty = require("./is-empty");
module.exports = function validateCommentInput(data) {
  let errors = {};

  data.body = !isEmpty(data.body) ? data.body : "";

  if (Validator.isEmpty(data.body)) {
    errors.body = "body  field is required";
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};
