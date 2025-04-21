import React from 'react';
import {
    Container,
    Typography,
    Paper,
    Grid,
    Box,
    Card,
    CardContent,
    Button,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PeopleIcon from '@mui/icons-material/People';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const Home = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const features = [
        {
            icon: <LibraryBooksIcon sx={{ fontSize: 60 }} />,
            title: 'Extensive Book Collection',
            description: 'Access a wide variety of books from different genres shared by our community members.'
        },
        {
            icon: <MonetizationOnIcon sx={{ fontSize: 60 }} />,
            title: 'Affordable Rentals',
            description: 'Rent books at competitive prices set by book owners. Save money while enjoying great reads.'
        },
        {
            icon: <PeopleIcon sx={{ fontSize: 60 }} />,
            title: 'Community Driven',
            description: 'Join a community of book lovers. Share your collection and discover new reads from others.'
        }
    ];

    return (
        <Box sx={{ 
            background: 'linear-gradient(180deg, #f5f7fa 0%, #ffffff 100%)',
            minHeight: '100vh'
        }}>
            <Container>
                {/* Hero Section */}
                <Box sx={{ 
                    py: { xs: 6, md: 12 }, 
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'radial-gradient(circle at center, rgba(25,118,210,0.1) 0%, rgba(255,255,255,0) 70%)',
                        zIndex: 0
                    }} />
                    <Typography 
                        variant={isMobile ? "h3" : "h2"} 
                        component="h1" 
                        gutterBottom
                        sx={{ 
                            fontWeight: 'bold',
                            background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            position: 'relative',
                            zIndex: 1
                        }}
                    >
                        Welcome to  BookBNB
                    </Typography>
                    <Typography 
                        variant={isMobile ? "h6" : "h5"} 
                        color="text.secondary" 
                        paragraph
                        sx={{ 
                            maxWidth: '800px',
                            margin: '0 auto',
                            position: 'relative',
                            zIndex: 1
                        }}
                    >
                        Share your books with others and discover new reads from our community.
                        Rent books at affordable prices or make money by lending your collection.
                    </Typography>
                    <Box sx={{ mt: 4, position: 'relative', zIndex: 1 }}>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => navigate('/books')}
                            sx={{ 
                                mr: 2,
                                mb: isMobile ? 2 : 0,
                                px: 4,
                                py: 1.5,
                                fontSize: '1.1rem',
                                background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                                boxShadow: '0 4px 20px rgba(25,118,210,0.2)',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #1565c0 30%, #1e88e5 90%)',
                                    boxShadow: '0 6px 25px rgba(25,118,210,0.3)'
                                }
                            }}
                            endIcon={<ArrowForwardIcon />}
                        >
                            Browse Books
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            onClick={() => navigate('/my-books')}
                            sx={{ 
                                px: 4,
                                py: 1.5,
                                fontSize: '1.1rem',
                                borderWidth: 2,
                                '&:hover': {
                                    borderWidth: 2
                                }
                            }}
                        >
                            Share Your Books
                        </Button>
                    </Box>
                </Box>

                {/* Features Section */}
                <Box sx={{ py: { xs: 6, md: 12 } }}>
                    <Typography 
                        variant="h4" 
                        component="h2" 
                        gutterBottom 
                        textAlign="center"
                        sx={{ 
                            fontWeight: 'bold',
                            mb: 4
                        }}
                    >
                        How It Works
                    </Typography>
                    <Grid container spacing={4} sx={{ mt: 2 }}>
                        {features.map((feature, index) => (
                            <Grid item xs={12} md={4} key={index}>
                                <Card sx={{ 
                                    height: '100%', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center', 
                                    p: 4,
                                    borderRadius: 4,
                                    background: 'white',
                                    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                                    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow: '0 12px 40px rgba(0,0,0,0.12)'
                                    }
                                }}>
                                    <Box sx={{ 
                                        color: 'primary.main', 
                                        my: 2,
                                        background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent'
                                    }}>
                                        {feature.icon}
                                    </Box>
                                    <CardContent>
                                        <Typography 
                                            variant="h6" 
                                            component="h3" 
                                            gutterBottom 
                                            textAlign="center"
                                            sx={{ 
                                                fontWeight: 'bold',
                                                mb: 2
                                            }}
                                        >
                                            {feature.title}
                                        </Typography>
                                        <Typography 
                                            variant="body1" 
                                            color="text.secondary" 
                                            textAlign="center"
                                            sx={{ 
                                                lineHeight: 1.7
                                            }}
                                        >
                                            {feature.description}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* Steps Section */}
                <Box sx={{ py: { xs: 6, md: 12 } }}>
                    <Typography 
                        variant="h4" 
                        component="h2" 
                        gutterBottom 
                        textAlign="center"
                        sx={{ 
                            fontWeight: 'bold',
                            mb: 4
                        }}
                    >
                        Getting Started
                    </Typography>
                    <Paper sx={{ 
                        p: { xs: 3, md: 6 }, 
                        mt: 4,
                        borderRadius: 4,
                        background: 'white',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.08)'
                    }}>
                        <Grid container spacing={4}>
                            <Grid item xs={12} md={6}>
                                <Typography 
                                    variant="h6" 
                                    gutterBottom
                                    sx={{ 
                                        fontWeight: 'bold',
                                        color: 'primary.main',
                                        mb: 3
                                    }}
                                >
                                    For Renters:
                                </Typography>
                                <Box component="ol" sx={{ 
                                    pl: 2,
                                    '& li': {
                                        mb: 2,
                                        position: 'relative',
                                        pl: 3,
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            left: 0,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)'
                                        }
                                    }
                                }}>
                                    {[
                                        'Browse our collection of available books',
                                        'Select a book and check its rental price',
                                        'Request to rent for your desired duration',
                                        'Coordinate with the owner for pickup/delivery'
                                    ].map((step, index) => (
                                        <li key={index}>
                                            <Typography sx={{ lineHeight: 1.7 }}>
                                                {step}
                                            </Typography>
                                        </li>
                                    ))}
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography 
                                    variant="h6" 
                                    gutterBottom
                                    sx={{ 
                                        fontWeight: 'bold',
                                        color: 'primary.main',
                                        mb: 3
                                    }}
                                >
                                    For Book Owners:
                                </Typography>
                                <Box component="ol" sx={{ 
                                    pl: 2,
                                    '& li': {
                                        mb: 2,
                                        position: 'relative',
                                        pl: 3,
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            left: 0,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)'
                                        }
                                    }
                                }}>
                                    {[
                                        'List your books with descriptions and photos',
                                        'Set your rental price and conditions',
                                        'Review and approve rental requests',
                                        'Manage your rentals and returns'
                                    ].map((step, index) => (
                                        <li key={index}>
                                            <Typography sx={{ lineHeight: 1.7 }}>
                                                {step}
                                            </Typography>
                                        </li>
                                    ))}
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Box>
            </Container>
        </Box>
    );
};

export default Home; 