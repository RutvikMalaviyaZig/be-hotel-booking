import { Admin, Hotel, Booking, User, Room } from "../models/index.js";
import { bcrypt, jwt, mongoose, USER_ROLES, TOKEN_EXPIRY, VALIDATION_EVENTS, HTTP_STATUS_CODE, db, ObjectId, LOGIN_WITH, MODELS } from "../config/constant.js";
import { validateAdmin } from "../helpers/validation/AdminValidation.js";
import { validateHotel } from "../helpers/validation/HotelValidation.js";
import { validateUser } from "../helpers/validation/UserValidation.js";

/**
   * @name signUpAdmin
   * @file adminController.js
   * @param {Request} req
   * @param {Response} res
   * @description sign up admin
   * @author Rutvik Malaviya (Zignuts)
   */
export const signUpAdmin = async (req, res) => {
    try {
        // get data from request body
        const { name, email, password } = req.body;
        // validate data
        const validateAdminData = validateAdmin({ name, email, password, eventCode: VALIDATION_EVENTS.CREATE_ADMIN });
        if (validateAdminData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateAdminData.errors });
        }
        // check if admin already exists
        const user = await db.collection(MODELS.ADMIN).findOne({ email, isDeleted: false });
        // if admin already exists then return error
        if (user) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('Admin.AdminAlreadyExists') });
        }
        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // generate user id
        const userId = new ObjectId();
        // generate access token and refresh token
        const token = jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY.ADMIN_ACCESS_TOKEN });
        const refreshToken = jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY.ADMIN_REFRESH_TOKEN });
        // create admin
        await db.collection(MODELS.ADMIN).insertOne({ _id: userId, username: name, email, password: hashedPassword, role: USER_ROLES.ADMIN, accessToken: token, refreshToken });
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('Admin.SignUpSuccess'), token });
    } catch (error) {
        // if anything goes wrong, abort the transaction and end the session and return error
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

/**
   * @name signInAdmin
   * @file adminController.js
   * @param {Request} req
   * @param {Response} res
   * @description sign in admin
   * @author Rutvik Malaviya (Zignuts)
   */
export const signInAdmin = async (req, res) => {
    try {
        // get data from request body
        const { email, password } = req.body;
        // validate data
        const validateAdminData = validateAdmin({ email, password, eventCode: VALIDATION_EVENTS.SIGN_IN_ADMIN });
        if (validateAdminData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateAdminData.errors });
        }
        // find admin
        const user = await db.collection(MODELS.ADMIN).findOne({ email });
        if (!user) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('Admin.AdminNotFound') });
        }
        // check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('Admin.InvalidPassword') });
        }
        // generate access token and refresh token
        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY.ADMIN_ACCESS_TOKEN });
        const refreshToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY.ADMIN_REFRESH_TOKEN });
        // update access token and refresh token
        user.accessToken = token;
        user.refreshToken = refreshToken;
        // update user login with
        user.loginWith = LOGIN_WITH.EMAIL;
        // save user
        await db.collection(MODELS.ADMIN).updateOne({ _id: user._id }, { $set: user });
        // send response
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('Admin.SignInSuccess'), token });
    } catch (error) {
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

/**
* @name refreshToken
* @file adminController.js
* @param {Request} req
* @param {Response} res
* @description refresh token
* @author Rutvik Malaviya (Zignuts)
*/
export const refreshToken = async (req, res) => {
    try {
        let refreshToken = req.headers['authorization'];
        //check if refreshToken starts with Bearer, fetch the token or return error
        if (refreshToken && refreshToken.startsWith('Bearer ')) {
            //if token start with Bearer
            refreshToken = refreshToken.split(' ')[1];
        } else {
            //if token is not provided then send validation response
            return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
                status: HTTP_STATUS_CODE.UNAUTHORIZED,
                errorCode: '',
                message: req.__('User.Auth.TokenNotFound'),
                data: {},
                error: '',
            });
        }

        // find admin
        const user = await db.collection(MODELS.ADMIN).findOne({ refreshToken });
        if (!user) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('Admin.AdminNotFound') });
        }
        // generate access token
        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY.ADMIN_ACCESS_TOKEN })
        // update access token
        user.accessToken = token;
        // save user
        await db.collection(MODELS.ADMIN).updateOne({ _id: user._id }, { $set: user });
        // send response
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('Admin.SignInSuccess'), token });
    } catch (error) {
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

/**
* @name signOutAdmin
* @file adminController.js
* @param {Request} req
* @param {Response} res
* @description sign out admin
* @author Rutvik Malaviya (Zignuts)
*/
export const signOutAdmin = async (req, res) => {
    try {
        // get user id from request
        const userId = req.auth.userId;
        // validate user id
        const validateAdminData = validateAdmin({ userId, eventCode: VALIDATION_EVENTS.SIGN_OUT_ADMIN });
        if (validateAdminData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateAdminData.errors });
        }
        // find admin
        const user = await db.collection(MODELS.ADMIN).findOne({ _id: userId });
        if (!user) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('Admin.AdminNotFound') });
        }
        // update access token and refresh token
        user.accessToken = null;
        user.refreshToken = null;
        // save user
        await db.collection(MODELS.ADMIN).updateOne({ _id: userId }, { $set: user });
        // send response
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('Admin.SignOutSuccess') });
    } catch (error) {
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

/**
* @name updateAdmin
* @file adminController.js
* @param {Request} req
* @param {Response} res
* @description update admin
* @author Rutvik Malaviya (Zignuts)
*/
export const updateAdmin = async (req, res) => {
    try {
        // get data from request body
        const { name, email } = req.body;
        // validate data
        const validateAdminData = validateAdmin({ name, email, eventCode: VALIDATION_EVENTS.UPDATE_ADMIN });
        if (validateAdminData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateAdminData.errors });
        }
        // find admin
        const user = await db.collection(MODELS.ADMIN).findOne({ _id: req.auth.userId });
        if (!user) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('Admin.AdminNotFound') });
        }
        // update admin
        user.name = name;
        user.email = email;
        // save admin
        await db.collection(MODELS.ADMIN).updateOne({ _id: user._id }, { $set: user });
        // send response
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, message: req.__('Admin.UpdateSuccess') });
    } catch (error) {
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

/**
* @name getAllUsers
* @file adminController.js
* @param {Request} req
* @param {Response} res
* @description get all users
* @author Rutvik Malaviya (Zignuts)
*/
export const getAllUsers = async (req, res) => {
    try {
        // find all users
        const users = await db.collection(MODELS.USER).find(
            { role: USER_ROLES.USER },
            {
                projection: {
                    accessToken: 0,
                    refreshToken: 0,
                    password: 0,
                    createdAt: 0,
                    deletedAt: 0,
                    updatedAt: 0,
                    __v: 0
                }
            }
        ).toArray();
        // send response
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, users });
    } catch (error) {
        // if anything goes wrong, return error
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

/**
* @name getAllHotelOwners
* @file adminController.js
* @param {Request} req
* @param {Response} res
* @description get all hotel owners
* @author Rutvik Malaviya (Zignuts)
*/
export const getAllHotelOwners = async (req, res) => {
    try {
        // find all hotel owners
        const hotelOwners = await db.collection(MODELS.USER).find(
            { role: USER_ROLES.HOTEL_OWNER },
            {
                projection: {
                    accessToken: 0,
                    refreshToken: 0,
                    password: 0,
                    createdAt: 0,
                    deletedAt: 0,
                    updatedAt: 0,
                    __v: 0
                }
            }
        ).toArray();
        // send response
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, hotelOwners });
    } catch (error) {
        // if anything goes wrong, return error
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

/**
* @name getAllHotels
* @file adminController.js
* @param {Request} req
* @param {Response} res
* @description get all hotels
* @author Rutvik Malaviya (Zignuts)
*/
export const getAllHotels = async (req, res) => {
    try {
        // find all hotels
        const hotels = await db.collection(MODELS.HOTEL).find(
            {
                projection: {
                    createdAt: 0,
                    deletedAt: 0,
                    updatedAt: 0,
                    __v: 0
                }
            }
        ).toArray();
        // send response
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, hotels });
    } catch (error) {
        // if anything goes wrong, return error
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

/**
* @name getAllRooms
* @file adminController.js
* @param {Request} req
* @param {Response} res
* @description get all rooms
* @author Rutvik Malaviya (Zignuts)
*/
export const getAllRooms = async (req, res) => {
    try {
        // find all rooms
        const rooms = await db.collection(MODELS.ROOM).find(
            {
                projection: {
                    createdAt: 0,
                    deletedAt: 0,
                    updatedAt: 0,
                    __v: 0
                }
            }
        ).toArray();
        // send response
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, rooms });
    } catch (error) {
        // if anything goes wrong, return error
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

/**
* @name getAllBookings
* @file adminController.js
* @param {Request} req
* @param {Response} res
* @description get all bookings
* @author Rutvik Malaviya (Zignuts)
*/
export const getAllBookings = async (req, res) => {
    try {
        // find all bookings
        const bookings = await db.collection(MODELS.BOOKING).find(
            {
                projection: {
                    createdAt: 0,
                    deletedAt: 0,
                    updatedAt: 0,
                    __v: 0
                }
            }
        ).toArray();
        // send response
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, bookings });
    } catch (error) {
        // if anything goes wrong, return error
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

/**
* @name getHotelBookings
* @file adminController.js
* @param {Request} req
* @param {Response} res
* @description get booking of particular hotel owner
* @author Rutvik Malaviya (Zignuts)
*/
export const getHotelBookings = async (req, res) => {
    try {
        // validate hotel id
        const validateHotelData = validateHotel({ hotelId: req.params.id, eventCode: VALIDATION_EVENTS.GET_HOTEL_BOOKINGS });
        if (validateHotelData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateHotelData.errors });
        }
        // find hotel
        const hotel = await db.collection(MODELS.HOTEL).findOne({ _id: new ObjectId(String(req.params.id)) });
        if (!hotel) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('Hotel.HotelNotFound') });
        }
        // find bookings
        const bookings = await db.collection(MODELS.BOOKING).aggregate([
            {
                $match: {
                    hotel: hotel._id
                }
            },
            {
                $lookup: {
                    from: MODELS.ROOM,
                    localField: "room",
                    foreignField: "_id",
                    as: "room"
                }
            },
            {
                $lookup: {
                    from: MODELS.HOTEL,
                    localField: "hotel",
                    foreignField: "_id",
                    as: "hotel"
                }
            },
            {
                $lookup: {
                    from: MODELS.USER,
                    localField: "user",
                    foreignField: "_id",
                    as: "user"
                }
            }
        ]).toArray().sort({ createdAt: -1 });
        // calculate total bookings and total revenue
        const totalBookings = bookings.length;
        const totalRevenue = bookings.reduce((acc, booking) => acc + booking.totalPrice, 0);
        // send response
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, bookings, totalBookings, totalRevenue });
    } catch (error) {
        // if anything goes wrong, return error
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}

/**
* @name getUserBookings
* @file adminController.js
* @param {Request} req
* @param {Response} res
* @description get booking of particular user
* @author Rutvik Malaviya (Zignuts)
*/
export const getUserBookings = async (req, res) => {
    try {
        // validate user id
        const validateUserData = validateUser({ userId: req.params.id, eventCode: VALIDATION_EVENTS.GET_USER_BOOKINGS });
        if (validateUserData.hasError) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateUserData.errors });
        }
        // find user
        const user = await db.collection(MODELS.USER).findOne({ _id: new ObjectId(String(req.params.id)) });
        if (!user) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: req.__('User.UserNotFound') });
        }
        // find bookings
        const bookings = await db.collection(MODELS.BOOKING).aggregate([
            {
                $match: {
                    user: new ObjectId(String(req.params.id))
                }
            },
            {
                $lookup: {
                    from: MODELS.ROOM,
                    localField: "room",
                    foreignField: "_id",
                    as: "room"
                }
            },
            {
                $lookup: {
                    from: MODELS.HOTEL,
                    localField: "hotel",
                    foreignField: "_id",
                    as: "hotel"
                }
            }
        ]).toArray().sort({ createdAt: -1 });
        // calculate total bookings and total revenue
        const totalBookings = bookings.length;
        const totalRevenue = bookings.reduce((acc, booking) => acc + booking.totalPrice, 0);
        // send response
        return res.status(HTTP_STATUS_CODE.OK).json({ success: true, bookings, totalBookings, totalRevenue });
    } catch (error) {
        // if anything goes wrong, return error
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}
