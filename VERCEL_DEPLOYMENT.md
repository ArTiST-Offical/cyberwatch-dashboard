# CyberWatch Dashboard - Vercel Deployment Guide

## Project Structure

This is a monorepo containing:
- **Frontend**: `artifacts/cyber-threat-dashboard` - Vite React application
- **Backend API**: `artifacts/api-server` - Express.js server
- **Shared Libraries**: `lib/` - Shared utilities and types

## Deployment Options

### Option 1: Frontend Only (Recommended for Quick Start)
Deploy just the React dashboard frontend to Vercel.

**Steps:**
1. Push the code to GitHub
2. Connect your GitHub repo to Vercel
3. Set build settings:
   - Build Command: `pnpm run build`
   - Output Directory: `artifacts/cyber-threat-dashboard/dist/public`
   - Install Command: `pnpm install`
4. Run on deployment

**Result:** Static React app deployed at your Vercel domain.

### Option 2: Full Stack (Frontend + Backend)
Deploy both frontend and backend together.

**Prerequisites:**
- Separate Vercel project for the API backend, OR
- Deploy backend to a different service (Render.com, Railway, Heroku, etc.)

**For Backend Deployment (Render.com recommended):**
1. Create an account on Render.com
2. Create a new Web Service
3. Connect your GitHub repo
4. Set build command: `cd artifacts/api-server && npm run build`
5. Set start command: `npm start`
6. Add environment variables:
   - `NODE_ENV`: `production`
   - `PORT`: `3000` (or as needed)
   - Any database connection strings if using a database

### Option 3: Monorepo Full Stack on Vercel
Deploy as a monorepo with separate projects.

**Steps:**
1. Create two separate Vercel projects
2. **Project 1 - Frontend:**
   - Root Directory: `.` (root of monorepo)
   - Build Command: `pnpm run build`
   - Output Directory: `artifacts/cyber-threat-dashboard/dist/public`

3. **Project 2 - Backend:**
   - Root Directory: `.` (root of monorepo)
   - Build Command: `pnpm run build` (builds all)
   - Start Command: `cd artifacts/api-server && npm start`

## Environment Variables

### Frontend (.env for dashboard)
```
VITE_API_URL=https://your-api-domain.com/api  # Backend API URL
```

### Backend (.env for API server)
```
NODE_ENV=production
PORT=3000
DATABASE_URL=your-database-connection-string  # If using a database
```

## Fixed Issues

1. **Port Configuration**: `vite.config.ts` now has sensible defaults
   - `PORT` defaults to `3000`
   - `BASE_PATH` defaults to `/`
   - Both can be overridden via environment variables

2. **Build Configuration**: Updated for Vercel's build system
   - Uses pnpm workspaces correctly
   - Outputs to the correct directory

## Deployment Commands

Local testing:
```bash
# Install dependencies
pnpm install

# Build everything
pnpm run build

# Build just the dashboard
cd artifacts/cyber-threat-dashboard && npm run build

# Build just the API
cd artifacts/api-server && npm run build
```

## Troubleshooting

### Build fails with "PORT environment variable"
- ✅ Fixed: `vite.config.ts` now provides defaults

### Environment variables not loading
- Make sure to set `VITE_*` prefixed variables in Vercel dashboard
- Frontend receives them automatically with the prefix

### API calls fail in production
- Ensure `VITE_API_URL` points to your deployed backend
- Check CORS settings in `artifacts/api-server/src/app.ts`

### Database connection issues
- Set `DATABASE_URL` in backend environment variables
- Verify database is accessible from Vercel infrastructure

## Next Steps

1. **For Quick Start (Frontend Only):**
   - Push to GitHub
   - Connect repo to Vercel
   - Deploy immediately

2. **For Full Stack:**
   - Deploy frontend to Vercel
   - Deploy backend to Render.com or Railway
   - Set `VITE_API_URL` in Vercel to point to backend URL
   - Test API connectivity

3. **Optional Enhancements:**
   - Add GitHub Actions for CI/CD
   - Set up staging environment
   - Add custom domain
   - Configure analytics and monitoring

## Support

For issues:
1. Check Vercel deployment logs
2. Check GitHub workflow logs (if using Actions)
3. Verify environment variables are set correctly
4. Test locally with `pnpm run build` before pushing
