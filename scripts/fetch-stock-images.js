const https = require('https');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

// List of Unsplash image URLs relevant to lost and found theme
const images = [
  {
    name: 'hero-image.jpg',
    url: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?q=80&w=1200&auto=format&fit=crop',
    description: 'Person holding a smartphone with AI scanning interface'
  },
  {
    name: 'report-step.jpg',
    url: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=1200&auto=format&fit=crop',
    description: 'Person taking photo of lost item'
  },
  {
    name: 'matching-step.jpg',
    url: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=1200&auto=format&fit=crop',
    description: 'AI pattern matching visualization'
  },
  {
    name: 'recover-step.jpg',
    url: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1200&auto=format&fit=crop',
    description: 'Two people handshaking, item recovery'
  },
  {
    name: 'report-detail.jpg',
    url: 'https://images.unsplash.com/photo-1586473219010-2ffc57b0d282?q=80&w=1200&auto=format&fit=crop',
    description: 'Close-up of filling out forms on mobile'
  },
  {
    name: 'mobile-upload.jpg',
    url: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?q=80&w=1200&auto=format&fit=crop',
    description: 'Person holding mobile phone outdoors'
  },
  {
    name: 'ai-analysis.jpg',
    url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=1200&auto=format&fit=crop',
    description: 'Analytics dashboard visualization'
  },
  {
    name: 'matching-results.jpg',
    url: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=1200&auto=format&fit=crop',
    description: 'Person looking at search results on laptop'
  },
  {
    name: 'handover.jpg',
    url: 'https://images.unsplash.com/photo-1579208570378-8c970854bc23?q=80&w=1200&auto=format&fit=crop',
    description: 'Person receiving a package'
  },
  {
    name: 'notify-step.jpg',
    url: 'https://images.unsplash.com/photo-1596558450268-9c27524ba856?q=80&w=1200&auto=format&fit=crop',
    description: 'Person receiving notification on smartphone'
  }
];

// Function to download an image from URL
const downloadImage = (url, imagePath) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(imagePath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Downloaded: ${imagePath}`);
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(imagePath, () => {}); // Delete the file if there's an error
        reject(err);
      });

    }).on('error', (err) => {
      reject(err);
    });
  });
};

// Download all images
async function downloadAllImages() {
  // Create directory if it doesn't exist
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log('Starting download of stock images...');
  
  for (const image of images) {
    const imagePath = path.join(publicDir, image.name);
    try {
      await downloadImage(image.url, imagePath);
    } catch (error) {
      console.error(`Error downloading ${image.name}:`, error.message);
    }
  }

  console.log('All images downloaded successfully!');
}

// Run the download
downloadAllImages().catch(error => {
  console.error('Error in download process:', error);
}); 