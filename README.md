# Credit Manager

A modern, professional credit management application built with React, Firebase, and Tailwind CSS.

## Features

- 🔐 **Secure Authentication** - Email/password and Google sign-in with Firebase Auth
- 📊 **Interactive Dashboard** - Real-time analytics with Chart.js visualizations
- 👥 **Customer Management** - Complete CRUD operations for customer profiles
- 💳 **Credit Tracking** - Create and manage customer credits with payment tracking
- 💰 **Payment Recording** - Record partial or full payments with automatic balance calculations
- 🎨 **Modern UI/UX** - Beautiful interface with dark/light theme support
- 📱 **Responsive Design** - Fully responsive for mobile, tablet, and desktop
- ✨ **Smooth Animations** - Framer Motion animations and confetti effects on payment completion

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Firebase (Authentication, Firestore)
- **State Management**: TanStack Query, React Context
- **Charts**: Chart.js, react-chartjs-2
- **Animations**: Framer Motion
- **Icons**: Lucide React, React Icons

## Getting Started

### Prerequisites

- Node.js 20 or higher
- A Firebase project ([Create one here](https://console.firebase.google.com/))

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase:
   - Create a Firebase project
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore database
   - Copy your Firebase configuration

4. Add your Firebase credentials as Replit Secrets:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_PROJECT_ID`

5. Configure Firestore Security Rules (see FIRESTORE_RULES.md)

6. Start the development server:
   ```bash
   npm run dev
   ```

## Firebase Setup

### Firestore Security Rules

Apply the security rules from `FIRESTORE_RULES.md` to your Firestore database to ensure proper data isolation and security.

### Collections Structure

The app uses three main Firestore collections:

1. **customers** - Customer profiles
   - `id`, `name`, `email`, `phone`, `address`, `userId`, `createdAt`

2. **credits** - Credit records
   - `id`, `customerId`, `customerName`, `amount`, `paidAmount`, `remainingAmount`, `interestRate`, `dueDate`, `status`, `userId`, `createdAt`

3. **payments** - Payment records
   - `id`, `creditId`, `customerId`, `amount`, `note`, `userId`, `createdAt`

## Usage

1. **Sign Up/Login**: Create an account or sign in with Google
2. **Add Customers**: Navigate to Customers and add your customer database
3. **Create Credits**: Go to Credits and create new credit entries for customers
4. **Record Payments**: Click "Record Payment" on any credit card to log payments
5. **View Dashboard**: Monitor your credit portfolio with real-time analytics

## Features in Detail

### Dashboard
- Overview statistics: Total credits, paid amount, overdue credits, active customers
- Interactive charts showing monthly trends and balance evolution
- Quick insights into business health

### Customer Management
- Add, edit, and delete customer profiles
- Search and filter customers
- Store contact information and addresses
- Avatar placeholders with initials

### Credit Management
- Create credits with customizable amounts, interest rates, and due dates
- Automatic status calculation (active, overdue, paid)
- Visual progress bars showing payment completion
- Status badges for quick identification

### Payment Recording
- Record partial or full payments
- Add notes to payment records
- Automatic balance recalculation
- Confetti celebration when credit is fully paid!

## Design System

The application follows Material Design 3 principles with:
- Consistent spacing (4, 6, 8, 12, 16 units)
- Typography hierarchy with Inter (UI) and JetBrains Mono (numbers)
- Smooth animations and transitions
- Professional color palette with dark/light modes
- Accessible contrast ratios (WCAG AA)

## Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth, Theme)
│   │   ├── lib/            # Utilities and Firebase config
│   │   ├── pages/          # Page components
│   │   └── App.tsx         # Main app component
├── shared/
│   └── schema.ts           # Shared TypeScript schemas
├── design_guidelines.md    # Design system documentation
└── FIRESTORE_RULES.md      # Firebase security rules
```

## Security

- All Firebase operations require authentication
- Firestore security rules ensure data isolation per user
- Passwords are hashed by Firebase Authentication
- Environment variables protect sensitive configuration

## Contributing

This is a professional credit management tool. Ensure all contributions:
- Follow the existing code style
- Include proper TypeScript types
- Maintain responsive design
- Follow accessibility best practices

## License

MIT License - feel free to use this for your business needs.

## Support

For issues or questions, please create an issue in the repository.
