import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import fs from "fs/promises"
import cors from "cors";

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());

app.get('/messages', (_, res) => {
    res.send('salom')
});

app.get('/users', async (_, res) => {

    const users = JSON.parse(await fs.readFile("./data/db.json", "utf-8"));

    res.send(users);
});

app.listen(4999);

async function getUser(name, id) {
    const users = JSON.parse(await fs.readFile("./data/db.json", "utf-8"));

    users.push({ name, id });

    await fs.writeFile('./data/db.json', JSON.stringify(users, null, "\t"));
}


io.on("connection", async (socket) => {
    console.log("user connected:", socket.id);


    socket.on('new user', ({ name, id }) => {

        getUser(name, id);
    });
});

server.listen(3978, () => {
    console.log("Server running");
});
