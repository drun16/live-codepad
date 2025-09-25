// server.js
const express = require('express');
const http = require('http'); 
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const url = require('url'); // Built-in Node.js moduke
// 1. Set up the Express app and HTTP server
const app = express();
const server = http.createServer(app); // Create an HTTP server from our Express app

// 2. Create the WebSocket Server (WSS)
// We attach it to our existing HTTP server.
// We need a server with `noServer: true` to handle the upgrade manually
const wss = new WebSocket.Server({ noServer: true });

const rooms = {}; // In-memory store for rooms: { roomId: { clients: Map(), content: '' } }

// The 'upgrade' event is fired before the WebSocket connection is established
server.on('upgrade', (request, socket,head) => {
  const pathname = url.parse(request.url).pathname;
  const roomId = pathname.slice(1); //Remove leading slash

  wss.handleUpgrade(request, socket, head, (ws) => {
    // Now that the WebSocket is established, emit a custom connection event
    // with the roomId we extracted.
    wss.emit('connection', ws, roomId);
  });
});

// const clients = new Map(); // Use a Map to store clients with metadata


function broadcast(roomId, message, sender_ws) {
  if(rooms[roomId]){
    const room = rooms[roomId];

    room.clients.forEach((metadata, client_ws) => {
        //check client is not sender and is ready to recieve messages
        if (client_ws !== sender_ws && client_ws.readyState === WebSocket.OPEN) {
            client_ws.send(JSON.stringify(message));
        }
    });
  }
}

// 3. Define what happens on a new connection
wss.on('connection', (ws, roomId) => {
  // If the room doesn't exist, create it.
  if (!rooms[roomId]) {
    rooms[roomId] = {
      clients: new Map(),
      content: `// Welcome to room: ${roomId}\n\n`,
    };
  }
  // This function runs every time a new client connects.
  // The 'ws' object represents the unique connection to that one client.
  const userId = uuidv4();
  const color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
  const metadata = { userId, color };
  rooms[roomId].clients.set(ws, metadata);

  console.log(`Client ${userId} joined room "${roomId}"`);

    // Send the current document content to the new client
  ws.send(JSON.stringify({ type: 'initialContent', content: rooms[roomId].content }));

  // 4. Handle incoming messages
  ws.on('message', (message) => {
    const parsedMessage = JSON.parse(message); //Always parse incoming JSON
    const senderMetadata = rooms[roomId].clients.get(ws);

    // 3. Addsender's info to the message before broadcasting
    const outgoingMessage = { ...parsedMessage, ...senderMetadata };

    // If it's a content change, update the room's stored content
    if (parsedMessage.type === 'contentChange') {
      rooms[roomId].content = parsedMessage.content;
    }

    broadcast(roomId,outgoingMessage, ws);
  });

  // 6. Define what happens when this client disconnects
  ws.on('close', () => {
    const disconnectedUser = rooms[roomId].clients.get(ws);
    console.log(`Client ${disconnectedUser.userId} left room "${roomId}"`);
    //Notify other clients thatthis user has left
    broadcast(roomId, { type: 'userDisconnect', userId: disconnectedUser.userId}, ws);
    rooms[roomId].clients.delete(ws);

    // Delete room if it's empty
    if (rooms[roomId].clients.size === 0) {
      delete rooms[roomId];
      console.log(`🗑️ Room "${roomId}" is now empty and has been closed.`);
    }
  });
});


// // Serve the static frontend files
app.use(express.static('public'));
// A catch-all route to serve index.html for any room URL
app.get('my',(req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Start the HTTP server
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server is up and running on http://localhost:${PORT}`);
});