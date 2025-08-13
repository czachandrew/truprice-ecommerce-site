# TruePrice Ecommerce Platform

A modern, transparent ecommerce platform built with Vue 3, Vite, and Tailwind CSS. TruePrice focuses on transparency, user empowerment, and providing a seamless shopping experience while being honest about how the business model works.

## Features

### Core Functionality
- **Product Catalog**: Browse and search products with advanced filtering
- **Shopping Cart**: Real-time cart management with persistent storage
- **User Authentication**: Secure login/registration with JWT tokens
- **User Dashboard**: Order history, wallet management, and account settings
- **Transparency Features**: Clear disclosure of business model and earnings

### Technical Features
- **Vue 3 Composition API**: Modern reactive programming
- **Pinia State Management**: Type-safe state management
- **GraphQL Integration**: Apollo Client for efficient data fetching
- **Tailwind CSS**: Utility-first styling with custom design system
- **TypeScript**: Full type safety throughout the application
- **Responsive Design**: Mobile-first approach with beautiful UI
- **Performance Optimized**: Code splitting, lazy loading, and caching

## Tech Stack

- **Framework**: Vue 3 with Composition API
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **Router**: Vue Router 4
- **HTTP Client**: Apollo Client (GraphQL)
- **UI Components**: Headless UI (Vue)
- **Icons**: Heroicons
- **Form Validation**: VeeValidate with Yup
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd truprice-ecommerce-site
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the environment variables in `.env`:
```
VITE_API_URL=http://localhost:8000/graphql/
VITE_APP_NAME=TruePrice
VITE_APP_VERSION=1.0.0
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # Reusable Vue components
│   ├── ui/             # Base UI components
│   └── AppHeader.vue   # Main navigation header
├── views/              # Page components
│   ├── HomePage.vue    # Landing page
│   ├── ProductCatalog.vue
│   ├── ShoppingCart.vue
│   ├── Login.vue
│   └── ...
├── stores/             # Pinia stores
│   ├── product.ts      # Product state management
│   ├── cart.ts         # Shopping cart state
│   └── user.ts         # User authentication state
├── router/             # Vue Router configuration
├── plugins/            # Plugin configurations
│   └── apollo.ts       # Apollo Client setup
└── style.css           # Global styles and Tailwind
```

## Key Components

### State Management (Pinia)

The application uses three main stores:

1. **Product Store**: Manages product data, filters, and search
2. **Cart Store**: Handles shopping cart operations and persistence
3. **User Store**: Manages authentication and user profile data

### GraphQL Integration

All data fetching is done through GraphQL using Apollo Client:

- Product queries with filtering and pagination
- Cart mutations for add/update/remove operations
- User authentication and profile management

### Design System

The application uses a custom design system built on Tailwind CSS:

- **Colors**: Primary, secondary, success, warning, error variants
- **Typography**: Inter font family with consistent sizing
- **Components**: Reusable base components (Button, Input, Card, Modal)
- **Responsive**: Mobile-first design with breakpoint system

## Features in Detail

### Transparency Features
- Clear disclosure of affiliate relationships
- Price comparison across multiple vendors
- Wallet system showing earnings potential
- Transparent business model explanation

### User Experience
- Smooth page transitions and loading states
- Real-time cart updates
- Responsive design for all devices
- Accessible components (WCAG 2.1 AA compliant)

### Performance
- Code splitting with lazy-loaded routes
- Image optimization and lazy loading
- GraphQL query caching
- Optimized bundle size

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run unit tests
- `npm run lint` - Lint code with ESLint

### Code Style

The project uses:
- **ESLint** for code linting
- **TypeScript** for type safety
- **Prettier** for code formatting
- **Vue 3 Composition API** patterns

### Testing

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e
```

## Deployment

The application can be deployed to any static hosting service:

1. Build the application: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Configure environment variables for production

### Environment Variables

- `VITE_API_URL`: GraphQL API endpoint
- `VITE_APP_NAME`: Application name
- `VITE_APP_VERSION`: Application version

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository or contact the development team.
