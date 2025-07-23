import {
    VALIDATION_EVENTS,
    validator,
} from '../../config/constant.js';

const validateAdmin = (bodyData) => {
    let rules;
    let result = {};
    switch (bodyData.eventCode) {
        case VALIDATION_EVENTS.CREATE_ADMIN: {
            rules = {
                name: 'string|required',
                email: 'string|required|email',
                password: 'string|required',
            };
            break;
        }
        case VALIDATION_EVENTS.UPDATE_ADMIN: {
            rules = {
                name: 'string|required',
                email: 'string|required|email',
                password: 'string|required',
            };
            break;
        }
        case VALIDATION_EVENTS.DELETE_ADMIN: {
            rules = {
                id: 'string|required',
            };
            break;
        }
        case VALIDATION_EVENTS.SIGN_IN_ADMIN: {
            rules = {
                email: 'string|required|email',
                password: 'string|required',
            };
            break;
        }
        case VALIDATION_EVENTS.SIGN_OUT_ADMIN: {
            rules = {
                userId: 'string|required',
            };
            break;
        }
        case VALIDATION_EVENTS.GET_USER_BOOKINGS: {
            rules = {
                userId: 'string|required',
            };
            break;
        }
        case VALIDATION_EVENTS.GET_HOTEL_BOOKINGS: {
            rules = {
                hotelId: 'string|required',
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

export { validateAdmin };
