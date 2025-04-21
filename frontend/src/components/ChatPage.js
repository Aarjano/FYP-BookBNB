import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { getDatabase, ref, onValue, push } from "firebase/database";
import { 
    Box, 
    TextField, 
    Button, 
    Typography, 
    Paper, 
    List, 
    ListItem, 
    ListItemText,
    Avatar,
    IconButton,
    Divider,
    useTheme,
    useMediaQuery,
    Container,
    Tab,
    Tabs,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert
} from "@mui/material";
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PaymentIcon from '@mui/icons-material/Payment';
import { getUserById, getPaymentInfoByEmail } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

const ChatPage = ({ currentUserId }) => {
    const { chatId } = useParams();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [chatData, setChatData] = useState({});
    const [userEmails, setUserEmails] = useState({});
    const [paymentInfo, setPaymentInfo] = useState(null);
    const messagesEndRef = useRef(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const db = getDatabase();
    const [tabValue, setTabValue] = useState(0);
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false);

    useEffect(() => {
        if (!chatId) return;

        const chatRef = ref(db, `/chats/${chatId}`);
        onValue(chatRef, async (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setChatData(data);
                setMessages(data.messages ? Object.values(data.messages) : []);

                const otherUserId = data.ownerId === currentUserId ? (data.renterId || data.buyerId) : data.ownerId;
                try {
                    const [currentUserResponse, otherUserResponse] = await Promise.all([
                        getUserById(currentUserId),
                        getUserById(otherUserId)
                    ]);
                    
                    const emails = {
                        [currentUserId]: currentUserResponse.data.email || 'Unknown User',
                        [otherUserId]: otherUserResponse.data.email || 'Unknown User'
                    };
                    setUserEmails(emails);

                    // Fetch payment info for the seller using their email
                    if (data.ownerId !== currentUserId) {
                        try {
                            const sellerEmail = emails[data.ownerId];
                            if (sellerEmail && sellerEmail !== 'Unknown User') {
                                const paymentResponse = await getPaymentInfoByEmail(sellerEmail);
                                if (paymentResponse.data) {
                                    setPaymentInfo(paymentResponse.data);
                                }
                            }
                        } catch (error) {
                            console.error('Error fetching payment info:', error);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    setUserEmails({
                        [currentUserId]: 'Unknown User',
                        [otherUserId]: 'Unknown User'
                    });
                }
            }
        });
    }, [chatId, currentUserId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handlePayment = () => {
        setOpenPaymentDialog(true);
    };

    return (
        <Container maxWidth="sm" sx={{ height: '80vh', py: 2 }}>
            <Paper 
                elevation={3} 
                sx={{ 
                    height: '100%',
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: 2,
                    overflow: 'hidden'
                }}
            >
                {/* Chat Header */}
                <Paper elevation={0} sx={{ 
                    p: 1.5, 
                    display: 'flex', 
                    flexDirection: 'column',
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <IconButton 
                            color="inherit" 
                            sx={{ mr: 1 }}
                            onClick={() => window.history.back()}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" noWrap>
                                {chatData.bookTitle || "Chat"}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                {chatData.ownerId === currentUserId 
                                    ? userEmails[chatData.renterId || chatData.buyerId] 
                                    : userEmails[chatData.ownerId]}
                            </Typography>
                        </Box>
                    </Box>
                    <Tabs 
                        value={tabValue} 
                        onChange={handleTabChange}
                        textColor="inherit"
                        indicatorColor="secondary"
                    >
                        <Tab label="Chat" />
                        <Tab 
                            label="Payment" 
                            icon={<PaymentIcon />} 
                            onClick={handlePayment}
                        />
                    </Tabs>
                </Paper>

                {/* Messages List */}
                <List sx={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    p: 1.5,
                    bgcolor: '#f8f9fa',
                    '& > *:not(:last-child)': {
                        mb: 1
                    }
                }}>
                    {messages.map((msg, index) => (
                        <ListItem 
                            key={index} 
                            sx={{ 
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: msg.sender === currentUserId ? 'flex-end' : 'flex-start',
                                p: 0
                            }}
                        >
                            <Box sx={{ 
                                display: 'flex',
                                alignItems: 'flex-end',
                                maxWidth: '75%',
                                gap: 0.5
                            }}>
                                {msg.sender !== currentUserId && (
                                    <Avatar sx={{ width: 24, height: 24 }}>
                                        {userEmails[msg.sender]?.charAt(0).toUpperCase()}
                                    </Avatar>
                                )}
                                <Paper sx={{ 
                                    p: 1,
                                    borderRadius: 1.5,
                                    backgroundColor: msg.sender === currentUserId 
                                        ? theme.palette.primary.main 
                                        : 'white',
                                    color: msg.sender === currentUserId ? 'white' : 'text.primary',
                                }}>
                                    <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                                        {msg.text}
                                    </Typography>
                                    <Typography 
                                        variant="caption" 
                                        sx={{ 
                                            display: 'block',
                                            mt: 0.25,
                                            opacity: 0.7,
                                            fontSize: '0.65rem'
                                        }}
                                    >
                                        {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                                    </Typography>
                                </Paper>
                                {msg.sender === currentUserId && (
                                    <Avatar sx={{ width: 24, height: 24 }}>
                                        {userEmails[msg.sender]?.charAt(0).toUpperCase()}
                                    </Avatar>
                                )}
                            </Box>
                        </ListItem>
                    ))}
                    <div ref={messagesEndRef} />
                </List>

                {/* Message Input */}
                <Paper 
                    elevation={0} 
                    sx={{ 
                        p: 1, 
                        display: 'flex', 
                        gap: 0.5,
                        borderTop: 1,
                        borderColor: 'divider',
                        bgcolor: 'white'
                    }}
                >
                    <TextField
                        fullWidth
                        variant="outlined"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        multiline
                        maxRows={2}
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 1.5,
                                backgroundColor: '#f8f9fa'
                            }
                        }}
                    />
                    <IconButton 
                        size="small"
                        color="primary" 
                        onClick={sendMessage}
                        disabled={!message.trim()}
                        sx={{ 
                            backgroundColor: theme.palette.primary.main,
                            color: 'white',
                            '&:hover': {
                                backgroundColor: theme.palette.primary.dark
                            },
                            '&:disabled': {
                                backgroundColor: theme.palette.grey[300]
                            }
                        }}
                    >
                        <SendIcon fontSize="small" />
                    </IconButton>
                </Paper>
            </Paper>

            {/* Payment Dialog */}
            <Dialog 
                open={openPaymentDialog} 
                onClose={() => setOpenPaymentDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Typography variant="h6">
                        Seller's Payment Information
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    {paymentInfo ? (
                        <Box sx={{ p: 2 }}>
                            <Alert severity="info" sx={{ mb: 3 }}>
                                Please use the following payment details to complete your transaction
                            </Alert>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                                    Seller's Email:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>
                                    {userEmails[chatData.ownerId]}
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                                    Payment Method:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>
                                    {paymentInfo.method?.toUpperCase() || 'Not specified'}
                                </Typography>
                                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                                    Mobile Number:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                    {paymentInfo.mobile_number || 'Not specified'}
                                </Typography>
                            </Box>
                            <Alert severity="warning">
                                Please save these payment details and contact the seller to confirm your payment.
                            </Alert>
                        </Box>
                    ) : (
                        <Box sx={{ p: 2 }}>
                            <Alert severity="warning" sx={{ mb: 3 }}>
                                Payment information is not available for this seller.
                            </Alert>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                                    Seller's Email:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                    {userEmails[chatData.ownerId]}
                                </Typography>
                            </Box>
                            <Alert severity="info">
                                Please contact the seller directly to arrange payment.
                            </Alert>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPaymentDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default ChatPage;
