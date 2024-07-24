import Joi from "joi";
import { dropOffStatus, jobType } from "../utils/enums/enums.js";

const createJobValidation = {
  body: Joi.object({
    title: Joi.string().required().messages({
      "any.required": "Title is required",
    }),
    pickUpLocation: Joi.string().required().messages({
      "any.required": "Pickup location is required",
    }),
    pickUpDate: Joi.date()
      .min("now")
      .messages({
        "date.min": "Pickup date must not be in the past",
        "any.required": "Pickup date is required",
      })
      .required(),
    pickUpTime: Joi.string()
      .regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])\s*([AaPp][Mm])$/)
      .messages({
        "string.pattern.base": "Pickup time must be in HH:mm format",
        "any.required": "Pickup time is required",
      })
      .required(),
    dropOffDate: Joi.date()
      .min("now")
      .messages({
        "date.min": "Dropoff date must not be in the past",
        "any.required": "Dropoff date is required",
      })
      .required(),
    dropOffTime: Joi.string()
      .regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])\s*([AaPp][Mm])$/)
      .messages({
        "string.pattern.base": "Dropoff time must be in HH:mm format",
        "any.required": "Dropoff time is required",
      })
      .required(),
    dropOffs: Joi.array()
      .items({
        dropOffLocation: Joi.string().required().messages({
          "any.required": "Dropoff location is required",
        }),
        numberOfItems: Joi.number().required().messages({
          "any.required": "Number of items is required",
        }),
        weightOfItems: Joi.number().required().messages({
          "any.required": "Weight of items is required",
        }),
        lengthOfItems: Joi.number().required().messages({
          "any.required": "Length of items is required",
        }),
        heightOfItems: Joi.number().required().messages({
          "any.required": "Height of items is required",
        }),
        instructions: Joi.string().required().messages({
          "any.required": "Instructions are required",
        }),
      })
      .required()
      .messages({
        "any.required": "Dropoffs are required",
      }),
    jobType: Joi.number()
      .valid(jobType.SINGLE_DROPOFF, jobType.MULTIPLE_DROPOFF, jobType.TEAM_JOB)
      .required()
      .messages({
        "any.required": "Job type is required",
        "any.only": "Invalid job type",
      }),
  }),
};

const searchByLocationValidation = {
  query: Joi.object({
    location: Joi.string().required().messages({
      "any.required": "Location is required",
    }),
  }),
};

const getJobDetailsValidation = {
  params: Joi.object({
    jobId: Joi.string().required().messages({
      "any.required": "Job ID is required",
    }),
  }),
};

const getJobsByFiltersValidation = {
  query: Joi.object({
    scheduled: Joi.boolean().optional().messages({
      "boolean.base": "Scheduled must be a boolean",
    }),
    completed: Joi.boolean().optional().messages({
      "boolean.base": "Completed must be a boolean",
    }),
  }),
};

const applyJobValidation = {
  body: Joi.object({
    jobId: Joi.string().required().messages({
      "any.required": "Job ID is required",
    }),
  }),
};

const getJobApplicationsValidation = {
  params: Joi.object({
    jobId: Joi.string().required().messages({
      "any.required": "Job ID is required",
    }),
  }),
};

const selectJobDriverValidation = {
  body: Joi.object({
    jobId: Joi.string().required().messages({
      "any.required": "Job ID is required",
    }),
    driverId: Joi.string().required().messages({
      "any.required": "Driver ID is required",
    }),
  }),
};

const completeJobValidation = {
  body: Joi.object({
    jobId: Joi.string().required().messages({
      "any.required": "Job ID is required",
    }),
    dropOffId: Joi.string().required().messages({
      "any.required": "Dropoff ID is required",
    }),
    dropOffStatus: Joi.number()
      .valid(
        dropOffStatus.ON_THE_WAY_TO_PICKUP,
        dropOffStatus.ON_THE_WAY_TO_DROPOFF,
        dropOffStatus.COMPLETED
      )
      .optional()
      .messages({
        "any.only": "Invalid dropoff status",
      }),
    dropOffPoint: Joi.number()
      .valid(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13)
      .optional()
      .messages({
        "any.only": "Invalid dropoff point",
      }),
    dropOffDetails: Joi.string().optional().messages({
      "string.base": "Dropoff details must be a string",
    }),
    isDeliveryCompleted: Joi.boolean().optional().messages({
      "boolean.base": "Is delivery completed must be a boolean",
    }),
  }),
};

const giveCustomerReviewValidation = {
  body: Joi.object({
    jobId: Joi.string().required().messages({
      "any.required": "Job ID is required",
    }),
    review: Joi.string().required().messages({
      "any.required": "Review is required",
    }),
    rating: Joi.number().min(1).max(5).required().messages({
      "number.base": "Rating must be a number",
      "number.min": "Rating must be at least 1",
      "number.max": "Rating must be at most 5",
      "any.required": "Rating is required",
    }),
  }),
};

const recognizeFaceValidation = {
  body: Joi.object({
    jobId: Joi.string().required().messages({
      "any.required": "Job ID is required",
    }),
  }),
};

const quitJobValidation = {
  body: Joi.object({
    jobId: Joi.string().required().messages({
      "any.required": "Job ID is required",
    }),
    reason: Joi.string().required().messages({
      "any.required": "Reason is required",
    }),
  }),
};

export default {
  createJobValidation,
  searchByLocationValidation,
  getJobDetailsValidation,
  getJobsByFiltersValidation,
  applyJobValidation,
  getJobApplicationsValidation,
  selectJobDriverValidation,
  completeJobValidation,
  giveCustomerReviewValidation,
  recognizeFaceValidation,
  quitJobValidation,
};
