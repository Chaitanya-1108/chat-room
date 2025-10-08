const socket = io();

const textarea = document.getElementById('textarea');
const sendBtn = document.getElementById('sendBtn');
const messageArea = document.querySelector('.message__area');
const typingIndicator = document.getElementById('typingIndicator');
const themeToggle = document.getElementById('themeToggle');

let username;
let user_id;

// Ask for username
do {
    username = prompt('Enter your username:').trim();
} while (!username);

socket.emit('setUser', username);

socket.on('userSet', (id) => {
    user_id = id;
});

// Send message
function sendMessage() {
    const message = textarea.value.trim();
    if (!message || !user_id) return;

    socket.emit('message', { user_id, username, message });
    textarea.value = '';
    socket.emit('stopTyping');
}

// Button click
sendBtn.addEventListener('click', sendMessage);

// Enter key
textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Typing detection
let typingUsers = new Set();
let typingTimer;
const TYPING_TIMEOUT = 1000;

textarea.addEventListener('input', () => {
    socket.emit('typing');
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        socket.emit('stopTyping');
    }, TYPING_TIMEOUT);
});

// Receive typing events
socket.on('typing', (data) => {
    typingUsers.add(data.username);
    updateTypingIndicator();
});

socket.on('stopTyping', (data) => {
    if (data?.username) typingUsers.delete(data.username);
    updateTypingIndicator();
});

function updateTypingIndicator() {
    typingIndicator.textContent = typingUsers.size === 0 ? '' : `${[...typingUsers].join(', ')} is typing...`;
}

// Append message
function appendMessage(msg) {
    const div = document.createElement('div');
    div.classList.add(msg.user_id === user_id ? 'outgoing' : 'incoming', 'message');

    const time = new Date(msg.created_at);
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;

    div.innerHTML = `<h4>${msg.username}</h4><p>${msg.message}</p><span class="time">${formattedTime}</span>`;
    messageArea.appendChild(div);
    messageArea.scrollTop = messageArea.scrollHeight;
}

// Receive previous messages
socket.on('previousMessages', (messages) => {
    messages.forEach(msg => appendMessage(msg));
});

// Receive new messages
socket.on('message', (msg) => appendMessage(msg));

// Theme toggle
document.body.classList.add('light');
themeToggle.addEventListener('click', () => {
    if (document.body.classList.contains('light')) {
        document.body.classList.replace('light', 'dark');
        themeToggle.textContent = '☀️';
    } else {
        document.body.classList.replace('dark', 'light');
        themeToggle.textContent = '🌙';
    }
});
