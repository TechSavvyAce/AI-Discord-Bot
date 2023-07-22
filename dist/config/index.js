"use strict";
require('dotenv').config();
module.exports = {
    mongoURI: `mongodb://localhost:27017/${process.env.DATABASE_NAME}?serverSelectionTimeoutMS=5000&connectTimeoutMS=10000`
};
//# sourceMappingURL=index.js.map