# VendorBridge

A comprehensive vendor management system that streamlines the procurement process from Request for Quotation (RFQ) to invoice generation and payment tracking.

## Features

- **User Management**: Role-based access control for admins, purchasers, and vendors
- **Vendor Management**: Complete vendor profile management with company details and contact information
- **Request for Quotation (RFQ)**: Create and manage RFQs with detailed item specifications
- **Quotation Management**: Submit and compare quotations from multiple vendors
- **Purchase Orders**: Generate purchase orders from approved quotations
- **Invoice Generation**: Automated invoice creation with PDF generation
- **Approval Workflow**: Multi-level approval system for purchase orders and quotations
- **Activity Logging**: Comprehensive audit trail of all system activities
- **Email Notifications**: Automated email notifications for invoices and important updates
- **Reports**: Generate reports for procurement analytics and vendor performance

## Tech Stack

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing
- **Email**: FastAPI Mail for email notifications
- **PDF Generation**: ReportLab for invoice PDFs
- **Migration**: Alembic for database migrations

### Frontend
- **Framework**: React 19 with Vite
- **UI Components**: shadcn/ui with Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React

## Installation

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 12+

### Backend Setup

1. Navigate to the project directory:
```bash
cd vendorbridge
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables in `.env`:
```env
DATABASE_URL=postgresql://username:password@localhost/dbname
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

5. Run database migrations:
```bash
cd backend
alembic upgrade head
```

6. Start the backend server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd vendorbridge/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage

### User Roles

- **Admin**: Full system access, user management, vendor management
- **Purchaser**: Create RFQs, review quotations, generate purchase orders
- **Vendor**: View RFQs, submit quotations, manage company profile

### Workflow

1. **Create RFQ**: Purchaser creates a request for quotation with item details
2. **Submit Quotations**: Vendors submit quotations for RFQs
3. **Compare Quotations**: Purchaser compares quotations from multiple vendors
4. **Generate PO**: Purchaser generates purchase order from selected quotation
5. **Approval**: Purchase order goes through approval workflow
6. **Invoice Generation**: System generates invoice from approved PO
7. **Send Invoice**: Invoice is sent to vendor via email
8. **Payment Tracking**: Track invoice status and payments

## Project Structure

```
vendorbridge/
├── backend/
│   ├── alembic/              # Database migrations
│   ├── models/               # SQLAlchemy models
│   ├── routers/              # API route handlers
│   ├── schemas/              # Pydantic schemas
│   ├── services/             # Business logic
│   ├── utils/                # Utility functions
│   └── main.py               # FastAPI application entry point
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── api/              # API client
│   │   ├── hooks/            # Custom React hooks
│   │   └── store/            # State management
│   └── public/               # Static assets
├── requirements.txt          # Python dependencies
└── package.json              # Node.js dependencies
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password

### Vendors
- `GET /api/vendors` - List all vendors
- `POST /api/vendors` - Create new vendor
- `GET /api/vendors/{id}` - Get vendor details
- `PUT /api/vendors/{id}` - Update vendor
- `DELETE /api/vendors/{id}` - Delete vendor

### RFQs
- `GET /api/rfqs` - List all RFQs
- `POST /api/rfqs` - Create new RFQ
- `GET /api/rfqs/{id}` - Get RFQ details
- `PUT /api/rfqs/{id}` - Update RFQ

### Quotations
- `GET /api/quotations` - List all quotations
- `POST /api/quotations` - Submit quotation
- `GET /api/quotations/{id}` - Get quotation details

### Purchase Orders
- `GET /api/purchase-orders` - List all purchase orders
- `POST /api/purchase-orders` - Create purchase order
- `GET /api/purchase-orders/{id}` - Get PO details
- `PUT /api/purchase-orders/{id}` - Update PO

### Invoices
- `GET /api/invoices` - List all invoices
- `POST /api/invoices` - Generate invoice
- `GET /api/invoices/{id}` - Get invoice details
- `POST /api/invoices/{id}/send` - Send invoice to vendor

## Invoice Number Format

Invoices are generated in the format: `INV{number}{year}`

Example: `INV00012026`

## Development

### Running Tests
```bash
# Backend tests
pytest

# Frontend tests
npm test
```

### Code Style
- Backend: Follow PEP 8 guidelines
- Frontend: Follow ESLint rules

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue on GitHub.

## Acknowledgments

- Built with FastAPI and React
- UI components from shadcn/ui
- Icons from Lucide React
