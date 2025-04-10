import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getBookDetails, requestRental, requestPurchase, getBookReviews, postReview } from '../services/api';
import {
    Typography, Card, CardMedia, CardContent, CircularProgress, Button, TextField, Dialog,
    DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, Rating
} from '@mui/material';
import { database, ref, set, push, serverTimestamp } from "../services/firebase";

const BookDetail = ({ currentUserId }) => {
    const { id } = useParams();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rentalDays, setRentalDays] = useState(7);
    const [open, setOpen] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [reviewText, setReviewText] = useState("");
    const [rating, setRating] = useState(0);
    const userId = currentUserId;

    useEffect(() => {
        const fetchBook = async () => {
            try {
                const response = await getBookDetails(id);
                setBook(response.data);
            } catch (error) {
                console.error('Error fetching book:', error);
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
                console.error("Error: Missing renter or owner ID!");
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
        }
    };

    const handleBuy = async () => {
        try {
            const response = await requestPurchase(book.id);
            const purchaseData = response.data;
            const buyerId = purchaseData.buyer_id;
            const sellerId = purchaseData.book.owner_id;

            if (!buyerId || !sellerId) {
                console.error("Error: Missing buyer or seller ID!");
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
        }
    };
    
    if (loading) return <CircularProgress />;
    if (!book) return <Typography variant="h6">Book not found</Typography>;

    return (
        <Card sx={{ maxWidth: 600, margin: 'auto', mt: 3, p: 2 }}>
            {book.cover_image && (
                <CardMedia component="img" height="300" image={book.cover_image} alt={book.title} />
            )}
            <CardContent>
                <Typography variant="h4">{book.title}</Typography>
                <Typography variant="h6" color="text.secondary">by {book.author}</Typography>
                <Typography variant="body1">{book.description}</Typography>
                <Typography variant="body2" sx={{ mt: 2 }}>Price per day: Rs.{book.price_per_day}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>Purchase Price: Rs.{book.price}</Typography>
                <Button variant="contained" color="primary" sx={{ mt: 2, mr: 2 }} onClick={handleRentClick}>
                    Rent Book
                </Button>
                <Button variant="contained" color="secondary" sx={{ mt: 2 }} onClick={handleBuy}>
                    Buy Now
                </Button>
                
                <Dialog open={open} onClose={handleClose}>
                    <DialogTitle>Rent Book</DialogTitle>
                    <DialogContent>
                        <Typography variant="body1" gutterBottom>{book.title}</Typography>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Number of Days"
                            type="number"
                            fullWidth
                            value={rentalDays}
                            onChange={(e) => setRentalDays(Number(e.target.value))}
                            inputProps={{ min: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            Total Price: Rs.{book.price_per_day * rentalDays}
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button onClick={handleRent} variant="contained" color="primary">Confirm Rental</Button>
                    </DialogActions>
                </Dialog>

                <Typography variant="h5" sx={{ mt: 3 }}>Reviews</Typography>
                <List>
                    {reviews.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">No reviews yet.</Typography>
                    ) : (
                        reviews.map((review, index) => (
                            <ListItem key={index}>
                                <ListItemText
                                    primary={review.review_text}
                                    secondary={`Rating: ${review.rating} ★ | Posted on: ${new Date(review.created_at).toLocaleString()}`}
                                />
                            </ListItem>
                        ))
                    )}
                </List>

                <Typography variant="h6" sx={{ mt: 3 }}>Write a Review</Typography>
                <Rating value={rating} onChange={(event, newValue) => setRating(newValue)} />
                <TextField
                    label="Your review"
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    sx={{ mt: 2 }}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                />
                <Button variant="contained" color="secondary" sx={{ mt: 1 }} onClick={handlePostReview}>
                    Submit Review
                </Button>
            </CardContent>
        </Card>
    );
};

export default BookDetail;
