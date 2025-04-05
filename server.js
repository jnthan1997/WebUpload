const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");
const cors = require("cors");
const { Readable } = require("stream");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const mongoUser = process.env.MONGO_USER;
const mongoPassword = process.env.MONGO_PASSWORD;
const mongoHost = process.env.MONGO_HOST;
const mongoPort = process.env.MONGO_PORT;

console.log({
    mongoUser,
    mongoPassword,
    mongoHost,
    mongoPort,
  });


const app = express();
app.use(cors());
app.use(express.static("public"));

// MongoDB connection
const mongoURI = process.env.MONGO_URI || `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/videoDB?authSource=admin`;
const conn = mongoose.createConnection(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

let gfs;
let gridFSBucket;
conn.once("open", () => {
    gridFSBucket = new GridFSBucket(conn.db, { bucketName: "videos" });
    gfs = conn.db.collection("videos.files");
});


// Multer Configuration for Large File Upload
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 * 1024 } });

// Upload video endpoint
app.post("/upload", upload.single("video"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
        // Convert Buffer to Stream
        const readStream = Readable.from(req.file.buffer);
    
    const uploadStream = gridFSBucket.openUploadStream(req.file.originalname, {
      chunkSizeBytes: 1048576, // 1MB chunk size for large files
      metadata: { title: req.body.title },
    });
    readStream.pipe(uploadStream);

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
app.listen(PORT, () => console.log(`Server running on port' ${PORT}`));