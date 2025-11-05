# Design Guidelines: Credit Management Application

## Design Approach

**System Selected:** Material Design 3 / Shadcn UI Hybrid
- Rationale: Optimized for data-dense productivity applications with clean component patterns
- Focus: Clarity, efficiency, and professional aesthetic for business users

## Typography System

**Font Families:**
- Primary: Inter (headings, UI elements)
- Secondary: JetBrains Mono (numbers, amounts, transaction IDs)

**Hierarchy:**
- Page Titles: text-3xl font-bold
- Section Headers: text-xl font-semibold
- Card Titles: text-lg font-medium
- Body Text: text-base font-normal
- Captions/Labels: text-sm font-medium
- Data/Numbers: text-lg font-mono

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, and 16 for consistency
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Card gaps: gap-4 to gap-6
- Container margins: mx-4 to mx-8

**Grid Structure:**
- Dashboard: 12-column responsive grid
- Sidebar: Fixed 280px width (desktop), collapsible to icon-only 72px
- Main content: flex-1 with max-w-7xl container

## Core Components

### Dashboard Layout
- **Sidebar Navigation:** Fixed left sidebar with icon + label items, collapsible state
- **Top Bar:** Breadcrumbs, search bar (max-w-md), theme toggle, notifications bell, user profile dropdown
- **Stats Cards:** Grid of 4 cards (grid-cols-1 md:grid-cols-2 lg:grid-cols-4) showing: Total Credits, Paid Amount, Overdue Credits, Active Customers
- **Chart Section:** Full-width card with Chart.js visualizations, tabbed interface for different time periods

### Data Tables
- **Structure:** Sticky header, alternating row hover states, sortable columns
- **Row Actions:** Icon buttons (view, edit, delete) aligned right
- **Pagination:** Bottom-aligned with rows-per-page selector
- **Empty States:** Centered illustration with action button

### Cards & Containers
- **Standard Card:** Rounded corners (rounded-lg), subtle shadow, padding p-6
- **Interactive Cards:** Hover lift effect (subtle transform), border accent on hover
- **Status Badges:** Rounded pill shape (rounded-full px-3 py-1), different variants for paid/pending/overdue

### Forms & Modals
- **Input Fields:** Full-width with floating labels, helper text below, error states with icons
- **Modal Structure:** Centered overlay with backdrop blur, max-w-2xl, padding p-6
- **Form Layout:** Two-column grid (grid-cols-2) for related fields, full-width for text areas
- **Action Buttons:** Right-aligned with primary/secondary hierarchy

### Credit Management Interface
- **Credit Card Component:** 
  - Header: Customer name + status badge
  - Body: Amount (large font-mono), due date, interest rate in two-column layout
  - Progress bar for payment completion (h-2 rounded-full)
  - Footer: Action buttons (Record Payment, View History, Send Reminder)

### Customer Profiles
- **Header Section:** Avatar (96x96 rounded-full), name (text-2xl), contact info (grid layout)
- **Tabs:** Horizontal tabs for Credits, Payments, History
- **Timeline:** Vertical timeline component for payment history with connector lines

## Animations (Minimal & Purposeful)

**Page Transitions:**
- Fade-in on mount: 300ms duration
- Slide-in sidebar: 200ms ease-out

**Interactive States:**
- Button hover: subtle scale (1.02) with 150ms transition
- Card hover: lift with subtle shadow increase
- Modal entry: fade + scale from 0.95 to 1

**Data Updates:**
- Number counter animation on stats cards (when data changes)
- Progress bar smooth fill animation
- Success confetti: Only on payment completion (particles.js, 2s duration, then clear)

## Responsive Behavior

**Breakpoints:**
- Mobile (< 768px): Single column, hamburger menu, collapsed sidebar
- Tablet (768px - 1024px): Two-column grids, persistent sidebar
- Desktop (> 1024px): Full multi-column layouts, expanded sidebar

**Mobile Optimizations:**
- Stats cards stack vertically
- Tables switch to card view
- Sidebar becomes bottom navigation or drawer
- Forms remain single column

## Accessibility Standards

- **ARIA Labels:** All interactive elements properly labeled
- **Keyboard Navigation:** Full tab order, focus visible states with ring-2
- **Color Contrast:** Maintain WCAG AA standards (will be addressed in theme implementation)
- **Screen Reader:** Announce dynamic content updates for credit status changes

## Key Design Principles

1. **Data Clarity:** Numbers and critical information always prominent with monospace font
2. **Action Hierarchy:** Primary actions clearly distinguished from secondary
3. **Progressive Disclosure:** Details revealed on demand, summaries first
4. **Consistent Feedback:** Loading states, success confirmations, error handling visible
5. **Efficient Workflows:** Minimize clicks for common tasks (quick payment recording, customer search)

This design creates a professional, efficient interface optimized for the daily tasks of credit management while maintaining visual appeal through thoughtful spacing, typography, and subtle animations.