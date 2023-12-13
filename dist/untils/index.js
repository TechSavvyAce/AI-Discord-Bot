"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStrongPassword = exports.emailValidator = exports.Trim = void 0;
const Trim = (s) => String(s || '').trim();
exports.Trim = Trim;
const emailValidator = (s) => s.match(/(?:[a-z0-9+!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/gi);
exports.emailValidator = emailValidator;
const isStrongPassword = (s) => {
    if (!(0, exports.Trim)(s)) {
        return { status: false, msg: 'Password is required!' };
    }
    if (s.length < 8) {
        return { status: false, msg: '8 characters length!' };
    }
    if (!s.match(/[A-Z]/)) {
        return { status: false, msg: 'A letter in upper case!' };
    }
    if (!s.match(/[0-9]/)) {
        return { status: false, msg: 'A numerals (0-9)!' };
    }
    if (!s.match(/[!@#$%^&*()]/)) {
        return { status: false, msg: 'A letter special character!' };
    }
    return { status: true, msg: 'Password is strong!' };
};
exports.isStrongPassword = isStrongPassword;
//# sourceMappingURL=index.js.map