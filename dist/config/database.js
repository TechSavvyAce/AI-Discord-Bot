"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const models_1 = require("../models");
const ConnectDatabase = async (mongoUrl) => {
    try {
        mongoose_1.default.set('strictQuery', true);
        const connectOptions = {
            autoCreate: true,
            keepAlive: true,
            retryReads: true
        };
        const result = await mongoose_1.default.connect(mongoUrl, connectOptions);
        if (result) {
            console.log('MongoDB connected');
            await MakeAdminAccount();
        }
    }
    catch (err) {
        console.log(err);
        await ConnectDatabase(mongoUrl);
    }
};
const MakeAdminAccount = async () => {
    try {
        const admin = {
            first_name: process.env.ADMIN_NAME,
            last_name: '',
            email: process.env.ADMIN_EMAIL,
            user_name: process.env.ADMIN_USER_NAME,
            avatar: '',
            password: await bcryptjs_1.default.hash(String(process.env.ADMIN_PASSWORD), 10),
            group: ['chatgpt'],
            permission: 'admin',
            status: 'accept'
        };
        const result = await models_1.UserSchema.findOne({ permission: 'admin' });
        if (!result) {
            const newData = new models_1.UserSchema(admin);
            const saveData = await newData.save();
            if (!saveData) {
                throw new Error('Database Error');
            }
            return;
        }
    }
    catch (err) {
        console.log(err);
    }
};
exports.default = ConnectDatabase;
//# sourceMappingURL=database.js.map