import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    IconButton,
    Collapse,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Box
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import {
    getMyBooks,
    getRentalRequests,
    approveRental,
    rejectRental,
    getPurchaseRequests,
    approvePurchase,
    rejectPurchase,
    createBook
} from '../services/api';

const MyBooks = () => {
    const [books, setBooks] = useState([]);
    const [rentalRequests, setRentalRequests] = useState({});
    const [purchaseRequests, setPurchaseRequests] = useState({});
    const [expandedBook, setExpandedBook] = useState(null);
    const [openAddBookDialog, setOpenAddBookDialog] = useState(false);
    const [newBook, setNewBook] = useState({
        title: '',
        author: '',
        description: '',
        isbn: '',
        cover_image: '',
        publication_year: '',
        price_per_day: 0,
        price: 0,
        category: '',
        language: 'English',
        condition: 'GOOD',
        tags: [],
        location: {}
    });

    useEffect(() => {
        loadBooks();
        loadRentalRequests();
        loadPurchaseRequests();
    }, []);

    const loadBooks = async () => {
        try {
            const response = await getMyBooks();
            setBooks(response.data);
            console.log('Books loaded:', response.data); // Debugging log
        } catch (error) {
            console.error('Error loading books:', error);
        }
    };

    const loadRentalRequests = async () => {
        try {
            const response = await getRentalRequests();
            const groupedRequests = response.data.reduce((acc, request) => {
                const bookId = request.book_id;
                if (!acc[bookId]) {
                    acc[bookId] = [];
                }
                // Access the nested `rentals` array
                if (request.rentals && request.rentals.length > 0) {
                    acc[bookId].push(...request.rentals);
                }
                return acc;
            }, {});

            console.log('Grouped rental requests:', groupedRequests); // Debugging log
            setRentalRequests(groupedRequests);
        } catch (error) {
            console.error('Error loading rental requests:', error);
        }
    };

    const loadPurchaseRequests = async () => {
        try {
            const response = await getPurchaseRequests();
            const groupedRequests = response.data.reduce((acc, request) => {
                const bookId = request.book_id;
                if (!acc[bookId]) {
                    acc[bookId] = [];
                }
                // Access the nested `purchases` array
                if (request.purchases && request.purchases.length > 0) {
                    acc[bookId].push(...request.purchases);
                }
                return acc;
            }, {});

            console.log('Grouped purchase requests:', groupedRequests); // Debugging log
            setPurchaseRequests(groupedRequests);
        } catch (error) {
            console.error('Error loading purchase requests:', error);
        }
    };

    const handleExpand = (bookId) => {
        setExpandedBook(expandedBook === bookId ? null : bookId);
    };

    const handleApproveRental = async (rental_id) => {
        try {
            await approveRental(rental_id);
            loadRentalRequests(); // Refresh data after approval
        } catch (error) {
            console.error('Error approving rental:', error);
        }
    };

    const handleRejectRental = async (rental_id) => {
        try {
            await rejectRental(rental_id);
            loadRentalRequests(); // Refresh data after rejection
        } catch (error) {
            console.error('Error rejecting rental:', error);
        }
    };


    const handleApprovePurchase = async (purchase_id) => {
        try {
            await approvePurchase(purchase_id);
            loadPurchaseRequests(); // Refresh data after approval
        } catch (error) {
            console.error('Error approving purchase:', error);
        }
    };

    const handleRejectPurchase = async (purchase_id) => {
        try {
            await rejectPurchase(purchase_id);
            loadPurchaseRequests(); // Refresh data after rejection
        } catch (error) {
            console.error('Error rejecting purchase:', error);
        }
    };

    const handleAddBookClick = () => {
        setOpenAddBookDialog(true);
    };

    const handleAddBookClose = () => {
        setOpenAddBookDialog(false);
        setNewBook({
            title: '',
            author: '',
            description: '',
            isbn: '',
            cover_image: '',
            publication_year: '',
            price_per_day: 0,
            price: 0,
            category: '',
            language: 'English',
            condition: 'GOOD',
            tags: [],
            location: {}
        });
    };

    const handleAddBookSubmit = async () => {
        try {
            await createBook(newBook);
            loadBooks(); // Refresh the book list
            handleAddBookClose(); // Close the dialog
        } catch (error) {
            console.error('Error adding book:', error);
        }
    };

    const handleNewBookChange = (e) => {
        const { name, value } = e.target;
        setNewBook({ ...newBook, [name]: value });
    };

    return (
        <div>
            <Typography variant="h4" gutterBottom>
                My Books
            </Typography>

            {/* Add Book Button */}
            <Button
                variant="contained"
                color="primary"
                onClick={handleAddBookClick}
                sx={{ mb: 3 }}
            >
                Add Book
            </Button>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Author</TableCell>
                            <TableCell>ISBN</TableCell>
                            <TableCell>Price Per Day</TableCell>
                            <TableCell>Requests</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {books.map((book) => (
                            <React.Fragment key={book.id}>
                                <TableRow>
                                    <TableCell>{book.title}</TableCell>
                                    <TableCell>{book.author}</TableCell>
                                    <TableCell>{book.isbn}</TableCell>
                                    <TableCell>{book.price_per_day}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleExpand(book.id)}>
                                            {expandedBook === book.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                        </IconButton>
                                    </TableCell>
                                </TableRow>

                                {/* Expandable Rental Requests Section */}
                                <TableRow>
                                    <TableCell colSpan={5}>
                                        <Collapse in={expandedBook === book.id} timeout="auto" unmountOnExit>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Renter ID</TableCell>
                                                        <TableCell>Status</TableCell>
                                                        <TableCell>Actions</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {rentalRequests[book.id] && rentalRequests[book.id].length > 0 ? (
                                                        rentalRequests[book.id].map((rental) => (
                                                            <TableRow key={rental.rental_id}>
                                                                <TableCell>{rental.renter_id}</TableCell>
                                                                <TableCell>{rental.status || 'Pending'}</TableCell>
                                                                <TableCell>
                                                                    <IconButton
                                                                        color="primary"
                                                                        onClick={() => handleApproveRental(rental.rental_id)}
                                                                    >
                                                                        <CheckIcon />
                                                                    </IconButton>
                                                                    <IconButton
                                                                        color="secondary"
                                                                        onClick={() => handleRejectRental(rental.rental_id)}
                                                                    >
                                                                        <CloseIcon />
                                                                    </IconButton>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={3} align="center">
                                                                No purchase requests.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </Collapse>
                                    </TableCell>
                                </TableRow>

                                <TableRow>
                                    <TableCell colSpan={5}>
                                        <Collapse in={expandedBook === book.id} timeout="auto" unmountOnExit>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Buyer ID</TableCell>
                                                        <TableCell>Status</TableCell>
                                                        <TableCell>Actions</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {purchaseRequests[book.id] && purchaseRequests[book.id].length > 0 ? (
                                                        purchaseRequests[book.id].map((purchase) => (
                                                            <TableRow key={purchase.purchase_id}>
                                                                <TableCell>{purchase.buyer_id}</TableCell>
                                                                <TableCell>{purchase.status || 'Pending'}</TableCell>
                                                                <TableCell>
                                                                    <IconButton
                                                                        color="primary"
                                                                        onClick={() => handleApprovePurchase(purchase.purchase_id)}
                                                                    >
                                                                        <CheckIcon />
                                                                    </IconButton>
                                                                    <IconButton
                                                                        color="secondary"
                                                                        onClick={() => handleRejectPurchase(purchase.purchase_id)}
                                                                    >
                                                                        <CloseIcon />
                                                                    </IconButton>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={3} align="center">
                                                                No rental requests.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </Collapse>
                                    </TableCell>
                                </TableRow>
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add Book Dialog */}
            <Dialog open={openAddBookDialog} onClose={handleAddBookClose}>
                <DialogTitle>Add a New Book</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 2 }}>
                        <TextField
                            label="Title"
                            name="title"
                            value={newBook.title}
                            onChange={handleNewBookChange}
                            fullWidth
                            margin="normal"
                            required
                        />
                        <TextField
                            label="Author"
                            name="author"
                            value={newBook.author}
                            onChange={handleNewBookChange}
                            fullWidth
                            margin="normal"
                            required
                        />
                        <TextField
                            label="Description"
                            name="description"
                            value={newBook.description}
                            onChange={handleNewBookChange}
                            fullWidth
                            margin="normal"
                            multiline
                            rows={4}
                        />
                        <TextField
                            label="ISBN"
                            name="isbn"
                            value={newBook.isbn}
                            onChange={handleNewBookChange}
                            fullWidth
                            margin="normal"
                            required
                        />
                        <TextField
                            label="Cover Image URL"
                            name="cover_image"
                            value={newBook.cover_image}
                            onChange={handleNewBookChange}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Publication Year"
                            name="publication_year"
                            value={newBook.publication_year}
                            onChange={handleNewBookChange}
                            fullWidth
                            margin="normal"
                            type="number"
                        />
                        <TextField
                            label="Price Per Day"
                            name="price_per_day"
                            value={newBook.price_per_day}
                            onChange={handleNewBookChange}
                            fullWidth
                            margin="normal"
                            type="number"
                            required
                        />
                        <TextField
                            label="Price"
                            name="price"
                            value={newBook.price}
                            onChange={handleNewBookChange}
                            fullWidth
                            margin="normal"
                            type="number"
                            required
                        />
                        <TextField
                            label="Category"
                            name="category"
                            value={newBook.category}
                            onChange={handleNewBookChange}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Language"
                            name="language"
                            value={newBook.language}
                            onChange={handleNewBookChange}
                            fullWidth
                            margin="normal"
                            select
                        >
                            <MenuItem value="English">English</MenuItem>
                            <MenuItem value="Spanish">Spanish</MenuItem>
                            <MenuItem value="French">French</MenuItem>
                            <MenuItem value="German">German</MenuItem>
                        </TextField>
                        <TextField
                            label="Condition"
                            name="condition"
                            value={newBook.condition}
                            onChange={handleNewBookChange}
                            fullWidth
                            margin="normal"
                            select
                        >
                            <MenuItem value="NEW">New</MenuItem>
                            <MenuItem value="GOOD">Good</MenuItem>
                            <MenuItem value="FAIR">Fair</MenuItem>
                            <MenuItem value="POOR">Poor</MenuItem>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleAddBookClose}>Cancel</Button>
                    <Button onClick={handleAddBookSubmit} variant="contained" color="primary">
                        Add Book
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default MyBooks;