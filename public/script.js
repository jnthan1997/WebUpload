async function uploadVideo() {
    const titleInput = document.getElementById('videoTitle').value;
    const videoInput = document.getElementById('videoInput');
    const thumbnailInput = document.getElementById('thumbnailInput');

    if (!titleInput || videoInput.files.length === 0) {
        return alert('Title and video file are required!');
    }

    const formData = new FormData();
    formData.append('title', titleInput);
    formData.append('video', videoInput.files[0]);

    if (thumbnailInput.files.length > 0) {
        formData.append('thumbnail', thumbnailInput.files[0]);
    }

    await fetch('http://localhost:4000/upload', {
        method: 'POST',
        body: formData
    });

    location.reload();
}

async function fetchVideos() {
    const response = await fetch('http://localhost:4000/videos');
    const videos = await response.json();
    const gallery = document.getElementById('videoGallery');
    gallery.innerHTML = '';

    videos.forEach(video => {
        const container = document.createElement('div');
        container.style.marginBottom = '15px';

        const title = document.createElement('h3');
        title.innerText = video.title;
        
        const thumbnail = document.createElement('img');
        thumbnail.src = video.thumbnail ? http://localhost:4000/thumbnail/${video._id} : 'default-thumbnail.jpg';
        thumbnail.width = 150;
        thumbnail.height = 100;
        thumbnail.style.cursor = 'pointer';
        thumbnail.onclick = () => playVideo(video._id);

        container.appendChild(title);
        container.appendChild(thumbnail);
        gallery.appendChild(container);
    });
}

function playVideo(videoId) {
    const player = document.getElementById('videoPlayer');
    player.src = `http://localhost:4000/video/${videoId};`
    player.style.display = 'block';
    player.play();
}

window.onload = fetchVideos;

