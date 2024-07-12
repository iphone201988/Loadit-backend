import Joi from "joi";

const createJobValidation = {
  body: Joi.object({
    title: Joi.string().required(),
    pickUpLocation: Joi.string().required(),
    pickUpDate: Joi.date()
      .min("now")
      .messages({
        "date.min": "Date must not be in the past",
      })
      .required(),
    pickUpTime: Joi.string()
      .regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])\s*([AaPp][Mm])$/)
      .messages({
        "string.pattern.base": "Pickup time must be in HH:mm format",
      })
      .required(),
    dropOffDate: Joi.date()
      .min("now")
      .messages({
        "date.min": "Date must not be in the past",
      })
      .required(),
    dropOffTime: Joi.string()
      .regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])\s*([AaPp][Mm])$/)
      .messages({
        "string.pattern.base": "Dropoff time must be in HH:mm format",
      })
      .required(),
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

const getJobDetailsValidation = {
  params: Joi.object({
    jobId: Joi.string().required(),
  }),
};

const getJobsValidation = {
  query: Joi.object({
    scheduled: Joi.boolean().optional(),
    completed: Joi.boolean().optional(),
  }),
};

export default {
  createJobValidation,
  getJobDetailsValidation,
  getJobsValidation
};
