import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Typography
} from '@mui/material';
import { getMyRentals, getActiveRentals, returnBook } from '../services/api';

const MyRentals = () => {
    const [activeRentals, setActiveRentals] = useState([]);
    const [pastRentals, setPastRentals] = useState([]);

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

    return (
        <div>
            <div>
                <Typography variant="h4" gutterBottom>
                    My Active Rentals
                </Typography>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Book Title</TableCell>
                                <TableCell>Author</TableCell>
                                <TableCell>Rental Date</TableCell>
                                <TableCell>Return Date</TableCell>
                                <TableCell>Total Price</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {activeRentals.map((rental) => (
                                <TableRow key={`${rental.id || rental.book_id}-${rental.rental_date}`}>
                                    <TableCell>{rental.book.title}</TableCell>
                                    <TableCell>{rental.book.author}</TableCell>
                                    <TableCell>{formatDate(rental.rental_date)}</TableCell>
                                    <TableCell>{formatDate(rental.return_date)}</TableCell>
                                    <TableCell>Rs.{rental.total_price}</TableCell>
                                    <TableCell>{rental.status}</TableCell>
                                    <TableCell>
                                        {rental.status === 'ACTIVE' && (
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={() => handleReturn(rental.id)}
                                            >
                                                Return Book
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
            <div>
                <Typography variant="h4" gutterBottom>
                    All Rentals
                </Typography>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Book Title</TableCell>
                                <TableCell>Author</TableCell>
                                <TableCell>Rental Date</TableCell>
                                <TableCell>Return Date</TableCell>
                                <TableCell>Total Price</TableCell>
                                <TableCell>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pastRentals.map((rental) => (
                                <TableRow key={`${rental.id || rental.book_id}-${rental.rental_date}`}>
                                    <TableCell>{rental.book.title}</TableCell>
                                    <TableCell>{rental.book.author}</TableCell>
                                    <TableCell>{formatDate(rental.rental_start_date)}</TableCell>
                                    <TableCell>{formatDate(rental.rental_end_date)}</TableCell>
                                    <TableCell>Rs.{rental.total_price}</TableCell>
                                    <TableCell>{rental.status}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        </div>
    );
};

export default MyRentals;