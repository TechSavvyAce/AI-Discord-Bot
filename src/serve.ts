require('dotenv').config();

// External Modules
import API from './apis';
import config from './config';
import ConnectDatabase from './config/database';
import { initSocket, initDiscordBot } from './socket/index_discord';
// import { initSocket } from './socket/index_telegram';
ConnectDatabase(config.mongoURI);

initDiscordBot();
initSocket();