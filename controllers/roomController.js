import { Hotel, Room } from "../models/index.js";
import { cloudinary, HTTP_STATUS_CODE, VALIDATION_EVENTS, db, ObjectId, MODELS } from "../config/constant.js";
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
    try {
        // get data from request body
        const { roomType, pricePerNight, amenities } = req.body;
        // validate data
        const validateRoomData = validateRoom({
            eventCode: VALIDATION_EVENTS.CREATE_ROOM,
            roomType,
            pricePerNight,
            amenities
        });

        if (validateRoomData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateRoomData.errors });
        }
        // find hotel
        const hotel = await db.collection(MODELS.HOTEL)
            .findOne({ owner: new ObjectId(String(req.user._id)), isDeleted: false });

        if (!hotel) {
            return res.status(HTTP_STATUS_CODE.NOT_FOUND)
                .json({ success: false, message: req.__('Hotel.HotelNotFound') });
        }
        // upload images
        const uploadImages = req.files.map(async (file) => {
            const result = await cloudinary.uploader.upload(file.path)
            return result.secure_url;
        });
        // fullfill promise and get images
        const images = await Promise.all(uploadImages);
        // create room
        const room = await db.collection(MODELS.ROOM).insertOne({
            hotel: hotel._id,
            roomType,
            pricePerNight: Number(pricePerNight),
            amenities: JSON.parse(amenities),
            images,
            isDeleted: false,
            isAvailable: true
        });
        // send response
        res.status(HTTP_STATUS_CODE.CREATED).json({ success: true, message: req.__('Room.CreateSuccess'), room });
    } catch (error) {
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
        const rooms = await db.collection(MODELS.ROOM)
            .aggregate([
                {
                    $match: {
                        isAvailable: true // Filter by isAvailable here
                    }
                },
                {
                    $lookup: {
                        from: MODELS.HOTEL,
                        localField: "hotel",
                        foreignField: "_id",
                        as: "hotelData"
                    }
                },
                {
                    $unwind: "$hotelData"
                },
                {
                    $project: {
                        _id: 1,
                        roomType: 1,
                        pricePerNight: 1,
                        amenities: 1,
                        images: 1,
                        isAvailable: 1,
                        hotel: 1,
                        hotelData: {
                            _id: 1,
                            name: 1,
                            address: 1,
                            contact: 1,
                            city: 1,
                            owner: 1,
                            isDeleted: 1
                        }
                    }
                }
            ]).toArray();
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
        const validateRoomData = validateRoom({
            eventCode: VALIDATION_EVENTS.GET_OWNER_ROOMS,
            id: req.user._id
        });

        if (validateRoomData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                success: false,
                message: validateRoomData.errors
            });
        }

        // get hotel data
        const hotelData = await db.collection(MODELS.HOTEL)
            .findOne({
                owner: new ObjectId(String(req.user._id)),
                isDeleted: false
            });

        if (!hotelData) {
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
                success: false,
                message: req.__('Hotel.HotelNotFound')
            });
        }

        // get rooms
        const rooms = await db.collection(MODELS.ROOM)
            .find({
                hotel: new ObjectId(String(hotelData._id)),
                isDeleted: false
            })
            .toArray();

        // send response
        res.status(HTTP_STATUS_CODE.OK).json({
            success: true,
            rooms
        });
    } catch (error) {
        // if anything goes wrong, return error
        res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message
        });
    }
};

/**
* @name toggleRoomAvailability
* @file roomController.js
* @param {Request} req
* @param {Response} res
* @description toggle room availability
* @author Rutvik Malaviya (Zignuts)
*/
export const toggleRoomAvailability = async (req, res) => {
    try {
        // get data from request body
        const { roomId } = req.body;
        const validateRoomData = validateRoom({
            eventCode: VALIDATION_EVENTS.TOGGLE_ROOM_AVAILABILITY,
            roomId
        });
        if (validateRoomData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST)
                .json({ success: false, message: validateRoomData.errors });
        }
        // get room data
        const roomData = await db.collection(MODELS.ROOM)
            .findOne({ _id: new ObjectId(String(roomId)), isDeleted: false });
        // toggle availability
        roomData.isAvailable = !roomData.isAvailable;
        await db.collection(MODELS.ROOM).findOneAndUpdate({ _id: new ObjectId(String(roomId)), isDeleted: false }, { $set: { isAvailable: roomData.isAvailable } });
        // commit transaction
        res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('Room.UpdateSuccess') });
    } catch (error) {
        // if anything goes wrong, return error
        res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}