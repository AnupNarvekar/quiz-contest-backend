# Quiz Contest Participation System

#### (Assessment project for TenTwenty)

A Node.js backend application for managing quiz contests with different user roles, real-time leaderboards, and timed questions.

## Features

- User roles (Normal, VIP, Admin, Guest)
- Contest types (Normal and VIP)
- Timed questions with scoring
- Real-time leaderboards
- Prize management
- Comprehensive API with authentication and authorization

## Getting Started

### Installation

Follow any one way as per your preferance

# 1. Using Docker (Recommended)

### Prerequisites

- ### MacOS & Windows
  - Docker desktop (installs docker enginer + compose)

- ### Linux
  - Docker
  - Docker compose (v2)

1. Clone and cd into repository:

   ```
   git clone https://github.com/AnupNarvekar/quiz-contest-backend.git
   cd quiz-contest-backend
   ```

2. Build and start the app:
   ```
   docker compose up --build
   ```

<br>

# 2. The Traditional Way

### Prerequisites

- Node.js (v14 or later)
- MongoDB
- Redis

1. Clone the repository:

   ```
   git clone https://github.com/your-username/quiz-contest-system.git
   cd quiz-contest-system
   ```

2. Install dependencies:

   ```
   npm i
   ```

3. Start the application:
   ```
   npm run start
   ```

4. Seed the database with initial data (in a separate terminal):

   ```
   npm run seed
   ```

### Note:

I've included the .env files in this repository to streamline the project setup process. Since this application is designed for local development, these files do not contain any sensitive information, and are safe to share with your team.

## API Documentation

### Authentication

- **Register**: `POST /api/auth/register`

  - Body: `{ name, email, password }`
  - Response: JWT token and user details

- **Login**: `POST /api/auth/login`
  - Body: `{ email, password }`
  - Response: JWT token and user details

### User Endpoints

- **Get Current User**: `GET /api/users/me`

  - Headers: `Authorization: Bearer <token>`
  - Response: User details

- **Upgrade to VIP**: `POST /api/users/vip`

  - Headers: `Authorization: Bearer <token>`
  - Response: Updated user details

- **Get User Participations**: `GET /api/users/participations`

  - Headers: `Authorization: Bearer <token>`
  - Query Parameters: `page`, `limit`
  - Response: List of user participations

- **Get User Prizes**: `GET /api/users/prizes`
  - Headers: `Authorization: Bearer <token>`
  - Query Parameters: `page`, `limit`
  - Response: List of user prizes

### Contest Endpoints

- **Get All Contests**: `GET /api/contests`

  - Query Parameters: `page`, `limit`, `status`, `type`
  - Response: List of contests (filtered based on user role)

- **Get Single Contest**: `GET /api/contests/:contestId`

  - Headers: `Authorization: Bearer <token>` (required for VIP contests)
  - Response: Contest details

- **Participate in Contest**: `POST /api/contests/:contestId/participate`

  - Headers: `Authorization: Bearer <token>`
  - Response: Participation details

- **Get Contest Leaderboard**: `GET /api/contests/:contestId/leaderboard`

  - Headers: `Authorization: Bearer <token>` (required for VIP contests)
  - Query Parameters: `page`, `limit`
  - Response: Leaderboard entries

- **Submit Answer**: `POST /api/contests/:contestId/submit-answer`

  - Headers: `Authorization: Bearer <token>`
  - Body: `{ questionIndex, selectedOptions }`
  - Response: Result with score update

- **Submit Contest**: `POST /api/contests/:contestId/submit-contest`
  - Headers: `Authorization: Bearer <token>`
  - Response: Final score and submission confirmation

### Admin Endpoints

All admin endpoints require authentication with an admin user.

- **Create Contest**: `POST /api/admin/contests`

  - Headers: `Authorization: Bearer <token>`
  - Body: Contest details with questions
  - Response: Created contest

- **Update Contest**: `PUT /api/admin/contests/:id`

  - Headers: `Authorization: Bearer <token>`
  - Body: Updated contest details
  - Response: Updated contest

- **Delete Contest**: `DELETE /api/admin/contests/:id`

  - Headers: `Authorization: Bearer <token>`
  - Response: Deletion confirmation

- **Cancel Contest**: `PUT /api/admin/contests/:id/cancel`

  - Headers: `Authorization: Bearer <token>`
  - Response: Updated contest with cancelled status

- **Get All Contests (Admin)**: `GET /api/admin/contests`

  - Headers: `Authorization: Bearer <token>`
  - Query Parameters: `page`, `limit`, `status`, `vipOnly`
  - Response: All contests with detailed information

- **Get All Users**: `GET /api/admin/users`

  - Headers: `Authorization: Bearer <token>`
  - Query Parameters: `page`, `limit`, `userType`, `isAdmin`
  - Response: List of users

- **Update User**: `PUT /api/admin/users/:id`

  - Headers: `Authorization: Bearer <token>`
  - Body: `{ name, userType, isAdmin }`
  - Response: Updated user

- **Award Prize**: `POST /api/admin/prizes`

  - Headers: `Authorization: Bearer <token>`
  - Body: `{ userId, contestId, prize }`
  - Response: Prize details

- **Get All Participations**: `GET /api/admin/participations`

  - Headers: `Authorization: Bearer <token>`
  - Query Parameters: `page`, `limit`, `contestId`, `userId`, `submissionState`
  - Response: List of participations

- **Get All Prizes**: `GET /api/admin/prizes`
  - Headers: `Authorization: Bearer <token>`
  - Query Parameters: `page`, `limit`, `contestId`, `userId`
  - Response: List of prizes

## Postman collection
https://documenter.getpostman.com/view/18716978/2sB2j7dVDA