"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const ChatHistory = {
    create: async (props) => {
        const { from, to, message, date } = props;
        try {
            const newData = new models_1.ChathistorySchema({
                from,
                to,
                message,
                date
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
            const result = await models_1.ChathistorySchema.find({ $or: filter });
            return result;
        }
        catch (err) {
            throw new Error(err.message);
        }
    },
    remove: async (props) => {
        const { email } = props;
        try {
            const id = await models_1.UserSchema.findOne({ email: email });
            const result = await models_1.ChathistorySchema.deleteMany({ $or: [{ from: id?._id }, { to: id?._id }] });
            if (result)
                return true;
            else
                return false;
        }
        catch (error) {
            return false;
        }
    }
};
exports.default = ChatHistory;
//# sourceMappingURL=chathistories.js.map