# 🐳 RECOVR Docker Deployment Guide

This guide helps you deploy the complete RECOVR system using Docker containers for easy setup on any machine.

## 🚀 Quick Start

### Prerequisites
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **System Requirements**: 
  - 4GB RAM minimum (8GB recommended)
  - 10GB free disk space
  - Modern CPU with 2+ cores

### 1. One-Command Setup

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd lost-found-system

# Start the entire system
./start-recovr.sh
```

That's it! The script will:
- ✅ Check Docker installation
- ✅ Create necessary directories
- ✅ Build all services
- ✅ Start the complete system
- ✅ Check service health

### 2. Access the Application

Once started, access these services:

| Service | URL | Description |
|---------|-----|-------------|
| 🌐 **Frontend** | http://localhost:3000 | Main web application |
| 🔧 **Backend API** | http://localhost:8082 | REST API endpoints |
| 🤖 **AI Detection** | http://localhost:5003 | AI detection service |
| 🗄️ **Database** | localhost:3306 | MySQL database |

## 📋 Services Overview

### Frontend (Next.js)
- **Port**: 3000
- **Technology**: Next.js 15 + TypeScript
- **Features**: Responsive UI, real-time search, AI detection

### Backend (Spring Boot)
- **Port**: 8082
- **Technology**: Spring Boot 3 + Java 17
- **Features**: REST API, authentication, file upload

### AI Detection (Python)
- **Ports**: 5002, 5003
- **Technology**: Python + YOLO v8
- **Features**: Object detection, feature extraction

### Database (MySQL)
- **Port**: 3306
- **Version**: MySQL 8.0
- **Data**: Persistent storage with Docker volumes

## 🛠️ Manual Setup

If you prefer manual control:

```bash
# 1. Create environment file
cp .env.docker .env

# 2. Build and start services
docker-compose up --build -d

# 3. Check status
docker-compose ps

# 4. View logs
docker-compose logs -f
```

## 🔧 Configuration

### Environment Variables

Edit `.env` file to customize:

```env
# Database
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_DATABASE=recovr_db
MYSQL_USER=recovr_user
MYSQL_PASSWORD=your_password

# API URLs
NEXT_PUBLIC_BACKEND_URL=http://localhost:8082
NEXT_PUBLIC_DETECTION_API_URL=http://localhost:5003

# Security (IMPORTANT: Change in production!)
NEXTAUTH_SECRET=your-very-secure-secret
JWT_SECRET=your-jwt-secret
```

### Port Configuration

Default ports (can be changed in `docker-compose.yml`):
- Frontend: 3000
- Backend: 8082  
- AI Detection: 5002, 5003
- Database: 3306

## 📊 Monitoring & Maintenance

### Check System Status
```bash
# View all services
docker-compose ps

# Check specific service logs
docker-compose logs frontend
docker-compose logs backend
docker-compose logs ai-detection
docker-compose logs mysql

# Follow live logs
docker-compose logs -f
```

### Service Management
```bash
# Restart specific service
docker-compose restart frontend

# Stop all services
docker-compose down

# Start services
docker-compose up -d

# Rebuild and restart
docker-compose up --build -d
```

### Health Checks

All services include health checks:
- 🌐 Frontend: `curl http://localhost:3000`
- 🔧 Backend: `curl http://localhost:8082/actuator/health`
- 🤖 AI Detection: `curl http://localhost:5003/health`
- 🗄️ Database: Built-in MySQL health check

## 🗂️ Data Management

### Persistent Data
Data is stored in Docker volumes:
- `mysql_data`: Database files
- `backend_uploads`: Backend uploaded files
- `detection_uploads`: AI detection files
- `detection_models`: YOLO models

### Backup Data
```bash
# Backup database
docker-compose exec mysql mysqldump -u root -p recovr_db > backup.sql

# Backup uploads
docker cp recovr-backend:/app/uploads ./uploads_backup
```

### Reset Data
```bash
# Stop and remove all data
docker-compose down -v

# Start fresh
./start-recovr.sh
```

## 🚨 Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check what's using the port
sudo lsof -i :3000
sudo lsof -i :8082

# Change ports in docker-compose.yml
ports:
  - "3001:3000"  # Use different host port
```

#### Memory Issues
```bash
# Check Docker memory usage
docker stats

# Increase Docker memory limit in Docker Desktop
# or add memory limits in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 2G
```

#### Service Not Starting
```bash
# Check logs for errors
docker-compose logs service-name

# Restart specific service
docker-compose restart service-name

# Rebuild service
docker-compose up --build service-name
```

#### Database Connection Issues
```bash
# Check MySQL logs
docker-compose logs mysql

# Connect to database manually
docker-compose exec mysql mysql -u root -p recovr_db
```

### Clean Installation
```bash
# Complete cleanup
docker-compose down -v --rmi all
docker system prune -a

# Fresh start
./start-recovr.sh
```

## 🔒 Security Notes

### Production Deployment

⚠️ **Important for production:**

1. **Change default passwords** in `.env`
2. **Use HTTPS** with proper SSL certificates
3. **Enable firewall** to restrict access
4. **Update secrets** (NEXTAUTH_SECRET, JWT_SECRET)
5. **Configure reverse proxy** (Nginx included)

### Reverse Proxy Setup

Enable Nginx reverse proxy for production:

```bash
# Start with Nginx
docker-compose --profile production up -d
```

This provides:
- SSL termination
- Load balancing
- Static file serving
- Security headers

## 📈 Performance Optimization

### Resource Limits
```yaml
# In docker-compose.yml
services:
  frontend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          memory: 512M
```

### Image Optimization
```bash
# Use multi-stage builds (already implemented)
# Optimize layer caching with .dockerignore
# Use Alpine images where possible
```

## 🌐 Deployment Options

### Local Development
```bash
./start-recovr.sh
```

### Production Server
```bash
# With reverse proxy
docker-compose --profile production up -d

# With custom configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Cloud Deployment

The Docker setup works on:
- ☁️ **AWS EC2** with Docker
- ☁️ **Google Cloud** Compute Engine  
- ☁️ **Azure** Virtual Machines
- ☁️ **DigitalOcean** Droplets
- ☁️ **Any VPS** with Docker support

## 📞 Support

### Getting Help

1. **Check logs**: `docker-compose logs -f`
2. **Verify health**: All services should show as "healthy"
3. **Check ports**: Ensure no conflicts
4. **Review configuration**: Verify `.env` settings

### Useful Commands

```bash
# System information
docker system info
docker-compose version

# Resource usage
docker stats
docker system df

# Cleanup
docker system prune
docker volume prune
```

---

## 🎉 Success!

If everything is working:
- ✅ All containers show as "healthy"
- ✅ Frontend loads at http://localhost:3000
- ✅ Backend API responds at http://localhost:8082
- ✅ AI detection works at http://localhost:5003

You now have a fully containerized RECOVR system ready for deployment anywhere! 🚀