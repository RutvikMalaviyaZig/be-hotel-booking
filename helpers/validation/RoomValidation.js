import {
    VALIDATION_EVENTS,
    validator,
} from '../../config/constant.js';

const validateRoom = (bodyData) => {
    let rules;
    let result = {};
    switch (bodyData.eventCode) {
        case VALIDATION_EVENTS.CREATE_ROOM: {
            rules = {
                roomType: 'string|required',
                pricePerNight: 'numeric|required',
                amenities: 'string|required',
            };
            break;
        }
        case VALIDATION_EVENTS.UPDATE_ROOM: {
            rules = {
                id: 'string|required',
                roomType: 'string|required',
                pricePerNight: 'numeric|required',
                amenities: 'string|required',
            };
            break;
        }
        case VALIDATION_EVENTS.DELETE_ROOM: {
            rules = {
                id: 'string|required',
            };
            break;
        }
        case VALIDATION_EVENTS.TOGGLE_ROOM_AVAILABILITY: {
            rules = {
                roomId: 'string|required',
            };
            break;
        }
        case VALIDATION_EVENTS.GET_OWNER_ROOMS: {
            rules = {
                id: 'string|required',
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

export { validateRoom };
