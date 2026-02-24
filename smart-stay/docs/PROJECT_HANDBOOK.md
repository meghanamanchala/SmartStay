# SmartStay Project Handbook

## 1) What this project is
SmartStay is a multi-role rental platform (Guest, Host, Admin) built with Next.js App Router, MongoDB, NextAuth, Cloudinary, Stripe, and OpenAI-assisted smart search.

## 2) Tech stack
- Frontend: Next.js, React, Tailwind CSS
- Backend: Next.js Route Handlers (`app/api/**`)
- DB: MongoDB (native driver)
- Auth: NextAuth credentials flow
- Storage: Cloudinary
- Payments: Stripe
- AI: OpenAI (smart search parsing)

## 3) High-level folder map
- `app/` → Pages and API routes
- `app/api/` → Backend endpoints by role/domain
- `components/` → Shared UI and navbars
- `lib/` → DB client and notification/business helpers
- `docs/` → Project docs (this file)

## 4) Roles and key screens
### Guest
- Explore: `app/guest/explore/page.tsx`
- Property details: `app/guest/explore/[id]/page.tsx`
- Bookings: `app/guest/bookings/page.tsx`
- Reviews: `app/guest/reviews/page.tsx`
- Notifications: `app/guest/notifications/page.tsx`

### Host
- Properties: `app/host/properties/page.tsx`
- Add property: `app/host/add-property/page.tsx`
- Bookings: `app/host/bookings/page.tsx`
- Reviews: `app/host/reviews/page.tsx`
- Earnings: `app/host/earnings/page.tsx`

### Admin
- Dashboard: `app/admin/dashboard/page.tsx`
- Users: `app/admin/users/page.tsx`
- Properties: `app/admin/properties/page.tsx`
- Bookings: `app/admin/bookings/page.tsx`
- Analytics: `app/admin/analytics/page.tsx`
- Notifications: `app/admin/notifications/page.tsx`

## 5) Core API routes (most important)
### Auth
- NextAuth: `app/api/auth/[...nextauth]/route.ts`
- Signup: `app/api/auth/signup/route.ts`

### Guest domain
- Properties list + ratings: `app/api/guest/properties/route.js`
- Smart Search (OpenAI + fallback): `app/api/guest/smart-search/route.ts`
- Bookings: `app/api/guest/bookings/route.js`
- Reviews submit/list: `app/api/guest/reviews/route.ts`
- Review delete: `app/api/guest/reviews/[id]/route.ts`
- Notifications: `app/api/guest/notifications/route.ts`

### Host domain
- Properties CRUD: `app/api/host/properties/route.ts`
- Reviews read: `app/api/host/reviews/route.ts`

### Admin domain
- Analytics: `app/api/admin/analytics/route.ts`
- Notifications: `app/api/admin/notifications/route.ts`
- User management: `app/api/admin/all-users/route.ts`, `app/api/admin/users/[id]/route.ts`

## 6) MongoDB collections and suggested schema
### users
- `_id`, `name`, `email`, `password`, `role`
- profile fields: `phone`, `location`, `bio`, `profileImageUrl`, `createdAt`

### properties
- `_id`, `title`, `description`, `category`
- location: `city`, `country`
- capacity: `maxGuests`, `bedrooms`, `bathrooms`
- pricing: `price`
- media: `images[]`
- ownership: `host`
- timestamps: `createdAt`, `updatedAt`

### bookings
- `_id`, `property`, `guest`, `host`
- `checkIn`, `checkOut`, `guests`
- `pricePerNight`, `cleaningFee`, `serviceFee`, `totalPrice`
- `status`, `paymentStatus`, `paymentPaidAt`, `reviewed`, `createdAt`

### reviews
- `_id`, `booking`, `property`, `guest`
- `rating`, `comment`, `date`

### notifications
- `_id`, `type`, `recipientEmail`, `recipientRole`
- `title`, `message`, `metadata`
- `read`, `createdAt`

## 7) Main user flows
1. Guest search/explore → property details → booking request
2. Host sees bookings and manages listings
3. Guest checkout passes → guest leaves review
4. Host receives review notification and sees review analytics
5. Admin monitors users/properties/bookings/analytics + notifications

## 8) Smart Search flow (current)
1. User enters natural language query in Explore search bar
2. Frontend posts to `POST /api/guest/smart-search`
3. Backend parses query using OpenAI (`OPENAI_API_KEY`)
4. If AI fails/unavailable, fallback regex parser is used
5. Backend filters properties and returns `filters + properties`
6. Frontend shows filtered result set + extracted filter chips

## 9) Notifications architecture
- Creation: `lib/notificationHelpers.ts` + `lib/notificationService.ts`
- Triggered on key events:
  - user login
  - new signup
  - new booking
  - property create/delete
  - new review
- Read/update APIs per role notification page

## 10) Environment variables (required)
Use `.env.example` as template and fill actual values in `.env`.

## 11) Local run checklist
1. Install deps: `npm install`
2. Configure `.env`
3. Run app: `npm run dev`
4. Verify role routes by logging in as Guest/Host/Admin

## 12) Smoke test checklist
- Auth login/logout works
- Guest can search, book, wishlist
- Host can add/edit/delete property
- Guest can submit review after checkout
- Admin analytics loads data
- Notifications page loads for each role
- Smart search returns relevant results

## 13) Known gaps to complete roadmap
- Dynamic pricing suggestions
- Safety score integration
- Roommate matching
- Map integration
- Eco/carbon score

## 14) Suggested next implementation order
1. Dynamic pricing API + host UI hints
2. Safety score provider + property detail card
3. Maps on explore/details
4. Roommate matching MVP for long stays
