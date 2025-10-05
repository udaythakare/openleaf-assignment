# OpenLeaf Assignment

A Node.js application for the OpenLeaf assignment project.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v14 or higher recommended)
- **npm** (Node Package Manager)
- **Database** (PostgreSQL - as per project requirements)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/udaythakare/openleaf-assignment.git
   cd openleaf-assignment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   The project includes a `.env` file with necessary environment variables. Ensure this file is present in the root directory with the required configuration:
   
   ```env
   # Example variables (adjust according to your .env file)
   PORT=3000
   DATABASE_URL=your_database_connection_string
   NODE_ENV=development
   ```

## Database Setup

Run the database migration to set up your database schema:

```bash
npm run migrate
```

This command will create all necessary tables and initial data required for the application.

## Running the Application

### Development Mode

To start the application in development mode with auto-reload:

```bash
npm run dev
```

### Production Mode

To start the application in production mode:

```bash
npm run start
```

The application will start on the port specified in your `.env` file (default: 3000).

## Project Structure

```
openleaf-assignment/
├── node_modules/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── ...
├── .env
├── package.json
└── README.md
```

## Available Scripts

- `npm run dev` - Start the application in development mode
- `npm run start` - Start the application in production mode
- `npm run migrate` - Run database migrations
