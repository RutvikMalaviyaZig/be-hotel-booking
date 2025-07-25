import { Hotel, Booking, Room } from "../models/index.js";
import { HTTP_STATUS_CODE, EVENT_TYPES, ACTIONS, transporter, mongoose, VALIDATION_EVENTS } from "../config/constant.js";
import { sendSQSMessage } from "../helpers/SQS/sendData.js";
import { validateBooking } from "../helpers/validation/BookingValidation.js";

/**
* @name checkAvailability
* @file bookingController.js
* @param {Object} { room, checkInDate, checkOutDate }
* @description check availability
* @author Rutvik Malaviya (Zignuts)
*/
const checkAvailability = async ({ room, checkInDate, checkOutDate }) => {
  try {
    // check if room is available
    const bookings = await Booking.find({
      room,
      checkInDate: { $lte: checkOutDate },
      checkOutDate: { $gte: checkInDate },
    });
    // check if room is available
    const isAvailable = bookings.length === 0;
    // return isAvailable
    return isAvailable;
  } catch (error) {
    // return error
    return error;
  }
};

/**
* @name checkAvailabilityAPI
* @file bookingController.js
* @param {Request} req
* @param {Response} res
* @description check availability API
* @author Rutvik Malaviya (Zignuts)
*/
export const checkAvailabilityAPI = async (req, res) => {
  try {
    // get data from request body
    const { room, checkInDate, checkOutDate } = req.body;
    // validate data
    const validateBookingData = validateBooking({ eventCode: VALIDATION_EVENTS.CHECK_AVAILABILITY, room, checkInDate, checkOutDate });
    if (validateBookingData.hasError) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateBookingData.errors });
    }
    // check availability
    const isAvailable = await checkAvailability({
      room,
      checkInDate,
      checkOutDate,
    });
    // send response
    return res.status(HTTP_STATUS_CODE.OK).json({ success: true, isAvailable });
  } catch (error) {
    // if anything goes wrong, return error
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
* @name createBooking
* @file bookingController.js
* @param {Request} req
* @param {Response} res
* @description create booking
* @author Rutvik Malaviya (Zignuts)
*/
export const createBooking = async (req, res) => {
  // start session and transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // get data from request body
    const { room, checkInDate, checkOutDate, guests } = req.body;
    // validate data
    const user = req.user;
    const validateBookingData = validateBooking({ eventCode: VALIDATION_EVENTS.CREATE_BOOKING, room, checkInDate, checkOutDate, guests });
    if (validateBookingData.hasError) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateBookingData.errors });
    }
    // check availability
    const isAvailable = await checkAvailability({
      room,
      checkInDate,
      checkOutDate,
    });
    // if room is not available, return error
    if (!isAvailable) {
      return res
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json({ success: false, message: req.__('Room.RoomNotAvailable') });
    }
    // find room
    const roomData = await Room.findById(room).populate("hotel");
    let totalPrice = roomData.pricePerNight;
    // calculate total price
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    // calculate time difference
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    totalPrice = totalPrice * diffDays;
    // send booking data to SQS
    const booking = await sendSQSMessage(EVENT_TYPES.BOOKING, {
      _id: null,
      action: ACTIONS.CREATE,
      user: user._id,
      room,
      hotel: roomData.hotel._id,
      checkInDate,
      checkOutDate,
      totalPrice,
      guests,
    });
    // if booking is not created, return error
    if (!booking) {
      return res
        .status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: req.__('Booking.CreateFailed') });
    }
    // prepare mail options for user
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: req.user.email,
      subject: req.__('Booking.CreateSuccess'),
      text: `Your booking has been confirmed.
            Hotel: ${roomData.hotel.name}
            Room: ${roomData.roomType}
            Check-in Date: ${checkInDate}
            Check-out Date: ${checkOutDate}
            Total Price: ${totalPrice}
            Guests: ${guests}
            Thank you for using our service.`,
    };
    // send mail to user
    await transporter.sendMail(mailOptions);
    // send response
    res.status(HTTP_STATUS_CODE.CREATED).json({
      success: true,
      message: req.__('Booking.CreateSuccess'),
      booking,
    });
  } catch (error) {
    // if anything goes wrong, abort the transaction and end the session and return error
    await session.abortTransaction();
    session.endSession();
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
* @name updateBooking
* @file bookingController.js
* @param {Request} req
* @param {Response} res
* @description update booking
* @author Rutvik Malaviya (Zignuts)
*/
export const updateBooking = async (req, res) => {
  // start session and transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // get data from request body
    const { id } = req.params;
    const { checkInDate, checkOutDate, guests } = req.body;
    const user = req.user;
    // validate data
    const validateBookingData = validateBooking({ eventCode: VALIDATION_EVENTS.UPDATE_BOOKING, id, checkInDate, checkOutDate, guests });
    if (validateBookingData.hasError) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateBookingData.errors });
    }
    // find booking
    const booking = await Booking.findById(id);
    // if booking is not found, return error
    if (!booking) {
      return res
        .status(HTTP_STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: req.__('Booking.BookingNotFound') });
    }
    // check if user is authorized to update booking
    if (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.HOTEL_OWNER) {
      await sendSQSMessage(EVENT_TYPES.BOOKING, {
        _id: id,
        action: ACTIONS.UPDATE,
        booking: { _id, checkInDate, checkOutDate, guests },
      });
    } else {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({ success: false, message: req.__('General.Unauthorized') });
    }
    // commit transaction
    await session.commitTransaction();
    session.endSession();
    // send response
    return res
      .status(HTTP_STATUS_CODE.OK)
      .json({ success: true, message: req.__('Booking.UpdateSuccess') });
  } catch (error) {
    // if anything goes wrong, abort the transaction and end the session and return error
    await session.abortTransaction();
    session.endSession();
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
* @name deleteBooking
* @file bookingController.js
* @param {Request} req
* @param {Response} res
* @description delete booking
* @author Rutvik Malaviya (Zignuts)
*/
export const deleteBooking = async (req, res) => {
  // start session and transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // get data from request body
    const { id } = req.params;
    // validate data
    const validateBookingData = validateBooking({ eventCode: VALIDATION_EVENTS.DELETE_BOOKING, id });
    if (validateBookingData.hasError) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateBookingData.errors });
    }
    // find booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res
        .status(HTTP_STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: req.__('Booking.BookingNotFound') });
    }
    // check if user is authorized to delete booking
    const user = req.user;
    if (user) {
      // update booking
      await Booking.findByIdAndUpdate(id, {
        isDeleted: true,
        deletedAt: new Date(),
        status: BOOKING_STATUS.CANCELLED,
      });
      // send booking data to SQS
      await sendSQSMessage(EVENT_TYPES.BOOKING, {
        _id: id,
        action: ACTIONS.DELETE,
        booking: { _id },
      });
    } else {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({ success: false, message: req.__('General.Unauthorized') });
    }
    // commit transaction
    await session.commitTransaction();
    session.endSession();
    // send response
    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: req.__('Booking.BookingCancelled'),
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
* @name getUserBookings
* @file bookingController.js
* @param {Request} req
* @param {Response} res
* @description get user bookings
* @author Rutvik Malaviya (Zignuts)
*/
export const getUserBookings = async (req, res) => {
  try {
    // get user id from request
    const user = req.user._id;
    // validate data
    const validateBookingData = validateBooking({ eventCode: VALIDATION_EVENTS.GET_USER_BOOKINGS, user });
    if (validateBookingData.hasError) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateBookingData.errors });
    }
    // find bookings
    const bookings = await Booking.find({ user })
      .populate("room hotel")
      .sort({ createdAt: -1 });
    // send response
    return res.status(HTTP_STATUS_CODE.OK).json({ success: true, bookings });
  } catch (error) {
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
* @name getHotelBookings
* @file bookingController.js
* @param {Request} req
* @param {Response} res
* @description get hotel bookings
* @author Rutvik Malaviya (Zignuts)
*/
export const getHotelBookings = async (req, res) => {
  // start session and transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // validate data
    const validateBookingData = validateBooking({ hotel: req.user._id, eventCode: VALIDATION_EVENTS.GET_HOTEL_BOOKINGS });
    if (validateBookingData.hasError) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ success: false, message: validateBookingData.errors });
    }
    // find hotel
    const hotel = await Hotel.findOne({ owner: req.user._id });
    if (!hotel) {
      return res
        .status(HTTP_STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: req.__('Hotel.HotelNotFound') });
    }
    // find bookings
    const bookings = await Booking.find({ hotel: hotel._id })
      .populate("room hotel user")
      .sort({ createdAt: -1 });
    // calculate total bookings and total revenue
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce(
      (acc, booking) => acc + booking.totalPrice,
      0
    );
    // send response
    return res
      .status(HTTP_STATUS_CODE.OK)
      .json({ success: true, bookings, totalBookings, totalRevenue });
  } catch (error) {
    // if anything goes wrong, abort the transaction and end the session and return error
    await session.abortTransaction();
    session.endSession();
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
* @name stripePayment
* @file bookingController.js
* @param {Request} req
* @param {Response} res
* @description stripe payment
* @author Rutvik Malaviya (Zignuts)
*/
// not in use
// create payment intent
// export const stripePayment = async (req, res) => {
//   try {
//     const { bookingId } = req.body;
//     const bookingData = await Booking.findById(bookingId);
//     const roomData = await Room.findById(bookingData.room).populate("hotel");
//     const amount = bookingData.totalPrice;
//     const { origin } = req.headers;
//     const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
//     const line_items = [
//       {
//         price_data: {
//           currency: CURRENCY.USD,
//           product_data: {
//             name: roomData.hotel.name,
//           },
//           unit_amount: amount * 100,
//         },
//         quantity: 1,
//       },
//     ];

//     const session = await stripeInstance.checkout.sessions.create({
//       line_items,
//       mode: EVENT_TYPES.PAYMENT,
//       success_url: `${origin}/loader/my-bookings`,
//       cancel_url: `${origin}/my-bookings`,
//       metadata: { bookingId },
//     });

//     res.status(HTTP_STATUS_CODE.OK).json({ success: true, url: session.url, bookingId });
//   } catch (error) {
//     res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
//   }
// };
