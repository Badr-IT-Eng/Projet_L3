# RECOVR - AI-Powered Lost & Found Management System

A comprehensive web application for tracking, reporting, and discovering lost and found items using advanced AI-powered object detection, image matching, and real-time monitoring.

## ✨ Features

### 🤖 AI-Powered Capabilities
- **Real-time Object Detection**: Automatically detect and track abandoned objects using computer vision
- **AI Image Matching**: Upload a photo to find visually similar items using TensorFlow.js and MobileNet
- **Smart Feature Extraction**: Advanced image analysis with cosine similarity matching
- **Confidence Scoring**: AI-driven confidence ratings for match quality

### 🔍 Search & Discovery
- **Image-Based Search**: Upload photos for instant visual matching
- **Text Search**: Search by name, description, location, category
- **Interactive Map**: Geolocation-based item discovery with clustering
- **Advanced Filtering**: Filter by date, category, status, location

### 👥 User Management
- **Role-Based Access**: Admin and user roles with different permissions
- **Admin Dashboard**: Comprehensive management panel with analytics
- **User Authentication**: Secure JWT-based authentication with NextAuth.js
- **User Dashboard**: Personal item tracking and claim management

### 🎛️ Advanced Features
- **Live Detection Interface**: Real-time monitoring with bounding boxes and labels
- **Webcam Integration**: Capture and analyze images directly from camera
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Mode**: Theme switching with system preference detection

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI components
- **State Management**: React Hooks + Context
- **AI/ML**: TensorFlow.js with MobileNet model

### Backend  
- **API**: Spring Boot (Java) + Next.js API routes
- **Database**: MySQL with JPA/Hibernate
- **Authentication**: NextAuth.js + JWT tokens
- **Image Storage**: Cloudinary integration
- **Migration**: Flyway database migrations

### Infrastructure
- **Detection Service**: Python-based computer vision service
- **Real-time Processing**: WebSocket connections for live updates
- **File Upload**: Multipart form handling with validation
- **CORS**: Configured for cross-origin resource sharing

## 📋 Prerequisites

- **Node.js 18+** and npm/yarn/pnpm
- **Java 17+** for Spring Boot backend
- **MySQL 8.0+** database
- **Python 3.8+** for detection service (optional)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/recovr-lost-found.git
cd recovr-lost-found
```

### 2. Database Setup
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE recovr_db;
CREATE USER 'recovr_user'@'localhost' IDENTIFIED BY 'Recovr@2024';
GRANT ALL PRIVILEGES ON recovr_db.* TO 'recovr_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Backend Setup (Spring Boot)
```bash
cd spring-backend
./mvnw spring-boot:run
```
Backend will start on http://localhost:8082

### 4. Frontend Setup (Next.js)
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```
Frontend will start on http://localhost:3000

### 5. Environment Variables
Create `.env.local` with:
```env
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8082
```

### 6. Default Login Credentials
- **Admin**: username: `admin`, password: `admin123`
- **Demo User**: username: `demo_user`, password: `admin123`

## Project Structure

- `/app`: Main application code using Next.js App Router
  - `/api`: API endpoints and serverless functions
  - `/auth`: Authentication-related pages
  - `/dashboard`: Admin dashboard
  - `/lost-objects`: Lost items listing and details
  - `/map`: Interactive map view
  - `/report`: Item reporting form
  - `/search`: Search functionality
- `/components`: Reusable UI components
- `/lib`: Utilities, hooks, and shared functions
  - `/ai`: AI-related code for object detection
  - `/models`: MongoDB schemas
- `/public`: Static assets
- `/styles`: Global styles

## API Endpoints

- `GET /api/lost-objects`: List lost objects with filtering
- `POST /api/lost-objects`: Report a new lost object
- `GET /api/lost-objects/:id`: Get details for a specific object
- `POST /api/upload`: Upload images to Cloudinary
- `POST /api/search/image`: Search by image features
- `POST /api/auth/register`: Register new users

## Development

- **Linting**: `npm run lint`
- **Building**: `npm run build`
- **Testing**: `npm run test`

## Deployment

This application can be deployed on Vercel, Netlify, or any platform supporting Next.js applications.

```bash
npm run build
npm run start
```

## Future Enhancements

- Real-time notifications when matching items are found
- Mobile app integration
- QR code generation for physical tagging
- Enhanced AI object recognition
- Integration with facility security cameras

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 