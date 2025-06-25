# Docker Deployment Guide for RecovR Lost & Found System

## Overview
This guide explains how to deploy the complete RecovR system using Docker from a fresh GitHub clone.

## System Requirements
- Docker (version 20.10 or later)
- Docker Compose (version 2.0 or later)
- 4GB+ available RAM
- 10GB+ available disk space

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/lost-found-system.git
cd lost-found-system
```

### 2. Environment Setup
Create environment files for production:

#### Frontend Environment (.env.local)
```bash
NODE_ENV=production
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_DETECTION_API_URL=http://localhost:5001
```

#### Backend Environment (spring-backend/.env)
```bash
SPRING_PROFILES_ACTIVE=prod
MYSQL_HOST=database
MYSQL_PORT=3306
MYSQL_DATABASE=recovr_db
MYSQL_USERNAME=recovr_user
MYSQL_PASSWORD=recovr_password
DETECTION_API_URL=http://detection:5001
```

#### Detection Service Environment (python-detection/.env)
```bash
FLASK_ENV=production
YOLO_MODEL_PATH=yolov8n.pt
CONFIDENCE_THRESHOLD=0.5
MAX_FILE_SIZE=50
```

### 3. Deploy with Docker Compose
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Detection Service**: http://localhost:5001
- **Database**: localhost:3307 (MySQL)

## Services Architecture

### Frontend (Next.js)
- **Port**: 3000
- **Technology**: Next.js 15 with TypeScript
- **Features**: Responsive UI, map integration, image upload
- **Build**: Multi-stage Docker build with standalone output

### Backend (Spring Boot)
- **Port**: 8080
- **Technology**: Spring Boot 3.x with Java 17
- **Database**: MySQL 8.0
- **Features**: REST API, JWT authentication, file upload, matching algorithms

### Detection Service (Python/Flask)
- **Port**: 5001
- **Technology**: Python 3.11 with Flask
- **AI Model**: YOLOv8 for object detection
- **Features**: Image analysis, object classification

### Database (MySQL)
- **Port**: 3307 (external), 3306 (internal)
- **Technology**: MySQL 8.0
- **Features**: Persistent storage, automated migrations

## Development vs Production

### Development Mode
```bash
# Start only database and backend
docker-compose up database backend detection

# Run frontend locally
npm install
npm run dev
```

### Production Mode
```bash
# Start all services including Nginx reverse proxy
docker-compose --profile production up -d
```

## Troubleshooting

### Common Issues

#### 1. Port Conflicts
```bash
# Check for port usage
netstat -tulpn | grep -E ':(3000|8080|5001|3307)'

# Stop conflicting services
sudo systemctl stop mysql  # If MySQL is running locally
```

#### 2. Memory Issues
```bash
# Check Docker memory usage
docker stats

# Increase Docker memory limit in Docker Desktop settings
# Recommended: 4GB+ for full system
```

#### 3. Database Connection Issues
```bash
# Check database health
docker-compose exec database mysql -u recovr_user -p recovr_db

# Reset database
docker-compose down -v
docker-compose up database -d
```

#### 4. Build Failures
```bash
# Clean rebuild
docker-compose down
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

### Health Checks
All services include health checks:

```bash
# Check service health
docker-compose ps

# View detailed health status
docker inspect recovr-frontend | grep -A 5 "Health"
docker inspect recovr-backend | grep -A 5 "Health"
docker inspect recovr-detection | grep -A 5 "Health"
docker inspect recovr-database | grep -A 5 "Health"
```

## Maintenance

### Backup Database
```bash
# Create backup
docker-compose exec database mysqldump -u recovr_user -p recovr_db > backup.sql

# Restore backup
docker-compose exec -T database mysql -u recovr_user -p recovr_db < backup.sql
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f detection
docker-compose logs -f database
```

### Scale Services
```bash
# Scale detection service for high load
docker-compose up -d --scale detection=3

# Scale backend for high traffic
docker-compose up -d --scale backend=2
```

## Security Considerations

### Production Deployment
1. **Change default passwords** in docker-compose.yml
2. **Set secure NEXTAUTH_SECRET** environment variable
3. **Configure HTTPS** with proper SSL certificates
4. **Use secrets management** for sensitive data
5. **Regular security updates** for base images

### Network Security
```bash
# Create custom network with encryption
docker network create --driver overlay --opt encrypted recovr-secure

# Update docker-compose.yml to use secure network
```

### File Permissions
```bash
# Ensure proper permissions for uploads
sudo chown -R 1001:1001 uploads/
sudo chmod -R 755 uploads/
```

## Performance Optimization

### Resource Limits
Add to docker-compose.yml:
```yaml
services:
  frontend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
```

### Database Optimization
```sql
-- Connect to database
docker-compose exec database mysql -u recovr_user -p recovr_db

-- Optimize tables
OPTIMIZE TABLE items, users, detected_objects;

-- Check indexes
SHOW INDEX FROM items;
```

## Monitoring

### Container Health
```bash
# Monitor resource usage
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

# Monitor logs in real-time
docker-compose logs -f --tail=100
```

### Application Metrics
- **Frontend**: Next.js analytics at /api/analytics
- **Backend**: Spring Actuator at /actuator/health
- **Detection**: Custom health endpoint at /health

## Support

### Getting Help
1. Check application logs: `docker-compose logs -f`
2. Verify service health: `docker-compose ps`
3. Check resource usage: `docker stats`
4. Review this guide for common solutions

### Reporting Issues
Include the following when reporting issues:
- Docker version: `docker --version`
- Docker Compose version: `docker-compose --version`
- Service logs: `docker-compose logs > logs.txt`
- System specifications (RAM, CPU, OS)

## Contact Information
- **Email**: youssef.azizi@etu.univ-amu.fr
- **Phone**: +33749491042
- **Address**: 22 traverse brun 13016 Marseille

---

*This guide covers the complete Docker deployment process for the RecovR Lost & Found System. For additional support or custom deployment scenarios, please contact the development team.*