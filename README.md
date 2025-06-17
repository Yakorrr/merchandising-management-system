# Merchandising Management System

## Welcome to the Merchandising Management System!

This application is designed to streamline and optimize the operations of confectionery factory merchandisers. It
provides a comprehensive platform for managing daily tasks, tracking store interactions, handling product orders, and
gaining valuable insights through metrics and map-based route planning. Whether you're a merchandiser on the ground or a
manager overseeing operations, this system aims to make your work more efficient and data-driven.

## Core Features

This system offers a robust set of features to support various aspects of merchandising:

* **User Authentication & Authorization:**
    * Secure user registration, login, and logout.
    * Role-based access control: "merchandisers" have limited access (view/create own orders/plans), while "managers"
      have full administrative control (manage users, stores, products, view all data, calculate routes, access logs and
      metrics).
    * JWT (JSON Web Token) based authentication for secure API communication.

* **User Management (Manager-only):**
    * View a list of all users.
    * Create new user accounts.
    * View detailed information for any user.
    * Edit existing user profiles, including roles and passwords.
    * Delete user accounts.

* **Store Management (Manager-only for CUD, All authenticated for R):**
    * View a list of all retail stores.
    * Create new store entries.
    * View detailed information for any store.
    * Edit existing store details (e.g., address, contact info, coordinates).
    * Delete store entries.

* **Product Management (Manager-only for CUD, All authenticated for R):**
    * View a list of all confectionery products.
    * Create new product entries.
    * View detailed information for any product.
    * Edit existing product details (e.g., name, description, price).
    * Delete product entries.

* **Order Management:**
    * **Merchandisers:** Can view and create their own orders, and view details of their orders.
    * **Managers:** Have full control to view all orders, create/edit any order (including assigning to merchandisers),
      and delete orders.
    * Orders include nested order items (products and quantities).
    * Automatic calculation of `total_amount` for orders based on items.

* **Daily Plan Management:**
    * **Merchandisers:** Can view their assigned daily plans, and view details of plans (including associated stores).
    * **Managers:** Have full control to view all daily plans, create/edit any plan (including assigning to
      merchandisers and defining store visit orders), and delete plans.
    * Daily plans include nested store visits with sequential order and completion status.

* **Store Metrics & Analytics (Manager-only):**
    * Calculate and view aggregated sales metrics for stores (total orders, total quantity, average order amount) for
      custom date ranges.
    * Save calculated metrics to the database for historical tracking.
    * View a list of previously saved metrics.
    * View detailed information for specific saved metric entries.

* **Interactive Map View & Route Planning:**
    * Visualize store locations on an interactive map using Leaflet.
    * Select a daily plan to display its assigned stores on the map.
    * **Calculate an optimized route** for the stores in a selected daily plan, integrating with the external OSRM (Open
      Source Routing Machine) API.
    * Display the calculated route on the map, including total distance and duration.
    * Optionally request a route that returns to the starting position.

* **User Activity Logging (Manager-only):**
    * View a comprehensive list of all user actions within the system (e.g., login, registration, creating/updating
      entities).
    * Filter logs by user or action type.
    * View detailed information for any log entry.
    * Export log data to a JSON file for analysis.

## Technologies Used

This system leverages a powerful and modern tech stack:

* **Backend:**
    * **Python 3.x:** The core programming language.
    * **Django:** A high-level Python web framework that encourages rapid development and clean, pragmatic design.
    * **Django REST Framework (DRF):** A flexible toolkit for building Web APIs on top of Django.
    * **Django Simple JWT:** Provides JWT (JSON Web Token) authentication for stateless API security.
    * **PostgreSQL:** A powerful, open-source object-relational database system for robust data storage.
    * **Psycopg2:** PostgreSQL adapter for Python.
    * **Requests:** A Python HTTP library for making API calls to external services (like OSRM).

* **Frontend:**
    * **JavaScript (ES6+):** The programming language for the client-side.
    * **React.js:** A declarative, component-based JavaScript library for building user interfaces.
    * **Create React App (CRA):** A tool to set up a modern React project with no build configuration.
    * **React Router DOM:** For client-side routing and navigation within the single-page application.
    * **Axios:** A promise-based HTTP client for making API requests from the browser to the Django backend.
    * **Leaflet.js:** A lightweight, open-source JavaScript library for mobile-friendly interactive maps.
    * **React-Leaflet:** React components for Leaflet maps.
    * **date-fns:** A modern JavaScript date utility library for date parsing and formatting.
    * **@mapbox/polyline:** A JavaScript library for encoding/decoding Google Maps/OSRM polyline geometry.

* **External Service Integration:**
    * **OSRM (Open Source Routing Machine):** An open-source routing engine that provides fast route computation (used
      via public demo servers).

## Project Structure

The project follows a standard Django project structure with a dedicated `frontend` (or `web` as per your latest naming)
directory for the React application.

```
merchandising-management-system/
├── .gitignore                   # Git ignore file for project-wide exclusions
├── manage.py                    # Django's command-line utility
├── src/                         # Django project core configuration
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py              # Django settings (DB, installed apps, DRF, JWT, OSRM URLs)
│   ├── urls.py                  # Main URL routing for Django backend
│   └── wsgi.py
├── core/                        # Django app for core business logic (models, views, serializers)
│   ├── migrations/              # Database migration files
│   ├── __init__.py
│   ├── admin.py                 # Django Admin configuration
│   ├── apps.py                  # Django app configuration (e.g., for signals)
│   ├── models.py                # Database models (User, Store, Product, Order, DailyPlan, Log, Metrics)
│   ├── permissions.py           # Custom DRF permissions (e.g., IsManager)
│   ├── signals.py               # Django signals (e.g., auto-create initial users)
│   ├── urls.py                  # API URL routing for the 'core' app
│   ├── serializers/             # API serializers for data validation and transformation
│   │   ├── __init__.py
│   │   ├── user.py              # User-related serializers
│   │   ├── store.py             # Store-related serializers
│   │   ├── product.py           # Product-related serializers
│   │   ├── order.py             # Order-related serializers
│   │   ├── daily_plan.py        # Daily Plan-related serializers
│   │   ├── metrics.py           # Metrics-related serializers
│   │   └── route.py             # Route calculation serializers
│   │   └── map.py               # Map-related serializers
│   │   └── log.py               # Log-related serializers
│   └── views/                   # API views to handle requests and responses
│       ├── __init__.py
│       ├── user.py              # User authentication and management views
│       ├── store.py             # Store management views
│       ├── product.py           # Product management views
│       ├── order.py             # Order management views
│       ├── daily_plan.py        # Daily Plan management views
│       ├── metrics.py           # Metrics calculation and display views
│       ├── route.py             # Route calculation views
│       ├── map.py               # Map-related data views
│       └── log.py               # Log-related data views
├── web/                         # React frontend application
│   ├── node_modules/            # Node.js dependencies
│   ├── public/                  # Static assets (HTML, images)
│   ├── src/                     # React source code
│   │   ├── App.js               # Main React component, central router
│   │   ├── index.js             # React entry point (wraps App in context/router)
│   │   ├── auth/                # Authentication components (Login, Register)
│   │   │   ├── Register.js
│   │   │   └── Login.js
│   │   ├── common/              # Common utilities (Axios interceptor, constants)
│   │   │   └── axios_interceptor.js
│   │   │   └── constants.js
│   │   ├── components/          # Reusable UI components (Forms, PrivateRoute)
│   │   │   ├── UserForm.js
│   │   │   ├── StoreForm.js
│   │   │   ├── ProductForm.js
│   │   │   ├── OrderForm.js
│   │   │   └── DailyPlanForm.js
│   │   ├── context/             # React Context API for global state (AuthContext)
│   │   │   └── AuthContext.js
│   │   ├── pages/               # Top-level page components
│   │   │   ├── Dashboard.js
│   │   │   ├── Welcome.js
│   │   │   ├── user/            # User management pages
│   │   │   │   ├── UserManagementList.js
│   │   │   │   ├── UserManagementCreate.js
│   │   │   │   ├── UserManagementDetail.js
│   │   │   │   └── UserManagementEdit.js
│   │   │   ├── store/           # Store management pages
│   │   │   │   ├── StoreList.js
│   │   │   │   ├── StoreCreate.js
│   │   │   │   ├── StoreDetail.js
│   │   │   │   └── StoreEdit.js
│   │   │   ├── product/         # Product management pages
│   │   │   │   ├── ProductList.js
│   │   │   │   ├── ProductCreate.js
│   │   │   │   ├── ProductDetail.js
│   │   │   │   └── ProductEdit.js
│   │   │   ├── order/           # Order management pages
│   │   │   │   ├── OrderList.js
│   │   │   │   ├── OrderCreate.js
│   │   │   │   ├── OrderDetail.js
│   │   │   │   └── OrderEdit.js
│   │   │   ├── daily_plan/           # Daily Plan management pages
│   │   │   │   ├── DailyPlanList.js
│   │   │   │   ├── DailyPlanCreate.js
│   │   │   │   ├── DailyPlanDetail.js
│   │   │   │   └── DailyPlanEdit.js
│   │   │   ├── metrics/         # Metrics pages
│   │   │   │   ├── MetricsDashboard.js
│   │   │   │   └── MetricsDetail.js
│   │   │   ├── map/             # Map visualization pages
│   │   │   │   └── MapView.js
│   │   │   └── log/             # Log management pages
│   │   │       ├── LogList.js
│   │   │       └── LogDetail.js
│   │   ├── services/            # API communication services (authService)
│   │   │   └── authService.js
│   │   └── setupProxy.js        # Webpack Dev Server proxy configuration
│   ├── package.json             # Node.js project manifest (dependencies, scripts)
│   └── yarn.lock                # Yarn dependency lock file
└── requirements.txt             # Python project dependencies
```

## Getting Started

Follow these steps to set up and run the Merchandising Management System on your local machine.

### Prerequisites

Before you begin, ensure you have the following installed:

*   **Python 3.8+:** Download from [python.org](https://www.python.org/downloads/).
*   **PostgreSQL:** Download from [postgresql.org/download/](https://www.postgresql.org/download/). (Recommended for production, SQLite is default for development).
*   **Node.js & npm (or Yarn):** Download Node.js (which includes npm) from [nodejs.org](https://nodejs.org/). Yarn can be installed via `npm install -g yarn`.

### Backend Setup (Django)

1.  **Navigate to the project root:**
    ```bash
    cd merchandising-management-system
    ```

2.  **Create a Python Virtual Environment:**
    ```bash
    python -m venv venv
    ```

3.  **Activate the Virtual Environment:**
    *   **Windows:** `.\venv\Scripts\activate`
    *   **macOS/Linux:** `source venv/bin/activate`

4.  **Install Python Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Configure PostgreSQL Database:**
    *   Ensure your PostgreSQL server is running.
    *   Using `psql` or `pgAdmin 4`, create a database and a user for your project.
    *   Example `psql` commands:
        ```sql
        CREATE USER merchandising_user WITH PASSWORD 'your_secure_password';
        CREATE DATABASE merchandising_db OWNER merchandising_user;
        ```
    *   **Update `src/settings.py`:** Open `merchandising_system/src/settings.py` and modify the `DATABASES` setting to match your PostgreSQL configuration:
        ```python
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': 'merchandising_db',
                'USER': 'merchandising_user',
                'PASSWORD': 'your_secure_password',
                'HOST': 'localhost', # Or your PostgreSQL host
                'PORT': '5432',
            }
        }
        ```

6.  **Run Database Migrations:**
    *   It's crucial to perform a clean migration to avoid `InconsistentMigrationHistory` errors, especially when changing the `AUTH_USER_MODEL`.
    *   **Delete any existing SQLite database file:** `merchandising_system/db.sqlite3` (if you were using it).
    *   **Delete existing migration files:** Remove all files (except `__init__.py`) from `merchandising_system/core/migrations/` and `merchandising_system/venv/Lib/site-packages/rest_framework_simplejwt/token_blacklist/migrations/`.
    *   **Make and apply migrations:**
        ```bash
        python manage.py makemigrations core
        python manage.py migrate
        ```
        This process will also automatically create the default `admin` and `user` accounts. You will see output in the console like:
        `Created initial admin user (username: admin, password: admin).`
        `Created initial merchandiser user (username: user, password: user).`

7.  **Create a Django Superuser (Optional, but recommended for Admin Panel access):**
    ```bash
    python manage.py createsuperuser
    ```
    (Follow prompts for username, email, password. You can use 'admin' / 'admin' for this as well, but the signal already creates one.)

8.  **Start the Django Backend Server:**
    ```bash
    python manage.py runserver
    ```
    The backend will be running on `http://localhost:8000/`. You can access the Django Admin Panel at `http://localhost:8000/admin/`.

### Frontend Setup (React)

1.  **Navigate to the Frontend Directory:**
    ```bash
    cd web # Assuming your frontend folder is named 'web'
    ```

2.  **Install JavaScript Dependencies:**
    ```bash
    npm install
    # Or if you use Yarn:
    # yarn install
    ```

3.  **Ensure Proxy Configuration is Correct:**
    *   Open `web/src/setupProxy.js`. Its content should be exactly as follows (without `pathRewrite`):
        ```javascript
        const { createProxyMiddleware } = require('http-proxy-middleware');

        module.exports = function(app) {
          app.use(
            '/api', // Requests to /api will be proxied
            createProxyMiddleware({
              target: 'http://localhost:8000', // Your Django backend
              changeOrigin: true,
            })
          );
        };
        ```
    *   If you modified this file or installed `http-proxy-middleware`, it's good practice to restart the frontend server (`npm start` or `yarn start`).

4.  **Start the React Frontend Development Server:**
    ```bash
    npm start
    # Or
    # yarn start
    ```
    The frontend application will typically open in your browser at `http://localhost:3000/`.

## First Launch & Testing

1.  **Open your browser** and navigate to `http://localhost:3000/`.
2.  You should be greeted by the **Welcome Page**.
3.  **Register a New User:** Click "Register" and create an account. You can create a "manager" role.
4.  **Log In:** Use the credentials of the automatically created `admin/admin` user, or your newly registered user.
5.  **Explore the Dashboard:** After logging in, you'll be redirected to the dashboard.
6.  **Test Functionality:**
    *   **User Management:** (As Manager) Navigate to "Users" to view, create, edit, and delete users.
    *   **Store Management:** (As Manager) Navigate to "Stores" to view, create, edit, and delete stores. Ensure you create some stores with `latitude` and `longitude` for map functionality.
    *   **Product Management:** (As Manager) Navigate to "Products" to view, create, edit, and delete products.
    *   **Order Management:** (As Merchandiser or Manager) Navigate to "Orders" to create, view, and manage orders.
    *   **Daily Plan Management:** (As Merchandiser or Manager) Navigate to "Daily Plans" to create, view, and manage daily plans. Ensure you create plans with stores that have coordinates for map routing.
    *   **Map View:** Navigate to "Map". Select a daily plan (with at least 2 stores with coordinates) and click "Calculate Route".
    *   **Metrics:** (As Manager) Navigate to "Metrics" to calculate and save store performance metrics.
    *   **Logs:** (As Manager) Navigate to "Logs" to view and filter user activity.

Enjoy using your Merchandising Management System!