import { SQS, EVENT_TYPES, MESSAGES } from "../config/constant.js";

const deleteSQSMessage = async (type, receiptHandle) => {
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
            QueueUrl: queueUrl,
            ReceiptHandle: receiptHandle,
        };
        SQS.deleteMessage(params, (err) => {
            if (err) {
                return false;
            }
            return true;
        });
    } catch (error) {
        return false;
    }
}

export { deleteSQSMessage };
