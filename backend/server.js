import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import fs from "fs/promises"

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

async function readFile(room, message) {
    const messages = JSON.parse(await fs.readFile('./data/db.json', "utf8"));

    messages[room].push({ message, room });

    await fs.writeFile('./data/db.json', JSON.stringify(messages, null, "\t"));
    
    return messages
}

io.on("connection", (socket) => {
    console.log("user connected:", socket.id);

    socket.on("join room", (roomName) => {
        socket.join(roomName);
    });

    socket.on("chat message", ({ room, message }) => {
        readFile(room, message);
        console.log(readFile(room, message));

        io.to(room).emit("chat message", { message, from: socket.id });
    });
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
