# Spa Booking App

A modern spa booking application built with React, TypeScript, and Supabase.

## Features

- 🔐 Authentication with Google OAuth and Email/Password
- 📅 Easy appointment booking system
- 🗓️ Calendar integration for availability
- 📧 Email notifications for bookings
- 👤 User dashboard to manage bookings
- 👨‍💼 Admin panel for booking management
- 📱 Fully responsive design

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account (free tier available)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd spa-booking-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings → API to get your project URL and anon key

4. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Set up the database:
   - Go to Supabase SQL Editor
   - Run the migration script from `supabase/migrations/001_initial_schema.sql`

6. Configure Authentication:
   - In Supabase Dashboard, go to Authentication → Providers
   - Enable Email/Password authentication
   - Enable Google OAuth (optional)
   - Add `http://localhost:5173` to Site URL in Authentication → URL Configuration

### Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

### Deployment

The app can be deployed to Vercel:

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## Project Structure

```
spa-booking-app/
├── src/
│   ├── components/     # Reusable components
│   ├── pages/          # Page components
│   ├── layouts/        # Layout components
│   ├── lib/           # Utilities and configs
│   ├── services/      # API services
│   └── types/         # TypeScript types
├── supabase/
│   └── migrations/    # Database migrations
└── public/           # Static assets
```

## Admin Access

To access the admin panel:
1. Sign in with an account using email: `admin@example.com`
2. Navigate to `/admin` to manage all bookings

## Features Roadmap

- [ ] Google Calendar API integration
- [ ] SMS notifications
- [ ] Payment processing
- [ ] Multi-staff scheduling
- [ ] Customer reviews
- [ ] Loyalty program

## License

MIT