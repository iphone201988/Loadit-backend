class ErrorHandler extends Error {
  constructor(error, statusCode) {
    super(error);
    this.statusCode = statusCode;
  }
}

export default ErrorHandler;
