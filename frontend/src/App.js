import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, IconButton, Paper, TextField, Typography } from '@mui/material';
import { w3cwebsocket as WebSocketClient } from 'websocket';
import SendIcon from '@mui/icons-material/Send';

const App = () => {
  const [ws, setWs] = useState(null);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [userList, setUserList] = useState([]);
  const [targetUser, setTargetUser] = useState('everyone');
  const [registered, setRegistered] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (registered && !ws) {
      const newWs = new WebSocketClient('ws://localhost:8080');
      newWs.onopen = () => {
        newWs.send(JSON.stringify({ type: 'register', username }));
      };
      newWs.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'userList') {
          setUserList(data.users.filter(u => u !== username));
        } else {
          setChatLog(prevChatLog => [...prevChatLog, data]);
        }
      };
      setWs(newWs);
      return () => newWs.close();
    }
  }, [registered, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  const handleRegistration = () => {
    if (!username.trim()) {
      alert('Please enter a valid username');
      return;
    }
    setRegistered(true);
  };

  const sendMessage = () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }
    const messageFormat = `${username}->${targetUser === 'everyone' ? 'everyone' : targetUser}: ${message}`;
    const newMessage = {
      username,
      text: messageFormat,
      type: targetUser === 'everyone' ? 'general' : 'private',
      target: targetUser
    };
    ws.send(JSON.stringify(newMessage));
    // Append the message to the sender's chat log only if it is a private message
    if (targetUser !== 'everyone') {
      setChatLog(prevChatLog => [...prevChatLog, newMessage]);
    }
    setMessage('');
  };

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', bgcolor: 'white' }}>
      {!registered ? (
        <Box sx={{ p: 2 }}>
          <Typography variant="h5" sx={{ color: 'white' }}>Register</Typography>
          <TextField fullWidth variant="outlined" label="Username" value={username} onChange={e => setUsername(e.target.value)} />
          <Button onClick={handleRegistration} variant="contained" sx={{ mt: 2 }}>Register</Button>
        </Box>
      ) : (
        <Box sx={{ width: '100%', maxWidth: 600 }}>
          <Paper sx={{ maxHeight: 400, overflow: 'auto', mb: 2, bgcolor: 'white' }}>
            {chatLog.map((msg, index) => (
              <Box key={index} sx={{ p: 1, display: 'flex', alignItems: 'center', bgcolor: msg.username === username ? '#2196f3' : '#616161', color: 'white', borderRadius: 1, m: 1 }}>
                <Typography variant="body1">{msg.text}</Typography>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Paper>
          <TextField fullWidth variant="outlined" label="Message" value={message} onChange={e => setMessage(e.target.value)} />
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
            <Button onClick={() => setTargetUser('everyone')}
                    variant="contained"
                    sx={{ mr: 1, bgcolor: targetUser === 'everyone' ? '#2196f3' : '#333', color: targetUser === 'everyone' ? 'white' : '#aaa' }}>
              Everyone
            </Button>
            {userList.map(user => (
              <Button key={user}
                      onClick={() => setTargetUser(user)}
                      variant="contained"
                      sx={{ mr: 1, bgcolor: targetUser === user ? '#2196f3' : '#333', color: targetUser === user ? 'white' : '#aaa' }}>
                {user}
              </Button>
            ))}
            <IconButton onClick={sendMessage} sx={{ ml: 'auto', bgcolor: '#2196f3', '&:hover': { bgcolor: '#1565c0' } }}>
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default App;