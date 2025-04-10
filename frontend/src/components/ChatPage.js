import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getDatabase, ref, onValue, push } from "firebase/database";
import { Box, TextField, Button, Typography, Paper, List, ListItem, ListItemText } from "@mui/material";

const ChatPage = ({ currentUserId }) => {
    const { chatId } = useParams();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [chatData, setChatData] = useState({});
    const db = getDatabase();

    useEffect(() => {
        if (!chatId) return;

        const chatRef = ref(db, `/chats/${chatId}`);
        onValue(chatRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setChatData(data);
                setMessages(data.messages ? Object.values(data.messages) : []);
            }
        });
    }, [chatId]);

    const sendMessage = () => {
        if (!message.trim()) return;

        const messagesRef = ref(db, `/chats/${chatId}/messages`);
        push(messagesRef, {
            sender: currentUserId,
            text: message,
            timestamp: Date.now(),
        });

        setMessage("");
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 600, margin: 'auto', border: 1, borderRadius: 2, overflow: 'hidden', backgroundColor: '#f0f2f5' }}>
            <Paper elevation={3} sx={{ padding: 2, backgroundColor: '#007bff', color: 'white', textAlign: 'center' }}>
                <Typography variant="h6">
                    {chatData.bookTitle || "Chat"}
                    {" - User "}
                    {chatData.ownerId === currentUserId ? chatData.renterId || chatData.buyerId : chatData.ownerId}
                </Typography>
            </Paper>
            <List sx={{ flex: 1, overflowY: 'auto', padding: 2 }}>
                {messages.map((msg, index) => (
                    <ListItem key={index} sx={{ justifyContent: msg.sender === currentUserId ? 'flex-end' : 'flex-start' }}>
                        <Paper sx={{ padding: 1, borderRadius: 2, backgroundColor: msg.sender === currentUserId ? '#007bff' : '#e5e5e5', color: msg.sender === currentUserId ? 'white' : 'black' }}>
                            <ListItemText primary={msg.text} />
                        </Paper>
                    </ListItem>
                ))}
            </List>
            <Box sx={{ display: 'flex', padding: 2, borderTop: 1, backgroundColor: 'white' }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    sx={{ marginRight: 2 }}
                />
                <Button variant="contained" color="primary" onClick={sendMessage}>
                    Send
                </Button>
            </Box>
        </Box>
    );
};

export default ChatPage;
