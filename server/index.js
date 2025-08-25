import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "db.json");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

async function readDB() {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === "ENOENT") {
      const initial = { users: [], matches: [] };
      await fs.writeFile(DB_PATH, JSON.stringify(initial, null, 2));
      return initial;
    }
    throw e;
  }
}
async function writeDB(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  socket.on("register", async (name) => {
    const db = await readDB();
    db.users.push({ id: socket.id, name });
    await writeDB(db);
    io.emit("userList", db.users);
  });

  socket.on("startMatch", async ({ opponentId }) => {
    const db = await readDB();
    const me = db.users.find((u) => u.id === socket.id);
    const opponent = db.users.find((u) => u.id === opponentId);
    if (!me || !opponent) return;

    const match = {
      id: Date.now().toString(),
      players: [me, opponent],
      board: Array(9).fill(null),
      turn: me.id,
      scores: { [me.id]: 0, [opponent.id]: 0 },
      round: 1,
    };

    db.matches.push(match);
    await writeDB(db);

    io.to(me.id).emit("matchStarted", match);
    io.to(opponent.id).emit("matchStarted", match);
  });

  socket.on("makeMove", async ({ matchId, index }) => {
    const db = await readDB();
    const match = db.matches.find((m) => m.id === matchId);
    if (!match) return;

    if (match.board[index]) return;
    if (socket.id !== match.turn) return;

    const p1 = match.players[0].id;
    const symbol = socket.id === p1 ? "X" : "O";

    match.board[index] = symbol;

    const wins = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    let winner = null;
    for (const [a, b, c] of wins) {
      if (match.board[a] && match.board[a] === match.board[b] && match.board[a] === match.board[c]) {
        winner = socket.id;
      }
    }

    if (winner) {
      match.scores[winner] += 1;
      if (match.scores[winner] >= 2) {

        io.to(match.players[0].id).emit("gameOver", { winner });
        io.to(match.players[1].id).emit("gameOver", { winner });
        db.matches = db.matches.filter((m) => m.id !== match.id);
      } else {

        match.round += 1;
        match.board = Array(9).fill(null);
      }
    } else if (!match.board.includes(null)) {

      match.round += 1;
      match.board = Array(9).fill(null);
    } else {
      match.turn = match.players.find((p) => p.id !== match.turn).id;
    }

    await writeDB(db);
    io.to(match.players[0].id).emit("matchUpdate", match);
    io.to(match.players[1].id).emit("matchUpdate", match);
  });

  socket.on("disconnect", async () => {
    const db = await readDB();
    db.users = db.users.filter((u) => u.id !== socket.id);
    await writeDB(db);
    io.emit("userList", db.users);
  });
});

server.listen(3000, () => console.log("Server running on 3000"));
