# Gaurav Web
A full stack video conferencing web application.

## Deployment

### Frontend on Vercel
- Root directory: `frontend`
- Build command: `npm run build`
- Environment variable:
  - `REACT_APP_SERVER_URL=https://your-backend-name.onrender.com`

### Backend on Render
- Service type: Web Service
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Environment variables:
  - `MONGO_URL`
  - `JWT_SECRET`
  - `FRONTEND_URL=https://your-frontend.vercel.app`

## Security Notes
- Keep real secrets only in platform environment variables, not in committed `.env` files.
- The local [backend/.env](c:/Users/Gaurav%20Giri/OneDrive/Desktop/Zoom-main/Zoom-main/backend/.env) now uses safe development placeholders and localhost defaults.
- Before production deploys, replace placeholder values for `MONGO_URL` and `JWT_SECRET` in Render.

### Health Check
- Backend health endpoint: `/health`
