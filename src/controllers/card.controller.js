import { UserBankCardDeTail } from "../models/cardDetails.js";

import {
    TryCatch,
} from "../utils/helper.js";
import httpStatus from "http-status";


export const addCard = TryCatch(async (req, res, next) => {
    const { cardNumber, expiryMonth, expiryYear, cvv, cardHolderName } = req.body;

    let userId = req.userId;
    user = await UserBankCardDeTail.create({
        userId,
        cardNumber, expiryMonth, expiryYear, cvv, cardHolderName
    });

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: "Card added successfully",
    })
});

export const getCards = TryCatch(async (req, res, next) => {
    let userId = req.userId;
    if (req.params.id) {
        let card = await UserBankCardDeTail.findById(id);
        if (!card) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: "Card not found"
            })
        }
        return res.status(httpStatus.OK).json({
            success: true,
            data: card,
        })
    }
    let cards = await UserBankCardDeTail.find({ userId });
    if (!cards || cards.length == 0) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: "No cards found"
        })
    }
    return res.status(httpStatus.OK).json({
        success: true,
        data: cards,
    })
});

export const deleteCard = TryCatch(async (req, res, next) => {
    let id = req.params.id;
    let card = await UserBankCardDeTail.findByIdAndDelete(id);
    if (!card) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: "Card not found"
        })
    }
    return res.status(httpStatus.OK).json({
        success: true,
        message: "Card deleted successfully",
    })
});

export const updateCard = TryCatch(async (req, res, next) => {
    let id = req.params.id;
    let { cardNumber, expiryMonth, expiryYear, cvv, cardHolderName } = req.body;
    let card = await UserBankCardDeTail.findByIdAndUpdate(id, {
        cardNumber, expiryMonth, expiryYear, cvv, cardHolderName
    }, { new: true });
    if (!card) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: "Card not found"
        })
    }
    return res.status(httpStatus.OK).json({
        success: true,
        data: card,
    })
});