# RECOVR - Lost & Found Management System

A modern web application for tracking, reporting, and discovering lost and found items using AI-powered object detection and image matching.

## Features

- **Real-time Object Detection**: Automatically track and identify abandoned objects
- **Image-Based Search**: Upload a photo to find matching lost items using AI
- **Text Search**: Search for items by name, description, location, etc.
- **Interactive Map**: View the location of found objects on a map
- **User Authentication**: Secure login and registration system
- **Responsive Design**: Works smoothly on all devices
- **CRUD Operations**: Manage lost and found items with full database integration
- **AI Matching**: Sophisticated image comparison using feature extraction

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, MongoDB, Mongoose
- **Authentication**: NextAuth.js with JWT
- **UI Components**: Radix UI via Shadcn/UI
- **Image Storage**: Cloudinary
- **AI**: TensorFlow.js for image feature extraction and matching
- **Mapping**: Leaflet for interactive maps

## Prerequisites

- Node.js 18+ and npm/pnpm
- MongoDB instance (local or cloud)
- Cloudinary account (for image storage)

## Getting Started

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/lost-found-system.git
cd lost-found-system
```

2. **Install dependencies**

```bash
npm install
# or
pnpm install
```

3. **Set up environment variables**

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Be sure to update the following variables:
- `MONGODB_URI`: Your MongoDB connection string
- `NEXTAUTH_SECRET`: Generate a secure random string
- `CLOUDINARY_*`: Your Cloudinary credentials
- OAuth provider credentials (if using social login)

4. **Run the development server**

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

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