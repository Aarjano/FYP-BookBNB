import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Grid, 
    Card, 
    CardContent, 
    CardMedia, 
    Typography, 
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Box,
    Container,
    useTheme,
    useMediaQuery,
    IconButton,
    Rating,
    Snackbar,
    Alert,
    InputAdornment
} from '@mui/material';
import { getAvailableBooks, requestRental, requestPurchase } from '../services/api';
import { database, ref, set, push, serverTimestamp } from "../services/firebase";
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SearchIcon from '@mui/icons-material/Search';

const BookList = () => {
    const [books, setBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBook, setSelectedBook] = useState(null);
    const [rentalDays, setRentalDays] = useState(7);
    const [openRentDialog, setOpenRentDialog] = useState(false);
    const [openPurchaseDialog, setOpenPurchaseDialog] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        loadBooks();
    }, []);

    useEffect(() => {
        const filtered = books.filter(book => 
            book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredBooks(filtered);
    }, [searchTerm, books]);

    const navigate = useNavigate();

    const handleBookClick = (book) => {
        navigate(`/book/${book.id}`);
    };

    const loadBooks = async () => {
        try {
            const response = await getAvailableBooks();
            setBooks(response.data);
            setFilteredBooks(response.data);
        } catch (error) {
            console.error('Error loading books:', error);
        }
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleRentClick = (book) => {
        setSelectedBook(book);
        setOpenRentDialog(true);
    };

    const handlePurchaseClick = (book) => {
        setSelectedBook(book);
        setOpenPurchaseDialog(true);
    };

    const handleCloseDialogs = () => {
        setOpenRentDialog(false);
        setOpenPurchaseDialog(false);
        setSelectedBook(null);
        setRentalDays(7);
    };

    const handleRent = async () => {
        if (!selectedBook || !selectedBook.id) return;
        try {
            const response = await requestRental(selectedBook.id, rentalDays);
            
            // Check if the response indicates success (200 or 201)
            if (response && (response.status === 200 || response.status === 201)) {
                console.log("200 or 201");
                
                const rentalData = response.data;
                
                const chatRef = push(ref(database, "chats"));

                await set(chatRef, {
                    renterId: rentalData.renter_id,
                    ownerId: rentalData.book.owner_id,
                    bookId: rentalData.book.id,
                    bookTitle: rentalData.book.title,
                    messages: [],
                    createdAt: serverTimestamp(),
                });

                setSuccessMessage('Book rental requested successfully!');
                handleCloseDialogs(); // Close dialog first
                loadBooks(); // Then refresh the book list
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error("Error renting book:", error);
            // Check if the error response indicates success (201)
            if (error.response && error.response.status === 201) {
                setSuccessMessage('Book rental requested successfully!');
                handleCloseDialogs();
                loadBooks();
            } else {
                setErrorMessage('Failed to request book rental. Please try again.');
            }
        }
    };

    const handlePurchase = async () => {
        if (!selectedBook || !selectedBook.id) return;
        try {
            const response = await requestPurchase(selectedBook.id);

            console.log(response.status);

            if (response.status == 201) {
                setSuccessMessage('Book purchase requested successfully!');
                handleCloseDialogs(); // Close dialog first
                loadBooks(); // Then refresh the book list
            } else {
                setErrorMessage('Failed to request book purchase. Please try again.');
            }
            
            // Check if the response indicates success (200 or 201)
            if (response.status === 201 || response.status == 201 || response.status == 200) {
                console.log("201");
                
                const purchaseData = response.data;

                const chatRef = push(ref(database, "chats"));

                await set(chatRef, {
                    buyerId: purchaseData.buyer_id,
                    ownerId: purchaseData.book.owner_id,
                    bookId: purchaseData.book.id,
                    bookTitle: purchaseData.book.title,
                    messages: [],
                    createdAt: serverTimestamp(),
                });

                setSuccessMessage('Book purchase requested successfully!');
                handleCloseDialogs(); // Close dialog first
                loadBooks(); // Then refresh the book list
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error("Error purchasing book:", error);
            // Check if the error response indicates success (201)
            if (error.response && error.response.status === 201) {
                setSuccessMessage('Book purchase requested successfully!');
                handleCloseDialogs();
                loadBooks();
            } else {
                setErrorMessage('Failed to request book purchase. Please try again.');
            }
        }
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 4,
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: 2
                }}>
                    <Typography 
                        variant="h4" 
                        gutterBottom 
                        sx={{ 
                            fontWeight: 'bold',
                            background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        Available Books
                    </Typography>
                    <TextField
                        placeholder="Search books..."
                        variant="outlined"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        sx={{ 
                            width: isMobile ? '100%' : '300px',
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                background: 'white',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="primary" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
                <Grid container spacing={4}>
                    {filteredBooks.map((book) => (
                        <Grid item xs={12} sm={6} md={4} key={book.id}>
                            <Card sx={{ 
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: 4,
                                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                                '&:hover': {
                                    transform: 'translateY(-8px)',
                                    boxShadow: '0 12px 40px rgba(0,0,0,0.12)'
                                }
                            }}>
                                {book.cover_image && (
                                    <CardMedia
                                        component="img"
                                        height="300"
                                        image={book.cover_image}
                                        alt={book.title}
                                        onClick={() => handleBookClick(book)}
                                        sx={{ 
                                            cursor: 'pointer',
                                            objectFit: 'cover'
                                        }}
                                    />
                                )}
                                <CardContent sx={{ 
                                    flexGrow: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    p: 3
                                }}>
                                    <Box onClick={() => handleBookClick(book)} sx={{ cursor: 'pointer', flexGrow: 1 }}>
                                        <Typography 
                                            variant="h6" 
                                            component="div"
                                            sx={{ 
                                                fontWeight: 'bold',
                                                mb: 1
                                            }}
                                        >
                                            {book.title}
                                        </Typography>
                                        <Typography 
                                            variant="subtitle1" 
                                            color="text.secondary"
                                            sx={{ mb: 1 }}
                                        >
                                            {book.author}
                                        </Typography>
                                        <Typography 
                                            variant="body2" 
                                            color="primary"
                                            sx={{ 
                                                mb: 2,
                                                fontWeight: 'medium',
                                                display: 'inline-block',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                background: 'rgba(25, 118, 210, 0.1)'
                                            }}
                                        >
                                            {book.category}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Rating value={book.rating || 0} readOnly precision={0.5} />
                                            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                                ({book.total_ratings || 0} reviews)
                                            </Typography>
                                        </Box>
                                        <Box sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between',
                                            mb: 2
                                        }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Available: {book.available_copies}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Rs.{book.price_per_day}/day
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        gap: 1,
                                        mt: 'auto'
                                    }}>
                                        <Button 
                                            variant="contained" 
                                            color="primary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRentClick(book);
                                            }}
                                            startIcon={<LocalLibraryIcon />}
                                            sx={{ 
                                                flex: 1,
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
                                            Rent
                                        </Button>
                                        <Button 
                                            variant="outlined" 
                                            color="secondary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePurchaseClick(book);
                                            }}
                                            startIcon={<ShoppingCartIcon />}
                                            sx={{ 
                                                flex: 1,
                                                py: 1.5,
                                                borderRadius: 2,
                                                borderWidth: 2,
                                                '&:hover': {
                                                    borderWidth: 2
                                                }
                                            }}
                                        >
                                            Buy
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* Success Snackbar */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={3000}
                onClose={() => setSuccessMessage('')}
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
                    {successMessage}
                </Alert>
            </Snackbar>

            {/* Error Snackbar */}
            <Snackbar
                open={!!errorMessage}
                autoHideDuration={3000}
                onClose={() => setErrorMessage('')}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert 
                    severity="error" 
                    sx={{ 
                        width: '100%',
                        borderRadius: 2
                    }}
                >
                    {errorMessage}
                </Alert>
            </Snackbar>

            {/* Rent Dialog */}
            <Dialog 
                open={openRentDialog} 
                onClose={handleCloseDialogs}
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        p: 2
                    }
                }}
            >
                <DialogTitle sx={{ 
                    fontWeight: 'bold',
                    textAlign: 'center',
                    color: 'primary.main'
                }}>
                    Rent Book
                </DialogTitle>
                <DialogContent>
                    <Typography 
                        variant="h6" 
                        gutterBottom
                        sx={{ 
                            textAlign: 'center',
                            mb: 3
                        }}
                    >
                        {selectedBook?.title}
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Number of Days"
                        type="number"
                        fullWidth
                        value={rentalDays}
                        onChange={(e) => setRentalDays(Number(e.target.value))}
                        inputProps={{ min: 1 }}
                        sx={{ mb: 3 }}
                    />
                    <Box sx={{ 
                        background: 'linear-gradient(45deg, #f5f7fa 30%, #ffffff 90%)',
                        p: 3,
                        borderRadius: 2,
                        textAlign: 'center'
                    }}>
                        <Typography variant="h6" color="primary.main">
                            Total Price: Rs.{selectedBook?.price_per_day * rentalDays}
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button 
                        onClick={handleCloseDialogs}
                        sx={{ 
                            mr: 2,
                            px: 3,
                            py: 1
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleRent} 
                        variant="contained" 
                        color="primary"
                        endIcon={<ArrowForwardIcon />}
                        sx={{ 
                            px: 4,
                            py: 1,
                            background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                            boxShadow: '0 4px 20px rgba(25,118,210,0.2)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #1565c0 30%, #1e88e5 90%)',
                                boxShadow: '0 6px 25px rgba(25,118,210,0.3)'
                            }
                        }}
                    >
                        Confirm Rental
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Purchase Dialog */}
            <Dialog 
                open={openPurchaseDialog} 
                onClose={handleCloseDialogs}
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        p: 2
                    }
                }}
            >
                <DialogTitle sx={{ 
                    fontWeight: 'bold',
                    textAlign: 'center',
                    color: 'secondary.main'
                }}>
                    Buy Book
                </DialogTitle>
                <DialogContent>
                    <Typography 
                        variant="h6" 
                        gutterBottom
                        sx={{ 
                            textAlign: 'center',
                            mb: 3
                        }}
                    >
                        {selectedBook?.title}
                    </Typography>
                    <Box sx={{ 
                        background: 'linear-gradient(45deg, #f5f7fa 30%, #ffffff 90%)',
                        p: 3,
                        borderRadius: 2,
                        textAlign: 'center'
                    }}>
                        <Typography variant="h6" color="secondary.main">
                            Purchase Price: Rs.{selectedBook?.price}
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button 
                        onClick={handleCloseDialogs}
                        sx={{ 
                            mr: 2,
                            px: 3,
                            py: 1
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handlePurchase} 
                        variant="contained" 
                        color="secondary"
                        endIcon={<ArrowForwardIcon />}
                        sx={{ 
                            px: 4,
                            py: 1,
                            background: 'linear-gradient(45deg, #9c27b0 30%, #ba68c8 90%)',
                            boxShadow: '0 4px 20px rgba(156,39,176,0.2)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #7b1fa2 30%, #9c27b0 90%)',
                                boxShadow: '0 6px 25px rgba(156,39,176,0.3)'
                            }
                        }}
                    >
                        Confirm Purchase
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default BookList;