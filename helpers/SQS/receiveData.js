import { SQS, EVENT_TYPES, MESSAGES } from "../config/constant.js";
import { deleteSQSMessage } from "./deleteData.js";
import { processMessageByType } from "../processMessage/processMessage.js";

export const receiveSQSMessage = async (type) => {
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
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 20,
        };
        SQS.receiveMessage(params, async (err, data) => {
            if (err) {
                return;
            }
            else if (!data.Messages) {
                return;
            }

            if (data.Messages) {
                for (const msg of data.Messages) {
                    const body = JSON.parse(msg.Body);

                    await processMessageByType(type, body);

                    await deleteSQSMessage(type, msg.ReceiptHandle);
                }
            }
            return true;
        });
    } catch (error) {
        return false;
    }
}
