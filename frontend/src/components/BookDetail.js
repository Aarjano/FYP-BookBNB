import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getBookDetails, requestRental, requestPurchase, getBookReviews, postReview } from '../services/api';
import {
    Typography, 
    Card, 
    CardMedia, 
    CardContent, 
    CircularProgress, 
    Button, 
    TextField, 
    Dialog,
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    List, 
    ListItem, 
    ListItemText, 
    Rating,
    Box,
    Container,
    Grid,
    Paper,
    Avatar,
    Divider,
    useTheme,
    useMediaQuery,
    Snackbar,
    Alert
} from '@mui/material';
import { database, ref, set, push, serverTimestamp } from "../services/firebase";
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

const BookDetail = ({ currentUserId }) => {
    const { id } = useParams();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rentalDays, setRentalDays] = useState(7);
    const [open, setOpen] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [reviewText, setReviewText] = useState("");
    const [rating, setRating] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const userId = currentUserId;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        const fetchBook = async () => {
            try {
                const response = await getBookDetails(id);
                setBook(response.data);
            } catch (error) {
                console.error('Error fetching book:', error);
                setErrorMessage('Error fetching book details');
            } finally {
                setLoading(false);
            }
        };

        const fetchReviews = async () => {
            try {
                const response = await getBookReviews(id);
                setReviews(response.data);
            } catch (error) {
                console.error('Error fetching reviews:', error);
                setErrorMessage('Error fetching reviews');
            }
        };

        fetchBook();
        fetchReviews();
    }, [id]);

    const handleRentClick = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setRentalDays(7);
    };

    const handleRent = async () => {
        try {
            const response = await requestRental(book.id, rentalDays);
            const rentalData = response.data;
            const renterId = rentalData.renter_id;
            const ownerId = rentalData.book.owner_id;

            if (!renterId || !ownerId) {
                setErrorMessage("Error: Missing renter or owner ID!");
                return;
            }

            const chatRef = push(ref(database, "chats"));
            await set(chatRef, {
                renterId,
                ownerId,
                bookId: rentalData.book.id,
                bookTitle: rentalData.book.title,
                messages: [],
                createdAt: serverTimestamp(),
            });
            console.log("Chat created successfully!", chatRef.key);
            handleClose();
        } catch (error) {
            console.error("Error renting book:", error.response?.data || error.message);
            setErrorMessage(error.response?.data?.message || "Error renting book. Please try again.");
        }
    };

    const handleBuy = async () => {
        try {
            const response = await requestPurchase(book.id);
            const purchaseData = response.data;
            const buyerId = purchaseData.buyer_id;
            const sellerId = purchaseData.book.owner_id;

            if (!buyerId || !sellerId) {
                setErrorMessage("Error: Missing buyer or seller ID!");
                return;
            }

            const chatRef = push(ref(database, "chats"));
            await set(chatRef, {
                buyerId,
                sellerId,
                bookId: purchaseData.book.id,
                bookTitle: purchaseData.book.title,
                messages: [],
                createdAt: serverTimestamp(),
            });
            console.log("Chat created successfully!", chatRef.key);
        } catch (error) {
            console.error("Error purchasing book:", error.response?.data || error.message);
            setErrorMessage(error.response?.data?.message || "Error purchasing book. Please try again.");
        }
    };

    const handlePostReview = async () => {
        if (!reviewText.trim() || rating === 0) return;
        try {
            await postReview(book.id, reviewText, rating, userId); 
            setReviewText("");
            setRating(0);
            const updatedReviews = await getBookReviews(id);
            setReviews(updatedReviews.data);
        } catch (error) {
            console.error("Error posting review:", error);
            setErrorMessage("Error posting review. Please try again.");
        }
    };
    
    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <CircularProgress size={60} />
        </Box>
    );
    if (!book) return <Typography variant="h6">Book not found</Typography>;

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={5}>
                        <Card sx={{ 
                            borderRadius: 4,
                            overflow: 'hidden',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.08)'
                        }}>
                            {book.cover_image && (
                                <CardMedia 
                                    component="img" 
                                    height="500" 
                                    image={book.cover_image} 
                                    alt={book.title}
                                    sx={{ objectFit: 'cover' }}
                                />
                            )}
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={7}>
                        <Box sx={{ 
                            background: 'white',
                            borderRadius: 4,
                            p: 4,
                            boxShadow: '0 8px 30px rgba(0,0,0,0.08)'
                        }}>
                            <Typography 
                                variant="h4" 
                                component="h1" 
                                sx={{ 
                                    fontWeight: 'bold',
                                    mb: 2,
                                    background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}
                            >
                                {book.title}
                            </Typography>
                            <Typography 
                                variant="h5" 
                                color="text.secondary"
                                sx={{ mb: 2 }}
                            >
                                {book.author}
                            </Typography>
                            <Typography 
                                variant="h6" 
                                color="primary"
                                sx={{ mb: 3 }}
                            >
                                {book.category}
                            </Typography>
                            <Typography 
                                variant="body1" 
                                sx={{ 
                                    mb: 4,
                                    lineHeight: 1.8,
                                    color: 'text.secondary'
                                }}
                            >
                                {book.description}
                            </Typography>
                            <Box sx={{ 
                                display: 'flex', 
                                gap: 2,
                                mb: 4
                            }}>
                                <Box sx={{ 
                                    background: 'linear-gradient(45deg, #f5f7fa 30%, #ffffff 90%)',
                                    p: 3,
                                    borderRadius: 2,
                                    flex: 1
                                }}>
                                    <Typography variant="h6" color="primary.main">
                                        Rs.{book.price_per_day}/day
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Rental Price
                                    </Typography>
                                </Box>
                                <Box sx={{ 
                                    background: 'linear-gradient(45deg, #f5f7fa 30%, #ffffff 90%)',
                                    p: 3,
                                    borderRadius: 2,
                                    flex: 1
                                }}>
                                    <Typography variant="h6" color="secondary.main">
                                        Rs.{book.price}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Purchase Price
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button 
                                    variant="contained" 
                                    color="primary" 
                                    onClick={handleRentClick}
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
                                    Rent Book
                                </Button>
                                <Button 
                                    variant="outlined" 
                                    color="secondary" 
                                    onClick={handleBuy}
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
                                    Buy Now
                                </Button>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>

                {/* Reviews Section */}
                <Box sx={{ mt: 6 }}>
                    <Typography 
                        variant="h4" 
                        sx={{ 
                            fontWeight: 'bold',
                            mb: 4,
                            background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        Reviews
                    </Typography>
                    <Paper sx={{ 
                        p: 4,
                        borderRadius: 4,
                        background: 'white',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.08)'
                    }}>
                        {reviews.length === 0 ? (
                            <Typography variant="body1" color="text.secondary" align="center">
                                No reviews yet. Be the first to review this book!
                            </Typography>
                        ) : (
                            <List>
                                {reviews.map((review, index) => (
                                    <React.Fragment key={index}>
                                        <ListItem sx={{ 
                                            alignItems: 'flex-start',
                                            py: 3
                                        }}>
                                            <Avatar sx={{ 
                                                mr: 2,
                                                background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)'
                                            }}>
                                                {review.reviewer_name?.[0]?.toUpperCase() || 'A'}
                                            </Avatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                            {review.reviewer_name || 'Anonymous'}
                                                        </Typography>
                                                        <Box sx={{ ml: 2 }}>
                                                            <Rating 
                                                                value={review.rating} 
                                                                readOnly 
                                                                precision={0.5}
                                                                icon={<StarIcon fontSize="inherit" />}
                                                                emptyIcon={<StarBorderIcon fontSize="inherit" />}
                                                            />
                                                        </Box>
                                                    </Box>
                                                }
                                                secondary={
                                                    <>
                                                        <Typography variant="body1" sx={{ mb: 1 }}>
                                                            {review.review_text}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(review.created_at).toLocaleString()}
                                                        </Typography>
                                                    </>
                                                }
                                            />
                                        </ListItem>
                                        {index < reviews.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                    </Paper>

                    {/* Write Review Section */}
                    <Paper sx={{ 
                        mt: 4,
                        p: 4,
                        borderRadius: 4,
                        background: 'white',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.08)'
                    }}>
                        <Typography variant="h6" sx={{ mb: 3 }}>
                            Write a Review
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            <Rating 
                                value={rating} 
                                onChange={(event, newValue) => setRating(newValue)}
                                icon={<StarIcon fontSize="large" />}
                                emptyIcon={<StarBorderIcon fontSize="large" />}
                                sx={{ 
                                    '& .MuiRating-iconFilled': {
                                        color: 'primary.main'
                                    }
                                }}
                            />
                        </Box>
                        <TextField
                            label="Your review"
                            fullWidth
                            multiline
                            rows={4}
                            variant="outlined"
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            sx={{ mb: 3 }}
                        />
                        <Button 
                            variant="contained" 
                            color="primary"
                            onClick={handlePostReview}
                            endIcon={<ArrowForwardIcon />}
                            sx={{ 
                                px: 4,
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
                            Submit Review
                        </Button>
                    </Paper>
                </Box>

                {/* Rent Dialog */}
                <Dialog 
                    open={open} 
                    onClose={handleClose}
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
                            {book.title}
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
                                Total Price: Rs.{book.price_per_day * rentalDays}
                            </Typography>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, pt: 0 }}>
                        <Button 
                            onClick={handleClose}
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

                {/* Error Snackbar */}
                <Snackbar 
                    open={!!errorMessage} 
                    autoHideDuration={6000} 
                    onClose={() => setErrorMessage('')}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert 
                        onClose={() => setErrorMessage('')} 
                        severity="error" 
                        sx={{ width: '100%' }}
                    >
                        {errorMessage}
                    </Alert>
                </Snackbar>
            </Box>
        </Container>
    );
};

export default BookDetail;
