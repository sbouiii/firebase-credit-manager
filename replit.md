# Credit Manager - Project Documentation

## Overview

Credit Manager is a modern web application for managing customer credits and payments. Built with React, Firebase, and Tailwind CSS, it provides a professional interface for tracking customer debts, recording payments, and analyzing credit portfolio health.

## Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with Shadcn UI components
- **State Management**: TanStack Query for server state, React Context for auth and theme
- **Routing**: Wouter (lightweight React router)
- **Animations**: Framer Motion for smooth transitions
- **Charts**: Chart.js for analytics visualizations

### Backend
- **Authentication**: Firebase Authentication (Email/Password + Google OAuth)
- **Database**: Firebase Firestore (NoSQL document database)
- **Real-time**: Firestore real-time listeners (can be added for live updates)

## Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── AppSidebar.tsx   # Main navigation sidebar
│   │   │   ├── CreditCard.tsx   # Credit display component
│   │   │   ├── StatsCard.tsx    # Dashboard statistics card
│   │   │   ├── ThemeToggle.tsx  # Dark/light mode toggle
│   │   │   └── ui/              # Shadcn UI primitives
│   │   ├── contexts/            # React contexts
│   │   │   ├── AuthContext.tsx  # Firebase auth state
│   │   │   └── ThemeContext.tsx # Theme management
│   │   ├── lib/                 # Utilities and config
│   │   │   ├── firebase.ts      # Firebase initialization
│   │   │   ├── creditUtils.ts   # Credit calculation helpers
│   │   │   └── queryClient.ts   # TanStack Query config
│   │   ├── pages/               # Page components
│   │   │   ├── auth.tsx         # Login/signup page
│   │   │   ├── dashboard.tsx    # Main dashboard
│   │   │   ├── customers.tsx    # Customer management
│   │   │   └── credits.tsx      # Credit management
│   │   ├── App.tsx              # Main app with routing
│   │   └── index.css            # Global styles
│   └── index.html               # HTML entry point
├── shared/
│   └── schema.ts                # TypeScript schemas (Zod)
├── design_guidelines.md         # Design system documentation
├── FIRESTORE_RULES.md          # Firebase security rules
└── README.md                   # User-facing documentation
```

## Key Features

### Authentication
- Email/password registration and login
- Google OAuth integration
- Protected routes with automatic redirects
- User session persistence

### Customer Management
- Create, read, update, delete (CRUD) operations
- Search and filter functionality
- Contact information storage (email, phone, address)
- Avatar placeholders with initials

### Credit Management
- Create credits with amount, due date, interest rate
- Automatic status calculation (active, overdue, paid)
- Payment progress visualization
- Status badges for quick identification

### Payment Recording
- Record partial or full payments
- Automatic balance recalculation
- Payment notes support
- Confetti celebration on full payment
- Payment history tracking

### Dashboard Analytics
- Total credits overview
- Paid amount tracking
- Overdue credits monitoring
- Active customer count
- Chart.js visualizations (bar and line charts)
- Tabbed interface for different time periods

## Data Models

### Customer
```typescript
{
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  userId: string;         // Owner user ID
  createdAt: number;      // Timestamp
}
```

### Credit
```typescript
{
  id: string;
  customerId: string;
  customerName: string;   // Denormalized for performance
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  interestRate?: number;
  dueDate: number;        // Timestamp
  status: "active" | "paid" | "overdue";
  userId: string;         // Owner user ID
  createdAt: number;      // Timestamp
}
```

### Payment
```typescript
{
  id: string;
  creditId: string;
  customerId: string;
  amount: number;
  note?: string;
  userId: string;         // Owner user ID
  createdAt: number;      // Timestamp
}
```

## Firebase Setup

### Required Configuration

1. **Firebase Project**: Create a project at https://console.firebase.google.com/
2. **Authentication**: Enable Email/Password and Google sign-in methods
3. **Firestore Database**: Create a Firestore database in production mode
4. **Security Rules**: Apply rules from FIRESTORE_RULES.md
5. **Authorized Domains**: Add your Replit domain to Firebase Auth settings

### Environment Variables (Replit Secrets)

Required secrets:
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_APP_ID` - Firebase app ID
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID

These are safely exposed to the frontend (they're meant to be public but protected by Firestore security rules).

## Design System

### Colors
- Primary: Blue (#217BF4) for main actions and branding
- Success: Green for paid status
- Destructive: Red for overdue status and delete actions
- Muted: Grays for secondary information

### Typography
- **Headings**: Inter font family
- **Numbers/Data**: JetBrains Mono for better readability
- **Hierarchy**: Clear distinction between page titles, section headers, and body text

### Spacing
- Consistent spacing scale: 4, 6, 8, 12, 16 units
- Component padding: p-4 to p-6
- Card gaps: gap-4 to gap-6

### Components
- All components use Shadcn UI primitives
- Hover states with subtle elevation
- Smooth animations (300ms fade, 200ms slide)
- Loading skeletons for async operations

## Development Workflow

### Running Locally
```bash
npm run dev
```
This starts both the Express server and Vite dev server.

### Adding New Features
1. Define schema in `shared/schema.ts`
2. Create components in `client/src/components/`
3. Implement page in `client/src/pages/`
4. Add route in `client/src/App.tsx`
5. Update Firebase security rules if needed

### Best Practices
- Use TypeScript for type safety
- Validate data with Zod schemas
- Handle loading and error states
- Add data-testid attributes for testing
- Follow design guidelines for consistency
- Keep components focused and reusable

## Security

### Authentication
- Firebase handles password hashing
- JWT tokens for session management
- Automatic token refresh

### Authorization
- Firestore security rules enforce data isolation
- Users can only access their own data (via userId)
- All operations require authentication

### Data Validation
- Client-side validation with Zod
- Firestore security rules validate server-side
- Input sanitization in forms

## Performance Optimizations

### Frontend
- Code splitting with lazy loading
- Optimistic updates for better UX
- Debounced search inputs
- Memoized expensive calculations

### Backend
- Indexed Firestore queries
- Denormalized data (customerName in credits)
- Batch operations where possible

## Future Enhancements (Next Phase)

1. **Automated Reminders**
   - Firebase Cloud Functions for scheduled tasks
   - Email notifications via Nodemailer
   - SMS via Twilio integration
   - Push notifications via FCM

2. **Advanced Reporting**
   - PDF export with pdfmake
   - CSV export for Excel
   - Date range filtering
   - Custom report generation

3. **Real-time Updates**
   - Firestore real-time listeners
   - Live dashboard updates
   - Multi-user collaboration

4. **Customer Portal**
   - Separate login for customers
   - View own credit history
   - Request payment adjustments

## Troubleshooting

### Common Issues

**Authentication errors**
- Check Firebase API keys in secrets
- Verify domain is authorized in Firebase console
- Ensure authentication methods are enabled

**Data not loading**
- Check Firestore security rules
- Verify user is authenticated
- Check browser console for errors

**Build errors**
- Run `npm install` to ensure all packages are installed
- Check for TypeScript errors
- Verify environment variables are set

## Deployment

The app is configured for Replit deployment:
1. Ensure all secrets are set
2. Firebase security rules are applied
3. Click "Deploy" in Replit
4. Add deployment domain to Firebase authorized domains

For production:
- Consider upgrading to Firebase Blaze plan for better performance
- Set up monitoring and error tracking
- Configure custom domain if desired
- Enable Firebase App Check for additional security

## Support

For issues or questions:
1. Check README.md for basic setup
2. Review FIRESTORE_RULES.md for security configuration
3. Consult design_guidelines.md for UI/UX decisions
4. Check Firebase console for backend issues

## Credits

Built with modern web technologies:
- React ecosystem for frontend
- Firebase for backend services
- Shadcn UI for beautiful components
- Chart.js for data visualization
