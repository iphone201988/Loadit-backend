import express from "express";
import { addCard, deleteCard, getCards, updateCard } from "../controllers/card.controller.js";
import { addCardValidation, deleteCardValidation, editCardValidation, getCardValidation } from "../schema/card.schema.js";
import { authenticationMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../utils/helper.js";

const cardRouter = express.Router();

cardRouter.post("/card", authenticationMiddleware, validate(addCardValidation), addCard);
cardRouter.put("card/:id", authenticationMiddleware, validate(editCardValidation), updateCard);
cardRouter.get("cards", authenticationMiddleware, getCards);
cardRouter.get("card/:id", authenticationMiddleware, validate(getCardValidation), getCards);
cardRouter.delete("card/:id", authenticationMiddleware, validate(deleteCardValidation), deleteCard);

export default cardRouter;
