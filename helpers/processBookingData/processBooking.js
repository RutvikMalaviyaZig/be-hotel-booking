import { Booking } from "../../models/index.js";
import { ACTIONS, MESSAGES, mongoose } from "../../config/constant.js";

export const processBooking = async (data) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // Extract common fields
        const { _id, user, room, hotel, checkInDate, checkOutDate, totalPrice, guests, action } = data;

        if (action === ACTIONS.DELETE) {
            // Delete booking
            if (!_id) {
                return { isError: true, data: MESSAGES.INVALID_ID };
            }
            const deleted = await Booking.findByIdAndDelete(_id, { session });
            if (!deleted) {
                return { isError: true, data: MESSAGES.NOT_FOUND };
            }
            await session.commitTransaction();
            session.endSession();
            return { isError: false, data: deleted };
        }

        // Handle create/update operations
        if (_id && action === ACTIONS.UPDATE) {
            // Update existing booking
            const booking = await Booking.findByIdAndUpdate(
                _id,
                { checkInDate, checkOutDate, guests },
                { new: true }
            );
            await session.commitTransaction();
            session.endSession();
            return { isError: false, data: booking };
        } else if (action === ACTIONS.CREATE) {
            // Create new booking
            const booking = await Booking.create([{
                user,
                room,
                hotel,
                checkInDate,
                checkOutDate,
                totalPrice,
                guests
            }], { session });
            await session.commitTransaction();
            session.endSession();
            return { isError: false, data: booking };
        }
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return { isError: true, data: error };
    }
}
