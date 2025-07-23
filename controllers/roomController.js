import { Hotel, Room } from "../models/index.js";
import { cloudinary, HTTP_STATUS_CODE, VALIDATION_EVENTS, mongoose } from "../config/constant.js";
import { validateRoom } from "../helpers/validation/RoomValidation.js";

/**
* @name createRoom
* @file roomController.js
* @param {Request} req
* @param {Response} res
* @description create room
* @author Rutvik Malaviya (Zignuts)
*/
export const createRoom = async (req, res) => {
    // start session and transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // get data from request body
        const { roomType, pricePerNight, amenities } = req.body;
        // validate data
        const validateRoomData = validateRoom({ eventCode: VALIDATION_EVENTS.CREATE_ROOM, roomType, pricePerNight, amenities });
        if (validateRoomData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateRoomData.errors });
        }
        // find hotel
        const hotel = await Hotel.findOne({ owner: req.user._id });
        if (!hotel) {
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({ success: false, message: req.__('Hotel.HotelNotFound') });
        }
        // upload images
        const uploadImages = req.files.map(async (file) => {
            const result = await cloudinary.uploader.upload(file.path)
            return result.secure_url;
        });
        // fullfill promise and get images
        const images = await Promise.all(uploadImages);
        // create room
        const room = await Room.create([{ hotel: hotel._id, roomType, pricePerNight: Number(pricePerNight), amenities: JSON.parse(amenities), images }], { session });
        // commit transaction
        await session.commitTransaction();
        session.endSession();
        // send response
        res.status(HTTP_STATUS_CODE.CREATED).json({ success: true, message: req.__('Room.CreateSuccess'), room });
    } catch (error) {
        // if anything goes wrong, abort the transaction and end the session and return error
        await session.abortTransaction();
        session.endSession();
        console.log(error);
        res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

/**
* @name getRooms
* @file roomController.js
* @param {Request} req
* @param {Response} res
* @description get rooms
* @author Rutvik Malaviya (Zignuts)
*/
export const getRooms = async (req, res) => {
    try {
        // get rooms
        const rooms = await Room.find({ isAvailable: true }).populate({
            path: "hotel",
            populate: {
                path: "owner",
                select: "image"
            }
        }).sort({ createdAt: -1 });
        // send response
        res.status(HTTP_STATUS_CODE.OK).json({ success: true, rooms });
    } catch (error) {
        // if anything goes wrong, return error
        res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

/**
* @name getOwnerRooms
* @file roomController.js
* @param {Request} req
* @param {Response} res
* @description get owner rooms
* @author Rutvik Malaviya (Zignuts)
*/
export const getOwnerRooms = async (req, res) => {
    try {
        // validate data
        const validateRoomData = validateRoom({ eventCode: VALIDATION_EVENTS.GET_OWNER_ROOMS, id: req.user._id });
        if (validateRoomData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateRoomData.errors });
        }
        // get hotel data
        const hotelData = await Hotel.findOne({ owner: req.user._id });
        // get rooms
        const rooms = await Room.find({ hotel: hotelData._id.toString() }).populate("hotel");
        // send response
        res.status(HTTP_STATUS_CODE.OK).json({ success: true, rooms });
    } catch (error) {
        // if anything goes wrong, return error
        res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

/**
* @name toggleRoomAvailability
* @file roomController.js
* @param {Request} req
* @param {Response} res
* @description toggle room availability
* @author Rutvik Malaviya (Zignuts)
*/
export const toggleRoomAvailability = async (req, res) => {
    // start session and transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // get data from request body
        const { roomId } = req.body;
        const validateRoomData = validateRoom({ eventCode: VALIDATION_EVENTS.TOGGLE_ROOM_AVAILABILITY, roomId });
        if (validateRoomData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateRoomData.errors });
        }
        // get room data
        const roomData = await Room.findById(roomId);
        // toggle availability
        roomData.isAvailable = !roomData.isAvailable;
        await roomData.save({ session });
        // commit transaction
        await session.commitTransaction();
        session.endSession();
        res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('Room.UpdateSuccess') });
    } catch (error) {
        // if anything goes wrong, abort the transaction and end the session and return error
        await session.abortTransaction();
        session.endSession();
        res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}