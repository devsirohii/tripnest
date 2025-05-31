import { useEffect, useState } from "react";
import "../styles/ListingDetails.scss";
import { redirect, useNavigate, useParams } from "react-router-dom";
import { facilities } from "../data";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { DateRange } from "react-date-range";
import Loader from "../components/Loader";
import Navbar from "../components/Navbar";
import { useSelector } from "react-redux";
import Footer from "../components/Footer"
import toast from "react-hot-toast";


const ListingDetails = () => {
  const [loading, setLoading] = useState(true);

  const { listingId } = useParams();
  const [listing, setListing] = useState(null);

  const getListingDetails = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/properties/${listingId}`,
        {
          method: "GET",
        }
      );

      const data = await response.json();
      setListing(data);
      setLoading(false);
    } catch (err) {
      console.log("Fetch Listing Details Failed", err.message);
    }
  };

  useEffect(() => {
    getListingDetails();
  }, []);

  console.log(listing)


  /* BOOKING CALENDAR */
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  const handleSelect = (ranges) => {
    // Update the selected date range when user makes a selection
    setDateRange([ranges.selection]);
  };

  const start = new Date(dateRange[0].startDate);
  const end = new Date(dateRange[0].endDate);
  const dayCount = Math.round(end - start) / (1000 * 60 * 60 * 24); // Calculate the difference in day unit

  const customerId = useSelector((state) => state?.user?._id)
  const customerName = useSelector((state) => state?.user?.firstName)
  const customerEmail = useSelector((state) => state?.user?.email)
  const customerContact = useSelector((state) => state?.user?.contactNumber)

  const customer = useSelector((state) => state?.user)
  console.log(customer)

  const navigate = useNavigate()

  const handleSubmit = async () => {
    if (!customerId) {
      toast.error("Please login to book a property!");
      return;
    }
  
    if (customerId === listing.creator._id) {
      toast.error("You cannot book your own property!");
      return;
    }
  
    if (dayCount === 0) {
      toast.error("Please select a valid date range!");
      return;
    }
  
    try {
      // Fetch API key from backend
      const keyResponse = await fetch("http://localhost:3001/payment/paymentKey");
      const { key: api_key } = await keyResponse.json();
  
      // Fetch order from backend
      const orderResponse = await fetch("http://localhost:3001/payment/instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: listing.price * dayCount * 100 }),
      });
  
      const { order } = await orderResponse.json();
      if (!order?.id) {
        throw new Error("Payment order creation failed");
      }
  
      const options = {
        key: api_key,
        amount: listing.price * dayCount * 100,
        currency: "INR",
        name: "Trip Nest",
        description: "Booking Payment",
        image: "/assets/logo.png",
        order_id: order.id,
        handler: async function (response) {
          try {
            // Payment successful, create booking
            const bookingForm = {
              customerId,
              listingId: listing._id,
              hostId: listing.creator._id,
              startDate: dateRange[0].startDate.toDateString(),
              endDate: dateRange[0].endDate.toDateString(),
              totalPrice: listing.price * dayCount,
              paymentId: response.razorpay_payment_id,
            };
  
            const bookingResponse = await fetch("http://localhost:3001/bookings/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(bookingForm),
            });
  
            if (!bookingResponse.ok) {
              throw new Error("Booking creation failed!");
            }
  
            toast.success("Booking successful!");
            navigate(`/${customerId}/trips`);
          } catch (err) {
            console.error("Error saving booking:", err.message);
            toast.error("Booking failed, please contact support.");
          }
        },
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerContact,
        },
        notes: { address: "TripNest Office" },
        theme: { color: "#3399cc" },
      };
  
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
  
    } catch (err) {
      console.error("Payment process failed:", err.message);
      toast.error("Error processing payment. Please try again.");
    }
  };
  



  return loading ? (
    <Loader />
  ) : (
    <>
      <Navbar />

      <div className="listing-details">
        <div className="title">
          <h1>{listing.title}</h1>
          <div></div>
        </div>

        <div className="photos">
          {listing.listingPhotoPaths?.map((item) => (
            <img
              src={`http://localhost:3001/${item.replace("public", "")}`}
              alt="listing photo"
            />
          ))}
        </div>

        <h2>
          {listing.type} in {listing.city}, {listing.province},{" "}
          {listing.country}
        </h2>
        <p>
          {listing.guestCount} guests - {listing.bedroomCount} bedroom(s) -{" "}
          {listing.bedCount} bed(s) - {listing.bathroomCount} bathroom(s)
        </p>
        <hr />

        <div className="profile">
          <img
            src={`http://localhost:3001/${listing.creator.profileImagePath.replace(
              "public",
              ""
            )}`}
          />
          <h3>
            Hosted by {listing.creator.firstName} {listing.creator.lastName}
          </h3>
        </div>
        <hr />

        <h3>Description</h3>
        <p>{listing.description}</p>
        <hr />

        <h3>{listing.highlight}</h3>
        <p>{listing.highlightDesc}</p>
        <hr />

        <div className="booking">
          <div>
            <h2>What this place offers?</h2>
            <div className="amenities">
              {listing.amenities[0].split(",").map((item, index) => (
                <div className="facility" key={index}>
                  <div className="facility_icon">
                    {
                      facilities.find((facility) => facility.name === item)
                        ?.icon
                    }
                  </div>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2>How long do you want to stay?</h2>
            <div className="date-range-calendar">
              <DateRange ranges={dateRange} onChange={handleSelect} />
              {dayCount > 1 ? (
                <h2>
                  Rs. {listing.price} x {dayCount} nights
                </h2>
              ) : (
                <h2>
                  Rs. {listing.price} x {dayCount} night
                </h2>
              )}

              <h2>Total price: Rs. {listing.price * dayCount}</h2>
              <p>Start Date: {dateRange[0].startDate.toDateString()}</p>
              <p>End Date: {dateRange[0].endDate.toDateString()}</p>

              <button className="button" type="submit" onClick={handleSubmit}>
                BOOKING
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ListingDetails;
