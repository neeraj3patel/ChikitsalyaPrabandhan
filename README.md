# Hospital Management System

A comprehensive Hospital Management System built with MERN stack (MongoDB, Express.js, React, Node.js) featuring role-based access control.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Patient Management**: Register, view, and manage patient records
- **Doctor Management**: Doctor profiles, schedules, and appointments
- **Appointment System**: Book and manage appointments
- **OPD/IPD Records**: Track outpatient and inpatient records
- **Bed Management**: Manage hospital beds and ward allocation
- **Pharmacy**: Medicine inventory management
- **Lab Management**: Lab tests and results
- **Billing**: Generate and manage patient bills

## Roles

- **Admin**: Full system access
- **Doctor**: Appointments, OPD, patients
- **Nurse**: Patient care, beds, IPD
- **Receptionist**: Appointments, patients
- **Lab Technician**: Lab tests management
- **Pharmacist**: Pharmacy inventory
- **Patient**: View own records

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, React Router 6
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
```bash
git clone <repo-url>
cd hospital-management-system
```

2. Install dependencies
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables

**Frontend** (frontend folder):
```bash
cd frontend
cp .env.example .env
# Edit .env and set VITE_API_URL if needed
```

**Backend** (backend folder):
```bash
cd backend
cp .env.example .env
# Edit .env and configure:
# - MONGODB_URI: Your MongoDB connection string
# - JWT_SECRET: A secure random string
# - SEEDER_DEFAULT_PASSWORD: Password for seeded test accounts
```

4. Seed the database (optional - for test data)
```bash
cd backend
npm run seed
```

5. Start the application
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

6. Access the application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Test Accounts (after seeding)

All test accounts use the password set in `SEEDER_DEFAULT_PASSWORD` env variable (default: `password123`)

| Role | Email |
|------|-------|
| Admin | admin@hospital.com |
| Doctor | doctor@hospital.com |
| Patient | patient@hospital.com |
| Nurse | nurse@hospital.com |
| Receptionist | reception@hospital.com |
| Lab | lab@hospital.com |
| Pharmacy | pharmacy@hospital.com |

## Environment Variables

### Frontend (frontend/.env)
```
VITE_API_URL=http://localhost:5000/api
```

### Backend (backend/.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hospital_management
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
MAX_FILE_SIZE=5242880
SEEDER_DEFAULT_PASSWORD=password123
```

## Project Structure

```
hospital-management-system/
├── frontend/          # React frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/           # Node.js backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   └── package.json
├── README.md
└── .gitignore
```

## License

MIT
