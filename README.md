# Recipe Sharing Platform

A modern, full-stack recipe sharing application built with Angular and Django REST Framework. Users can discover, create, share, and rate recipes with a comprehensive social platform experience.

## 🌐 Live Demo

- **Frontend**: [https://white-rock-011c63e03.2.azurestaticapps.net/](https://white-rock-011c63e03.2.azurestaticapps.net/)
- **Backend API**: [https://recipe-api-dev98298.azurewebsites.net/](https://recipe-api-dev98298.azurewebsites.net/)
- **API Health Check**: [https://recipe-api-dev98298.azurewebsites.net/api/health/](https://recipe-api-dev98298.azurewebsites.net/api/health/)

## 🚀 Features

### Public Part (No Authentication Required)
- **Recipe Catalog**: Browse all published recipes with advanced filtering and sorting
- **Recipe Details**: View comprehensive recipe information including ingredients, instructions, and reviews
- **Search & Discovery**: Advanced search with multiple criteria (ingredients, difficulty, cooking time)
- **User Registration & Login**: Secure authentication system with JWT tokens
- **Password Reset**: Complete password recovery flow via email

### Private Part (Authenticated Users)
- **Personal Dashboard**: User activity feed, statistics, and recipe management
- **Recipe Creation**: Full CRUD operations for recipes with rich media support
- **Recipe Management**: Edit, delete, and moderate your own recipes
- **Rating & Reviews**: Rate recipes (1-5 stars) and leave detailed reviews
- **User Profile**: Manage personal information, preferences, and security settings
- **Favorites System**: Save and organize favorite recipes
- **Social Features**: Mark reviews as helpful, verified purchase badges
- **Achievement System**: Gamified progress tracking with badges and milestones

### Admin Features
- **Content Moderation**: Review and approve/reject recipes and comments
- **User Management**: Manage user accounts and permissions
- **Analytics Dashboard**: Platform statistics and performance metrics
- **Category Management**: Organize recipes with custom categories

## 🛠 Technology Stack

### Frontend
- **Angular 20.1.0** - Modern TypeScript framework
- **Angular Material** - UI component library
- **Tailwind CSS** - Utility-first CSS framework
- **RxJS** - Reactive programming library
- **Chart.js** - Data visualization
- **Angular Animations** - Smooth UI transitions

### Backend
- **Django 4.2** - Python web framework
- **Django REST Framework** - API development
- **PostgreSQL** - Production database
- **Redis** - Caching and session storage
- **JWT Authentication** - Secure token-based auth
- **Azure Blob Storage** - File storage for images
- **Gunicorn** - WSGI server for production

### DevOps & Deployment
- **Azure App Service** - Backend hosting
- **Azure Static Web Apps** - Frontend hosting
- **Azure Blob Storage** - File storage
- **GitHub Actions** - CI/CD pipeline

## 📋 Requirements Compliance

### ✅ Core Requirements

#### 3+ Dynamic Pages
1. **Recipe Catalog** - Dynamic listing with filtering, sorting, and pagination
2. **Recipe Details** - Comprehensive recipe view with ratings and reviews
3. **User Dashboard** - Personalized user statistics and activity feed
4. **Recipe Creation/Edit** - Dynamic form with real-time validation
5. **Admin Dashboard** - Analytics and moderation interface

#### Required Views
- ✅ **Catalog** - Complete recipe listing with advanced search
- ✅ **Details** - Detailed recipe information with social features

#### CRUD Operations
- ✅ **Create** - Recipe creation with rich media upload
- ✅ **Read** - Recipe viewing with advanced filtering
- ✅ **Update** - Recipe editing with version control
- ✅ **Delete** - Recipe deletion with permission checks

#### User Interactions
- ✅ **Rating System** - 1-5 star ratings with reviews
- ✅ **Comments** - Recipe reviews with helpful voting
- ✅ **Favorites** - Save and organize favorite recipes
- ✅ **Social Features** - Mark reviews helpful, verified badges

#### Technology Stack
- ✅ **Angular** - Modern TypeScript frontend
- ✅ **REST API** - Django REST Framework backend
- ✅ **Client-Side Routing** - 8+ routes with parameters
- ✅ **Source Control** - Comprehensive Git history with descriptive commits

### ✅ Angular Framework Requirements

#### TypeScript & Types
- ✅ **Strict TypeScript** - No `any` types, comprehensive interfaces
- ✅ **Interfaces** - Recipe, User, Rating, Category models
- ✅ **Observables** - Reactive data flow throughout the app
- ✅ **RxJS Operators** - `map`, `filter`, `switchMap`, `catchError`, `tap`
- ✅ **Lifecycle Hooks** - `ngOnInit`, `ngOnDestroy`, `ngOnChanges`
- ✅ **Pipes** - Custom pipes for formatting and data transformation

#### Component Architecture
- ✅ **External CSS** - Tailwind CSS and component-specific styles
- ✅ **Route Guards** - Authentication and authorization guards
- ✅ **Error Handling** - Comprehensive error handling and validation
- ✅ **Folder Structure** - Feature-based modular architecture

### ✅ Bonus Features

#### Cloud Deployment
- ✅ **Azure Deployment** - Full production deployment
- ✅ **Frontend**: Azure Static Web Apps
- ✅ **Backend**: Azure App Service
- ✅ **Database**: Azure PostgreSQL
- ✅ **Storage**: Azure Blob Storage

#### File Storage
- ✅ **Azure Blob Storage** - Cloud-based image storage
- ✅ **Image Processing** - Automatic thumbnail generation
- ✅ **CDN Integration** - Fast global content delivery

#### HTML5 Features
- ✅ **SVG Icons** - Scalable vector graphics throughout UI
- ✅ **Canvas** - Chart.js visualizations

#### Angular Animations
- ✅ **Page Transitions** - Smooth route transitions
- ✅ **Component Animations** - Loading states and interactions
- ✅ **Micro-interactions** - Button hover effects and feedback

#### Unit Testing
- ✅ **Jasmine/Karma** - Comprehensive test suite
- ✅ **Component Tests** - Isolated component testing
- ✅ **Service Tests** - Business logic validation
- ✅ **Guard Tests** - Authentication flow testing

#### State Management
- ✅ **RxJS State** - Reactive state management
- ✅ **BehaviorSubject** - User authentication state
- ✅ **Observable Patterns** - Consistent data flow

## 🏆 Achievement System

The platform features a comprehensive gamification system that rewards users for their contributions and engagement:

### Recipe Creation Achievements
- **🥇 First Recipe** - Created your first recipe
- **🍽️ Recipe Creator** - Created 5 recipes
- **📚 Recipe Enthusiast** - Created 10 recipes  
- **🏆 Recipe Master** - Created 25+ recipes

### Quality Achievements
- **⭐ Highly Rated Chef** - Maintain 4.0+ star average rating
- **👑 Excellent Chef** - Maintain 4.5+ star average rating
- **👁️ Popular Chef** - Reach 100+ total recipe views
- **🔥 Trending Chef** - Reach 500+ total recipe views

### Social Engagement Achievements
- **💬 Active Reviewer** - Leave 10+ helpful reviews
- **👍 Community Helper** - Have 20+ reviews marked as helpful
- **✅ Verified Chef** - Earn verified purchase badges
- **🌟 Top Contributor** - Consistently high-quality contributions

### Special Badges
- **👍 Helpful Review** - Badge for reviews marked as helpful by the community
- **⭐ Featured Recipe** - Badge for recipes selected by moderators
- **🏅 Community Choice** - Badge for recipes with highest community ratings

### Achievement Features
- **Real-time Tracking** - Progress updates as you use the platform
- **Visual Badges** - Beautiful icons and animations for unlocked achievements
- **Progress Indicators** - See how close you are to unlocking new achievements
- **Achievement History** - Track when you earned each achievement
- **Social Sharing** - Share your achievements with the community

## 🏗 Architecture

### Frontend Architecture
```
src/
├── app/
│   ├── core/           # Shared services, guards, interceptors
│   ├── features/       # Feature modules
│   │   ├── auth/       # Authentication
│   │   ├── recipes/    # Recipe management
│   │   ├── dashboard/  # User dashboard
│   │   ├── profile/    # User profile
│   │   └── admin/      # Admin interface
│   └── shared/         # Shared components and models
```

### Backend Architecture
```
backend/
├── accounts/           # User authentication
├── recipes/           # Recipe management
├── user_management/   # User profiles and preferences
├── admin_api/         # Admin functionality
├── core/              # Shared utilities and services
└── config/            # Settings and configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20.0.0+
- Python 3.9+
- PostgreSQL
- Redis

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements/development.txt
python manage.py migrate
python manage.py runserver
```

### Environment Variables
Create `.env` files in both frontend and backend directories with appropriate configuration for your environment.

## 📱 Screenshots

<img width="1907" height="917" alt="image" src="https://github.com/user-attachments/assets/36ed6464-3173-4df5-a1d9-a8b754297f8d" />

<img width="1906" height="916" alt="image" src="https://github.com/user-attachments/assets/32fd5d46-ab24-4c34-a010-6505a2859a0d" />

<img width="375" height="834" alt="image" src="https://github.com/user-attachments/assets/afd8153d-01b5-4f97-9dd0-c9407907eb7e" />


### Recipe Catalog
<img width="1908" height="920" alt="image" src="https://github.com/user-attachments/assets/5423900b-b605-4972-ac54-78739bb3efcf" />


### Recipe Details
<img width="1172" height="921" alt="image" src="https://github.com/user-attachments/assets/555971b3-6281-4aa3-8a82-f7d498646892" />
<img width="1168" height="804" alt="image" src="https://github.com/user-attachments/assets/e2afd55f-615e-40c4-91a5-3f426847ca3b" />


### User Dashboard
<img width="1909" height="788" alt="image" src="https://github.com/user-attachments/assets/4d889d47-0d3c-45c0-93e1-7dfa77cf1de0" />


### Recipe Creation
<img width="1178" height="849" alt="image" src="https://github.com/user-attachments/assets/543f429d-03d2-49a5-aa4e-0b5259318d50" />


## 🔧 API Documentation

The API provides comprehensive endpoints for:
- **Authentication**: Login, register, password reset
- **Recipes**: CRUD operations, search, filtering
- **Ratings**: Create, update, delete ratings and reviews
- **Users**: Profile management and preferences
- **Admin**: Content moderation and analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🚀 Future Development Roadmap

The platform is continuously evolving with planned features to enhance user experience and functionality:

### 🔔 Enhanced Notifications & Preferences
- **Email Notifications**: Smart email system with user preference controls
- **Theme System**: Customizable themes with CSS variables and dark/light modes
- **Language Support**: Internationalization (i18n) with multiple language support
- **Timezone Support**: User-specific timezone handling for date/time display
- **Privacy Controls**: Granular profile visibility and privacy settings

### 🛒 E-commerce & Shopping Integration
- **Recipe Marketplace**: Ability to purchase premium recipes
- **Ingredient Shopping**: Direct integration with grocery stores and delivery services
- **Shopping List Management**: Automated shopping lists from recipe ingredients
- **Meal Planning**: Weekly/monthly meal planning with shopping integration

### 📊 Advanced Analytics & Management
- **Enhanced Recipe Dashboard**: Full CRUD operations with advanced editing capabilities
- **Comprehensive Favorites**: Collections and organization system for saved recipes
- **Cooking Statistics**: Detailed charts and insights about cooking patterns
- **Recipe Collections**: Organize recipes into custom collections and categories
- **Site Administration**: Dynamic site preferences (title, admin email, meta tags, upload limits)

### 🤖 AI-Powered Features
- **AI Recipe Generator**: Create recipes based on available ingredients and preferences
- **Smart Recommendations**: Personalized recipe suggestions using machine learning
- **Ingredient Substitution**: AI-powered ingredient replacement suggestions
- **Nutritional Analysis**: Automatic nutritional information calculation

### 📱 Mobile & Accessibility
- **Progressive Web App (PWA)**: Offline functionality and mobile app-like experience
- **Voice Commands**: Voice-controlled recipe navigation and creation
- **Accessibility Features**: Screen reader support and keyboard navigation
- **Mobile Optimization**: Enhanced mobile interface and touch interactions

### 🌐 Social & Community Features
- **Recipe Sharing**: Social media integration and sharing capabilities
- **Community Challenges**: Monthly cooking challenges and competitions
- **Recipe Collaboration**: Multi-user recipe editing and collaboration
- **Live Cooking Sessions**: Real-time cooking streams and tutorials

### 🔧 Technical Enhancements
- **Performance Optimization**: Advanced caching and CDN improvements
- **API Versioning**: Backward-compatible API evolution
- **Microservices Architecture**: Scalable service-oriented architecture
- **Real-time Features**: WebSocket integration for live updates

---

## 🙏 Acknowledgments

- Angular team for the excellent framework
- Django team for the robust backend framework
- Azure team for the cloud infrastructure
- All contributors and testers

---

**Built with ❤️ using Angular and Django** 
