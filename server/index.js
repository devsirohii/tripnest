const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const cors = require("cors");

const authRoutes = require("./routes/auth.js")
const listingRoutes = require("./routes/listing.js")
const bookingRoutes = require("./routes/booking.js")
const userRoutes = require("./routes/user.js")
const paymentRoutes = require("./routes/payment.js")


app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* ROUTES */
app.use("/auth", authRoutes)
app.use("/properties", listingRoutes)
app.use("/bookings", bookingRoutes)
app.use("/users", userRoutes)
app.use("/payment", paymentRoutes)

const PORT = 3001;

/* MONGOOSE SETUP */

const mongoDb = async()=>{
try{
  console.log("start connecting")
  await mongoose.connect(process.env.MONGO_URL
  );
  console.log("mongodb connected");
}
catch(error){
  console.log(`${error},  did not connect`);
}
}
  const startServer =()=>{
    app.listen(PORT, () => console.log(`Server Port: ${PORT}`));
  }

  startServer();
  mongoDb();