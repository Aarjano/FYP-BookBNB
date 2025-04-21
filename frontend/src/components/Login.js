import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    Snackbar,
    Avatar,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { login } from '../services/auth';
import { loginStateChanged } from '../App';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import LoginIcon from '@mui/icons-material/Login';

const Login = ({ setUser }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(formData);
            setSuccess(true);
            window.dispatchEvent(loginStateChanged);
            setTimeout(() => {
                navigate('/');
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ 
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                py: 4
            }}>
                <Paper 
                    elevation={3} 
                    sx={{ 
                        p: 4,
                        width: '100%',
                        borderRadius: 4,
                        background: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.08)'
                    }}
                >
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        mb: 4
                    }}>
                        <Avatar sx={{ 
                            width: 80, 
                            height: 80,
                            mb: 2,
                            background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)'
                        }}>
                            <LoginIcon sx={{ fontSize: 40 }} />
                        </Avatar>
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                fontWeight: 'bold',
                                background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}
                        >
                            Welcome Back
                        </Typography>
                    </Box>

                    {error && (
                        <Alert 
                            severity="error" 
                            sx={{ 
                                mb: 3,
                                borderRadius: 2
                            }}
                        >
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            margin="normal"
                            required
                            InputProps={{
                                startAdornment: (
                                    <PersonIcon sx={{ color: 'primary.main', mr: 1 }} />
                                )
                            }}
                            sx={{ 
                                mb: 3,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                }
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            margin="normal"
                            required
                            InputProps={{
                                startAdornment: (
                                    <LockIcon sx={{ color: 'primary.main', mr: 1 }} />
                                )
                            }}
                            sx={{ 
                                mb: 3,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                }
                            }}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ 
                                mt: 3,
                                py: 1.5,
                                borderRadius: 2,
                                background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                                boxShadow: '0 4px 20px rgba(25,118,210,0.2)',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #1565c0 30%, #1e88e5 90%)',
                                    boxShadow: '0 6px 25px rgba(25,118,210,0.3)'
                                }
                            }}
                        >
                            Sign In
                        </Button>
                        <Button
                            fullWidth
                            variant="text"
                            onClick={() => navigate('/register')}
                            sx={{ 
                                mt: 2,
                                color: 'primary.main',
                                '&:hover': {
                                    background: 'rgba(25,118,210,0.08)'
                                }
                            }}
                        >
                            Don't have an account? Register
                        </Button>
                    </Box>
                </Paper>
            </Box>

            <Snackbar
                open={success}
                autoHideDuration={1500}
                onClose={() => setSuccess(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert 
                    severity="success" 
                    sx={{ 
                        width: '100%',
                        borderRadius: 2,
                        background: 'linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)',
                        color: 'white'
                    }}
                >
                    Login successful! Redirecting...
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default Login; 