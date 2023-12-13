require('dotenv').config();

// External Modules
import API from './apis';
import config from './config';
import ConnectDatabase from './config/database';
import { initSocket } from './socket';
import getMondayData from './apis/monday';
ConnectDatabase(config.mongoURI);

/////// Loading Monday Data first ////////////
const mondaygetResult = getMondayData();
initSocket();