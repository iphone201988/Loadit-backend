export const vehicleType = {
  BOX_TRUCK: 1,
  CAR: 2,
  SMALL_TRUCK: 3,
  MINI_VAN: 4,
  SPRINTER_VAN: 5,
};

export const userRole = {
  DRIVER: 1,
  CUSTOMER: 2,
};

export const deviceType = {
  ANDROID: 1,
  IOS: 2,
};

export const cardType = {
  PRIMARY: "PRIMARY",
  SECONDARY: "SECONDARY",
};

export const addressType = {
  PERSONAL_USE: 1,
  COMPANY_USE: 2,
};

export const jobType = {
  SINGLE_DROPOFF: 1,
  MULTIPLE_DROPOFF: 2,
  TEAM_JOB: 3,
};

export const dropOffStatus = {
  ON_THE_WAY_TO_PICKUP: 1,
  ON_THE_WAY_TO_DROPOFF: 2,
  COMPLETED: 3,
};

export const dropOffPoint = {
  AT_FRONT_DOOR: 1,
  AT_BACK_DOOR: 2,
  AT_SIDE_DOOR: 3,
  ON_THE_PORCH: 4,
  AT_FRONT_DESK: 5,
  AT_CONCIERGE: 6,
  IN_MAILROOM: 7,
  IN_LOBBY: 8,
  AT_GARAGE: 9,
  HANDED_TO_RECIPIENT: 10,
  WITH_RECIPIENTIST: 11,
  WITH_SECURITY: 12,
  WITH_DOOR_PERSON: 13,
};

export const deliveryStatus = {
  IN_PROGRESS: 1,
  DELIVERED: 2,
  CANCELED: 3,
};

export const transactionType = {
  CUSTOMER_DEDUCTION: 1,
  DRIVER_TRANSFER: 2,
  // DRIVER_WITHDRAW: 3,
};

export const paymentStatus = {
  PENDING: 1,
  COMPLETED: 2,
  FAILED: 3,
};
