import { Hotel, Room, User, Booking } from "../models/index.js";
import { USER_ROLES, HTTP_STATUS_CODE, VALIDATION_EVENTS, db, ObjectId, RADIUS, MODELS } from "../config/constant.js";
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
    try {
        // get data from request body
        const { name, address, contact, city, latitude, longitude } = req.body;
        const owner = req.user._id;
        // validate data
        const validateHotelData = validateHotel({ eventCode: VALIDATION_EVENTS.CREATE_HOTEL, id: owner, name, address, contact, city, latitude, longitude });
        // if validation fails, return error
        if (validateHotelData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateHotelData.errors });
        }

        // check if hotel already exists
        const hotel = await db.collection(MODELS.HOTEL).findOne({
            name, owner, isDeleted: false, location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: RADIUS.HOTEL
                }
            }
        });
        // if hotel already exists, return error
        if (hotel) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('Hotel.HotelAlreadyExists') });
        }

        // create hotel
        await db.collection(MODELS.HOTEL).insertOne({ name, address, contact, owner, city, isDeleted: false, location: { type: "Point", coordinates: [longitude, latitude] } });
        // update user role
        await db.collection(MODELS.USER).findOneAndUpdate({ _id: new ObjectId(String(owner)) }, { $set: { role: USER_ROLES.HOTEL_OWNER } });
        // send response
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('Hotel.CreateSuccess') });
    } catch (error) {
        // if anything goes wrong, return error
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
    try {
        // get data from request body
        const { name, address, contact, city, hotelId, latitude, longitude } = req.body;
        const owner = req.user._id;
        // validate data
        const validateHotelData = validateHotel({ eventCode: VALIDATION_EVENTS.UPDATE_HOTEL, id: owner, hotelId, name, address, contact, city, latitude, longitude });
        // if validation fails, return error
        if (validateHotelData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateHotelData.errors });
        }
        // find hotel
        const hotel = await db.collection(MODELS.HOTEL).findOne({
            _id: new ObjectId(String(hotelId)),
            owner,
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: RADIUS.HOTEL
                }
            }
        });
        // if hotel is not found, return error
        if (!hotel) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('Hotel.HotelNotFound') });
        }
        // update hotel
        await db.collection(MODELS.HOTEL).findOneAndUpdate({ _id: new ObjectId(String(hotel._id)) }, { $set: { name, address, contact, city, isDeleted: false, location: { type: "Point", coordinates: [longitude, latitude] } } });
        // send response
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('Hotel.UpdateSuccess') });
    } catch (error) {
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
    try {
        // get data from request body
        const { hotelId, latitude, longitude } = req.body;
        const owner = req.user._id;
        // validate data
        const validateHotelData = validateHotel({ eventCode: VALIDATION_EVENTS.DELETE_HOTEL, id: owner, hotelId, latitude, longitude });
        // if validation fails, return error
        if (validateHotelData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateHotelData.errors });
        }
        // find hotel
        const hotel = await db.collection(MODELS.HOTEL).findOne({
            owner,
            _id: new ObjectId(String(hotelId)),
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: RADIUS.HOTEL
                }
            }
        });
        // if hotel is not found, return error
        if (!hotel) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('Hotel.HotelNotFound') });
        }
        // delete hotel
        await db.collection(MODELS.HOTEL).findOneAndUpdate({ _id: new ObjectId(String(hotel._id)), owner, isDeleted: false }, { $set: { isDeleted: true } });
        // delete rooms
        await db.collection(MODELS.ROOM).deleteMany({ hotel: new ObjectId(String(hotel._id)) });
        // delete bookings
        await db.collection(MODELS.BOOKING).deleteMany({ hotel: new ObjectId(String(hotel._id)) });
        // update user role if no hotel exists for the owner
        const hotelCount = await db.collection(MODELS.HOTEL).countDocuments({ owner, isDeleted: false });
        if (hotelCount === 0) {
            await db.collection(MODELS.USER).findOneAndUpdate({ _id: new ObjectId(String(owner)) }, { $set: { role: USER_ROLES.USER } });
        }
        // send response
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('Hotel.DeleteSuccess') });
    } catch (error) {
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

/**
* @name findHotelOnGeoLocation
* @file hotelController.js
* @param {Request} req
* @param {Response} res
* @description find hotel on geo location
* @author Rutvik Malaviya (Zignuts)
*/
export const findHotelOnGeoLocation = async (req, res) => {
    try {
        // get data from request body
        const { latitude, longitude } = req.query;
        const radius = RADIUS.HOTEL; // in meters (5km)
        // validate data
        const validateHotelData = validateHotel({ eventCode: VALIDATION_EVENTS.FIND_HOTEL_ON_GEO_LOCATION, latitude, longitude });
        // if validation fails, return error
        if (validateHotelData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateHotelData.errors });
        }
        // find hotel
        const hotel = await db.collection(MODELS.HOTEL).find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: radius
                }
            },
            isDeleted: false
        }).toArray();

        // if hotel is not found, return error
        if (!hotel) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('Hotel.HotelNotFound') });
        }
        // send response
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, hotel });
    } catch (error) {
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

