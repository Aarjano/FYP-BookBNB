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
    TextField
} from '@mui/material';
import { getAvailableBooks, requestRental, requestPurchase } from '../services/api';
import { database, ref, set, push, serverTimestamp } from "../services/firebase";

const BookList = () => {
    const [books, setBooks] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [rentalDays, setRentalDays] = useState(7);
    const [openRentDialog, setOpenRentDialog] = useState(false);
    const [openPurchaseDialog, setOpenPurchaseDialog] = useState(false);

    useEffect(() => {
        loadBooks();
    }, []);

    const navigate = useNavigate();

    const handleBookClick = (book) => {
        navigate(`/book/${book.id}`);
    };

    const loadBooks = async () => {
        try {
            const response = await getAvailableBooks();
            setBooks(response.data);
        } catch (error) {
            console.error('Error loading books:', error);
        }
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

            loadBooks();
            handleCloseDialogs();
        } catch (error) {
            console.error("Error renting book:", error.response?.data || error.message);
        }
    };

    const handlePurchase = async () => {
        if (!selectedBook || !selectedBook.id) return;
        try {
            const response = await requestPurchase(selectedBook.id);
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

            loadBooks();
            handleCloseDialogs();
        } catch (error) {
            console.error("Error purchasing book:", error.response?.data || error.message);
        }
    };

    return (
        <div>
            <Typography variant="h4" gutterBottom>
                Available Books
            </Typography>
            <Grid container spacing={3}>
                {books.map((book) => (
                    <Grid item xs={12} sm={6} md={4} key={book.id}>
                        <Card sx={{ cursor: 'pointer' }}>
                            {book.cover_image && (
                                <CardMedia
                                    component="img"
                                    height="200"
                                    image={book.cover_image}
                                    alt={book.title}
                                    onClick={() => handleBookClick(book)}
                                />
                            )}
                            <CardContent onClick={() => handleBookClick(book)}>
                                <Typography variant="h6" component="div">
                                    {book.title}
                                </Typography>
                                <Typography variant="subtitle1" color="text.secondary">
                                    {book.author}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Available copies: {book.available_copies}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Price per day: Rs.{book.price_per_day}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Purchase Price: Rs.{book.price}
                                </Typography>
                                <Button 
                                    variant="contained" 
                                    color="primary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRentClick(book);
                                    }}
                                    sx={{ mt: 1, mr: 1 }}
                                >
                                    Rent Book
                                </Button>
                                <Button 
                                    variant="contained" 
                                    color="secondary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePurchaseClick(book);
                                    }}
                                    sx={{ mt: 1 }}
                                >
                                    Buy Book
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Rent Dialog */}
            <Dialog open={openRentDialog} onClose={handleCloseDialogs}>
                <DialogTitle>Rent Book</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" gutterBottom>
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
                    />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                        Total Price: Rs.{selectedBook?.price_per_day * rentalDays}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogs}>Cancel</Button>
                    <Button onClick={handleRent} variant="contained" color="primary">
                        Confirm Rental
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Purchase Dialog */}
            <Dialog open={openPurchaseDialog} onClose={handleCloseDialogs}>
                <DialogTitle>Buy Book</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" gutterBottom>
                        {selectedBook?.title}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 2 }}>
                        Purchase Price: Rs.{selectedBook?.price}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogs}>Cancel</Button>
                    <Button onClick={handlePurchase} variant="contained" color="secondary">
                        Confirm Purchase
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default BookList;