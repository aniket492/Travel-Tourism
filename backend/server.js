// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mongodbVSCodePlaygroundDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// Create a Schema
const bookingSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    email: String,
    phone: String,
    checkInDate: Date,
    checkOutDate: Date,
    accommodation: String,
    rooms: Number,
    roomType: String,
    additional: String,
});

// Create a Model
const Booking = mongoose.model('Booking', bookingSchema);

// Helper function to decode accommodation type
function getAccommodationType(accommodationCode) {
    switch ((accommodationCode || '').toLowerCase()) {
        case 'hotel': return 'Hotel 🏨';
        case 'resort': return 'Resort 🏖️';
        case 'villa': return 'Villa 🏡';
        case 'hostel': return 'Hostel 🛌';
        case 'apartment': return 'Apartment 🏢';
        default: return accommodationCode ? accommodationCode : 'Unknown';
    }
}

// Route to receive form data
app.post('/submit-form', async (req, res) => {
    try {
        const bookingData = new Booking({
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            phone: req.body.phone,
            checkInDate: req.body.checkInDate,
            checkOutDate: req.body.checkOutDate,
            accommodation: req.body.accommodation,
            rooms: req.body.rooms,
            roomType: req.body.roomType,
            additional: req.body.additional,
        });

        await bookingData.save();
        res.status(200).send({ message: 'Booking saved successfully!' });
    } catch (error) {
        console.error('Error saving booking:', error);
        res.status(500).send({ message: 'Failed to save booking.' });
    }
});

// Route to get all bookings
app.get('/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ checkInDate: -1 }); // Sort latest first

        let html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>All Bookings</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        margin: 0;
                        padding: 20px;
                        background-color: #f8f9fa;
                    }
                    h1 {
                        text-align: center;
                        color: #343a40;
                        margin-bottom: 30px;
                    }
                    table {
                        border-collapse: collapse;
                        width: 95%;
                        margin: auto;
                        background-color: white;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                        border-radius: 10px;
                        overflow: hidden;
                    }
                    th, td {
                        padding: 15px;
                        text-align: center;
                        border-bottom: 1px solid #dee2e6;
                    }
                    th {
                        background-color: #007bff;
                        color: white;
                        font-size: 16px;
                        letter-spacing: 0.5px;
                    }
                    tr:hover {
                        background-color: #f1f1f1;
                        transition: background-color 0.3s;
                    }
                    tr:last-child td {
                        border-bottom: none;
                    }
                    button {
                        background-color: #dc3545;
                        color: white;
                        border: none;
                        padding: 8px 12px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                        transition: background-color 0.3s;
                    }
                    button:hover {
                        background-color: #c82333;
                    }
                    @media (max-width: 768px) {
                        table, thead, tbody, th, td, tr {
                            display: block;
                        }
                        tr {
                            margin-bottom: 15px;
                        }
                        td {
                            text-align: right;
                            padding-left: 50%;
                            position: relative;
                        }
                        td::before {
                            content: attr(data-label);
                            position: absolute;
                            left: 0;
                            width: 50%;
                            padding-left: 15px;
                            font-weight: bold;
                            text-align: left;
                        }
                    }
                </style>
                <script>
                    async function deleteBooking(id) {
                        if(confirm('Are you sure you want to delete this booking?')) {
                            const response = await fetch('/delete-booking/' + id, { method: 'DELETE' });
                            if(response.ok) {
                                alert('Booking deleted successfully');
                                window.location.reload();
                            } else {
                                alert('Failed to delete booking');
                            }
                        }
                    }
                </script>
            </head>
            <body>
                <h1>Booking Records</h1>
                <table>
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Check-in</th>
                            <th>Check-out</th>
                            <th>Accommodation</th>
                            <th>Room Type</th>
                            <th>Rooms</th>
                            <th>Additional Requests</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        bookings.forEach((booking, index) => {
            html += `
                <tr>
                    <td data-label="S.No">${index + 1}</td>
                    <td data-label="Name">${booking.firstname} ${booking.lastname}</td>
                    <td data-label="Email">${booking.email}</td>
                    <td data-label="Phone">${booking.phone}</td>
                    <td data-label="Check-in">${new Date(booking.checkInDate).toLocaleDateString()}</td>
                    <td data-label="Check-out">${new Date(booking.checkOutDate).toLocaleDateString()}</td>
                    <td data-label="Accommodation">${getAccommodationType(booking.accommodation)}</td>
                    <td data-label="Room Type">${booking.roomType}</td>
                    <td data-label="Rooms">${booking.rooms}</td>
                    <td data-label="Additional">${booking.additional || '-'}</td>
                    <td data-label="Actions">
                        <button onclick="deleteBooking('${booking._id}')">Delete</button>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </body>
            </html>
        `;

        res.send(html);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).send('Failed to fetch bookings.');
    }
});

// Route to delete a booking
app.delete('/delete-booking/:id', async (req, res) => {
    try {
        await Booking.findByIdAndDelete(req.params.id);
        res.status(200).send('Booking deleted successfully');
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).send('Failed to delete booking');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
