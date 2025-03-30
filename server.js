const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = 4000;
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));
// MongoDB Connection
mongoose.connect('mongodb://admin:password@localhost:27018/videoDB?authSource=admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Video Schema
const videoSchema = new mongoose.Schema({
  title: String,
  filename: String,
  contentType: String,
  data: Buffer,
  thumbnail: Buffer, // Store thumbnail image
  thumbnailType: String, // Store thumbnail MIME type
});

const Video = mongoose.model('Video', videoSchema);

const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([{ name: 'video' }, { name: 'thumbnail' }]);


// Upload Video & Thumbnail
app.post('/upload', upload, async (req, res) => {
  try {
    const { title } = req.body;
    const videoFile = req.files.video[0];
    const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

    const newVideo = new Video({
      title,
      filename: videoFile.originalname,
      contentType: videoFile.mimetype,
      data: videoFile.buffer,
      thumbnail: thumbnailFile ? thumbnailFile.buffer : null,
      thumbnailType: thumbnailFile ? thumbnailFile.mimetype : null
    });

    await newVideo.save();
    res.json({ message: 'Video uploaded successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error });
  }
});

// Retrieve Videos (Including Thumbnails & Titles)
app.get('/videos', async (req, res) => {
  try {
    const videos = await Video.find({}, '_id title filename thumbnail thumbnailType');
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching videos', error });
  }
});

// Stream Video
app.get('/video/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    res.set('Content-Type', video.contentType);
    res.send(video.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching video', error });
  }
});

// Retrieve Thumbnail
app.get('/thumbnail/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (video.thumbnail) {
      res.set('Content-Type', video.thumbnailType);
      res.send(video.thumbnail);
    } else {
      res.status(404).json({ message: 'Thumbnail not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching thumbnail', error });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
