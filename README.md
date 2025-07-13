# TMS Passenger Application

A comprehensive student transport management system for passengers. This application allows students to manage their transport bookings, view routes, make payments, submit grievances, and track their transport activities.

## Features

### 🔐 Authentication

- **First-time Login**: Students use their registered email and date of birth for initial setup
- **Password Setup**: Create a secure password during first login
- **Regular Login**: Email and password authentication for subsequent logins
- **Account Security**: Failed login attempt tracking and temporary account locking

### 🏠 Dashboard

- **Overview Cards**: Quick stats showing total trips, spending, upcoming trips, and active issues
- **Transport Status**: Display assigned route information and status
- **Upcoming Bookings**: Next scheduled trips with details
- **Recent Payments**: Payment history overview
- **Notifications**: Important announcements and updates
- **Profile Completion**: Track and complete profile information
- **Quick Actions**: Fast access to common tasks

### 🚌 Transport Routes

- **Available Routes**: Browse all active transport routes
- **Route Details**: Comprehensive information including stops, timings, and fares
- **Assigned Route**: Dedicated section for student's primary route
- **Route Schedules**: View upcoming schedules for any route
- **Search & Filter**: Find routes by name, number, or location

### 📅 Bookings Management

- **Trip Booking**: Book trips on available routes and schedules
- **Booking History**: View all past and upcoming bookings
- **Status Tracking**: Monitor booking confirmation and payment status
- **Filtering**: Filter bookings by status, date, route, or payment status
- **Special Requirements**: Add accessibility or special needs information
- **Cancellation**: Cancel bookings when needed (with policy compliance)

### 💳 Payment Management

- **Payment History**: Complete transaction history with detailed information
- **Payment Stats**: Track spending patterns and outstanding amounts
- **Multiple Payment Methods**: Support for UPI, cards, net banking, wallets, and cash
- **Receipt Download**: Download payment receipts for completed transactions
- **Payment Filtering**: Filter by status, type, date, or amount
- **Pending Payments**: Track and manage outstanding payments

### 📢 Grievances & Feedback

- **Submit Grievances**: Report complaints, suggestions, or compliments
- **Category Selection**: Organize feedback by type (complaint, suggestion, etc.)
- **Priority Levels**: Set urgency level for issues
- **Status Tracking**: Monitor resolution progress
- **Route-Specific**: Link grievances to specific routes or drivers
- **Resolution Tracking**: View admin responses and resolution details

### 🔔 Notifications

- **Real-time Updates**: Receive important announcements and updates
- **Categorized Notifications**: Transport, payment, system, and emergency alerts
- **Targeted Messaging**: Receive notifications relevant to your status
- **Read/Unread Tracking**: Mark notifications as read
- **Action Items**: Some notifications include actionable buttons

### 👤 Profile Management

- **Personal Information**: Manage contact details and emergency contacts
- **Academic Details**: View department, program, and academic information
- **Transport Profile**: View transport status and payment information
- **Password Management**: Change password securely
- **Profile Completion**: Track and complete profile fields
- **Account Settings**: Manage account preferences

## Technology Stack

- **Framework**: Next.js 15 with React 19
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **State Management**: React Hooks
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Supabase project with the TMS database schema
- Environment variables configured

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd passenger
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env.local
   ```

   Update the environment variables:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Database Setup**

   - Ensure the TMS database schema is set up in Supabase
   - Run the passenger authentication setup SQL from `/admin/supabase/10-passenger-auth-setup.sql`
   - Verify Row Level Security policies are enabled

5. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Requirements

The passenger application requires the following database tables and configurations:

### Required Tables

- `students` - Student information and profiles
- `routes` - Transport route details
- `route_stops` - Route stop information
- `bookings` - Trip bookings
- `payments` - Payment transactions
- `grievances` - Student feedback and complaints
- `notifications` - System notifications
- `schedules` - Route schedules
- `departments` - Academic departments
- `programs` - Academic programs
- `institutions` - Institution information

### Authentication Setup

The application uses DOB-based first-time login. Ensure the following fields exist in the `students` table:

- `email` - Student email (unique)
- `date_of_birth` - For first-time authentication
- `password_hash` - Hashed password storage
- `first_login_completed` - Track first login status
- `last_login` - Track login activity
- `failed_login_attempts` - Security tracking
- `account_locked_until` - Account security

### Row Level Security

Enable RLS policies to ensure students can only access their own data:

- Students can view/update their own profile
- Students can view/create their own bookings
- Students can view their own payments
- Students can view/create their own grievances
- Students can view active routes and schedules

## Application Structure

```
passenger/
├── app/                          # Next.js app directory
│   ├── dashboard/               # Protected dashboard routes
│   │   ├── bookings/           # Booking management
│   │   ├── grievances/         # Grievance system
│   │   ├── notifications/      # Notification center
│   │   ├── payments/           # Payment history
│   │   ├── profile/            # Profile management
│   │   ├── routes/             # Route information
│   │   ├── layout.tsx          # Dashboard layout
│   │   └── page.tsx            # Dashboard home
│   ├── login/                  # Authentication
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page
├── lib/                        # Utility libraries
│   ├── supabase.ts            # Database client and helpers
│   └── utils.ts               # Common utilities
├── types/                      # TypeScript type definitions
│   └── index.ts               # Application types
├── middleware.ts              # Route protection
├── package.json               # Dependencies
└── README.md                  # This file
```

## Key Features Implementation

### First-Time Login Flow

1. Student enters registered email and date of birth
2. System verifies email exists and DOB matches
3. Student creates a new secure password
4. Account is marked as `first_login_completed`
5. User is redirected to dashboard

### Booking System

1. Browse available routes and schedules
2. Select trip date and boarding stop
3. Add special requirements if needed
4. Confirm booking (payment required)
5. Receive booking confirmation

### Payment Processing

1. Multiple payment method support
2. Real-time payment status updates
3. Automatic receipt generation
4. Payment history tracking
5. Outstanding amount management

### Grievance Management

1. Categorized complaint submission
2. Priority level assignment
3. Route and driver association
4. Status tracking and updates
5. Admin response viewing

## Security Features

- **Row Level Security**: Database-level access control
- **Authentication**: Secure login with attempt tracking
- **Account Locking**: Temporary lockout after failed attempts
- **Password Requirements**: Strong password enforcement
- **Data Validation**: Input sanitization and validation
- **XSS Protection**: React's built-in XSS protection
- **CSRF Protection**: Next.js built-in CSRF protection

## Performance Optimizations

- **Lazy Loading**: Components and routes loaded on demand
- **Caching**: Efficient data caching strategies
- **Pagination**: Large data sets paginated
- **Debounced Search**: Optimized search functionality
- **Optimistic Updates**: Immediate UI feedback
- **Image Optimization**: Next.js built-in image optimization

## Responsive Design

The application is fully responsive and optimized for:

- **Desktop**: Full feature access with optimal layout
- **Tablet**: Adapted layout for touch interfaces
- **Mobile**: Mobile-first design with touch-friendly controls
- **Accessibility**: WCAG compliant with keyboard navigation

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Implement proper error handling
- Add loading states for async operations

### Component Structure

- Keep components focused and reusable
- Use proper TypeScript interfaces
- Implement proper prop validation
- Handle edge cases gracefully
- Add appropriate ARIA labels

### State Management

- Use React hooks for local state
- Implement proper loading states
- Handle errors gracefully
- Use optimistic updates where appropriate

## Deployment

### Production Build

```bash
npm run build
npm run start
```

### Environment Variables (Production)

Ensure all environment variables are set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Deployment Platforms

- **Vercel**: Recommended for Next.js applications
- **Netlify**: Alternative deployment option
- **Docker**: Container deployment support

## Troubleshooting

### Common Issues

1. **Login Issues**

   - Check if `first_login_completed` is properly set
   - Verify DOB format matches database
   - Check account lock status

2. **Data Loading Issues**

   - Verify Supabase connection
   - Check RLS policies
   - Validate API responses

3. **Permission Errors**
   - Ensure RLS policies are correctly configured
   - Check user session validity
   - Verify student profile exists

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

## Support

For technical support or bug reports:

1. Check the troubleshooting section
2. Review database setup and RLS policies
3. Check browser console for errors
4. Contact system administrator

## License

This project is part of the Transport Management System (TMS) and is proprietary software. Unauthorized copying, modification, or distribution is prohibited.
