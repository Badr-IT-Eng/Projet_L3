# 🚀 Complete Beginner's Guide: Deploy RECOVR to recovr.pro

## Step 1: Check What You Have

### 1.1 Login to Namecheap
1. Go to [namecheap.com](https://namecheap.com)
2. Click "Sign In" 
3. Enter your username/password

### 1.2 Check Your Dashboard
Look for these items and tell me what you see:

**Domain Section:**
- ✅ recovr.pro (you have this)
- Status: Should say "Active"

**Hosting Section:**
- Look for "Stellar" or any hosting plan
- Note the type (Shared, VPS, etc.)

**SSL Section:**
- Look for SSL certificate
- Note if it's active

**Email Section:**
- Any email services

## Step 2: Choose Deployment Method

### Method A: Use Existing Hosting (If you have it)
**Pros:** Use what you already paid for
**Cons:** Limited features, might not support our app

### Method B: Get a VPS (Recommended for beginners)
**Pros:** Full control, supports Docker, easy setup
**Cons:** Extra $5-10/month cost
**Best for:** Modern web applications like RECOVR

## Step 3: VPS Setup (Recommended Path)

### 3.1 Get a VPS (I recommend DigitalOcean)
1. Go to [digitalocean.com](https://digitalocean.com)
2. Sign up with email
3. Create a "Droplet" (their term for VPS):
   - **Size:** Basic ($6/month)
   - **OS:** Ubuntu 22.04
   - **RAM:** 1GB (sufficient for start)

### 3.2 Connect Your Domain
1. In DigitalOcean, get your server IP (like 123.456.789.123)
2. In Namecheap, go to Domain management
3. Set DNS records:
   - A Record: @ → YOUR_SERVER_IP
   - A Record: www → YOUR_SERVER_IP

### 3.3 Setup Server
```bash
# Connect to your server
ssh root@YOUR_SERVER_IP

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone your project
git clone YOUR_PROJECT_URL
cd recovr
```

### 3.4 Deploy Your App
```bash
# Copy production config
cp .env.production .env

# Start your application
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check if running
docker-compose ps
```

### 3.5 Setup SSL (Free with Let's Encrypt)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d recovr.pro -d www.recovr.pro

# Restart your app
docker-compose restart
```

## Step 4: Alternative - Shared Hosting Path

### 4.1 If You Have Shared Hosting
1. Check if it supports Node.js
2. If not, we'll build a static version
3. Upload to public_html folder

### 4.2 Build Static Version
```bash
# On your local machine
npm run build
npm run export

# Upload the 'out' folder contents to your hosting
```

## Step 5: Testing Your Deployment

### 5.1 Check Your Website
1. Go to https://recovr.pro
2. Should see your RECOVR homepage
3. Test login/registration
4. Test item reporting

### 5.2 If Something's Wrong
```bash
# Check logs
docker-compose logs

# Restart services
docker-compose restart

# Check service status
docker-compose ps
```

## Quick Decision Tree

**Answer these questions:**

1. **Do you have Namecheap hosting?** 
   - Yes → Check if it supports Node.js/Docker
   - No → Get a VPS ($5-10/month)

2. **Are you comfortable with $5-10/month for VPS?**
   - Yes → Use VPS method (easier, more powerful)
   - No → Try shared hosting limitations

3. **Do you want the easiest setup?**
   - Yes → VPS with DigitalOcean
   - No → Work with hosting limitations

## My Recommendation for You

**As a complete beginner:**
1. ✅ Get DigitalOcean VPS ($6/month)
2. ✅ Point recovr.pro to VPS
3. ✅ Deploy with Docker (one command)
4. ✅ Get free SSL certificate
5. ✅ Your app is live!

This path is:
- **Fastest** to set up
- **Most reliable**
- **Easiest** to maintain
- **Professional** setup

## Next Steps

**Tell me:**
1. What do you see in your Namecheap dashboard?
2. Are you okay spending $5-10/month for VPS hosting?
3. Do you want me to walk you through the VPS setup?

Then I'll give you **exact commands** to copy and paste! 🚀