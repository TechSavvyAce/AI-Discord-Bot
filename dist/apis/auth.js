"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const controllers_1 = __importDefault(require("../controllers"));
const untils_1 = require("../untils");
const models_1 = require("../models");
// Normal Auth
const register = async (req, res) => {
    try {
        const { first_name, last_name, email, user_name, password, group, permission } = req.body;
        if (!((0, untils_1.Trim)(first_name) && (0, untils_1.Trim)(last_name) && (0, untils_1.Trim)(email) && (0, untils_1.Trim)(user_name) && (0, untils_1.Trim)(password) && (0, untils_1.Trim)(permission))) {
            return res.send({ status: false, code: 400, message: 'Please enter all required data.' });
        } // Check user
        if (!(0, untils_1.emailValidator)(email)) {
            return res.send({ status: false, code: 400, message: 'Invalid email type!' });
        } // Check email
        if (!(0, untils_1.isStrongPassword)(password).status) {
            return res.send({ status: false, code: 400, message: (0, untils_1.isStrongPassword)(password).msg });
        } // Check strong password
        const oldUser = await controllers_1.default.Auth.find({
            filter: [{ user_name: (0, untils_1.Trim)(user_name) }, { email: (0, untils_1.Trim)(email) }]
        });
        if (oldUser) {
            if (oldUser.email === (0, untils_1.Trim)(email)) {
                return res.send({ status: false, code: 409, message: 'Email Already Exist.' });
            }
            if (oldUser.user_name === (0, untils_1.Trim)(user_name)) {
                return res.send({ status: false, code: 409, message: 'User Name Already Exist.' });
            }
        } // Check user exists
        const encryptedPassword = await bcryptjs_1.default.hash(password, 10); // Encrypt password
        await controllers_1.default.Auth.create({
            first_name,
            last_name,
            email: (0, untils_1.Trim)(email).toLowerCase(),
            user_name,
            password: encryptedPassword,
            group,
            permission,
            status: 'pending'
        }); // Save user data
        return res.send({ status: true, code: 201, message: 'User created successfully, please login' });
    }
    catch (err) {
        console.log('register error : ', err.message);
        res.status(500).send(err.message);
    }
};
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!((0, untils_1.Trim)(email) && (0, untils_1.Trim)(password))) {
            return res.send({ status: false, code: 400, message: 'Please enter all required data.' });
        }
        const user = await controllers_1.default.Auth.find({
            filter: [{ email: (0, untils_1.Trim)(email).toLowerCase() }]
        });
        if (!user) {
            return res.send({ status: false, code: 404, message: 'User not exist, please register' });
        }
        const pass = await bcryptjs_1.default.compare(password, user.password);
        if (pass) {
            switch (user.status) {
                case 'pending':
                    return res.send({
                        status: false,
                        code: 403,
                        message: 'User not allow from admin, please contact with admin'
                    });
                    break;
                case 'block':
                    return res.send({
                        status: false,
                        code: 403,
                        message: 'User blocked from admin, please contact with admin'
                    });
                    break;
            }
            const token = jsonwebtoken_1.default.sign({
                user_id: user._id,
                first_name: (0, untils_1.Trim)(user.first_name),
                last_name: (0, untils_1.Trim)(user.last_name),
                email: (0, untils_1.Trim)(email),
                user_name: (0, untils_1.Trim)(user.user_name),
                avatar: (0, untils_1.Trim)(user.avatar),
                permission: (0, untils_1.Trim)(user.permission),
                group: user.group
            }, String(process.env.TOKEN_KEY), {
                expiresIn: '2h'
            }); // Create token
            return res.send({ status: true, code: 200, message: 'User logged successfully, please login', token: token });
        }
        else {
            return res.send({ status: false, code: 400, message: 'Password or Email is not correct!' });
        }
    }
    catch (err) {
        console.log('login error: ', err);
        res.status(500).send(err.message);
    }
};
const updateStatus = async (req, res) => {
    await models_1.UserSchema.updateMany({ permission: 'user' }, { $set: { status: 'accept' } });
};
exports.default = {
    register,
    login,
    updateStatus
};
//# sourceMappingURL=auth.js.map