const ul = document.querySelector("ul");
const input = document.getElementById("input");
const form = document.querySelector("form");

const socket = io("http://localhost:3000");

let currentRoom = "group";

document.getElementById("family").onclick = () => {
  socket.emit("join room", "family");
  currentRoom = "family";
};

document.getElementById("work").onclick = () => {
  socket.emit("join room", "work");
  currentRoom = "work";
};

document.getElementById("group").onclick = () => {
  socket.emit("join room", "group");
  currentRoom = "group";
};

socket.on("chat message", ({ message, from }) => {
  const li = document.createElement("li");
  li.textContent = `${from}: ${message}`;
  ul.appendChild(li);
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit("chat message", { room: currentRoom, message: input.value });
    input.value = "";
  }
});
