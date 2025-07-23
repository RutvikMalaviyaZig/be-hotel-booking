import {
    VALIDATION_EVENTS,
    validator,
} from '../../config/constant.js';

const validateUser = (bodyData) => {
    let rules;
    let result = {};
    switch (bodyData.eventCode) {
        case VALIDATION_EVENTS.CREATE_USER: {
            rules = {
                name: 'string|required',
                email: 'string|required|email',
                password: 'string|required',
            };
            break;
        }
        case VALIDATION_EVENTS.UPDATE_USER: {
            rules = {
                name: 'string|required',
                email: 'string|required|email',
                password: 'string|required',
            };
            break;
        }
        case VALIDATION_EVENTS.DELETE_USER: {
            rules = {
                id: 'string|required',
            };
            break;
        }
        case VALIDATION_EVENTS.SIGN_IN_USER: {
            rules = {
                email: 'string|required|email',
                password: 'string|required',
            };
            break;
        }
        case VALIDATION_EVENTS.STORE_RECENT_SEARCHED_CITIES: {
            rules = {
                recentSearchCity: 'string',
            };
            break;
        }
        case VALIDATION_EVENTS.SIGN_OUT_USER: {
            rules = {
                userId: 'string|required',
            };
            break;
        }
        case VALIDATION_EVENTS.GOOGLE_SIGN_IN: {
            rules = {
                name: 'string|required',
                email: 'string|required|email',
                socialMediaId: 'string|required',
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

export { validateUser };
