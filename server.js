// server.js
const express = require('express');
const http = require('http'); 
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// 1. Set up the Express app and HTTP server
const app = express();
const server = http.createServer(app); // Create an HTTP server from our Express app

// 2. Create the WebSocket Server (WSS)
// We attach it to our existing HTTP server.
const wss = new WebSocket.Server({ server });

const clients = new Map(); // Use a Map to store clients with metadata
function broadcast(message, sender_ws) {
    wss.clients.forEach((client) => {
        //check client is not sender and is ready to recieve messages
        if (client !== sender_ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

// 3. Define what happens on a new connection
wss.on('connection', (ws) => {
  // This function runs every time a new client connects.
  // The 'ws' object represents the unique connection to that one client.
  const userId = uuidv4();
  const color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
  const metadata = { userId, color };
  clients.set(ws, metadata);

  console.log(`client ${userId} connected!`);

  // 4. Handle incoming messages
  ws.on('message', (message) => {
    const parsedMessage = JSON.parse(message); //Always parse incoming JSON
    const senderMetadata = clients.get(ws);

    // 3. Addsender's info to the message before broadcasting
    const outgoingMessage = { ...parsedMessage, ...senderMetadata };

    console.log(`Recieved:`, outgoingMessage);

    broadcast(outgoingMessage, ws);
  });

  // 6. Define what happens when this client disconnects
  ws.on('close', () => {
    const disconnectedUser = clients.get(ws);
    console.log(`Client ${disconnectedUser.userId} disconnected.`);
    //Notify other clients thatthis user has left
    broadcast({ type: 'userDisconnect', userId: disconnectedUser.userId}, ws);
    clients.delete(ws);
  });
});

// 7. Start the HTTP server
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server is up and running on http://localhost:${PORT}`);
});