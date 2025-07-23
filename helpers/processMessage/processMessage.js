import { processBooking } from "../processBookingData/processBooking.js";
import { EVENT_TYPES, ACTIONS, MESSAGES } from "../../config/constant.js"

const processMessageByType = async (type, data) => {
    switch (type) {
        case EVENT_TYPES.BOOKING:
            try {
                if (data.action === ACTIONS.CREATE) {
                    await processBooking(data);
                } else if (data.action === ACTIONS.UPDATE) {
                    await processBooking(data);
                } else if (data.action === ACTIONS.DELETE) {
                    await processBooking(data);
                } else {
                    throw new Error(MESSAGES.INVALID_ACTION);
                }
            } catch (error) {
                throw error;
            }
            break;
        default:
            throw new Error(MESSAGES.INVALID_TYPE);
    }
}

export { processMessageByType };
