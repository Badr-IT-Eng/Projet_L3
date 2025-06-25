# RECOVR - AI-Powered Lost & Found Management System

A comprehensive web application for tracking, reporting, and discovering lost and found items using advanced AI-powered object detection, interactive mapping, and real-time contact facilitation.

## 🌟 Project Principles

- **Privacy First**: User contact information is protected and only shared when users choose to connect
- **Community-Driven**: Connecting people who have lost items with those who have found them
- **AI-Enhanced**: Using computer vision to improve matching accuracy
- **Location-Aware**: Interactive maps for precise location reporting and discovery
- **User-Friendly**: Simple, intuitive interface for all user types
- **Secure & Compliant**: Complete legal framework with privacy policy and terms of service

## ✨ Key Features

### 🤖 AI-Powered Detection
- **Real-time Object Detection**: YOLO-based computer vision for automatic object identification
- **Smart Categorization**: Automatic item classification (bags, electronics, accessories, etc.)
- **Image Analysis**: Advanced feature extraction for visual similarity matching
- **Confidence Scoring**: AI-driven confidence ratings for match accuracy

### 🗺️ Interactive Mapping
- **Location Selection**: Click-to-select map interface for precise location reporting
- **Geolocation Support**: Automatic coordinate capture with address resolution
- **Visual Markers**: Custom map markers for different item types and statuses
- **Area-Based Search**: Find items within specific geographic areas

### 📱 Contact & Communication
- **Secure Contact**: Protected contact information sharing
- **Direct Communication**: Email and phone integration for item recovery
- **Safety Guidelines**: Built-in safety tips for secure item exchanges
- **Contact History**: Track communication attempts and successful recoveries

### 🔍 Advanced Search
- **Text Search**: Search by name, description, location, category
- **Visual Search**: Upload photos for image-based matching
- **Filter Options**: Date range, category, location, and status filters
- **Real-time Results**: Instant search results with live updates

### 👥 User Management
- **Secure Authentication**: NextAuth.js-powered authentication system
- **Role-Based Access**: User and admin roles with appropriate permissions
- **Profile Management**: User profiles with contact preferences
- **Activity Tracking**: Report history and recovery statistics

### 📄 Legal Compliance
- **Privacy Policy**: Comprehensive data protection and privacy guidelines
- **Terms of Service**: Clear usage terms and user responsibilities
- **FAQ Section**: Detailed answers to common questions
- **Contact Information**: Clear support and contact channels

## 🏗️ System Architecture

### Frontend (Next.js 15)
- **Framework**: Next.js 15 with TypeScript
- **UI Library**: shadcn/ui components with Tailwind CSS
- **Authentication**: NextAuth.js with custom providers
- **Maps**: Leaflet with react-leaflet for interactive mapping
- **Forms**: React Hook Form with Zod validation
- **Animations**: Framer Motion for smooth transitions

### Backend (Spring Boot)
- **Framework**: Spring Boot 3.x with Java 17
- **Database**: MySQL 8.0 with Flyway migrations
- **Security**: Spring Security with JWT authentication
- **File Upload**: Multipart file handling with secure storage
- **API Documentation**: OpenAPI 3.0 with Swagger UI

### AI Detection Service (Python)
- **Framework**: Flask-based REST API
- **Computer Vision**: OpenCV with YOLO v8 models
- **Deep Learning**: PyTorch and Ultralytics for object detection
- **Image Processing**: PIL and NumPy for image manipulation
- **Performance**: Optimized for real-time detection

### Infrastructure
- **Containerization**: Docker and Docker Compose
- **Database**: MySQL with persistent volumes
- **Reverse Proxy**: Nginx for production deployment
- **File Storage**: Volume-mounted storage for uploads
- **Health Checks**: Comprehensive service monitoring

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git
- Node.js 18+ (for local development)
- Java 17+ (for local development)
- Python 3.11+ (for local development)

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lost-found-system
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - AI Detection: http://localhost:5001
   - Full system: http://localhost (with nginx)

### Local Development

1. **Database Setup**
   ```bash
   docker-compose up database -d
   ```

2. **Backend (Spring Boot)**
   ```bash
   cd spring-backend
   ./gradlew bootRun
   ```

3. **AI Detection Service**
   ```bash
   cd python-detection
   pip install -r requirements.txt
   python unified_detection_api.py
   ```

4. **Frontend (Next.js)**
   ```bash
   npm install
   npm run dev
   ```

## 📚 API Documentation

### Backend API
- **OpenAPI Spec**: http://localhost:8080/swagger-ui.html
- **Base URL**: http://localhost:8080/api
- **Authentication**: JWT Bearer tokens

### Detection API
- **Health Check**: http://localhost:5001/health
- **Object Detection**: POST /detect
- **Feature Extraction**: POST /features

## 🔧 Configuration

### Environment Variables

#### Frontend (.env.local)
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_DETECTION_API_URL=http://localhost:5001
```

#### Backend (application.properties)
```properties
spring.datasource.url=jdbc:mysql://localhost:3307/recovr_db
spring.datasource.username=recovr_user
spring.datasource.password=recovr_password
detection.api.url=http://localhost:5001
```

#### Detection Service
```bash
YOLO_MODEL_PATH=yolov8n.pt
CONFIDENCE_THRESHOLD=0.5
MAX_FILE_SIZE=50
FLASK_ENV=production
```

## 📂 Project Structure

```
├── app/                    # Next.js application
│   ├── api/               # API routes
│   ├── components/        # Page components
│   └── ...
├── components/            # Shared React components
├── spring-backend/        # Spring Boot backend
│   ├── src/main/java/    # Java source code
│   └── src/main/resources/ # Configuration files
├── python-detection/      # Python AI service
│   ├── unified_detection_api.py
│   └── requirements.txt
├── public/               # Static assets
├── docker-compose.yml    # Container orchestration
└── README.md            # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Contact & Support

- **Email**: youssef.azizi@etu.univ-amu.fr
- **Phone**: +33749491042
- **Address**: 22 traverse brun, 13016 Marseille, France

For technical support, please check the FAQ section in the application or create an issue in the repository.

## 📄 Legal

- [Privacy Policy](http://localhost:3000/privacy) - How we handle your data
- [Terms of Service](http://localhost:3000/terms) - Usage terms and conditions
- [FAQ](http://localhost:3000/faq) - Frequently asked questions

## 🔒 Security

This application implements multiple security measures:
- JWT authentication with secure token handling
- CORS protection for API endpoints
- Input validation and sanitization
- Secure file upload with type checking
- Protected contact information sharing
- SQL injection prevention

## 📈 Performance

- **Frontend**: Optimized with Next.js static generation and caching
- **Backend**: Connection pooling and query optimization
- **AI Service**: Model caching and batch processing
- **Database**: Indexed queries and efficient schemas
- **Images**: Compressed uploads and optimized storage

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Ensure MySQL container is running
   - Check database credentials
   - Verify network connectivity

2. **AI Detection Not Working**
   - Check Python dependencies
   - Verify YOLO model download
   - Ensure sufficient system memory

3. **Map Not Loading**
   - Check internet connectivity
   - Verify Leaflet assets are available
   - Clear browser cache

For more detailed troubleshooting, see the FAQ section or contact support.

---

**RECOVR** - Reuniting people with their lost belongings through the power of AI and community.