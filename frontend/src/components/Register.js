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
    Grid,
    Avatar,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { register } from '../services/auth';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password2: '',
        first_name: '',
        last_name: '',
        location: {
            city: '',
            country: ''
        }
    });
    const [error, setError] = useState('');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('location.')) {
            const locationField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                location: {
                    ...prev.location,
                    [locationField]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            console.log('Submitting form data:', JSON.stringify(formData));
            await register(formData);
            navigate('/login');
        } catch (err) {
            console.error('Full error:', err);
            setError(err.response?.data?.error || 
                     (typeof err.response?.data === 'string' ? err.response.data : 
                     'Registration failed. Please check your information.'));
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
                            <PersonAddIcon sx={{ fontSize: 40 }} />
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
                            Create Account
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
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <PersonIcon sx={{ color: 'primary.main', mr: 1 }} />
                                        )
                                    }}
                                    sx={{ 
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <EmailIcon sx={{ color: 'primary.main', mr: 1 }} />
                                        )
                                    }}
                                    sx={{ 
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="First Name"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <PersonIcon sx={{ color: 'primary.main', mr: 1 }} />
                                        )
                                    }}
                                    sx={{ 
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Last Name"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <PersonIcon sx={{ color: 'primary.main', mr: 1 }} />
                                        )
                                    }}
                                    sx={{ 
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <LockIcon sx={{ color: 'primary.main', mr: 1 }} />
                                        )
                                    }}
                                    sx={{ 
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Confirm Password"
                                    name="password2"
                                    type="password"
                                    value={formData.password2}
                                    onChange={handleChange}
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <LockIcon sx={{ color: 'primary.main', mr: 1 }} />
                                        )
                                    }}
                                    sx={{ 
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="City"
                                    name="location.city"
                                    value={formData.location.city}
                                    onChange={handleChange}
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <LocationOnIcon sx={{ color: 'primary.main', mr: 1 }} />
                                        )
                                    }}
                                    sx={{ 
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Country"
                                    name="location.country"
                                    value={formData.location.country}
                                    onChange={handleChange}
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <LocationOnIcon sx={{ color: 'primary.main', mr: 1 }} />
                                        )
                                    }}
                                    sx={{ 
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2
                                        }
                                    }}
                                />
                            </Grid>
                        </Grid>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ 
                                mt: 4,
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
                            Register
                        </Button>

                        <Button
                            fullWidth
                            variant="text"
                            onClick={() => navigate('/login')}
                            sx={{ 
                                mt: 2,
                                color: 'primary.main',
                                '&:hover': {
                                    background: 'rgba(25,118,210,0.08)'
                                }
                            }}
                        >
                            Already have an account? Login
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Register;
