import {
    VALIDATION_EVENTS,
    validator,
} from '../../config/constant.js';

const validateHotel = (bodyData) => {
    let rules;
    let result = {};
    switch (bodyData.eventCode) {
        case VALIDATION_EVENTS.CREATE_HOTEL: {
            rules = {
                id: 'string|required',
                name: 'string|required',
                address: 'string|required',
                contact: 'string|required',
                city: 'string|required',
            };
            break;
        }
        case VALIDATION_EVENTS.UPDATE_HOTEL: {
            rules = {
                id: 'string|required',
                name: 'string|required',
                address: 'string|required',
                contact: 'string|required',
                city: 'string|required',
                hotelId: 'string|required',
            };
            break;
        }
        case VALIDATION_EVENTS.DELETE_HOTEL: {
            rules = {
                id: 'string|required',
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

export { validateHotel };
