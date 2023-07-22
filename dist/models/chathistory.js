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
    from: {
        type: String,
        default: '',
        require: true
    },
    to: {
        type: String,
        default: '',
        require: true
    },
    message: {
        type: Array,
        default: [],
        require: true
    },
    date: {
        type: Date,
        default: null,
        require: true
    }
});
exports.default = mongoose_1.default.model('chathistories', BasicSchema);
//# sourceMappingURL=chathistory.js.map