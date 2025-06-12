const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

// SVG files with enhanced graphics
const enhancedSvgs = [
  {
    name: 'report-step.svg',
    title: 'Report Your Item',
    icon: 'camera',
    color: '#3b82f6'
  },
  {
    name: 'matching-step.svg',
    title: 'AI Matching Process',
    icon: 'search',
    color: '#10b981'
  },
  {
    name: 'recover-step.svg',
    title: 'Recover Your Item',
    icon: 'check-circle',
    color: '#6366f1'
  },
  {
    name: 'notify-step.svg',
    title: 'Notifications',
    icon: 'bell',
    color: '#f59e0b'
  },
  {
    name: 'report-detail.svg',
    title: 'Item Details Form',
    icon: 'clipboard',
    color: '#8b5cf6'
  },
  {
    name: 'mobile-upload.svg',
    title: 'Mobile Upload',
    icon: 'smartphone',
    color: '#ec4899'
  },
  {
    name: 'ai-analysis.svg',
    title: 'AI Image Analysis',
    icon: 'zap',
    color: '#06b6d4'
  },
  {
    name: 'matching-results.svg',
    title: 'Match Results',
    icon: 'layers',
    color: '#14b8a6'
  },
  {
    name: 'handover.svg',
    title: 'Safe Handover',
    icon: 'handshake',
    color: '#2dd4bf'
  }
];

// SVG icon paths
const icons = {
  camera: 'M12 15V17M6 3H18C19.1046 3 20 3.89543 20 5V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V5C4 3.89543 4.89543 3 6 3ZM16 11C16 13.2091 14.2091 15 12 15C9.79086 15 8 13.2091 8 11C8 8.79086 9.79086 7 12 7C14.2091 7 16 8.79086 16 11Z',
  search: 'M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z',
  'check-circle': 'M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z',
  bell: 'M10 15H14C14 16.6569 12.6569 18 11 18C9.34315 18 8 16.6569 8 15H10ZM18 15H6C5.44772 15 5 14.5523 5 14V13.5858C5 13.3212 5.10536 13.0679 5.29289 12.8804L6.41421 11.7591C6.78929 11.384 7 10.8755 7 10.3431V8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8V10.3431C17 10.8755 17.2107 11.384 17.5858 11.7591L18.7071 12.8804C18.8946 13.0679 19 13.3212 19 13.5858V14C19 14.5523 18.5523 15 18 15Z',
  clipboard: 'M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01',
  smartphone: 'M12 18H12.01M8 21H16C17.1046 21 18 20.1046 18 19V5C18 3.89543 17.1046 3 16 3H8C6.89543 3 6 3.89543 6 5V19C6 20.1046 6.89543 21 8 21Z',
  zap: 'M13 10V3L4 14H11L11 21L20 10L13 10Z',
  layers: 'M19 11L12 16.5L5 11M19 5L12 10.5L5 5',
  handshake: 'M9 15L5 11M9 15L11.5 17.5M9 15L5.5 17.5M15 15L19 11M15 15L12.5 17.5M15 15L18.5 17.5M5 5V6C5 7.10457 5.89543 8 7 8H17C18.1046 8 19 7.10457 19 6V5M12 8V13'
};

// Generate enhanced SVG with icon and title
const generateEnhancedSVG = (title, icon, color) => {
  const iconPath = icons[icon] || icons.camera;
  const gradient = `${color}66`;
  
  return `<svg width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <linearGradient id="card-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#334155" />
    </linearGradient>
    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#94a3b8" stroke-opacity="0.1" stroke-width="1" />
    </pattern>
    <radialGradient id="icon-bg" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
      <stop offset="0%" stop-color="${gradient}" />
      <stop offset="100%" stop-color="${color}00" />
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.3" />
    </filter>
  </defs>
  
  <rect width="800" height="450" fill="url(#bg)" />
  <rect width="800" height="450" fill="url(#grid)" />
  
  <g filter="url(#shadow)">
    <rect x="150" y="100" width="500" height="250" rx="16" fill="url(#card-gradient)" />
  </g>
  
  <circle cx="400" cy="200" r="80" fill="url(#icon-bg)" opacity="0.3" />
  <g transform="translate(400, 200) scale(6)">
    <path d="${iconPath}" fill="none" stroke="${color}" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" transform="translate(-12, -12)" />
  </g>
  
  <rect x="200" y="320" width="400" height="50" rx="8" fill="#1e293b" />
  <text x="400" y="355" font-family="Arial" font-size="24" fill="#f8fafc" text-anchor="middle">${title}</text>
  
  <!-- RECOVR branding -->
  <text x="400" y="40" font-family="Arial" font-size="24" font-weight="bold" text-anchor="middle" fill="${color}">RECOVR</text>
</svg>`;
};

// Create SVG files
enhancedSvgs.forEach(({ name, title, icon, color }) => {
  const filePath = path.join(publicDir, name);
  const svgContent = generateEnhancedSVG(title, icon, color);
  
  fs.writeFileSync(filePath, svgContent);
  console.log(`Created: ${name}`);
});

// Also create a logo.svg file
const logoSVG = `<svg width="140" height="40" viewBox="0 0 140 40" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#0ea5e9" />
    </linearGradient>
  </defs>
  <rect x="0" y="8" width="24" height="24" rx="8" fill="url(#logo-gradient)" />
  <path d="M5 20L9 24L19 14" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
  <text x="34" y="28" font-family="Arial" font-size="20" font-weight="bold" fill="#0f172a">RECOVR</text>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'logo.svg'), logoSVG);
console.log('Created: logo.svg');

console.log('Enhanced SVG placeholder generation complete!'); 