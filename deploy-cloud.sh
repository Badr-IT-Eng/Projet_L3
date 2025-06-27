#!/bin/bash

# RECOVR Cloud Deployment Script
# This script helps deploy RECOVR to various cloud platforms

echo "☁️ RECOVR Cloud Deployment Helper"
echo "=================================="

# Function to show usage
show_usage() {
    echo "Usage: $0 [platform] [options]"
    echo ""
    echo "Platforms:"
    echo "  aws       - Deploy to AWS EC2"
    echo "  gcp       - Deploy to Google Cloud"
    echo "  azure     - Deploy to Azure"
    echo "  digital   - Deploy to DigitalOcean"
    echo "  local     - Deploy locally"
    echo ""
    echo "Options:"
    echo "  --domain  - Custom domain name"
    echo "  --ssl     - Enable SSL/HTTPS"
    echo "  --help    - Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 aws --domain recovr.mysite.com --ssl"
    echo "  $0 local"
}

# Parse arguments
PLATFORM=""
DOMAIN=""
SSL_ENABLED=false

while [[ $# -gt 0 ]]; do
    case $1 in
        aws|gcp|azure|digital|local)
            PLATFORM="$1"
            shift
            ;;
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --ssl)
            SSL_ENABLED=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

if [ -z "$PLATFORM" ]; then
    echo "❌ Please specify a platform"
    show_usage
    exit 1
fi

echo "🎯 Deploying to: $PLATFORM"
[ ! -z "$DOMAIN" ] && echo "🌐 Domain: $DOMAIN"
[ "$SSL_ENABLED" = true ] && echo "🔒 SSL: Enabled"

# Generate deployment configuration
generate_production_config() {
    echo "📝 Generating production configuration..."
    
    cat > .env.production << EOF
# Production Environment Configuration
MYSQL_ROOT_PASSWORD=$(openssl rand -base64 32)
MYSQL_DATABASE=recovr_db
MYSQL_USER=recovr_user
MYSQL_PASSWORD=$(openssl rand -base64 32)

# Backend Configuration
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/recovr_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=recovr_user
SPRING_DATASOURCE_PASSWORD=\${MYSQL_PASSWORD}

# Frontend Configuration
NEXT_PUBLIC_BACKEND_URL=${DOMAIN:+https://$DOMAIN}/api
NEXT_PUBLIC_DETECTION_API_URL=${DOMAIN:+https://$DOMAIN}/ai
BACKEND_URL=http://backend:8082
DETECTION_API_URL=http://ai-detection:5003

# Security
NEXTAUTH_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

# Domain configuration
DOMAIN=${DOMAIN:-localhost}
SSL_ENABLED=${SSL_ENABLED}
EOF

    echo "✅ Production configuration generated"
}

# Generate Docker Compose override for production
generate_production_compose() {
    echo "📝 Generating production Docker Compose..."
    
    cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  frontend:
    environment:
      - NODE_ENV=production
    restart: always
    
  backend:
    environment:
      - SPRING_PROFILES_ACTIVE=prod
    restart: always
    
  ai-detection:
    restart: always
    
  mysql:
    restart: always
    
  nginx:
    image: nginx:alpine
    container_name: recovr-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    networks:
      - recovr-network
EOF

    echo "✅ Production Docker Compose generated"
}

# Generate Nginx configuration
generate_nginx_config() {
    echo "📝 Generating Nginx configuration..."
    
    mkdir -p nginx
    
    cat > nginx/nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }
    
    upstream backend {
        server backend:8082;
    }
    
    upstream ai-detection {
        server ai-detection:5003;
    }
    
    server {
        listen 80;
        server_name ${DOMAIN:-localhost};
        
        # Redirect HTTP to HTTPS in production
        $([ "$SSL_ENABLED" = true ] && echo "return 301 https://\$server_name\$request_uri;")
        
        # Development configuration
        $([ "$SSL_ENABLED" = false ] && cat << 'DEVCONF'
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        location /api/ {
            proxy_pass http://backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        location /ai/ {
            proxy_pass http://ai-detection/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
DEVCONF
)
    }
    
    $([ "$SSL_ENABLED" = true ] && cat << 'SSLCONF'
    server {
        listen 443 ssl http2;
        server_name DOMAIN_PLACEHOLDER;
        
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        location /api/ {
            proxy_pass http://backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        location /ai/ {
            proxy_pass http://ai-detection/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
SSLCONF
)
}
EOF

    # Replace domain placeholder if SSL is enabled
    if [ "$SSL_ENABLED" = true ] && [ ! -z "$DOMAIN" ]; then
        sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" nginx/nginx.conf
    fi
    
    echo "✅ Nginx configuration generated"
}

# Platform-specific instructions
show_platform_instructions() {
    case $PLATFORM in
        aws)
            echo ""
            echo "🚀 AWS EC2 Deployment Instructions:"
            echo "1. Launch an EC2 instance (t3.medium or larger)"
            echo "2. Install Docker and Docker Compose"
            echo "3. Open ports 80, 443, 3000, 8082 in security group"
            echo "4. Copy this project to the instance"
            echo "5. Run: docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d"
            ;;
        gcp)
            echo ""
            echo "🚀 Google Cloud Deployment Instructions:"
            echo "1. Create a Compute Engine instance (e2-standard-2 or larger)"
            echo "2. Install Docker and Docker Compose"
            echo "3. Configure firewall rules for HTTP/HTTPS"
            echo "4. Copy this project to the instance"
            echo "5. Run: docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d"
            ;;
        azure)
            echo ""
            echo "🚀 Azure Deployment Instructions:"
            echo "1. Create a Virtual Machine (Standard_B2s or larger)"
            echo "2. Install Docker and Docker Compose"
            echo "3. Configure Network Security Group for ports 80, 443"
            echo "4. Copy this project to the VM"
            echo "5. Run: docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d"
            ;;
        digital)
            echo ""
            echo "🚀 DigitalOcean Deployment Instructions:"
            echo "1. Create a Droplet (2GB RAM or larger)"
            echo "2. Install Docker and Docker Compose"
            echo "3. Configure firewall for HTTP/HTTPS"
            echo "4. Copy this project to the droplet"
            echo "5. Run: docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d"
            ;;
        local)
            echo ""
            echo "🚀 Local Deployment:"
            echo "Simply run: ./start-recovr.sh"
            ;;
    esac
}

# Main deployment process
echo ""
echo "🔧 Preparing deployment..."

if [ "$PLATFORM" != "local" ]; then
    generate_production_config
    generate_production_compose
    generate_nginx_config
    
    echo ""
    echo "📦 Deployment files created:"
    echo "  - .env.production"
    echo "  - docker-compose.prod.yml"
    echo "  - nginx/nginx.conf"
    
    show_platform_instructions
    
    echo ""
    echo "🚀 To deploy:"
    echo "1. Copy all files to your server"
    echo "2. Run: cp .env.production .env"
    echo "3. Run: docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d"
    
    if [ "$SSL_ENABLED" = true ]; then
        echo ""
        echo "🔒 SSL Setup:"
        echo "1. Place your SSL certificates in nginx/ssl/"
        echo "   - fullchain.pem (certificate)"
        echo "   - privkey.pem (private key)"
        echo "2. Or use Let's Encrypt with certbot"
    fi
else
    echo "Starting local deployment..."
    ./start-recovr.sh
fi

echo ""
echo "✨ Deployment preparation complete!"