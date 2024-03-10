const cors = require('cors');
const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Serve static files from the Angular app
app.use(express.static(path.join(__dirname, 'dist/my-angular-project')));

// All other routes should redirect to the Angular app's index.html
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist/my-angular-project/index.html'));
});

// Create the HTTP server
const server = http.createServer(app);

// Setup Socket.IO with CORS
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:4200",  // Specify the client origin if you want to restrict
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('join-room', (data) => {
        const { room, characterName, characterId } = data;
        socket.join(room);
        console.log(`Character ${characterName} (ID: ${characterId}) joined room: ${room}`);
        // Broadcast the character entering the room to others in the room
        socket.to(room).emit('character-enter', `{characterName:${characterName}} just arrived.`);
    });

    socket.on('leave-room', (data) => {
        const { room, characterName, characterId } = data;
        socket.leave(room);
        console.log(`Character ${characterName} (ID: ${characterId}) left room: ${room}`);
        // Broadcast the character leaving the room to others in the room
        socket.to(room).emit('character-leave', `{characterName:${characterName}} just left.`);
    });

    socket.on('item-picked-up', (data) => {
        const { room, message, characterId } = data;
        console.log(`Received item pickup from client: ${message}, Character ID: ${characterId}, Room: ${room}`);
        io.to(room).emit('item-picked-up', data);
    });

    socket.on('item-drop', (data) => {
        const { room, message, characterId } = data;
        console.log(`Reveived item drop from client: ${message}, Character ID: ${characterId}, Room: ${room}`);
        io.to(room).emit('item-drop', data);
    })

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
