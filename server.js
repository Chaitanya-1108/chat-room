const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mysql = require('mysql2/promise');

// Use Render's PORT environment variable
const PORT = process.env.PORT || 3005;

// Serve static files
app.use(express.static(__dirname + '/public'));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// MySQL Connection using environment variables
let db;
const connectDB = async () => {
    try {
        db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3307
        });
        console.log('✅ Connected to MySQL database!');
    } catch (err) {
        console.error('❌ Database connection failed:', err);
    }
};

connectDB();

// Socket.io
io.on('connection', async (socket) => {
    console.log('📱 New Device Connected');

    // Handle user login
    socket.on('setUser', async (username) => {
        try {
            let [rows] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
            let user_id;

            if (rows.length > 0) {
                user_id = rows[0].id;
            } else {
                const [result] = await db.execute('INSERT INTO users (username) VALUES (?)', [username]);
                user_id = result.insertId;
            }

            socket.user_id = user_id;
            socket.username = username;

            socket.emit('userSet', user_id);

            // Send last 20 messages
            const [messages] = await db.execute(
                'SELECT messages.id, messages.user_id, users.username, messages.message, messages.created_at ' +
                'FROM messages JOIN users ON messages.user_id = users.id ' +
                'ORDER BY messages.created_at DESC LIMIT 20'
            );
            socket.emit('previousMessages', messages.reverse());

        } catch (err) {
            console.error(err);
        }
    });

    // Handle new messages
    socket.on('message', async (data) => {
        const { user_id, username, message } = data;
        if (!message || !user_id) return;

        try {
            const [result] = await db.execute(
                'INSERT INTO messages (user_id, message) VALUES (?, ?)',
                [user_id, message]
            );

            const newMessage = {
                id: result.insertId,
                user_id,
                username,
                message,
                created_at: new Date()
            };

            io.emit('message', newMessage);
        } catch (err) {
            console.error(err);
        }
    });

    // Typing indicator
    socket.on('typing', () => {
        socket.broadcast.emit('typing', { username: socket.username });
    });

    socket.on('stopTyping', () => {
        socket.broadcast.emit('stopTyping', { username: socket.username });
    });

    socket.on('disconnect', () => {
        console.log('📴 Device Disconnected');
    });
});

// Start server
http.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
