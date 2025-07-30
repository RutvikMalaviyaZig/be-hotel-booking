import { ACTIONS, MESSAGES, db, MODELS, ObjectId } from "../../config/constant.js";

export const processBooking = async (data) => {
    try {
        // Extract common fields
        const { _id, user, room, hotel, checkInDate, checkOutDate, totalPrice, guests, action } = data;

        if (action === ACTIONS.DELETE) {
            // Delete booking
            if (!_id) {
                return { isError: true, data: MESSAGES.INVALID_ID };
            }
            const deleted = await db.collection(MODELS.BOOKING).deleteOne({ _id: new ObjectId(String(_id)) });
            if (!deleted) {
                return { isError: true, data: MESSAGES.NOT_FOUND };
            }
            return { isError: false, data: deleted };
        }

        // Handle create/update operations
        if (_id && action === ACTIONS.UPDATE) {
            // Update existing booking
            const booking = await db.collection(MODELS.BOOKING).updateOne(
                { _id: new ObjectId(String(_id)) },
                { checkInDate, checkOutDate, guests },
                { new: true }
            );
            return { isError: false, data: booking };
        } else if (action === ACTIONS.CREATE) {
            // Create new booking
            const booking = await db.collection(MODELS.BOOKING).insertOne({
                user,
                room,
                hotel,
                checkInDate,
                checkOutDate,
                totalPrice,
                guests
            });
            return { isError: false, data: booking };
        }
    } catch (error) {
        return { isError: true, data: error };
    }
}
