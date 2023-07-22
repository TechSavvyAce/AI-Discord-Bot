"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const Auth = {
    create: async (props) => {
        const { userId, token } = props;
        try {
            const newData = new models_1.TokenSchema({
                userId: userId,
                token: token
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
            const result = await models_1.TokenSchema.findOne(filter);
            return result;
        }
        catch (err) {
            throw new Error(err.message);
        }
    }
};
exports.default = Auth;
//# sourceMappingURL=token.js.map