import Joi from "joi";
import { dropOffStatus, jobType } from "../utils/enums/enums.js";

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
    jobType: Joi.number()
      .valid(jobType.SINGLE_DROPOFF, jobType.MULTIPLE_DROPOFF, jobType.TEAM_JOB)
      .required(),
  }),
};

const getJobDetailsValidation = {
  params: Joi.object({
    jobId: Joi.string().required(),
  }),
};

const getJobsByFiltersValidation = {
  query: Joi.object({
    scheduled: Joi.boolean().optional(),
    completed: Joi.boolean().optional(),
  }),
};

const applyJobValidation = {
  body: Joi.object({
    jobId: Joi.string().required(),
  }),
};

const getJobApplicationsValidation = {
  params: Joi.object({
    jobId: Joi.string().required(),
  }),
};

const selectJobDriverValidation = {
  body: Joi.object({
    jobId: Joi.string().required(),
    userId: Joi.string().required(),
  }),
};

const completeJobValidation = {
  body: Joi.object({
    jobId: Joi.string().required(),
    dropOffId: Joi.string().required(),
    dropOffStatus: Joi.number()
      .valid(
        dropOffStatus.ON_THE_WAY_TO_PICKUP,
        dropOffStatus.ON_THE_WAY_TO_DROPOFF,
        dropOffStatus.COMPLETED
      )
      .optional(),
    pickupImage: Joi.string().optional(),
    dropOffImage: Joi.string().optional(),
    dropOffPoint: Joi.number()
      .valid(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13)
      .optional(),
    dropOffDetails: Joi.string().optional(),
    isDeliveryCompleted: Joi.boolean().optional(),
  }),
};

export default {
  createJobValidation,
  getJobDetailsValidation,
  getJobsByFiltersValidation,
  applyJobValidation,
  getJobApplicationsValidation,
  selectJobDriverValidation,
  completeJobValidation,
};
