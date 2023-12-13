"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const config_1 = __importDefault(require("./config"));
const database_1 = __importDefault(require("./config/database"));
const socket_1 = require("./socket");
(0, database_1.default)(config_1.default.mongoURI);
(0, socket_1.initSocket)();
//# sourceMappingURL=serve.js.map