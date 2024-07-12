import express from "express";
import router from "./src/routes/index.js";
import { errorMiddleware } from "./src/middlewares/error.middleware.js";
import { connectToDB } from "./src/utils/helper.js";
import "dotenv/config";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import ErrorHandler from "./src/utils/ErrorHandler.js";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "/src/uploads")));

app.use(morgan("tiny"));
app.use(express.json());

connectToDB();

app.use("/api", router);

app.use("*", (req, res, next) => {
  return next(new ErrorHandler("Route not found", 404));
});

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
