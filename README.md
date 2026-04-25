# Discord Clone

A full-stack MERN application (MongoDB, Express.js, React, Node.js) based on a Discord clone.

## Project Structure

```
/client  → React frontend (Vite)
/server  → Node.js + Express backend
```

## Features

- User authentication with JWT
- MongoDB database with Mongoose
- Clean UI with Tailwind CSS and Radix UI components
- RESTful API
- Error handling middleware
- CORS enabled

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation via MongoDB Compass)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mern-discord-clone
   ```

2. **Install dependencies**
   ```bash
   npm run install
   # or separately:
   # cd server && npm install
   # cd ../client && npm install
   ```

3. **MongoDB Setup**
   - Install MongoDB Compass
   - Start MongoDB service (default port 27017)
   - Create a database named `mern-app`

4. **Environment Variables**
   - Server: Copy `server/.env.example` to `server/.env` and update values
   - Client: Copy `client/.env.example` to `client/.env` and update API URL

## Running the Application

1. **Start both frontend and backend**
   ```bash
   npm run dev
   ```

2. **Or run separately**
   ```bash
   # Terminal 1: Start backend
   npm run dev:server

   # Terminal 2: Start frontend
   npm run dev:client
   ```

3. **Access the application**
   - Frontend: http://localhost:5173 (Vite default)
   - Backend API: http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

## Database Schema

### User
```javascript
{
  username: String (required, unique),
  email: String (required, unique),
  password: String (required, hashed),
  createdAt: Date
}
```

## Technologies Used

- **Frontend**: React, Vite, Tailwind CSS, Radix UI, Axios
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs

## Scripts

- `npm run dev` - Start both client and server in development mode
- `npm run dev:server` - Start only the backend server
- `npm run dev:client` - Start only the frontend client
- `npm run install:all` - Install dependencies for both client and server
