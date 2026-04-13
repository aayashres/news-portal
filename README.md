# News Portal

A full-stack news portal application built with Next.js 14, React 18, and MySQL. It features role-based access control with two user types — **Admin** and **Author** — allowing authors to write and manage articles within assigned categories, while admins oversee users and category assignments.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Frontend | React 18, Tailwind CSS 3 |
| Language | TypeScript 5 |
| Database | MySQL |
| ORM | [Prisma 7](https://www.prisma.io/) with `@prisma/adapter-mariadb` |
| Authentication | JWT (jsonwebtoken) + bcryptjs, HTTP-only cookies |

## Features

- **Public** — Browse published articles, filter by category
- **Author Dashboard** — Create, edit, publish/unpublish, and delete own articles (restricted to assigned categories)
- **Admin Dashboard** — View all users, assign categories to authors
- **Authentication** — Login/logout with JWT stored in secure HTTP-only cookies
- **Route Protection** — Middleware-based auth guards for `/admin` and `/author` routes

## Project Structure

```
src/
├── app/
│   ├── api/                        # API Routes (backend)
│   │   ├── auth/
│   │   │   ├── login/route.ts      # POST   - user login
│   │   │   ├── logout/route.ts     # POST   - clear auth cookie
│   │   │   └── verify/route.ts     # GET    - verify JWT token
│   │   ├── articles/
│   │   │   ├── route.ts            # GET    - public articles (with optional category filter)
│   │   │   └── [id]/route.ts       # GET / PUT / DELETE - single article
│   │   ├── author/
│   │   │   ├── articles/
│   │   │   │   ├── route.ts        # GET / POST - author's articles
│   │   │   │   └── [id]/route.ts   # PUT / DELETE - author edits/deletes own article
│   │   │   └── categories/route.ts # GET    - categories assigned to author
│   │   ├── categories/route.ts     # GET    - all categories
│   │   └── admin/
│   │       ├── users/route.ts      # GET    - list all users
│   │       └── assign-category/route.ts # POST - assign category to author
│   ├── admin/                      # Admin dashboard page
│   ├── author/                     # Author dashboard page
│   ├── article/[id]/               # Article detail page
│   ├── login/                      # Login page
│   ├── page.tsx                    # Home page (public article listing)
│   └── layout.tsx                  # Root layout with Navbar + React Query provider
├── components/
│   ├── Navbar.tsx
│   └── ui/Button.tsx
├── lib/
│   ├── prisma.ts                   # Prisma client singleton (with adapter)
│   └── auth.ts                     # JWT + bcrypt utilities
├── providers/
│   └── query-client-provider.tsx   # React Query provider
└── middleware.ts                   # Auth middleware for route protection

prisma/
├── schema.prisma                   # Database schema (models, enums, relations)
├── seed.ts                         # Seed script for default data
└── migrations/                     # Prisma migration files

database/
├── setup.sql                       # Original SQL schema (reference only)
└── update_passwords.sql            # Password hash reference
```

## Prerequisites

- **Node.js** >= 18
- **MySQL** >= 8.0 (running on `localhost:3306`)

## Getting Started

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd news-portal
npm install
```

### 2. Create the MySQL database

Open a MySQL client and run:

```sql
CREATE DATABASE IF NOT EXISTS news_portal;
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
JWT_SECRET=your-secure-random-string-here

DATABASE_URL="mysql://root:your_mysql_password@localhost:3306/news_portal"
```

> `DATABASE_URL` is used by Prisma CLI (migrations). `DB_*` variables are used by the application runtime (Prisma adapter).

### 4. Run database migrations

```bash
npx prisma migrate dev --name init
```

This creates all tables (`users`, `categories`, `author_categories`, `articles`) in your MySQL database.

### 5. Seed default data

```bash
npx prisma db seed
```

This populates the database with:

| User | Role | Password |
|---|---|---|
| `admin` | admin | `admin123` |
| `business_author` | author | `password123` |
| `sports_author` | author | `password123` |
| `tech_author` | author | `password123` |

And three default categories: **Business**, **Sports**, **Technology** — each assigned to their respective author.

### 6. Start the development server

```bash
npm run dev | yarn dev
```

The application will be available at **http://localhost:3000**.

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | - | Login with username/password |
| POST | `/api/auth/logout` | - | Clear auth cookie |
| GET | `/api/auth/verify` | JWT | Verify token and return user |
| GET | `/api/articles` | - | List published articles (optional `?categoryId=`) |
| GET | `/api/articles/:id` | - | Get a single published article |
| GET | `/api/categories` | - | List all categories |
| GET | `/api/author/articles` | JWT | List author's own articles |
| POST | `/api/author/articles` | JWT | Create a new article |
| PUT | `/api/author/articles/:id` | JWT | Update own article |
| DELETE | `/api/author/articles/:id` | JWT | Delete own article |
| GET | `/api/author/categories` | JWT | List author's assigned categories |
| GET | `/api/admin/users` | JWT (admin) | List all users |
| POST | `/api/admin/assign-category` | JWT (admin) | Assign a category to an author |
