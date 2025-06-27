#!/bin/bash

# RECOVR.PRO Deployment Script
echo "🚀 Deploying RECOVR to recovr.pro"
echo "================================="

# Check hosting type
echo "🔍 Checking hosting capabilities..."

# Function to deploy to VPS/Cloud
deploy_to_vps() {
    echo "📋 VPS/Cloud Deployment Instructions for recovr.pro:"
    echo ""
    echo "1. 🌐 Point your domain DNS to your server IP:"
    echo "   - A Record: recovr.pro → YOUR_SERVER_IP"
    echo "   - A Record: www.recovr.pro → YOUR_SERVER_IP"
    echo ""
    echo "2. 📁 Copy your project to the server:"
    echo "   scp -r . user@YOUR_SERVER_IP:/home/user/recovr/"
    echo ""
    echo "3. 🔒 Copy SSL certificates to nginx/ssl/:"
    echo "   - recovr.pro.crt (certificate file)"
    echo "   - recovr.pro.key (private key file)"
    echo ""
    echo "4. 🐳 Deploy with Docker:"
    echo "   cd /home/user/recovr/"
    echo "   cp .env.production .env"
    echo "   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d"
    echo ""
    echo "5. ✅ Access your site:"
    echo "   https://recovr.pro"
}

# Function to deploy to shared hosting
deploy_to_shared() {
    echo "📋 Shared Hosting Deployment for recovr.pro:"
    echo ""
    echo "❌ Docker not available on shared hosting."
    echo "✅ Alternative options:"
    echo ""
    echo "Option 1 - Build static version:"
    echo "  npm run build"
    echo "  npm run export"
    echo "  Upload 'out' folder to public_html"
    echo ""
    echo "Option 2 - Upgrade to VPS hosting"
    echo "Option 3 - Use Vercel/Netlify for frontend + separate backend hosting"
}

# Check what type of hosting user has
echo "❓ What type of hosting do you have?"
echo "1) VPS/Cloud Server (with SSH and Docker support)"
echo "2) Shared hosting (cPanel, limited access)"
echo "3) Not sure"
echo ""
read -p "Choose option (1-3): " hosting_type

case $hosting_type in
    1)
        echo "🎯 Selected: VPS/Cloud Server"
        deploy_to_vps
        ;;
    2)
        echo "🎯 Selected: Shared Hosting"
        deploy_to_shared
        ;;
    3)
        echo "🎯 Let's figure it out..."
        echo ""
        echo "Questions to determine your hosting type:"
        echo "• Can you SSH into your server? (ssh user@server)"
        echo "• Can you install software like Docker?"
        echo "• Do you have root/sudo access?"
        echo ""
        echo "If YES to above → You have VPS/Cloud (choose option 1)"
        echo "If NO to above → You have Shared hosting (choose option 2)"
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "📞 Need help? Common hosting providers:"
echo "• DigitalOcean, Linode, Vultr → VPS (option 1)"
echo "• GoDaddy, Hostgator, Bluehost → Shared (option 2)"
echo "• AWS EC2, Google Cloud, Azure → VPS (option 1)"

echo ""
echo "🎉 Files ready for recovr.pro deployment!"
echo "📁 Configuration files created:"
echo "  ✅ .env.production"
echo "  ✅ docker-compose.prod.yml"
echo "  ✅ nginx/nginx.conf"