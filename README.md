# Zoro Rentals

A simple motorbike rental platform where users can register, browse bikes, book rides, pay online, and leave ratings & feedback.

---

## Project Overview

Zoro Rentals is a full-stack web app for renting motorbikes. Key user flows:
- Users: register/login, browse bikes, create bookings, pay, rate and leave feedback.
- Admins: add / update / remove bikes and prices, view bookings and payments.

This repo uses MySQL for data storage and Tailwind CSS for styling.

## Key Features
- Authentication: user registration and login
- Bike CRUD: admins manage bikes and pricing
- Booking & Ride Management: users make, view, and cancel bookings
- Payment Management: process payments and record transactions
- Reviews & Ratings: users submit feedback and ratings
- Contact page, header/footer, and home landing

## Tech Stack
- Backend: Java + Spring Boot (recommended)
  - Spring Boot starters: `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-security`, `spring-boot-starter-validation`
  - Migrations: Flyway or Liquibase
  - Testing: `spring-boot-starter-test`
- Database: MySQL
- Frontend: HTML/CSS + Tailwind CSS
- Optional: Axios / Fetch for API calls

## Database (Suggested Schema)
Below is a compact set of tables to get started. Add indexes and constraints as needed.

- `users`
  - `id` (PK), `name`, `email` (unique), `password_hash`, `phone`, `role` (user|admin), `created_at`
- `bikes`
  - `id` (PK), `title`, `description`, `price_per_hour`, `price_per_day`, `availability_status`, `image_url`, `created_at`
- `bookings`
  - `id` (PK), `user_id` (FK -> users.id), `bike_id` (FK -> bikes.id), `start_time`, `end_time`, `status` (pending|confirmed|in_progress|completed|cancelled), `total_price`, `created_at`
- `payments`
  - `id` (PK), `booking_id` (FK -> bookings.id), `user_id` (FK -> users.id), `amount`, `method`, `status`, `transaction_id`, `created_at`
- `reviews`
  - `id` (PK), `user_id` (FK -> users.id), `bike_id` (FK -> bikes.id), `rating` (1-5), `comment`, `created_at`

## Example API Endpoints (skeleton)
- `POST /api/register` — register a user
- `POST /api/login` — login
- `GET /api/bikes` — list bikes
- `POST /api/bikes` — (admin) create bike
- `PUT /api/bikes/:id` — (admin) update bike
- `DELETE /api/bikes/:id` — (admin) delete bike
- `POST /api/bookings` — create booking
- `GET /api/bookings` — list user bookings
- `POST /api/payments` — create payment for booking
- `POST /api/reviews` — submit review

## Local Development Setup (Spring Boot + Tailwind)

1. Prerequisites

- Java 17 or 21 (LTS)
- Maven or Gradle
- MySQL server
- Node.js + npm (for Tailwind)

2. Clone the repo

```bash
git clone <repo-url>
cd zoro_rentals
```

3. Scaffold a Spring Boot app (choose one)

- Using Spring Initializr web: https://start.spring.io — select Java, Spring Boot 3.x, Maven/Gradle, and add dependencies: Web, JPA, MySQL Driver, Security, Validation, Flyway
- Using curl (example, Maven):

```bash
curl "https://start.spring.io/starter.zip?type=maven-project&language=java&bootVersion=3.2.0&baseDir=zoro-backend&groupId=com.zororentals&artifactId=zoro-backend&name=ZoroRentals&dependencies=web,data-jpa,security,validation,mysql,flyway" -o zoro-backend.zip
unzip zoro-backend.zip -d .
```

4. Configure MySQL connection in `src/main/resources/application.yml` or `application.properties` (use profiles for dev/test):

```yaml
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3306}/${DB_NAME:zoro_rentals}
    username: ${DB_USER:root}
    password: ${DB_PASS:password}
  jpa:
    hibernate:
      ddl-auto: validate # use `update` only for quick dev, prefer migrations
    properties:
      hibernate:
        format_sql: true
flyway:
  enabled: true

```

5. Build and run backend

- Maven

```bash
cd zoro-backend
mvn clean package
mvn spring-boot:run
```

- Gradle

```bash
./gradlew bootRun
```

6. Frontend (Tailwind)

```bash
# from project root (example frontend folder)
cd frontend
npm install
npx tailwindcss -i ./src/input.css -o ./dist/output.css --watch
```

7. Visit application

Open `http://localhost:8080` (default Spring Boot port) or your frontend dev server URL.

## Environment & Configuration
- Store credentials and secrets in `.env` and never commit them.
- Configure payment provider sandbox keys (Stripe/PayPal) for testing.

## Frontend structure (suggestion)
- `src/components/` — Header, Footer, BikeCard, BookingForm
- `src/pages/` — Home, Contact, Bikes, Booking, Admin dashboard
- Use Tailwind utility classes for styling and responsive layout.

## Team Responsibilities
- **Shenal**: Home, Header & Footer, Contact us, User Management
- **Prabodhi**: Bike Management
- **Pathum**: Payment Management
- **Thamadi**: Review & Rating Management
- **Vihangi**: Booking & Ride Management

Include small feature branches for each area and link PRs to tasks.

## Testing & QA
- Add unit tests for critical business logic (pricing, booking overlap rules).
- Test payment flows in sandbox mode.

## Next Steps / Roadmap
- Implement authentication and role-based access control
- Finish bike CRUD and admin dashboard
- Integrate payment provider sandbox
- Add search, filters, and availability calendar

## Contributing
- Create feature branches named `feature/<name>`
- Open pull requests with clear descriptions and assign reviewers

## License
- MIT (or choose your preferred license)

---
If you'd like, I can also scaffold the initial database migration files and a minimal frontend layout with Tailwind. Tell me which backend framework you prefer and I will scaffold accordingly.
