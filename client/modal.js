const usernameInput = document.querySelector('input#username');
const createBtn = document.querySelector('button#create-btn');
const joinBtn = document.querySelector('button#join-btn');

const checkUsername = () => {
  if (!usernameInput.value) {
    usernameInput.style.borderColor = '#f44336';

    throw 'Invalid username';
  }

  usernameInput.style.borderColor = 'white';
}

createBtn.onclick = () => {
  checkUsername();

  const data = {
    flow: 'create',
    username: usernameInput.value,
  };

  start(data);
};

joinBtn.onclick = () => {
  checkUsername();

  const data = {
    flow: 'join',
    room: prompt('Please enter room code to join:'),
    username: usernameInput.value,
  };

  if (!data.room) {
    alert('Invalid room code!');

    return;
  }

  start(data);
};
