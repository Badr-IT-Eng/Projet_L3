const https = require('https');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

// Profile picture URLs from Unsplash
const profilePictures = [
  {
    name: 'user-1.jpg',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=300&auto=format&fit=crop',
    description: 'Alex Johnson profile picture'
  },
  {
    name: 'user-2.jpg',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop',
    description: 'Sarah Chen profile picture'
  },
  {
    name: 'user-3.jpg',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
    description: 'Michael Rodriguez profile picture'
  },
  {
    name: 'user-4.jpg',
    url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=300&auto=format&fit=crop',
    description: 'Emily Watson profile picture'
  },
  {
    name: 'placeholder-user.jpg',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop',
    description: 'Placeholder user profile picture'
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

// Download all profile pictures
async function downloadProfilePictures() {
  // Create directory if it doesn't exist
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log('Starting download of profile pictures...');
  
  for (const picture of profilePictures) {
    const imagePath = path.join(publicDir, picture.name);
    try {
      await downloadImage(picture.url, imagePath);
    } catch (error) {
      console.error(`Error downloading ${picture.name}:`, error.message);
    }
  }

  console.log('All profile pictures downloaded successfully!');
}

// Run the download
downloadProfilePictures().catch(error => {
  console.error('Error in download process:', error);
}); 