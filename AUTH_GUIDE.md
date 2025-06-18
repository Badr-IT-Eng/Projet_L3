# Lost & Found System Authentication Guide

## 🔐 Complete Authentication System

This application uses **NextAuth.js** for frontend authentication and **Spring Security** with **JWT** for backend authentication.

## 🚀 Quick Start

```bash
# Start the complete application
./start_app.sh

# Stop the application
./stop_app.sh
```

## 👥 User Accounts

### Normal User
- **URL**: http://localhost:3000/auth/signin
- **Register**: http://localhost:3000/auth/register

### Creating an Admin User
1. Register a regular user at http://localhost:3000/auth/register
2. Contact system administrator to upgrade your account to admin role
3. Access admin panel at http://localhost:3000/admin

### Test Users
You can create test users:
- Username: `testuser`, Password: `password123` (regular user)
- Username: `admin`, Password: `admin123` (needs admin role assignment)

## 🔧 Authentication Architecture

### Frontend (Next.js + NextAuth)
- **NextAuth.js** for session management
- **Middleware** for route protection
- **Custom hooks** for authentication

### Backend (Spring Boot + JWT)
- **Spring Security** for authentication
- **JWT tokens** for authorization
- **Roles**: ROLE_USER, ROLE_ADMIN

## 📱 Features

### ✅ Authentication
- [x] User login
- [x] User registration
- [x] Route protection via middleware
- [x] Role management (USER/ADMIN)
- [x] Persistent sessions

### ✅ Security
- [x] Hashed passwords (BCrypt)
- [x] Secure JWT tokens
- [x] Client and server validation
- [x] CSRF protection
- [x] Role validation

## 🛣️ Protected Routes

### Public
- `/` - Home page
- `/lost-items` - Browse lost items
- `/found-objects` - Browse found objects  
- `/search` - Search items
- `/auth/signin` - User login
- `/auth/register` - User registration

### Authenticated User
- `/dashboard` - User dashboard
- `/report` - Report lost items

### Admin Only
- `/admin/*` - Administration panel
- `/admin/users` - User management
- `/admin/objects` - Object management

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signin` - Login
- `POST /api/auth/signup` - Registration
- `GET /api/auth/me` - Current user info

### Protected (JWT required)
- `GET /api/lost-objects` - Get lost/found objects
- `POST /api/lost-objects` - Report lost/found object
- `GET /api/user/profile` - User profile
- `PUT /api/user/profile` - Update profile

### Admin Only
- `GET /api/admin/*` - Admin endpoints

## 💻 Using Authentication Hooks

```tsx
import { useSession } from 'next-auth/react'

// Basic usage
const { data: session, status } = useSession()

// Check if user is authenticated
const isAuthenticated = status === "authenticated"

// Check if user is admin
const isAdmin = session?.user?.role === "ROLE_ADMIN"
```

## 🎨 Authentication Components

### AuthForm
```tsx
import { AuthForm } from '@/components/auth/auth-form'

// Login page
<AuthForm type="signin" />

// Registration page
<AuthForm type="register" />
```

## 🔍 Troubleshooting

### Common Issues

1. **Invalid JWT Token**
   - Check that Spring Boot backend is running
   - Check CORS configuration

2. **Session not persistent**
   - Check NEXTAUTH_SECRET in .env
   - Check cookie configuration

3. **Incorrect redirect**
   - Check role logic in middleware
   - Check NextAuth callbacks

### Useful Logs
```bash
# Backend logs
tail -f spring-backend/backend.log

# Frontend logs  
npm run dev

# Check backend status
curl http://localhost:8082/api/auth/signin
```

## 🔄 Authentication Flow

1. **User Login**:
   ```
   Frontend (NextAuth) → Backend (Spring) → JWT Token → Session
   ```

2. **Route Protection**:
   ```
   Middleware → Token verification → Authorization/Redirect
   ```

3. **API Calls**:
   ```
   Frontend → JWT Header → Backend → Validation → Response
   ```

## 📝 Configuration

### Environment Variables (.env.local)
```env
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
BACKEND_URL=http://localhost:8082/api
```

### Spring Boot (application.properties)
```properties
jwt.secret=mySecretKey
jwt.expirationMs=86400000
```

## 🛡️ Security Best Practices

- ✅ Passwords hashed with BCrypt
- ✅ JWT tokens with expiration
- ✅ Client and server validation
- ✅ CSRF protection enabled
- ✅ CORS configured correctly
- ✅ Granular roles and permissions

## 🚀 Getting Started

1. **Start the backend**:
   ```bash
   cd spring-backend
   ./mvnw spring-boot:run
   ```

2. **Start the frontend**:
   ```bash
   npm run dev
   ```

3. **Create a user account**:
   - Go to http://localhost:3000/auth/register
   - Fill in the registration form

4. **Access admin panel**:
   - Register as admin user
   - Contact system admin for role upgrade
   - Access http://localhost:3000/admin