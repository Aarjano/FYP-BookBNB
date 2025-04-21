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
    Box,
    Container,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Avatar,
    Chip,
    useTheme,
    useMediaQuery,
    Divider,
    Snackbar,
    Alert,
    CircularProgress
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import BookIcon from '@mui/icons-material/Book';
import PersonIcon from '@mui/icons-material/Person';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
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
    const [loading, setLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
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
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadBooks(),
                loadRentalRequests(),
                loadPurchaseRequests()
            ]);
        } catch (error) {
            setErrorMessage('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadBooks = async () => {
        try {
            const response = await getMyBooks();
            setBooks(response.data);
        } catch (error) {
            console.error('Error loading books:', error);
            throw error;
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
                if (request.rentals && request.rentals.length > 0) {
                    acc[bookId].push(...request.rentals);
                }
                return acc;
            }, {});
            setRentalRequests(groupedRequests);
        } catch (error) {
            console.error('Error loading rental requests:', error);
            throw error;
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
                if (request.purchases && request.purchases.length > 0) {
                    acc[bookId].push(...request.purchases);
                }
                return acc;
            }, {});
            setPurchaseRequests(groupedRequests);
        } catch (error) {
            console.error('Error loading purchase requests:', error);
            throw error;
        }
    };

    const handleExpand = (bookId) => {
        setExpandedBook(expandedBook === bookId ? null : bookId);
    };

    const handleApproveRental = async (rental_id) => {
        try {
            await approveRental(rental_id);
            await loadRentalRequests();
            setSuccessMessage('Rental request approved successfully!');
        } catch (error) {
            console.error('Error approving rental:', error);
            setErrorMessage('Failed to approve rental request. Please try again.');
        }
    };

    const handleRejectRental = async (rental_id) => {
        try {
            await rejectRental(rental_id);
            await loadRentalRequests();
            setSuccessMessage('Rental request rejected successfully!');
        } catch (error) {
            console.error('Error rejecting rental:', error);
            setErrorMessage('Failed to reject rental request. Please try again.');
        }
    };

    const handleApprovePurchase = async (purchase_id) => {
        try {
            await approvePurchase(purchase_id);
            await loadPurchaseRequests();
            setSuccessMessage('Purchase request approved successfully!');
        } catch (error) {
            setErrorMessage('Failed to approve purchase request.');
        }
    };

    const handleRejectPurchase = async (purchase_id) => {
        try {
            await rejectPurchase(purchase_id);
            await loadPurchaseRequests();
            setSuccessMessage('Purchase request rejected successfully!');
        } catch (error) {
            console.error('Error rejecting purchase:', error);
            setErrorMessage('Failed to reject purchase request. Please try again.');
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
            await loadBooks();
            handleAddBookClose();
            setSuccessMessage('Book added successfully!');
        } catch (error) {
            setErrorMessage('Failed to add book. Please try again.');
        }
    };

    const handleNewBookChange = (e) => {
        const { name, value } = e.target;
        
        // Prevent negative values for numeric fields
        if ((name === 'price_per_day' || name === 'price') && value < 0) {
            return;
        }
        
        setNewBook({ ...newBook, [name]: value });
    };

    if (loading) {
        return (
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '100vh',
                background: 'linear-gradient(45deg, #f5f7fa 30%, #ffffff 90%)'
            }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 4
                }}>
                    <Typography 
                        variant="h4" 
                        sx={{ 
                            fontWeight: 'bold',
                            background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        My Books
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAddBookClick}
                        startIcon={<AddIcon />}
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
                        Add Book
                    </Button>
                </Box>

                <Grid container spacing={4}>
                    {books.map((book) => (
                        <Grid item xs={12} sm={6} md={4} key={book.id}>
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
                                {book.cover_image ? (
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={book.cover_image}
                                        alt={book.title}
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
                                        sx={{ mb: 2 }}
                                    >
                                        by {book.author}
                                    </Typography>
                                    <Box sx={{ mb: 2 }}>
                                        <Chip 
                                            label={`Rs.${book.price_per_day}/day`} 
                                            color="primary" 
                                            size="small"
                                            sx={{ mr: 1 }}
                                        />
                                        <Chip 
                                            label={`Rs.${book.price}`} 
                                            color="secondary" 
                                            size="small"
                                        />
                                    </Box>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                ISBN: {book.isbn}
                                            </Typography>
                                        </Box>
                                        <IconButton 
                                            onClick={() => handleExpand(book.id)}
                                            sx={{ 
                                                color: 'primary.main',
                                                '&:hover': {
                                                    background: 'rgba(25,118,210,0.08)'
                                                }
                                            }}
                                        >
                                            {expandedBook === book.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                        </IconButton>
                                    </Box>
                                </CardContent>

                                <Collapse in={expandedBook === book.id} timeout="auto" unmountOnExit>
                                    <Divider />
                                    <Box sx={{ p: 2 }}>
                                        {/* Rental Requests */}
                                        <Typography 
                                            variant="subtitle1" 
                                            sx={{ 
                                                fontWeight: 'bold',
                                                mb: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1
                                            }}
                                        >
                                            <LocalLibraryIcon color="primary" />
                                            Rental Requests
                                        </Typography>
                                        {rentalRequests[book.id]?.length > 0 ? (
                                            rentalRequests[book.id].map((request) => (
                                                <Paper 
                                                    key={request.rental_id} 
                                                    sx={{ 
                                                        p: 2, 
                                                        mb: 2,
                                                        borderRadius: 2,
                                                        background: 'linear-gradient(145deg, #ffffff, #f0f0f0)'
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                                            <PersonIcon />
                                                        </Avatar>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                            Renter ID: {request.renter_id}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                        Status: {request.status}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Button
                                                            variant="contained"
                                                            color="success"
                                                            size="small"
                                                            startIcon={<CheckIcon />}
                                                            onClick={() => handleApproveRental(request.rental_id)}
                                                            sx={{ 
                                                                background: 'linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)',
                                                                '&:hover': {
                                                                    background: 'linear-gradient(45deg, #1b5e20 30%, #388e3c 90%)'
                                                                }
                                                            }}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            variant="contained"
                                                            color="error"
                                                            size="small"
                                                            startIcon={<CloseIcon />}
                                                            onClick={() => handleRejectRental(request.rental_id)}
                                                            sx={{ 
                                                                background: 'linear-gradient(45deg, #c62828 30%, #f44336 90%)',
                                                                '&:hover': {
                                                                    background: 'linear-gradient(45deg, #b71c1c 30%, #d32f2f 90%)'
                                                                }
                                                            }}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </Box>
                                                </Paper>
                                            ))
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                No rental requests
                                            </Typography>
                                        )}

                                        {/* Purchase Requests */}
                                        <Typography 
                                            variant="subtitle1" 
                                            sx={{ 
                                                fontWeight: 'bold',
                                                mb: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1
                                            }}
                                        >
                                            <ShoppingCartIcon color="secondary" />
                                            Purchase Requests
                                        </Typography>
                                        {purchaseRequests[book.id]?.length > 0 ? (
                                            purchaseRequests[book.id].map((request) => (
                                                <Paper 
                                                    key={request.purchase_id} 
                                                    sx={{ 
                                                        p: 2, 
                                                        mb: 2,
                                                        borderRadius: 2,
                                                        background: 'linear-gradient(145deg, #ffffff, #f0f0f0)'
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                                                            <PersonIcon />
                                                        </Avatar>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                            Buyer ID: {request.buyer_id}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                        Status: {request.status}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Button
                                                            variant="contained"
                                                            color="success"
                                                            size="small"
                                                            startIcon={<CheckIcon />}
                                                            onClick={() => handleApprovePurchase(request.purchase_id)}
                                                            sx={{ 
                                                                background: 'linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)',
                                                                '&:hover': {
                                                                    background: 'linear-gradient(45deg, #1b5e20 30%, #388e3c 90%)'
                                                                }
                                                            }}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            variant="contained"
                                                            color="error"
                                                            size="small"
                                                            startIcon={<CloseIcon />}
                                                            onClick={() => handleRejectPurchase(request.purchase_id)}
                                                            sx={{ 
                                                                background: 'linear-gradient(45deg, #c62828 30%, #f44336 90%)',
                                                                '&:hover': {
                                                                    background: 'linear-gradient(45deg, #b71c1c 30%, #d32f2f 90%)'
                                                                }
                                                            }}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </Box>
                                                </Paper>
                                            ))
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                No purchase requests
                                            </Typography>
                                        )}
                                    </Box>
                                </Collapse>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* Add Book Dialog */}
                <Dialog 
                    open={openAddBookDialog} 
                    onClose={handleAddBookClose}
                    PaperProps={{
                        sx: {
                            borderRadius: 4,
                            p: 2,
                            width: '100%',
                            maxWidth: '600px'
                        }
                    }}
                >
                    <DialogTitle sx={{ 
                        fontWeight: 'bold',
                        textAlign: 'center',
                        color: 'primary.main'
                    }}>
                        Add New Book
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
                            <TextField
                                label="Title"
                                name="title"
                                value={newBook.title}
                                onChange={handleNewBookChange}
                                fullWidth
                                required
                            />
                            <TextField
                                label="Author"
                                name="author"
                                value={newBook.author}
                                onChange={handleNewBookChange}
                                fullWidth
                                required
                            />
                            <TextField
                                label="Description"
                                name="description"
                                value={newBook.description}
                                onChange={handleNewBookChange}
                                multiline
                                rows={4}
                                fullWidth
                            />
                            <TextField
                                label="ISBN"
                                name="isbn"
                                value={newBook.isbn}
                                onChange={handleNewBookChange}
                                fullWidth
                                required
                            />
                            <TextField
                                label="Cover Image URL"
                                name="cover_image"
                                value={newBook.cover_image}
                                onChange={handleNewBookChange}
                                fullWidth
                            />
                            <TextField
                                label="Publication Year"
                                name="publication_year"
                                value={newBook.publication_year}
                                onChange={handleNewBookChange}
                                fullWidth
                            />
                            <TextField
                                label="Price Per Day"
                                name="price_per_day"
                                type="number"
                                value={newBook.price_per_day}
                                onChange={handleNewBookChange}
                                fullWidth
                                required
                                inputProps={{ min: 0 }}
                            />
                            <TextField
                                label="Purchase Price"
                                name="price"
                                type="number"
                                value={newBook.price}
                                onChange={handleNewBookChange}
                                fullWidth
                                required
                                inputProps={{ min: 0 }}
                            />
                            <TextField
                                select
                                label="Category"
                                name="category"
                                value={newBook.category}
                                onChange={handleNewBookChange}
                                fullWidth
                                required
                            >
                                <MenuItem value="Fiction">Fiction</MenuItem>
                                <MenuItem value="Non-Fiction">Non-Fiction</MenuItem>
                                <MenuItem value="Science Fiction">Science Fiction</MenuItem>
                                <MenuItem value="Fantasy">Fantasy</MenuItem>
                                <MenuItem value="Mystery">Mystery</MenuItem>
                                <MenuItem value="Romance">Romance</MenuItem>
                                <MenuItem value="Thriller">Thriller</MenuItem>
                                <MenuItem value="Biography">Biography</MenuItem>
                                <MenuItem value="History">History</MenuItem>
                                <MenuItem value="Self-Help">Self-Help</MenuItem>
                                <MenuItem value="Business">Business</MenuItem>
                                <MenuItem value="Technology">Technology</MenuItem>
                                <MenuItem value="Art">Art</MenuItem>
                                <MenuItem value="Poetry">Poetry</MenuItem>
                                <MenuItem value="Drama">Drama</MenuItem>
                                <MenuItem value="Children">Children</MenuItem>
                                <MenuItem value="Young Adult">Young Adult</MenuItem>
                                <MenuItem value="Educational">Educational</MenuItem>
                                <MenuItem value="Religion">Religion</MenuItem>
                                <MenuItem value="Philosophy">Philosophy</MenuItem>
                                <MenuItem value="Travel">Travel</MenuItem>
                                <MenuItem value="Cooking">Cooking</MenuItem>
                                <MenuItem value="Other">Other</MenuItem>
                            </TextField>
                            <TextField
                                select
                                label="Language"
                                name="language"
                                value={newBook.language}
                                onChange={handleNewBookChange}
                                fullWidth
                            >
                                <MenuItem value="English">English</MenuItem>
                                <MenuItem value="Spanish">Spanish</MenuItem>
                                <MenuItem value="French">French</MenuItem>
                                <MenuItem value="German">German</MenuItem>
                            </TextField>
                            <TextField
                                select
                                label="Condition"
                                name="condition"
                                value={newBook.condition}
                                onChange={handleNewBookChange}
                                fullWidth
                            >
                                <MenuItem value="NEW">New</MenuItem>
                                <MenuItem value="LIKE_NEW">Like New</MenuItem>
                                <MenuItem value="GOOD">Good</MenuItem>
                                <MenuItem value="FAIR">Fair</MenuItem>
                                <MenuItem value="POOR">Poor</MenuItem>
                            </TextField>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, pt: 0 }}>
                        <Button 
                            onClick={handleAddBookClose}
                            sx={{ 
                                mr: 2,
                                px: 3,
                                py: 1
                            }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleAddBookSubmit} 
                            variant="contained" 
                            color="primary"
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
                            Add Book
                        </Button>
                    </DialogActions>
                </Dialog>

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
            </Box>
        </Container>
    );
};

export default MyBooks;