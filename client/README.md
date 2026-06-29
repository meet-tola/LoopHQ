# Minimalist Slack Clone

A clean, modern Slack clone built with React 19, Next.js 16, and TanStack Query. Features a responsive design optimized for mobile, tablet, and desktop experiences.

## Features

### Core Features
- **Real-time Messaging**: Send and receive messages with reactions
- **Channels**: Organize conversations in channels
- **Direct Messages**: Private conversations between users
- **Threads**: Reply to specific messages in threads
- **Reactions**: Add emoji reactions to messages
- **User Profiles**: View user information and status
- **Search**: Find messages and conversations

### Responsive Design
- **Mobile-first approach**: Optimized for small screens
- **Three-breakpoint responsive**: Mobile (<640px), Tablet (640-1024px), Desktop (>1024px)
- **Adaptive Sidebars**: Compact sidebar always visible, expanded sidebar toggles as overlay on mobile/tablet
- **Touch-friendly**: Optimized for touch interactions on mobile devices

### UI/UX
- **Minimalist Design**: Clean, distraction-free interface
- **Smooth Animations**: 200-250ms transitions for natural interactions
- **Dark Mode Support**: Built-in dark mode compatibility
- **Accessible**: ARIA labels and semantic HTML throughout
- **Fast Performance**: TanStack Query for efficient data fetching and caching

## Tech Stack

- **Frontend**: React 19 (with Next.js 16 App Router)
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Data Fetching**: TanStack Query v5 (React Query)
- **State Management**: React Context API
- **Forms**: React Hook Form + Zod validation
- **Icons**: lucide-react
- **Type Safety**: TypeScript

## Project Structure

```
/app
  ├── page.tsx                          # Landing page
  ├── layout.tsx                        # Root layout with providers
  ├── login/page.tsx                    # Login page
  ├── signup/page.tsx                   # Sign up page
  ├── workspace-selector/page.tsx       # Workspace selection
  └── workspace/[workspaceId]/
      ├── layout.tsx                    # Workspace layout with sidebars
      ├── page.tsx                      # Main workspace view
      ├── channel/[channelId]/page.tsx  # Channel view
      └── dm/[userId]/page.tsx          # DM view

/components
  ├── ui/                               # shadcn/ui components
  ├── workspace/
      ├── CompactSidebar.tsx            # Icon sidebar (64px)
      ├── ExpandedSidebar.tsx           # Full navigation sidebar (280px)
      ├── MessagingArea.tsx             # Message display and input
      └── RightSidebar.tsx              # Profile and thread panel

/hooks
  ├── queries.ts                        # TanStack Query hooks for data fetching

/providers
  ├── QueryClientProvider.tsx           # TanStack Query client setup
  └── UIProvider.tsx                    # Global UI state context

/lib
  ├── mock-data.ts                      # Mock data for development
  └── utils.ts                          # Utility functions

/types
  └── index.ts                          # TypeScript interfaces
```

## Layout Structure

### Desktop (1024px+)
```
┌──────────────────────────────────────────────────┐
│ Compact Sidebar │ Expanded Sidebar │ Messaging │ Right Sidebar │
│     (64px)      │     (280px)      │   Area    │    (280px)    │
└──────────────────────────────────────────────────┘
```

### Tablet (640px - 1024px)
- Compact sidebar visible
- Expanded sidebar as toggle overlay
- Right sidebar as overlay

### Mobile (< 640px)
- Hamburger menu button instead of compact sidebar
- Expanded sidebar as overlay
- Full-width messaging area
- Right sidebar as overlay

## Getting Started

### Installation

```bash
# Clone or create the project
git clone <repo-url>
cd slack-clone

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`

### Development

1. **Landing Page**: `http://localhost:3000`
2. **Sign Up**: `http://localhost:3000/signup`
3. **Login**: `http://localhost:3000/login`
4. **Workspace Selector**: `http://localhost:3000/workspace-selector`
5. **Workspace**: `http://localhost:3000/workspace/1`

### Mock Data

The application uses mock data stored in `/lib/mock-data.ts`. In production, replace TanStack Query hooks with real API endpoints.

## Key Components

### CompactSidebar
Icon-only sidebar (64px width) with navigation items:
- Home
- Channels
- Direct Messages
- Activity
- Archive
- AI Agent

**Responsive Behavior**: Hidden on mobile, visible on tablet and desktop

### ExpandedSidebar
Full navigation sidebar (280px width) with:
- Workspace search
- Channels list with unread counts
- Direct messages list with user status
- Create channel/DM buttons

**Responsive Behavior**: Overlay on mobile/tablet, fixed on desktop

### MessagingArea
Main content area with:
- Channel/DM header
- Tabs: Messages, Suggestions, Pins, Files, Bookmarks
- Message list with reactions and thread indicators
- Message input with file upload and emoji picker

**Responsive Behavior**: Full-width on mobile, flexible on desktop

### RightSidebar
Panel for profiles and threads:
- User profile view
- Thread message display
- Thread reply input

**Responsive Behavior**: Overlay on mobile, shrinks messaging area on desktop

## Data Fetching with TanStack Query

All data is fetched using TanStack Query hooks in `/hooks/queries.ts`:

```tsx
// Fetch channels
const { data: channels } = useChannels(workspaceId)

// Fetch messages
const { data: messages } = useMessages(channelId)

// Send message (mutation)
const { mutate: sendMessage } = useSendMessage()

// Add reaction (mutation)
const { mutate: addReaction } = useAddReaction()
```

## UI State Management

Global UI state is managed via React Context (`UIProvider`):

```tsx
const {
  expandedSidebarOpen,
  rightSidebarOpen,
  selectedChannelId,
  selectedUserId,
  selectedThreadId,
  activeTab,
  // ... and more
} = useUI()
```

## Styling with Tailwind CSS

The project uses Tailwind CSS v4 with semantic color tokens:

```tsx
// Light mode colors
--background: oklch(1 0 0)        // White
--foreground: oklch(0.145 0 0)    // Dark gray/black
--primary: oklch(0.205 0 0)       // Dark color
--secondary: oklch(0.97 0 0)      // Light gray

// Dark mode colors
.dark {
  --background: oklch(0.145 0 0)
  --foreground: oklch(0.985 0 0)
  // ... dark mode overrides
}
```

## Responsive Design Patterns

### Mobile-First Approach
Start with mobile styles, add larger screen enhancements:

```tsx
// Base: mobile
<div className="flex flex-col gap-4">
  {/* Mobile layout */}
</div>

// Tablet and up
<div className="flex flex-col lg:flex-row gap-4">
  {/* Desktop layout */}
</div>
```

### Hiding/Showing Elements
```tsx
{/* Hidden on mobile, visible on tablet and up */}
<div className="hidden sm:flex">

{/* Visible on mobile only */}
<div className="sm:hidden">

{/* Visible on desktop only */}
<div className="hidden lg:flex">
```

## Form Validation

Forms use React Hook Form with Zod validation:

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
})
```

## Accessibility

The project includes:
- Semantic HTML elements (`<button>`, `<nav>`, `<main>`, etc.)
- ARIA labels and roles
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly

## Performance Optimizations

- **TanStack Query Caching**: 5-minute stale time, 10-minute garbage collection
- **React Suspense**: For code splitting and lazy loading
- **Image Optimization**: Next.js Image component
- **CSS-in-JS**: Tailwind CSS for minimal CSS output

## Future Enhancements

- Real-time WebSocket integration for live updates
- File upload and media support
- Video/audio calls
- User presence indicators
- Notification system
- Search with filters
- Custom emojis and stickers
- Message pinning and bookmarking
- User settings and preferences
- Admin panel for workspace management

## License

MIT

## Support

For issues or questions, open an issue on the repository.
