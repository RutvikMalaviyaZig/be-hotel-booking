import {
    VALIDATION_EVENTS,
    validator,
} from '../../config/constant.js';

const validateBooking = (bodyData) => {
    let rules;
    let result = {};
    switch (bodyData.eventCode) {
        case VALIDATION_EVENTS.CREATE_BOOKING: {
            rules = {
                room: 'string|required',
                checkInDate: 'string|required',
                checkOutDate: 'string|required',
                guests: 'string|required',
            };
            break;
        }
        case VALIDATION_EVENTS.UPDATE_BOOKING: {
            rules = {
                id: 'string|required',
                checkInDate: 'string|required',
                checkOutDate: 'string|required',
                guests: 'string|required',
            };
            break;
        }
        case VALIDATION_EVENTS.DELETE_BOOKING: {
            rules = {
                id: 'string|required',
            };
            break;
        }
        case VALIDATION_EVENTS.CHECK_AVAILABILITY: {
            rules = {
                room: 'string|required',
                checkInDate: 'string|required',
                checkOutDate: 'string|required',
            };
            break;
        }
        case VALIDATION_EVENTS.GET_USER_BOOKINGS: {
            rules = {
                user: 'string|required',
            };
            break;
        }
        case VALIDATION_EVENTS.GET_HOTEL_BOOKINGS: {
            rules = {
                hotel: 'string|required',
            };
            break;
        }


    }

    let validation = new validator(bodyData, rules);

    if (validation.passes()) {
        result['hasError'] = false;
    }
    if (validation.fails()) {
        result['hasError'] = true;
        result['errors'] = validation.errors.all();
    }
    return result;
};

export { validateBooking };
