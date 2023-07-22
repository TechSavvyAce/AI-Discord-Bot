"use strict";
/** @format */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
// Basic Schema
const BasicSchema = new Schema({
    first_name: {
        type: String,
        default: '',
        require: true
    },
    last_name: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: '',
        require: true
    },
    user_name: {
        type: String,
        default: '',
        require: true
    },
    avatar: {
        type: String,
        default: ''
    },
    password: {
        type: String,
        default: '',
        require: true
    },
    permission: {
        type: String,
        default: '',
        require: true
    },
    group: {
        type: Array,
        default: [],
        require: true
    },
    status: {
        type: String,
        default: '',
        require: true
    }
});
exports.default = mongoose_1.default.model('users', BasicSchema);
//# sourceMappingURL=user.js.map