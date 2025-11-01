// ApiError class
class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something Went Wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.date = new Date();
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// APIresponse class
class ApiResponse {
  constructor( statusCode,data, message = "Success") {
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}


// asyncHandler Function
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};
export { ApiError, ApiResponse, asyncHandler };
