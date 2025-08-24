const socket = io("http://localhost:3978");

const section = document.getElementById('section');
const withFriend = document.getElementById("friend");

withFriend.onclick = () => {

  section.innerHTML = '';

  section.innerHTML = `
    <div class="inputsContainer">
      <ul></ul>

      <input id="inputEmail" type="text" placeholder="Enter your name">
    </div>
  `

  const input = document.getElementById('inputEmail');
  input.onkeyup = (e) => {

    if (e.key == 'Enter') {

      if (input.value !== '') {
        socket.emit('new user', { name: input.value, id: new Date().getTime() });

        getUsers();
        input.value = '';
      }
    };
  }

}

async function getUsers() {

  try {

    const res = await fetch('http://localhost:4999/users');

    const data = await res.json();

    renderUser(data);
  } catch (error) {
    console.error(error);
  }
}

function renderUser(data) {

  const ul = document.querySelector('ul');

  for (const user of data) {

    const li = document.createElement('li');
    li.textContent = user.name;

    ul.appendChild(li);
  } 
}