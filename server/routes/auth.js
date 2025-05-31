const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const User = require("../models/User"); // Assuming you have a User model

const router = express.Router();

// Configuration Multer for File Upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../public/uploads/");
    fs.mkdirSync(uploadPath, { recursive: true }); // Create folder if it doesn't exist
    cb(null, uploadPath); // Store uploaded files in the 'uploads' folder
  },
  filename: function (req, file, cb) {
    // Generate a unique filename using timestamp and the original file extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const filename = uniqueSuffix + fileExtension;
    cb(null, filename); // Store file with the unique name
  },
});

const upload = multer({ storage });


router.post("/register", upload.single("profileImage"), async (req, res) => {
  try {
    console.log("File uploaded:", req.file);

    const { firstName, lastName, email, password, contactNumber, countryCode } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No profile image uploaded" });
    }

    // Save the relative path of the uploaded file instead of the absolute path
    const profileImagePath = `/uploads/${req.file.filename}`;  // Use just the relative path from the 'public' folder

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists!" });
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      firstName,
      lastName,
      email,
      contactNumber,
      countryCode,
      password: hashedPassword,
      profileImagePath,  // Save the relative path
    });

    await newUser.save();

    res.status(200).json({
      message: "User registered successfully!",
      user: newUser,
    });
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ message: "Registration failed!", error: err.message });
  }
});



/* USER LOGIN */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    /* Find the user by email */
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(409).json({ message: "User doesn't exist!" });
    }

    /* Check if the password is correct */
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials!" });
    }

    /* Generate a JWT token */
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    
    /* Remove password from the response */
    delete user.password;

    /* Respond with the token and user */
    res.status(200).json({ token, user });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
