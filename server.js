// server.js
const express = require('express');
const http = require('http'); 
const WebSocket = require('ws');

// 1. Set up the Express app and HTTP server
const app = express();
const server = http.createServer(app); // Create an HTTP server from our Express app

// 2. Create the WebSocket Server (WSS)
// We attach it to our existing HTTP server.
const wss = new WebSocket.Server({ server });

// 3. Define what happens on a new connection
wss.on('connection', (ws) => {
  // This function runs every time a new client connects.
  // The 'ws' object represents the unique connection to that one client.
  console.log('A new client has connected!');

  // 4. Define what happens when a message is received from this client
  ws.on('message', (message) => {
    // The 'message' is received as a Buffer, so we convert it to a string.
    const messageStr = message.toString();
    console.log(`Received message: "${messageStr}"`);

    // 5. Echo the message back to the sender
    ws.send(`You sent: ${messageStr}`);
    console.log(`Echoed message back to the client.`);
  });

  // 6. Define what happens when this client disconnects
  ws.on('close', () => {
    console.log('A client has disconnected.');
  });
});

// 7. Start the HTTP server
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server is up and running on http://localhost:${PORT}`);
});