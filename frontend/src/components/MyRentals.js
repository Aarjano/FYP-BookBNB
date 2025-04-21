import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Button,
    Box,
    Chip,
    Divider,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { getMyRentals, getActiveRentals, returnBook } from '../services/api';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import HistoryIcon from '@mui/icons-material/History';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BookIcon from '@mui/icons-material/Book';

const MyRentals = () => {
    const [activeRentals, setActiveRentals] = useState([]);
    const [pastRentals, setPastRentals] = useState([]);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        loadActiveRentals();
        loadPastRentals();
    }, []);

    const loadActiveRentals = async () => {
        try {
            const response = await getActiveRentals();
            setActiveRentals(response.data);
        } catch (error) {
            console.error('Error loading active rentals:', error);
        }
    };

    const loadPastRentals = async () => {
        try {
            const response = await getMyRentals();
            setPastRentals(response.data);
        } catch (error) {
            console.error('Error loading past rentals:', error);
        }
    };

    const handleReturn = async (rentalId) => {
        try {
            await returnBook(rentalId);
            loadActiveRentals();
        } catch (error) {
            console.error('Error returning book:', error);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const RentalCard = ({ rental, isActive }) => (
        <Card sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 4,
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.12)'
            }
        }}>
            {rental.book.cover_image ? (
                <CardMedia
                    component="img"
                    height="200"
                    image={rental.book.cover_image}
                    alt={rental.book.title}
                    sx={{ objectFit: 'cover' }}
                />
            ) : (
                <Box sx={{ 
                    height: 200, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: 'linear-gradient(45deg, #f5f7fa 30%, #ffffff 90%)'
                }}>
                    <BookIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                </Box>
            )}
            <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {rental.book.title}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
                    by {rental.book.author}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                    <Chip 
                        icon={<CalendarTodayIcon />}
                        label={`Rented: ${formatDate(isActive ? rental.rental_date : rental.rental_start_date)}`}
                        color="primary"
                        variant="outlined"
                        sx={{ mr: 1 }}
                    />
                    <Chip 
                        icon={<CalendarTodayIcon />}
                        label={`Return: ${formatDate(isActive ? rental.return_date : rental.rental_end_date)}`}
                        color="secondary"
                        variant="outlined"
                    />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Chip 
                        icon={<CheckCircleIcon />}
                        label={`Rs.${rental.total_price}`}
                        color="success"
                        sx={{ 
                            background: 'linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)',
                            color: 'white'
                        }}
                    />
                    <Chip 
                        label={rental.status}
                        color={rental.status === 'ACTIVE' ? 'primary' : 'default'}
                        variant="outlined"
                    />
                </Box>

                {isActive && rental.status === 'ACTIVE' && (
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={() => handleReturn(rental.id)}
                        sx={{ 
                            mt: 2,
                            py: 1.5,
                            background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                            boxShadow: '0 4px 20px rgba(25,118,210,0.2)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #1565c0 30%, #1e88e5 90%)',
                                boxShadow: '0 6px 25px rgba(25,118,210,0.3)'
                            }
                        }}
                    >
                        Return Book
                    </Button>
                )}
            </CardContent>
        </Card>
    );

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                {/* Active Rentals Section */}
                <Box sx={{ mb: 6 }}>
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 4,
                        gap: 2
                    }}>
                        <LocalLibraryIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                fontWeight: 'bold',
                                background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}
                        >
                            Active Rentals
                        </Typography>
                    </Box>
                    <Grid container spacing={4}>
                        {activeRentals.map((rental) => (
                            <Grid item xs={12} sm={6} md={4} key={`${rental.id || rental.book_id}-${rental.rental_date}`}>
                                <RentalCard rental={rental} isActive={true} />
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                <Divider sx={{ my: 6 }} />

                {/* Past Rentals Section */}
                <Box>
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 4,
                        gap: 2
                    }}>
                        <HistoryIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                fontWeight: 'bold',
                                background: 'linear-gradient(45deg, #9c27b0 30%, #ba68c8 90%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}
                        >
                            Rental History
                        </Typography>
                    </Box>
                    <Grid container spacing={4}>
                        {pastRentals.map((rental) => (
                            <Grid item xs={12} sm={6} md={4} key={`${rental.id || rental.book_id}-${rental.rental_date}`}>
                                <RentalCard rental={rental} isActive={false} />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Box>
        </Container>
    );
};

export default MyRentals;