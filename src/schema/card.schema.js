import Joi from "joi";

export const addCardValidation = {
    body: Joi.object({
        cardNumber: Joi.string().required(),
        expiryMonth: Joi.number().required(),
        expiryYear: Joi.string().required(),
        cvv: Joi.string().required(),
        cardHolderName: Joi.string().optional(),
    })
};
export const editCardValidation = {
    params: Joi.object({
        id: Joi.string().required(),
    }),
    body: Joi.object({
        cardNumber: Joi.string().optional(),
        expiryMonth: Joi.number().optional(),
        expiryYear: Joi.string().optional(),
        cvv: Joi.string().optional(),
        cardHolderName: Joi.string().optional(),
    })
};
export const deleteCardValidation = {
    params: Joi.object({
        id: Joi.string().required(),
    }),
};

export const getCardValidation = {
    params: Joi.object({
        id: Joi.string().required(),
    }),
};