# Exam Pictoring Dashboard

This repository contains the backend and frontend for the Exam Pictoring Dashboard.

## Project Structure
- `Backend/`: Express, MongoDB, Socket.IO server.
- `frontend/`: React + Vite + Tailwind frontend.

---

## Local Setup

### 1. Install Dependencies
Run the following command in the root folder to install dependencies for both the frontend and backend:
```bash
npm run install:all
```

### 2. Configure Environment Variables
- Copy `Backend/.env.example` to `Backend/.env` and fill in your MongoDB and Cloudinary credentials:
  ```bash
  cp Backend/.env.example Backend/.env
  ```
- Copy `frontend/.env.example` to `frontend/.env`:
  ```bash
  cp frontend/.env.example frontend/.env
  ```

### 3. Start Development Servers
Run the following command in the root folder to start both servers concurrently:
```bash
npm run dev
```
- Backend starts at: `http://localhost:4000`
- Frontend starts at: `http://localhost:5173`

---

## Deployment Configuration

When deploying the application:

### Frontend
- Build the production bundle:
  ```bash
  npm run build
  ```
- If deploying frontend on a separate service (e.g. Vercel, Netlify):
  - Set the `VITE_API_URL` environment variable during the build to point to your deployed backend API URL (e.g. `https://my-backend.herokuapp.com/api`).
  - Set the `VITE_SOCKET_URL` environment variable to point to your backend base URL (e.g. `https://my-backend.herokuapp.com`).
  
### Backend
- Configure the following environment variables on your server or hosting provider:
  - `PORT`: Port the server runs on (defaults to 4000).
  - `DB_URL`: Your production MongoDB URI.
  - `SECRET_KEY`: A secure secret string.
  - `ALLOWED_ORIGINS`: Comma-separated list of origins allowed to connect (e.g., `https://my-frontend.vercel.app,http://localhost:5173`).
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Cloudinary integration parameters.

### Single-Server Production (MERN Stack Setup)
If you set `NODE_ENV=production` on the backend, the backend server will automatically serve the built frontend files located in `frontend/dist`. 
To deploy this way:
1. Run `npm run build` to compile the frontend assets.
2. Start the backend with `npm start` (or `node Backend/server.js`).
3. Point your domain directly to the backend port.
