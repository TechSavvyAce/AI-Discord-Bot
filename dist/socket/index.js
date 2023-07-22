"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testAnswer = exports.initSocket = void 0;
require('dotenv').config();
const openai_1 = require("openai");
const uuid_1 = require("uuid");
const fs = require('fs');
const controllers_1 = __importDefault(require("../controllers"));
const configuration = new openai_1.Configuration({ apiKey: "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" });
const openai = new openai_1.OpenAIApi(configuration);
const initSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('new connected:' + socket.id);
        socket.join('chatgpt');
        socket.on('disconnect', () => {
            console.log('socket disconnected ' + socket.id);
        });
        /* join room */
        socket.on('join room', (e) => {
            console.log('join room =>', e.user_id);
            e.group.map((item) => {
                socket.join(item);
                socket.join(e.user_id);
            });
        });
        /* receive message from room */
        socket.on('sent message to server', async (e) => {
            const result1 = await saveMsg(e);
            if (result1) {
                const data = {
                    from: result1.to,
                    to: result1.from,
                    message: result1.message,
                    first_name: e.first_name,
                    last_name: e.last_name,
                    email: e.email,
                    user_name: e.user_name,
                    avatar: e.avatar,
                    date: result1.date
                };
                socket.to(e.to).emit('group', data);
            }
            const result2 = await saveAnswer(result1, e.first_name);
            if (result2) {
                const data = {
                    from: result2.from,
                    to: result2.to,
                    message: result2.message,
                    first_name: e.first_name,
                    last_name: e.last_name,
                    email: e.email,
                    user_name: 'GPT',
                    avatar: e.avatar,
                    date: result2.date
                };
                socket.to(e.to).emit('group', data);
                socket.emit('chatgpt', data);
            }
        });
    });
};
exports.initSocket = initSocket;
const saveMsg = async (e) => {
    try {
        return await controllers_1.default.ChatHistory.create({
            from: e.from,
            to: e.to,
            message: e.message,
            date: new Date()
        });
    }
    catch (err) {
        console.log('chatHistory save error: ', err);
    }
};
const saveAnswer = async (e, name) => {
    try {
        const history = await controllers_1.default.ChatHistory.find({
            filter: [{}]
        });
        let prompt = [];
        history.map((item1) => {
            let mymgs = '';
            if (item1.from !== "chatgpt") {
                item1.message.map((item2) => {
                    mymgs += item2 + ',';
                });
                prompt.push({
                    role: "user",
                    content: mymgs
                });
            }
            else {
                item1.message.map((item2) => {
                    mymgs += item2 + ',';
                });
                prompt.push({
                    role: "assistant",
                    content: mymgs
                });
            }
        });
        const completion = await openai.createChatCompletion({
            model: "gpt-4",
            messages: prompt,
            temperature: 0,
            top_p: 1,
        });
        return await controllers_1.default.ChatHistory.create({
            from: e.to,
            to: e.from,
            message: completion.data.choices[0].message?.content,
            date: new Date()
        });
    }
    catch (err) {
        console.log('chatGPT error: ', err.message);
    }
};
const getEmbedding = async (content, engine = 'text-embedding-ada-002') => {
    const response = await openai.createEmbedding({ input: content, model: engine });
    const vector = response.data.data[0]['embedding'];
    return vector;
};
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
const saveFile = (filename, content) => {
    let data = JSON.stringify(content);
    fs.writeFileSync(filename, data);
};
const saveJosn = (filename, info) => {
    let data = JSON.stringify(info);
    fs.writeFileSync(filename, data);
};
const loadJosn = (filename) => {
    let rawdata = fs.readFileSync(filename);
    let info = JSON.parse(rawdata);
    return info;
};
const loadConvo = () => {
    let result = [];
    const files = fs.readdirSync('./public/nexus');
    files.map((file) => {
        const data = loadJosn(`./public/nexus/${file}`);
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
const gpt3Completion = async (prompt) => {
    const completion = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hello world" }],
        temperature: 0,
        top_p: 1,
    });
    return completion.data.choices[0].message?.content;
};
const summarizeMemories = async (memories) => {
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
    let prompt = openFile('./public/prompt_notes.txt').replace('<<INPUT>>', block);
    let notes = await gpt3Completion(prompt);
    let vector = await getEmbedding(block);
    const timestamp = new Date().getTime();
    const info = { 'notes': notes, 'uuids': identifiers, 'times': timestamps, 'uuid': (0, uuid_1.v4)(), 'vector': vector, 'time': timestamp };
    const filename = `./notes_${timestamp}.json`;
    saveJosn(`./public/internal_notes/${filename}`, info);
    return notes || "";
};
const getLastMessages = (conversation, limit) => {
    const short = conversation.slice(0, limit);
    let output = '';
    short.map((conv) => {
        output += `${conv['message']}\n\n`;
    });
    output = output.trim();
    return output || "";
};
const testAnswer = async () => {
    console.log("Start Tundu");
    const a = "My name is Liguo,what is my name";
    let vector = await getEmbedding(a);
    const timestring = new Date().toLocaleString();
    var uid = (0, uuid_1.v4)();
    const timestamp = new Date().getTime();
    let message = `USER: ${timestring} - ${a}`;
    let info = { 'speaker': 'USER', 'time': timestamp, 'vector': vector, 'message': message, 'uuid': uid, 'timestring': timestring };
    let filename = `log_${timestamp}_USER.json`;
    saveJosn(`./public/nexus/${filename}`, info);
    let conversation = await loadConvo();
    let memories = fetchMemories(vector, conversation, 10);
    let notes = await summarizeMemories(memories);
    let recent = getLastMessages(conversation, 4);
    let prompt = openFile('./public/prompt_response.txt').replace('<<NOTES>>', notes).replace('<<CONVERSATION>>', recent);
    let output = await gpt3Completion(prompt);
    vector = await getEmbedding(output);
    message = `RAVEN: ${timestring} - ${output}`;
    info = { 'speaker': 'RAVEN', 'time': timestamp, 'vector': vector, 'message': message, 'uuid': (0, uuid_1.v4)(), 'timestring': timestring };
    filename = `log_${timestamp}_RAVEN.json`;
    saveJosn(`./public/nexus/${filename}`, info);
    console.log(`---------------------------\n\nRAVEN: ${output}`);
    // const response = await openai.createEmbedding({model:"text-embedding-ada-002",input:message});
    // const vector = response.data.data[0]['embedding'];
    // console.log(vector)
    // const completion = await openai.createChatCompletion({
    //   model: "gpt-4",
    //   messages: [{role:"user",content:"My name is tundu"}],
    //   temperature: 0,
    //   top_p: 1,
    // })
    // console.log("out put is ",completion.data.choices[0].message?.content,)
};
exports.testAnswer = testAnswer;
//# sourceMappingURL=index.js.map