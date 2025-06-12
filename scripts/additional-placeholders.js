const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

// Additional SVG placeholders needed
const additionalSvgs = [
  {
    name: 'matching-step.jpg', // Used in matching tab
    title: 'AI Matching Process',
    color: '#10b981'
  },
  {
    name: 'report-step.jpg', // Used in report tab
    title: 'Report Your Lost Item',
    color: '#3b82f6'
  },
  {
    name: 'recover-step.jpg', // Used in recover tab
    title: 'Recover Your Item', 
    color: '#6366f1'
  },
  {
    name: 'notify-step.jpg', // Used in recover section
    title: 'Notification System',
    color: '#f59e0b'
  }
];

// Generate wide banner placeholder
const generateWideImageSVG = (title, color) => {
  return `<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <linearGradient id="overlay-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(15, 23, 42, 0)" />
      <stop offset="100%" stop-color="rgba(15, 23, 42, 0.8)" />
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" stroke-opacity="0.1" stroke-width="1" />
    </pattern>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  
  <rect width="1200" height="675" fill="url(#bg-gradient)" />
  <rect width="1200" height="675" fill="url(#grid)" />
  
  <!-- Decorative Elements -->
  <circle cx="300" cy="200" r="100" fill="${color}" opacity="0.1" filter="url(#glow)" />
  <circle cx="900" cy="500" r="150" fill="${color}" opacity="0.15" filter="url(#glow)" />
  <circle cx="600" cy="300" r="200" fill="${color}" opacity="0.05" filter="url(#glow)" />
  
  <!-- Title -->
  <rect x="0" y="475" width="1200" height="200" fill="url(#overlay-gradient)" />
  <text x="600" y="550" font-family="Arial" font-size="48" font-weight="bold" fill="white" text-anchor="middle">${title}</text>
  <text x="600" y="600" font-family="Arial" font-size="24" fill="rgba(255,255,255,0.8)" text-anchor="middle">RECOVR - AI-Powered Lost & Found</text>

  <!-- RECOVR Branding -->
  <text x="50" y="50" font-family="Arial" font-size="24" font-weight="bold" fill="${color}">RECOVR</text>
</svg>`;
};

// Create SVG files
additionalSvgs.forEach(({ name, title, color }) => {
  const filePath = path.join(publicDir, name);
  const svgContent = generateWideImageSVG(title, color);
  
  fs.writeFileSync(filePath, svgContent);
  console.log(`Created: ${name}`);
});

console.log('Additional SVG placeholders complete!'); 