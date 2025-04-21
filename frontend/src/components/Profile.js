import { useEffect, useState } from "react";
import { 
    Container, 
    Typography, 
    Grid, 
    Card, 
    CardContent, 
    CardMedia, 
    CircularProgress, 
    Alert,
    Box,
    Avatar,
    Chip,
    Divider,
    useTheme,
    Paper,
    Button,
    TextField,
    MenuItem
} from "@mui/material";
import { getCurrentUser, getMyPurchases, getBookDetails, getPaymentInfo, updatePaymentInfo } from "../services/api";
import BookIcon from '@mui/icons-material/Book';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import EditIcon from '@mui/icons-material/Edit';
import PaymentIcon from '@mui/icons-material/Payment';
import PhoneIcon from '@mui/icons-material/Phone';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [paymentError, setPaymentError] = useState('');
    const [paymentSuccess, setPaymentSuccess] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const theme = useTheme();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch user data
                const userResponse = await getCurrentUser();
                if (userResponse.data) {
                    setUser(userResponse.data);
                }

                // Fetch purchases
                try {
                    const purchasesResponse = await getMyPurchases();
                    const purchasesData = purchasesResponse.data || [];
                    const successfulPurchases = purchasesData.filter(purchase => purchase.status === 'COMPLETED');
                    
                    // Fetch additional book details
                    const detailedPurchases = await Promise.all(
                        successfulPurchases.map(async (purchase) => {
                            const bookDetails = await getBookDetails(purchase.book.id);
                            return { ...purchase, book: { ...purchase.book, ...bookDetails.data } };
                        })
                    );
                    setPurchases(detailedPurchases);
                } catch (purchaseError) {
                    console.error('Error fetching purchases:', purchaseError);
                    setPurchases([]);
                }

                // Fetch payment info
                try {
                    const paymentResponse = await getPaymentInfo();
                    if (paymentResponse.data && paymentResponse.data.length > 0) {
                        const paymentData = paymentResponse.data[0];
                        setPaymentMethod(paymentData.method || '');
                        setMobileNumber(paymentData.mobile_number || '');
                    }
                } catch (paymentError) {
                    console.log('No payment info found, setting defaults');
                    setPaymentMethod('');
                    setMobileNumber('');
                }
            } catch (err) {
                console.error('Error fetching profile data:', err);
                setError('Failed to load profile data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        setPaymentError('');
        setPaymentSuccess('');

        if (!paymentMethod || !mobileNumber) {
            setPaymentError('Please select a payment method and enter your mobile number');
            return;
        }

        try {
            const response = await updatePaymentInfo({
                method: paymentMethod,
                mobile_number: mobileNumber
            });

            if (response.status === 200 || response.status === 201) {
                setPaymentSuccess('Payment information updated successfully');
                setIsEditing(false);
                // Refresh payment info
                const paymentResponse = await getPaymentInfo();
                if (paymentResponse.data && paymentResponse.data.length > 0) {
                    const paymentData = paymentResponse.data[0];
                    setPaymentMethod(paymentData.method || '');
                    setMobileNumber(paymentData.mobile_number || '');
                }
            } else {
                setPaymentError('Failed to update payment information. Please try again.');
            }
        } catch (err) {
            console.error('Error updating payment info:', err);
            const errorMessage = err.response?.data?.error || 
                               err.response?.data?.message || 
                               'Failed to update payment information. Please try again.';
            setPaymentError(errorMessage);
        }
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

    if (error) {
        return (
            <Container maxWidth="md">
                <Alert severity="error" sx={{ mt: 4 }}>
                    {error}
                </Alert>
            </Container>
        );
    }

    if (!user) {
        return (
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '100vh',
                background: 'linear-gradient(45deg, #f5f7fa 30%, #ffffff 90%)'
            }}>
                <Alert severity="error" sx={{ 
                    maxWidth: 400,
                    borderRadius: 4,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.08)'
                }}>
                    Failed to load user data.
                </Alert>
            </Box>
        );
    }

    return (
        <Container maxWidth="md">
            <Box sx={{ my: 4 }}>
                <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                    <Grid container spacing={4}>
                        {/* User Info Section */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Avatar
                                    sx={{
                                        width: 120,
                                        height: 120,
                                        mx: 'auto',
                                        mb: 2,
                                        bgcolor: theme.palette.primary.main
                                    }}
                                >
                                    {user?.first_name?.[0] || user?.username?.[0]}
                                </Avatar>
                                <Typography variant="h5" gutterBottom>
                                    {user?.first_name} {user?.last_name}
                                </Typography>
                                <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                                    {user?.email}
                                </Typography>
                                
                                {paymentMethod && mobileNumber && (
                                    <Box sx={{ 
                                        mt: 2, 
                                        p: 2, 
                                        borderRadius: 2,
                                        background: 'linear-gradient(45deg, #f5f7fa 30%, #ffffff 90%)',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <PaymentIcon sx={{ mr: 1, color: 'primary.main' }} />
                                            <Typography variant="subtitle1" color="textSecondary">
                                                Payment Method:
                                            </Typography>
                                            <Chip 
                                                label={paymentMethod.toUpperCase()}
                                                color="primary"
                                                size="small"
                                                sx={{ ml: 1 }}
                                            />
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
                                            <Typography variant="subtitle1" color="textSecondary">
                                                Mobile:
                                            </Typography>
                                            <Typography variant="body1" sx={{ ml: 1 }}>
                                                {mobileNumber}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </Grid>

                        {/* Payment Method Section */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    Payment Information
                                </Typography>
                                {paymentMethod && mobileNumber && !isEditing && (
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        startIcon={<EditIcon />}
                                        onClick={() => setIsEditing(true)}
                                    >
                                        Edit
                                    </Button>
                                )}
                            </Box>
                            <Divider sx={{ mb: 3 }} />
                            
                            {!isEditing && paymentMethod && mobileNumber ? (
                                <Box sx={{ mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <PaymentIcon sx={{ mr: 1, color: 'primary.main' }} />
                                        <Typography variant="subtitle1">
                                            Payment Method:
                                        </Typography>
                                        <Chip 
                                            label={paymentMethod.toUpperCase()}
                                            color="primary"
                                            sx={{ ml: 1 }}
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                        <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
                                        <Typography variant="subtitle1">
                                            Mobile Number:
                                        </Typography>
                                        <Typography variant="body1" sx={{ ml: 1 }}>
                                            {mobileNumber}
                                        </Typography>
                                    </Box>
                                </Box>
                            ) : (
                                <form onSubmit={handlePaymentSubmit}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Payment Method"
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        sx={{ mb: 2 }}
                                        required
                                    >
                                        <MenuItem value="esewa">eSewa</MenuItem>
                                        <MenuItem value="khalti">Khalti</MenuItem>
                                        <MenuItem value="imepay">IME Pay</MenuItem>
                                    </TextField>

                                    <TextField
                                        fullWidth
                                        label="Mobile Number"
                                        value={mobileNumber}
                                        onChange={(e) => setMobileNumber(e.target.value)}
                                        placeholder="98XXXXXXXX"
                                        sx={{ mb: 2 }}
                                        required
                                        inputProps={{
                                            pattern: "[0-9]{10,15}",
                                            title: "Please enter a valid mobile number (10-15 digits)"
                                        }}
                                    />

                                    {paymentError && (
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {paymentError}
                                        </Alert>
                                    )}

                                    {paymentSuccess && (
                                        <Alert severity="success" sx={{ mb: 2 }}>
                                            {paymentSuccess}
                                        </Alert>
                                    )}

                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            color="primary"
                                            fullWidth
                                            disabled={!paymentMethod || !mobileNumber}
                                        >
                                            Save
                                        </Button>
                                        {isEditing && (
                                            <Button
                                                variant="outlined"
                                                color="secondary"
                                                fullWidth
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setPaymentError('');
                                                    setPaymentSuccess('');
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                    </Box>
                                </form>
                            )}
                        </Grid>
                    </Grid>
                </Paper>
            </Box>

            {/* Purchased Books Section */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 4,
                    gap: 2
                }}>
                    <ShoppingCartIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
                    <Typography 
                        variant="h4" 
                        sx={{ 
                            fontWeight: 'bold',
                            background: 'linear-gradient(45deg, #9c27b0 30%, #ba68c8 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        Purchased Books
                    </Typography>
                </Box>

                {purchases.length > 0 ? (
                    <Grid container spacing={4}>
                        {purchases.map((purchase) => (
                            <Grid item xs={12} sm={6} md={4} key={purchase.id}>
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
                                    {purchase.book.cover_image ? (
                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={purchase.book.cover_image}
                                            alt={purchase.book.title}
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
                                            {purchase.book.title}
                                        </Typography>
                                        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
                                            by {purchase.book.author}
                                        </Typography>
                                        <Chip 
                                            label={`Rs.${purchase.price}`}
                                            color="success"
                                            sx={{ 
                                                background: 'linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)',
                                                color: 'white'
                                            }}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Card sx={{ 
                        p: 4,
                        textAlign: 'center',
                        borderRadius: 4,
                        background: 'linear-gradient(145deg, #ffffff, #f0f0f0)'
                    }}>
                        <Typography variant="body1" color="text.secondary">
                            No purchases yet.
                        </Typography>
                    </Card>
                )}
            </Box>
        </Container>
    );
};

export default ProfilePage;