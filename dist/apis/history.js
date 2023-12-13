"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nexus_1 = __importDefault(require("../controllers/nexus"));
const removeHistory = async (req, res) => {
    try {
        const { email } = req.body;
        var result = await nexus_1.default.remove({});
        if (result) {
            res.send({ status: true });
        }
    }
    catch (error) {
        res.status(500).json({ status: false });
    }
};
exports.default = { removeHistory };
//# sourceMappingURL=history.js.map