const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const helmet = require("helmet");

const app = express();
app.use(express.json());

app.use(helmet());

const allowedOrigins = [
  "http://localhost:3000",
  "https://sashakt-child-empowerment.vercel.app",
  "https://sashakt-five.vercel.app/",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use(cors(corsOptions));

// Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit the process if unable to connect to the database
  }
};

connectDB();

// Define the Video model
const videoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
});

const Video = mongoose.model("Video", videoSchema);

// Define the User model
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  cartoon: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  nickname: {
    type: String,
    required: true,
  },
  lastLoginDate: {
    type: Date,
  },
  videos: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
    },
  ],
});
const User = mongoose.model("User", userSchema);

const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  message: String,
});
const Contact = mongoose.model("Contact", contactSchema);

// Route to store user data
app.post("/users", async (req, res) => {
  try {
    const { name, age, nickname, cartoon, username } = req.body;

    // Check if age is within the allowed range (8-16)
    if (age < 8) {
      return res.status(403).json({
        message: "You need to be at least 8 years old to access the website",
      });
    } else if (age > 16) {
      return res
        .status(403)
        .json({ message: "This website is for children aged 8-16" });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ nickname });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this nickname already exists" });
    }

    // Create a new user instance
    const newUser = new User({
      name: name || username,
      age,
      nickname: nickname || username,
      cartoon: cartoon || "default",
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error during user registration:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// Route to post a video
app.post("/videos", async (req, res) => {
  try {
    const { url } = req.body;

    // Create a new video instance
    const newVideo = new Video({ url });

    // Save the video to the database
    await newVideo.save();

    res.status(201).json({ message: "Video posted successfully" });
  } catch (error) {
    console.error("Error during video posting:", error);
    res.status(500).json({ error: "Failed to post video" });
  }
});

// Route for user authentication (Login)
app.post("/authenticate", async (req, res) => {
  try {
    const { nickname } = req.body;

    // Check if the user exists in the database
    const existingUser = await User.findOne({ nickname });

    if (existingUser) {
      // Always allow login and update last login date
      existingUser.lastLoginDate = new Date();
      await existingUser.save();
      res.status(200).json({ success: true });
    } else {
      // User not found
      res.status(404).json({ success: false, message: "Invalid nickname" });
    }
  } catch (error) {
    console.error("Error during nickname authentication:", error);
    res.status(500).json({ success: false, message: "Failed to authenticate" });
  }
});

app.get("/videos", async (req, res) => {
  try {
    // Assuming you have a Video model with a 'url' field
    const video = await Video.findOne(); // You might need to adjust this query based on your data model

    if (video) {
      res.json({ url: video.url });
    } else {
      res.status(404).json({ error: "Video not found" });
    }
  } catch (error) {
    console.error("Error fetching video URL:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to handle form submission
app.post("/contact", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    const contact = new Contact({ name, email, phone, message });
    await contact.save();
    res.status(201).json({ message: "Contact saved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred" });
  }
});

app.get("/", (req, res) => {
  console.log("A new request has been raised on " + new Date(Date.now()));
  res.status(200).send("Hey");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Listening at port ${PORT}`));
