import httpStatus from "http-status";

export const validateFiles = (requiredFiles) => {
  return (req, res, next) => {
    let missingFiles = [];

    if (requiredFiles.length === 1) {
      if (req.file.fieldname !== requiredFiles[0]) {
        missingFiles.push(requiredFiles[0]);
      }
    } else {
      missingFiles = requiredFiles.filter((field) => !req.files[field]);
    }

    if (missingFiles.length > 0) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: `${missingFiles[0]} is required`,
        details: missingFiles.map((field) => `${field} is required`),
      });
    }
    next();
  };
};
