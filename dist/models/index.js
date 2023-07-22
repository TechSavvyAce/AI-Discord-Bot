"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChathistorySchema = exports.TokenSchema = exports.UserSchema = void 0;
const user_1 = __importDefault(require("./user"));
exports.UserSchema = user_1.default;
const token_1 = __importDefault(require("./token"));
exports.TokenSchema = token_1.default;
const chathistory_1 = __importDefault(require("./chathistory"));
exports.ChathistorySchema = chathistory_1.default;
//# sourceMappingURL=index.js.map