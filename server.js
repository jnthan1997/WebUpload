const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");
const cors = require("cors");
const { Readable } = require("stream");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.static("public"));

// MongoDB connection
const mongoURI = process.env.MONGO_URI || "mongodb://admin:password@localhost:27018/videoDB?authSource=admin";
const conn = mongoose.createConnection(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

let gfs;
let gridFSBucket;
conn.once("open", () => {
    gridFSBucket = new GridFSBucket(conn.db, { bucketName: "videos" });
    gfs = conn.db.collection("videos.files");
});

// Multer storage setup (temporary file storage before uploading to GridFS)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload video endpoint
app.post("/upload", upload.single("video"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    
    const uploadStream = gridFSBucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype
    });
    uploadStream.end(req.file.buffer);
    
    uploadStream.on("finish", () => {
        res.json({ message: "Video uploaded successfully!", filename: req.file.originalname });
    });
    
    uploadStream.on("error", (err) => {
        res.status(500).json({ error: err.message });
    });
});

// Serve simple frontend
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port${PORT}`));
