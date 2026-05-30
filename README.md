# Kitchen Management SaaS

A comprehensive web application for managing food costs, recipes, and raw ingredients in a professional kitchen environment.

## Features
- **Master List**: Manage all raw ingredients with real-time cost and yield tracking.
- **Recipe Builder**: Construct recipes from ingredients and calculate actual food cost automatically.
- **Role-Based Access Control (RBAC)**: Secure routes based on roles (Executive Chef, Sous Chef, Line Cook).
- **Multi-Tenant System**: Data isolation using JWT Authentication. Each user has their own private workspace.

## Tech Stack
- Frontend: React (Vite), Zustand, TailwindCSS
- Backend: Node.js, Express, Prisma, PostgreSQL
- Security: bcryptjs, jsonwebtoken

## Running Locally

1. Install dependencies:
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```

2. Start the database and backend:
   ```bash
   cd server
   npx prisma db push
   npm run dev
   ```

3. Start the frontend:
   ```bash
   cd client
   npm run dev
   ```
