import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import { Link } from "react-router-dom";
import { Container, Typography, Paper, List, ListItem, ListItemText, Box, Avatar, ListItemAvatar, Divider } from "@mui/material";
import ChatIcon from '@mui/icons-material/Chat';
import { getUserById } from '../services/api';

const ChatList = ({ currentUserId }) => {
    const [chats, setChats] = useState([]);
    const [userEmails, setUserEmails] = useState({});
    const userId = currentUserId;

    useEffect(() => {
        const db = getDatabase();
        const chatsRef = ref(db, "/chats");

        onValue(chatsRef, async (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const chatList = Object.entries(data)
                    .map(([id, chat]) => ({ id, ...chat }))
                    .filter(chat => chat.renterId === userId || chat.ownerId === userId || chat.buyerId === userId)
                    .sort((a, b) => b.createdAt - a.createdAt);

                // Fetch user emails for all unique user IDs
                const uniqueUserIds = new Set();
                chatList.forEach(chat => {
                    if (chat.ownerId) uniqueUserIds.add(chat.ownerId);
                    if (chat.renterId) uniqueUserIds.add(chat.renterId);
                    if (chat.buyerId) uniqueUserIds.add(chat.buyerId);
                });

                const emailPromises = Array.from(uniqueUserIds).map(async (id) => {
                    try {
                        const response = await getUserById(id);
                        return { id, email: response.data.email };
                    } catch (error) {
                        console.error('Error fetching user email:', error);
                        return { id, email: 'Unknown User' };
                    }
                });

                const userEmailsData = await Promise.all(emailPromises);
                const emailMap = userEmailsData.reduce((acc, { id, email }) => {
                    acc[id] = email;
                    return acc;
                }, {});

                setUserEmails(emailMap);
                setChats(chatList);
            }
        });
    }, [userId]);

    return (
        <Container maxWidth="md">
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h2" gutterBottom>
                    Your Chats
                </Typography>
                {chats.length === 0 ? (
                    <Typography variant="body1" color="textSecondary">
                        No chats yet.
                    </Typography>
                ) : (
                    <Paper elevation={3}>
                        <List>
                            {chats.map((chat, index) => (
                                <React.Fragment key={chat.id}>
                                    <Link 
                                        to={`/chat/${chat.id}`} 
                                        style={{ textDecoration: 'none', color: 'inherit' }}
                                    >
                                        <ListItem button>
                                            <ListItemAvatar>
                                                <Avatar>
                                                    <ChatIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <>
                                                        {chat.bookTitle ? `${chat.bookTitle} - ` : ""}
                                                        {chat.ownerId === userId 
                                                            ? userEmails[chat.renterId || chat.buyerId] 
                                                            : userEmails[chat.ownerId]}
                                                    </>
                                                }
                                                secondary={new Date(chat.createdAt).toLocaleString()}
                                            />
                                        </ListItem>
                                    </Link>
                                    {index < chats.length - 1 && <Divider variant="inset" component="li" />}
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                )}
            </Box>
        </Container>
    );
};

export default ChatList;