require('dotenv').config();
import { Server, Socket } from 'socket.io';
import { Configuration, OpenAIApi } from 'openai';
import { v4 as uuidv4 } from 'uuid';
import Nexus from '../controllers/nexus';
const configuration = new Configuration({ apiKey: process.env.CHATGPTKEY });
const openai = new OpenAIApi(configuration);
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAMTOKEN; // Replace with your own bot token
// const serverId = process.env.TELEGRAMCHATID;
const bot = new TelegramBot(token, { polling: true });

function similarity(A: Array<number>, B: Array<number>) {
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
  var similarity = (dotproduct) / ((mA) * (mB)) // here you needed extra brackets
  return similarity;
}

const openFile = (filename: string) => {
  let rawdata: string = fs.readFileSync(filename, "utf8");
  return rawdata;
}

const getEmbedding = async (content: any, engine: string = 'text-embedding-ada-002') => {
  const response = await openai.createEmbedding({ input: content, model: engine })
  const vector = response.data.data[0]['embedding'];
  return vector
}

const loadConvo = async () => {
  let result: Array<any> = [];
  const d = await Nexus.find({});
  d.map((data: any) => {
    result.push(data)
  })
  return result;
}

const fetchMemories = (vector: Array<any>, logs: Array<any>, count: number) => {
  let scores: Array<any> = [];
  for (let i of logs) {
    if (vector == i['vector'])
      continue
    let score = similarity(i['vector'], vector);
    i['score'] = score
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
  })

  return ordered.slice(0, count)
}

const gpt4Completion = async (prompt: string) => {
  const completion = await openai.createChatCompletion({
    model: "gpt-4-1106-preview",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
    top_p: 1,
  })
  return completion.data.choices[0].message?.content;
}

const summarizeMemories = async (memories: Array<any>, recent: string, currentMessage: string) => {
  memories = memories.sort((a, b) => {
    if (a.time < b.time) {
      return -1;
    }
    if (a.time > b.time) {
      return 1;
    }
    return 0;
  })
  let block = '';
  let identifiers: Array<any> = [];
  let timestamps: Array<any> = [];
  memories.map((memory) => {
    block += `[${[memory['time']]}], ` + memory['message'] + '\n\n'
    identifiers.push(memory['uuid'])
    timestamps.push(memory['time'])
  })
  block = block.trim();
  let prompt = openFile('./public/prompt_response.txt').replace('<<CONVERSATION>>', block).replace('<<RECENT>>', recent).replace("<<MESSAGE>>", currentMessage);
  let notes = await gpt4Completion(prompt);
  return notes || "I am sorry.Some error in communication."
}

const getLastMessages = (conversation: Array<any>, limit: number) => {
  if (conversation.length == 1) return "";
  const short = conversation.reverse().slice(1, limit).reverse();
  let output: string = '';
  console.log(short, "short")
  short.map((conv) => {
    output += `[${conv['time']}], ${conv['message']}\n\n`;
  })
  output = output.trim();
  let username = '';
  for (var i in userNames) {
    if (userNames[i] !== undefined) {
      username += userNames[i];
    }
  }
  output += "Online users are " + username;
  console.log(output, username);
  return output || ""
}

let users = {} as { [key: string]: any }
let userNames = {} as { [key: string]: any }
let botUsername = '' as string;
let groupchatId = 0 as number;
let messageText = "" as string;

export const initSocket = () => {
  // Retrieve information about the bot itself
  bot.getMe().then((me: any) => {
    botUsername = me.username || '';
    console.log(`Bot username is: @${botUsername}`);
  }).catch((err: Error) => {
    console.error(err);
  });

  bot.on('message', async (msg: any) => {
    const chatId = msg.chat.id;
    const username = msg.from.username;
    console.log(msg);

    if (msg.text) {
      messageText = Array.isArray(msg.text) ? msg.text.join(",") : msg.text;
    } else if (msg.new_chat_member) {
      // Update the message text with information about the new member
      messageText += `${msg.from.first_name} added ${msg.new_chat_member.first_name} to our group ${msg.chat.title}`;
    } else if (msg.new_chat_title) {
      messageText += `${msg.from.first_name} renamed our group title to ${msg.new_chat_title}`;
    }
    let data = {
      from: msg.from.first_name,
      to: msg.chat.id,
      message: messageText,
      first_name: msg.from.first_name,
      user_name: msg.from.username,
      date: msg.data
    };

    let vector = await getEmbedding(data.message);
    const timestring = new Date().toLocaleString();
    var uid = uuidv4();
    const timestamp = new Date().getTime();
    let info = { 'speaker': data.from, 'time': timestamp, 'vector': vector, 'message': `[${data.user_name}]:${messageText}`, 'uuid': uid, 'timestring': timestring };
    await Nexus.create(info);

    // console.log(messageText)
    if (messageText.toLowerCase().includes(`@${botUsername.toLowerCase()}`)) {
      console.log(`Received a message that mentions the bot: ${messageText}`);
      let conversation = await loadConvo();
      // console.log(conversation, "conversation");
      let memories = fetchMemories(vector, conversation, 30);
      // console.log(memories, "memories");
      let recent = getLastMessages(conversation, 30);
      // console.log(recent, "recent");
      let notes = await summarizeMemories(memories, recent, `[${timestamp}], [${data.user_name}]:${messageText}`)
      // console.log(notes, "notes");
      vector = await getEmbedding(notes);
      info = { 'speaker': 'ASSISTANT', 'time': timestamp, 'vector': vector, 'message': `${notes}`, 'uuid': uuidv4(), 'timestring': timestring }
      await Nexus.create(info);
      bot.sendMessage(chatId, notes);
    } else {
      console.log(`Received a message without mentioning the bot: ${messageText}`);
    }
  });
};