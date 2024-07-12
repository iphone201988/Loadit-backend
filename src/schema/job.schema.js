import Joi from "joi";

const createJobValidation = {
  body: Joi.object({
    title: Joi.string().required(),
    pickUpLocation: Joi.string().required(),
    pickUpDate: Joi.date().required(),
    pickUpTime: Joi.string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .messages({
        "string.pattern.base": "Time must be in HH:mm format",
      })
      .required(),
    dropOffDate: Joi.date().required(),
    dropOffTime: Joi.string().required(),
    dropOffs: Joi.array()
      .items({
        dropOffLocation: Joi.string().required(),
        numberOfItems: Joi.number().required(),
        weightOfItems: Joi.number().required(),
        lengthOfItems: Joi.number().required(),
        heightOfItems: Joi.number().required(),
        instructions: Joi.string().required(),
      })
      .required(),
    jobType: Joi.number().valid(1, 2, 3).required(),
  }),
};

export default {
  createJobValidation,
};
