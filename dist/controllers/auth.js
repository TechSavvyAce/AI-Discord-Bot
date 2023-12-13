"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const Auth = {
    create: async (props) => {
        const { first_name, last_name, email, user_name, password, group, permission } = props;
        try {
            const newData = new models_1.UserSchema({
                first_name,
                last_name,
                email,
                user_name,
                password: password,
                group,
                permission,
                status: 'accept',
                online: 'false'
            });
            const saveData = await newData.save();
            if (!saveData) {
                throw new Error('Database Error');
            }
            return saveData;
        }
        catch (err) {
            throw new Error(err.message);
        }
    },
    find: async (props) => {
        const { filter } = props;
        try {
            const result = await models_1.UserSchema.findOne({ $or: filter });
            return result;
        }
        catch (err) {
            throw new Error(err.message);
        }
    },
    findById: async (props) => {
        const { param } = props;
        try {
            const result = await models_1.UserSchema.findById(param);
            return result;
        }
        catch (err) {
            throw new Error(err.message);
        }
    }
};
exports.default = Auth;
//# sourceMappingURL=auth.js.map