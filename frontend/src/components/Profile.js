import { useEffect, useState } from "react";
import { Container, Typography, Grid, Card, CardContent, CardMedia, CircularProgress, Alert } from "@mui/material";
import { getCurrentUser, getMyPurchases, getBookDetails } from "../services/api";

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userResponse = await getCurrentUser();
                setUser(userResponse.data);

                const purchasesResponse = await getMyPurchases();
                const purchasesData = purchasesResponse.data || [];

                // Filter successful purchases
                const successfulPurchases = purchasesData.filter(purchase => purchase.status === 'COMPLETED');

                // Fetch additional book details
                const detailedPurchases = await Promise.all(
                    successfulPurchases.map(async (purchase) => {
                        const bookDetails = await getBookDetails(purchase.book.id);
                        return { ...purchase, book: { ...purchase.book, ...bookDetails.data } };
                    })
                );

                setPurchases(detailedPurchases);
            } catch (error) {
                console.error("Error fetching profile data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    if (loading) return <div className="text-center text-white"><CircularProgress /></div>;
    if (!user) return <div className="text-center text-red-500"><Alert severity="error">Failed to load user data.</Alert></div>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom align="center">
                Profile
            </Typography>

            {/* User Info */}
            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="h5" component="h2" gutterBottom>
                        User Details
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}><strong>Username:</strong> {user.username}</Grid>
                        <Grid item xs={12} sm={6}><strong>Email:</strong> {user.email}</Grid>
                        <Grid item xs={12} sm={6}><strong>First Name:</strong> {user.first_name || "N/A"}</Grid>
                        <Grid item xs={12} sm={6}><strong>Last Name:</strong> {user.last_name || "N/A"}</Grid>
                        <Grid item xs={12} sm={6}><strong>Location:</strong> {user.location?.city || "Unknown"}</Grid>
                        <Grid item xs={12} sm={6}><strong>Joined:</strong> {new Date(user.joined_date).toLocaleDateString()}</Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Purchased Books Section */}
            <Typography variant="h4" component="h2" gutterBottom>
                Purchased Books
            </Typography>
            <Grid container spacing={4}>
                {purchases.length > 0 ? (
                    purchases.map((purchase) => (
                        <Grid item key={purchase.id} xs={12} sm={6} md={4}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <CardMedia
                                    component="img"
                                    height="140"
                                    image={purchase.book.cover_image || "default-book-image.jpg"}
                                    alt={purchase.book.title}
                                />
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant="h5" component="h3">
                                        {purchase.book.title}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        <strong>Author:</strong> {purchase.book.author}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        <strong>Price:</strong> Rs.{purchase.price}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        <strong>Description:</strong> {purchase.book.description}
                                    </Typography>
                               </CardContent>
                            </Card>
                        </Grid>
                    ))
                ) : (

                    <Typography variant="body1" color="textSecondary" align="center" sx={{ mt: 4 }}> 
                        No purchases yet.
                    </Typography>
                )}
            </Grid>
        </Container>
    );
};

export default ProfilePage;