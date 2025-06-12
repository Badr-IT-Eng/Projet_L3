const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

// List of SVG files to be created
const svgFiles = [
  'report-step.svg', 
  'matching-step.svg', 
  'recover-step.svg', 
  'notify-step.svg',
  'report-detail.svg',
  'mobile-upload.svg',
  'ai-analysis.svg',
  'matching-results.svg',
  'handover.svg'
];

// Basic template for placeholder SVG
const generatePlaceholderSVG = (title) => `
<svg width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="450" fill="#0f172a"/>
  <rect x="0" y="0" width="800" height="450" fill="url(#grid)" opacity="0.1"/>
  
  <!-- Grid pattern -->
  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f8fafc" stroke-width="0.5" />
    </pattern>
  </defs>
  
  <!-- Text Labels -->
  <rect x="200" y="175" width="400" height="100" rx="8" fill="#1e293b"/>
  <text x="400" y="235" font-family="Arial" font-size="24" fill="#f8fafc" text-anchor="middle">${title}</text>
</svg>
`;

// Create SVG files
svgFiles.forEach(filename => {
  const filePath = path.join(publicDir, filename);
  const title = filename.replace('.svg', '').replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase());
  
  fs.writeFileSync(filePath, generatePlaceholderSVG(title));
  console.log(`Created: ${filename}`);
});

console.log('SVG placeholder generation complete!'); 