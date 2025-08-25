const socket = io("http://localhost:3000");

let myId = null;
let currentMatch = null;

const friendBtn = document.getElementById("friend");
const aiBtn = document.getElementById("ai");

friendBtn.addEventListener("click", () => {
  const name = prompt("Enter your name:");
  if (!name) return;
  socket.emit("register", name);

  const listDiv = document.createElement("div");
  listDiv.id = "user-list";
  document.body.appendChild(listDiv);

  socket.on("userList", (users) => {
    listDiv.innerHTML = "<h3>Online Users:</h3>";
    users
      .filter((u) => u.id !== socket.id)
      .forEach((u) => {
        const btn = document.createElement("button");
        btn.textContent = u.name;
        btn.onclick = () => {
          socket.emit("startMatch", { opponentId: u.id });
        };
        listDiv.appendChild(btn);
      });
  });
});

socket.on("matchStarted", (match) => {
  currentMatch = match;
  renderBoard();
});

socket.on("matchUpdate", (match) => {
  currentMatch = match;
  renderBoard();
});

socket.on("gameOver", ({ winner }) => {
  alert(winner === socket.id ? "You win the match!" : "You lost the match!");
  currentMatch = null;
  document.getElementById("board").remove();
});

function renderBoard() {
  let boardDiv = document.getElementById("board");
  if (!boardDiv) {
    boardDiv = document.createElement("div");
    boardDiv.id = "board";
    boardDiv.style.display = "grid";
    boardDiv.style.gridTemplateColumns = "repeat(3, 100px)";
    boardDiv.style.gridTemplateRows = "repeat(3, 100px)";
    boardDiv.style.gap = "5px";
    document.body.appendChild(boardDiv);
  }
  boardDiv.innerHTML = "";
  currentMatch.board.forEach((cell, idx) => {
    const c = document.createElement("div");
    c.style.width = "100px";
    c.style.height = "100px";
    c.style.display = "flex";
    c.style.alignItems = "center";
    c.style.justifyContent = "center";
    c.style.border = "1px solid #333";
    c.style.fontSize = "48px";
    c.textContent = cell || "";
    c.onclick = () => {
      if (!cell) socket.emit("makeMove", { matchId: currentMatch.id, index: idx });
    };
    boardDiv.appendChild(c);
  });
}
