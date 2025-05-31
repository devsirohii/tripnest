const router = require("express").Router();
const Booking = require("../models/Booking");


/* CREATE BOOKING */
router.post("/create", async (req, res) => {
  try {
    const { customerId, hostId, listingId, startDate, endDate, totalPrice, paymentId } = req.body;

    // Save the new booking
    const newBooking = new Booking({ customerId, hostId, listingId, startDate, endDate, totalPrice, paymentId });
    await newBooking.save();

    res.status(200).json(newBooking);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Failed to create a new Booking!", error: err.message });
  }
});

module.exports = router;
