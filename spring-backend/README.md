# RECOVR API - Spring Boot Backend

This is the backend API for the RECOVR lost and found system. It provides endpoints for managing lost and found items, user registration, authentication, and claim requests.

## Technologies Used

- Java 17
- Spring Boot 3.1.5
- Spring Security with JWT Authentication
- Spring Data JPA
- PostgreSQL
- Gradle

## Prerequisites

- JDK 17 or higher
- PostgreSQL
- Gradle

## Setup

1. Clone the repository
2. Configure the database:
   - Create a PostgreSQL database named `recovr_db`
   - Update the credentials in `src/main/resources/application.properties` if needed

3. Build the application:
   ```
   ./gradlew build
   ```

4. Run the application:
   ```
   ./gradlew bootRun
   ```

The application will start on port 8080 by default.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate and receive JWT token

### Items
- `GET /api/items/public/lost` - Get all lost items (public)
- `GET /api/items/public/found` - Get all found items (public)
- `GET /api/items/public/search` - Search items (public)
- `GET /api/items/public/{id}` - Get a specific item (public)
- `POST /api/items` - Create a new item (authenticated)
- `PUT /api/items/{id}` - Update an item (authenticated)
- `DELETE /api/items/{id}` - Delete an item (authenticated)
- `GET /api/items/user` - Get current user's items (authenticated)

### Claim Requests
- `GET /api/claims` - Get current user's claim requests (authenticated)
- `GET /api/claims/item/{itemId}` - Get claims for a specific item (authenticated)
- `POST /api/claims` - Create a new claim request (authenticated)
- `PUT /api/claims/{id}` - Update claim request status (authenticated)

### Files
- `POST /api/files/upload` - Upload a single file (authenticated)
- `POST /api/files/upload-multiple` - Upload multiple files (authenticated)
- `GET /api/files/{fileName}` - Download a file (public)
- `DELETE /api/files/{fileName}` - Delete a file (authenticated)

### User Management
- `GET /api/user/profile` - Get current user's profile (authenticated)
- `PUT /api/user/profile` - Update user profile (authenticated)
- `GET /api/user/admin/users` - Get all users (admin only)
- `GET /api/user/admin/users/{id}` - Get a specific user (admin only)

## Security

The API uses JWT for authentication. When a user logs in or registers, a JWT token is generated and should be included in the Authorization header for subsequent requests:

```
Authorization: Bearer <token>
```

## Initial Users

On first startup, the system will create an admin user:
- Username: admin
- Password: admin123

## Folder Structure

```
src/main/java/com/recovr/api/
├── config/              # Configuration classes
├── controller/          # REST controllers
├── dto/                 # Data transfer objects
├── entity/              # JPA entities
├── exception/           # Exception handling
├── repository/          # JPA repositories
├── security/            # Security configuration and JWT utilities
├── service/             # Service layer
└── RecovRApplication.java  # Main class
```

## Environment Variables

You can override the default configuration by setting the following environment variables:

- `SPRING_DATASOURCE_URL` - Database URL
- `SPRING_DATASOURCE_USERNAME` - Database username
- `SPRING_DATASOURCE_PASSWORD` - Database password
- `JWT_SECRET` - Secret key for JWT token signing
- `JWT_EXPIRATION` - JWT token expiration time in milliseconds
- `SERVER_PORT` - Application port 