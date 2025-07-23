import { SQS, EVENT_TYPES, MESSAGES } from "../../config/constant.js";

export const sendSQSMessage = async (type, data) => {
  try {
    let queueUrl;
    switch (type) {
      case EVENT_TYPES.BOOKING:
        queueUrl = process.env.BOOKING_QUEUE_URL;
        break;
      default:
        throw new Error(MESSAGES.INVALID_TYPE);
    }

    const params = {
      MessageBody: JSON.stringify({ type, data }),
      QueueUrl: queueUrl,
    };
    SQS.sendMessage(params, (err, data) => {
      if (err) {
        return { isError: true, data: err?.message || err };
      } else {
        return { isError: false, data };
      }
    });
  } catch (error) {
    return { isError: true, data: error?.message || error };
  }
};
