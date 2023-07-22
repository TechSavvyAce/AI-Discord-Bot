"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = __importDefault(require("./auth"));
const history_1 = __importDefault(require("./history"));
const API = (router) => {
    // APIs for Auth
    router.post('/register', auth_1.default.register);
    router.post('/login', auth_1.default.login);
    router.post('/updateStatus', auth_1.default.updateStatus);
    router.post('/clearHistory', history_1.default.removeHistory);
};
exports.default = API;
//# sourceMappingURL=index.js.map