const Validator = require("validator");
const isEmpty = require("./is-empty");
module.exports = function validateBlogInput(data) {
  let errors = {};

  data.title = !isEmpty(data.title) ? data.title : "";
  data.snippet = !isEmpty(data.snippet) ? data.snippet : "";
  data.body = !isEmpty(data.body) ? data.body : "";

  if (Validator.isEmpty(data.title)) {
    errors.title = "Title field is required";
  }

  if (Validator.isEmpty(data.snippet)) {
    errors.snippet = "snippet field is required";
  }

  if (Validator.isEmpty(data.body)) {
    errors.body = "body  field is required";
  }

  if (!Validator.isLength(data.title, { min: 10, max: 50 })) {
    errors.title =
      "The title field must be at least 10 and at most 50 characters long";
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};
