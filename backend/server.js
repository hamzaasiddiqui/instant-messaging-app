const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map();

wss.on('connection', (ws) => {
  let username = null;

  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);

      if (parsedMessage.type === 'register') {
        username = parsedMessage.username;
        clients.set(username, ws);
        updateUsers();
      } else if (parsedMessage.type === 'general') {
        broadcastMessage(parsedMessage);
      } else if (parsedMessage.type === 'private') {
        const targetClient = clients.get(parsedMessage.target);
        if (targetClient) {
          targetClient.send(JSON.stringify(parsedMessage));
        }
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  });

  ws.on('close', () => {
    clients.delete(username);
    updateUsers();
  });

  function updateUsers() {
    const users = Array.from(clients.keys());
    broadcastMessage({ type: 'userList', users });
  }

  function broadcastMessage(message) {
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
        console.log(message)
      }
    });
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});