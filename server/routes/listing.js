const router = require("express").Router();
const multer = require("multer");

const Listing = require("../models/Listing");
const User = require("../models/User")

/* Configuration Multer for File Upload */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/"); // Store uploaded files in the 'uploads' folder
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});

const upload = multer({ storage });

/* CREATE LISTING */
router.post("/create", upload.array("listingPhotos"), async (req, res) => {
  try {
    /* Take the information from the form */
    const {
      creator,
      category,
      type,
      streetAddress,
      aptSuite,
      city,
      province,
      country,
      guestCount,
      bedroomCount,
      bedCount,
      bathroomCount,
      amenities,
      title,
      description,
      highlight,
      highlightDesc,
      price,
    } = req.body;

    

    const listingPhotos = req.files

    if (!listingPhotos) {
      return res.status(400).send("No file uploaded.")
    }

    const listingPhotoPaths = listingPhotos.map((file) => file.path)

    const newListing = new Listing({
      creator,
      category,
      type,
      streetAddress,
      aptSuite,
      city,
      province,
      country,
      guestCount,
      bedroomCount,
      bedCount,
      bathroomCount,
      amenities,
      listingPhotoPaths,
      title,
      description,
      highlight,
      highlightDesc,
      price,
    })

    await newListing.save()
    console.log("new listing created" , newListing)

    res.status(200).json(newListing)
  } catch (err) {
    res.status(409).json({ message: "Fail to create Listing", error: err.message })
    console.log(err)
  }
});

/* GET lISTINGS BY CATEGORY */
router.get("/", async (req, res) => {
  const qCategory = req.query.category

  try {
    let listings
    if (qCategory) {
      listings = await Listing.find({ category: qCategory }).populate("creator")
    } else {
      listings = await Listing.find().populate("creator")
    }

    res.status(200).json(listings)
  } catch (err) {
    res.status(404).json({ message: "Fail to fetch listings", error: err.message })
    console.log(err)
  }
})

// GET SEARCH SUGGESTIONS
router.get("/search-suggestions", async (req, res) => {
  try {
    const query = req.query.q;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    // Search for listings where the title, city, or category matches the input query
    const listings = await Listing.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { city: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } }
      ]
    }).select("title city category");

    // Extract matched fields and remove duplicates
    const suggestionsSet = new Set();
    listings.forEach(listing => {
      if (listing.title?.toLowerCase().includes(query.toLowerCase())) {
        suggestionsSet.add(listing.title);
      }
      if (listing.city?.toLowerCase().includes(query.toLowerCase())) {
        suggestionsSet.add(listing.city);
      }
      if (listing.category?.toLowerCase().includes(query.toLowerCase())) {
        suggestionsSet.add(listing.category);
      }
    });

    const suggestions = Array.from(suggestionsSet).slice(0, 10); // Limit to 10 suggestions

    res.status(200).json(suggestions);
  } catch (err) {
    console.error("Failed to fetch suggestions:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
});


/* GET LISTINGS BY SEARCH */
/* GET LISTINGS BY SEARCH */
router.get("/search/:search", async (req, res) => {
  const { search } = req.params;

  try {
    let listings = [];

    if (search === "all") {
      listings = await Listing.find().populate("creator");
    } else {
      listings = await Listing.find({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { city: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } }
        ]
      }).populate("creator");
    }

    res.status(200).json(listings);
  } catch (err) {
    console.error("Search failed:", err);
    res.status(500).json({ message: "Failed to fetch listings", error: err.message });
  }
});



/* LISTING DETAILS */
router.get("/:listingId", async (req, res) => {
  try {
    const { listingId } = req.params
    const listing = await Listing.findById(listingId).populate("creator")
    res.status(202).json(listing)
  } catch (err) {
    res.status(404).json({ message: "Listing can not found!", error: err.message })
  }
})

module.exports = router
