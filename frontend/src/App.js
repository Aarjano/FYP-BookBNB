import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Container,
    Button,
    Box,
    Avatar,
    Menu,
    MenuItem,
    IconButton,
    useTheme,
    useMediaQuery
} from '@mui/material';
import BookList from './components/BookList';
import MyRentals from './components/MyRentals';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import MyBooks from './components/MyBooks';
import ChatList from './components/ChatList';
import ChatPage from './components/ChatPage';
import Profile from './components/Profile';
import Chatbot from './components/Chatbot';
import { getCurrentUser, logout } from './services/auth';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ChatIcon from '@mui/icons-material/Chat';
import BookDetail from './components/BookDetail';

// Custom event for login state changes
export const loginStateChanged = new Event('loginStateChanged');

const ProtectedRoute = ({ children }) => {
    const user = getCurrentUser();
    if (!user) {
        return <Navigate to="/login" />;
    }
    return children;
};

function App() {
    const [user, setUser] = useState(getCurrentUser());
    const [anchorEl, setAnchorEl] = useState(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Check for user on initial load
    useEffect(() => {
        const user = getCurrentUser();
        if (user) {
            setUser(user);
        }
    }, []);

    // Listen for login state changes
    useEffect(() => {
        const handleLoginStateChange = () => {
            const user = getCurrentUser();
            setUser(user);
        };

        window.addEventListener('loginStateChanged', handleLoginStateChange);

        // Cleanup
        return () => {
            window.removeEventListener('loginStateChanged', handleLoginStateChange);
        };
    }, []);

    const handleLogout = async () => {
        await logout();
        setUser(null);
        setAnchorEl(null);
        window.dispatchEvent(loginStateChanged); // Notify app of logout
    };

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <Router>
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <AppBar position="static" sx={{ 
                    background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}>
                    <Toolbar>
                        <IconButton
                            component={Link}
                            to="/"
                            color="inherit"
                            edge="start"
                            sx={{ mr: 2 }}
                        >
                            <MenuBookIcon />
                        </IconButton>
                        <Typography 
                            variant="h6" 
                            component={Link} 
                            to="/" 
                            sx={{ 
                                flexGrow: 1, 
                                textDecoration: 'none', 
                                color: 'inherit',
                                fontWeight: 'bold',
                                letterSpacing: '0.5px'
                            }}
                        >
BookBNB                        </Typography>
                        
                        {user ? (
                            <>
                                {!isMobile && (
                                    <>
                                        <Button 
                                            color="inherit" 
                                            component={Link} 
                                            to="/books"
                                            sx={{ mx: 1 }}
                                        >
                                            Browse Books
                                        </Button>
                                        <Button 
                                            color="inherit" 
                                            component={Link} 
                                            to="/my-books"
                                            sx={{ mx: 1 }}
                                        >
                                            My Books
                                        </Button>
                                        <Button 
                                            color="inherit" 
                                            component={Link} 
                                            to="/my-rentals"
                                            sx={{ mx: 1 }}
                                        >
                                            My Rentals
                                        </Button>
                                    </>
                                )}
                                <IconButton 
                                    color="inherit" 
                                    component={Link} 
                                    to="/chat"
                                    sx={{ mx: 1 }}
                                >
                                    <ChatIcon />
                                </IconButton>
                                <Box sx={{ ml: 2 }}>
                                    <Avatar
                                        onClick={handleMenuClick}
                                        sx={{ 
                                            cursor: 'pointer',
                                            background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
                                            boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                                        }}
                                    >
                                        {user.username[0].toUpperCase()}
                                    </Avatar>
                                    <Menu
                                        anchorEl={anchorEl}
                                        open={Boolean(anchorEl)}
                                        onClose={handleMenuClose}
                                        anchorOrigin={{
                                            vertical: 'bottom',
                                            horizontal: 'right',
                                        }}
                                        transformOrigin={{
                                            vertical: 'top',
                                            horizontal: 'right',
                                        }}
                                    >
                                        <MenuItem 
                                            component={Link} 
                                            to="/profile"
                                            onClick={handleMenuClose}
                                        >
                                            Profile
                                        </MenuItem>
                                        <MenuItem onClick={handleLogout}>
                                            Logout
                                        </MenuItem>
                                    </Menu>
                                </Box>
                            </>
                        ) : (
                            <>
                                <Button 
                                    color="inherit" 
                                    component={Link} 
                                    to="/chatbot"
                                    sx={{ mx: 1 }}
                                >
                                    Book Assistant
                                </Button>
                                <Button 
                                    color="inherit" 
                                    component={Link} 
                                    to="/login"
                                    sx={{ mx: 1 }}
                                >
                                    Login
                                </Button>
                                <Button 
                                    color="inherit" 
                                    component={Link} 
                                    to="/register"
                                    sx={{ mx: 1 }}
                                >
                                    Register
                                </Button>
                            </>
                        )}
                    </Toolbar>
                </AppBar>

                <Container sx={{ 
                    mt: 4, 
                    mb: 4,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login setUser={setUser} />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                            path="/books"
                            element={
                                <ProtectedRoute>
                                    <BookList />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/my-books"
                            element={
                                <ProtectedRoute>
                                    <MyBooks />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/my-rentals"
                            element={
                                <ProtectedRoute>
                                    <MyRentals />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            }
                        />
                        {user && (
                            <>
                                <Route
                                    path="/book/:id"
                                    element={
                                        <ProtectedRoute>
                                            <BookDetail currentUserId={user.id} />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/chat"
                                    element={
                                        <ProtectedRoute>
                                            <ChatList currentUserId={user.id} />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/chat/:chatId"
                                    element={
                                        <ProtectedRoute>
                                            <ChatPage currentUserId={user.id} />
                                        </ProtectedRoute>
                                    }
                                />
                            </>
                        )}
                        <Route path="/chatbot" element={<Chatbot />} />
                    </Routes>
                </Container>
            </Box>
        </Router>
    );
}

export default App;