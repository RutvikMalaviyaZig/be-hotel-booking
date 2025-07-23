import { Hotel, Room, User, Booking } from "../models/index.js";
import { USER_ROLES, HTTP_STATUS_CODE, VALIDATION_EVENTS, mongoose } from "../config/constant.js";
import { validateHotel } from "../helpers/validation/HotelValidation.js";

/**
* @name registerHotel
* @file hotelController.js
* @param {Request} req
* @param {Response} res
* @description register hotel
* @author Rutvik Malaviya (Zignuts)
*/
export const registerHotel = async (req, res) => {
    // start session and transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // get data from request body
        const { name, address, contact, city } = req.body;
        const owner = req.user._id;
        // validate data
        const validateHotelData = validateHotel({ eventCode: VALIDATION_EVENTS.CREATE_HOTEL, id: owner, name, address, contact, city });
        // if validation fails, return error
        if (validateHotelData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateHotelData.errors });
        }

        // check if hotel already exists
        const hotel = await Hotel.findOne({ name, owner }).session(session);
        // if hotel already exists, return error
        if (hotel) {
            await session.abortTransaction();
            session.endSession();
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('Hotel.HotelAlreadyExists') });
        }

        // create hotel
        await Hotel.create([{ name, address, contact, owner, city }], { session });
        // update user role
        await User.findByIdAndUpdate(owner, { role: USER_ROLES.HOTEL_OWNER }).session(session);
        // commit transaction
        await session.commitTransaction();
        session.endSession();
        // send response
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('Hotel.CreateSuccess') });
    } catch (error) {
        // if anything goes wrong, abort the transaction and end the session and return error
        await session.abortTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

/**
* @name updateHotel
* @file hotelController.js
* @param {Request} req
* @param {Response} res
* @description update hotel
* @author Rutvik Malaviya (Zignuts)
*/
export const updateHotel = async (req, res) => {
    // start session and transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // get data from request body
        const { name, address, contact, city, hotelId } = req.body;
        const owner = req.user._id;
        // validate data
        const validateHotelData = validateHotel({ eventCode: VALIDATION_EVENTS.UPDATE_HOTEL, id: owner, name, address, contact, city });
        // if validation fails, return error
        if (validateHotelData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateHotelData.errors });
        }
        // find hotel
        const hotel = await Hotel.findOne({ _id: hotelId, owner }).session(session);
        // if hotel is not found, return error
        if (!hotel) {
            await session.abortTransaction();
            session.endSession();
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('Hotel.HotelNotFound') });
        }
        // update hotel
        await Hotel.findByIdAndUpdate(hotel._id, { name, address, contact, city }).session(session);
        // commit transaction
        await session.commitTransaction();
        session.endSession();
        // send response
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('Hotel.UpdateSuccess') });
    } catch (error) {
        // if anything goes wrong, abort the transaction and end the session and return error
        await session.abortTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

/**
* @name deleteHotel
* @file hotelController.js
* @param {Request} req
* @param {Response} res
* @description delete hotel
* @author Rutvik Malaviya (Zignuts)
*/
export const deleteHotel = async (req, res) => {
    // start session and transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // get data from request body
        const { hotelId } = req.body;
        const owner = req.user._id;
        // validate data
        const validateHotelData = validateHotel({ eventCode: VALIDATION_EVENTS.DELETE_HOTEL, id: owner, hotelId });
        // if validation fails, return error
        if (validateHotelData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateHotelData.errors });
        }
        // find hotel
        const hotel = await Hotel.findOne({ owner, _id: hotelId }).session(session);
        // if hotel is not found, return error
        if (!hotel) {
            await session.abortTransaction();
            session.endSession();
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('Hotel.HotelNotFound') });
        }
        // delete hotel
        await Hotel.findByIdAndDelete(hotel._id).session(session);
        // delete rooms
        await Room.deleteMany({ hotel: hotel._id }).session(session);
        // delete bookings
        await Booking.deleteMany({ hotel: hotel._id }).session(session);
        // update user role if no hotel exists for the owner
        const hotelCount = await Hotel.countDocuments({ owner }).session(session);
        if (hotelCount === 0) {
            await User.findByIdAndUpdate(owner, { role: USER_ROLES.USER }).session(session);
        }
        // commit transaction
        await session.commitTransaction();
        session.endSession();
        // send response
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('Hotel.DeleteSuccess') });
    } catch (error) {
        // if anything goes wrong, abort the transaction and end the session and return error
        await session.abortTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}
