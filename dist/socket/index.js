"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = void 0;
require('dotenv').config();
const openai_1 = require("openai");
const uuid_1 = require("uuid");
const nexus_1 = __importDefault(require("../controllers/nexus"));
const configuration = new openai_1.Configuration({ apiKey: process.env.CHATGPTKEY });
const openai = new openai_1.OpenAIApi(configuration);
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAMTOKEN; // Replace with your own bot token
const serverId = process.env.TELEGRAMCHATID;
const bot = new TelegramBot(token, { polling: true });
function similarity(A, B) {
    var dotproduct = 0;
    var mA = 0;
    var mB = 0;
    for (let i = 0; i < A.length; i++) { // here you missed the i++
        dotproduct += (A[i] * B[i]);
        mA += (A[i] * A[i]);
        mB += (B[i] * B[i]);
    }
    mA = Math.sqrt(mA);
    mB = Math.sqrt(mB);
    var similarity = (dotproduct) / ((mA) * (mB)); // here you needed extra brackets
    return similarity;
}
const openFile = (filename) => {
    let rawdata = fs.readFileSync(filename, "utf8");
    return rawdata;
};
const getEmbedding = async (content, engine = 'text-embedding-ada-002') => {
    const response = await openai.createEmbedding({ input: content, model: engine });
    const vector = response.data.data[0]['embedding'];
    return vector;
};
const loadConvo = async () => {
    let result = [];
    const d = await nexus_1.default.find({});
    d.map((data) => {
        result.push(data);
    });
    return result;
};
const fetchMemories = (vector, logs, count) => {
    let scores = [];
    for (let i of logs) {
        if (vector == i['vector'])
            continue;
        let score = similarity(i['vector'], vector);
        i['score'] = score;
        scores.push(i);
    }
    let ordered = scores.sort((a, b) => {
        if (a.score < b.score) {
            return -1;
        }
        if (a.score > b.score) {
            return 1;
        }
        return 0;
    });
    return ordered.slice(0, count);
};
const gpt4Completion = async (prompt) => {
    const completion = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        top_p: 1,
    });
    return completion.data.choices[0].message?.content;
};
const summarizeMemories = async (memories, recent, currentMessage) => {
    memories = memories.sort((a, b) => {
        if (a.time < b.time) {
            return -1;
        }
        if (a.time > b.time) {
            return 1;
        }
        return 0;
    });
    let block = '';
    let identifiers = [];
    let timestamps = [];
    memories.map((memory) => {
        block += memory['message'] + '\n\n';
        identifiers.push(memory['uuid']);
        timestamps.push(memory['time']);
    });
    block = block.trim();
    let prompt = openFile('./public/prompt_response.txt').replace('<<CONVERSATION>>', block).replace('<<RECENT>>', recent).replace("<<MESSAGE>>", currentMessage);
    let notes = await gpt4Completion(prompt);
    return notes || "I am sorry.Some error in communication.";
};
const getLastMessages = (conversation, limit) => {
    if (conversation.length == 1)
        return "";
    const short = conversation.reverse().slice(1, limit).reverse();
    let output = '';
    short.map((conv) => {
        output += `${conv['message']}\n\n`;
    });
    output = output.trim();
    let username = '';
    for (var i in userNames) {
        if (userNames[i] !== undefined) {
            username += userNames[i];
        }
    }
    output += "Online users are " + username;
    console.log(output, username);
    return output || "";
};
let users = {};
let userNames = {};
const initSocket = () => {
    bot.on('message', async (msg) => {
        let data = {
            from: msg.from.first_name,
            to: msg.chat.id,
            message: msg.text,
            first_name: msg.from.first_name,
            user_name: msg.from.username,
            date: msg.data
        };
        let vector = await getEmbedding(data.message);
        const timestring = new Date().toLocaleString();
        var uid = (0, uuid_1.v4)();
        const timestamp = new Date().getTime();
        let info = { 'speaker': data.from, 'time': timestamp, 'vector': vector, 'message': `[${data.user_name}]:${data.message.join(",")}`, 'uuid': uid, 'timestring': timestring };
        await nexus_1.default.create(info);
        let conversation = await loadConvo();
        let memories = fetchMemories(vector, conversation, 30);
        let recent = getLastMessages(conversation, 30);
        // console.log("Running BOT to", e.message);
        let notes = await summarizeMemories(memories, recent, `[${data.user_name}]:${data.message.join(",")}`);
        vector = await getEmbedding(notes);
        info = { 'speaker': 'ASSISTANT', 'time': timestamp, 'vector': vector, 'message': `${notes}`, 'uuid': (0, uuid_1.v4)(), 'timestring': timestring };
        await nexus_1.default.create(info);
        bot.sendMessage(serverId, notes);
    });
};
exports.initSocket = initSocket;
//# sourceMappingURL=index.js.map