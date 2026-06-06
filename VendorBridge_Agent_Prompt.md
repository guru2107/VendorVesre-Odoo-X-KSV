# VendorBridge — Complete AI Agent Build Prompt
## 8-Hour Hackathon Edition — PostgreSQL (No Docker)

---

## ABSOLUTE RULES FOR THE AGENT

- Read every phase completely before writing a single line of code for that phase.
- Never skip a step. Never assume something is "already done."
- After completing each phase, do a self-check: does every listed endpoint exist? Does every listed UI screen exist?
- Never hardcode secrets, passwords, or tokens.
- Commit to a working state at the end of every phase — the app must be runnable after Phase 0.
- When in doubt about a field or behavior, choose the more complete option.
- PostgreSQL is the only database. No Docker. No SQLite. No fallback.

---

## TECH STACK — LOCKED, DO NOT DEVIATE

### Backend

| Layer | Technology |
|---|---|
| Framework | FastAPI (Python 3.11+) |
| ORM | SQLAlchemy 2.0 |
| Database | **PostgreSQL 15+ (locally installed)** |
| DB Driver | **`psycopg2-binary`** |
| Migrations | Alembic |
| Auth | JWT via `python-jose[cryptography]`, passwords via `passlib[bcrypt]` |
| Validation | Pydantic v2 |
| PDF Generation | ReportLab |
| Email | `fastapi-mail` with SMTP (Mailtrap for dev) |
| File Uploads | `python-multipart` + local disk under `/uploads/` |
| Environment | `python-dotenv` |
| Server | Uvicorn |

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 18 (Vite) |
| Routing | React Router v6 |
| State | Zustand (auth), React Query (server state) |
| HTTP Client | Axios with JWT interceptor |
| UI Components | shadcn/ui + Tailwind CSS |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Notifications | react-hot-toast |
| Icons | Lucide React |
| Date Picker | react-day-picker |
| Table | TanStack Table v8 |

### Infrastructure

| Tool | Purpose |
|---|---|
| PostgreSQL 15 | Primary database, locally installed |
| Alembic | Schema migrations |
| pgAdmin 4 | DB GUI (optional, install separately) |

---

## `requirements.txt` — EXACT CONTENTS

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
alembic==1.13.1
psycopg2-binary==2.9.9
pydantic==2.7.1
pydantic-settings==2.2.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
python-dotenv==1.0.1
fastapi-mail==1.4.1
reportlab==4.1.0
aiofiles==23.2.1
```

---

## ENVIRONMENT VARIABLES — `.env` FILE

```env
# PostgreSQL — direct local connection
DATABASE_URL=postgresql://vendorbridge_user:vendorbridge_pass_2025@localhost:5432/vendorbridge_db

# JWT
SECRET_KEY=vb_super_secret_jwt_key_change_this_before_deploy
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# Email — Mailtrap (sign up free at mailtrap.io for dev SMTP)
MAIL_USERNAME=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password
MAIL_FROM=noreply@vendorbridge.com
MAIL_PORT=587
MAIL_SERVER=smtp.mailtrap.io
MAIL_TLS=True
MAIL_SSL=False

# App
UPLOAD_DIR=uploads
FRONTEND_URL=http://localhost:5173
```

---

## PROJECT STRUCTURE — CREATE THIS EXACTLY

```
vendorbridge/
│
├── .env
├── .gitignore                   # include: venv/, .env, __pycache__/, uploads/, *.pyc
├── requirements.txt
├── check_db.py                  # one-time DB verification script
├── README.md
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── config.py
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   ├── models/
│   │   ├── __init__.py          # import ALL models here for Alembic
│   │   ├── user.py
│   │   ├── vendor.py
│   │   ├── rfq.py
│   │   ├── quotation.py
│   │   ├── approval.py
│   │   ├── purchase_order.py
│   │   ├── invoice.py
│   │   └── activity_log.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── vendor.py
│   │   ├── rfq.py
│   │   ├── quotation.py
│   │   ├── approval.py
│   │   ├── purchase_order.py
│   │   ├── invoice.py
│   │   └── activity_log.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── dashboard.py
│   │   ├── vendors.py
│   │   ├── rfqs.py
│   │   ├── quotations.py
│   │   ├── approvals.py
│   │   ├── purchase_orders.py
│   │   ├── invoices.py
│   │   ├── activity_logs.py
│   │   └── reports.py
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── vendor_service.py
│   │   ├── rfq_service.py
│   │   ├── quotation_service.py
│   │   ├── approval_service.py
│   │   ├── po_service.py
│   │   ├── invoice_service.py
│   │   └── report_service.py
│   ├── dependencies/
│   │   └── auth.py
│   └── utils/
│       ├── logger.py
│       ├── pdf_generator.py
│       ├── email_sender.py
│       └── number_generator.py
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── .env
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api/
│       │   └── axios.js
│       ├── store/
│       │   └── authStore.js
│       ├── hooks/
│       │   └── useAuth.js
│       ├── components/
│       │   ├── Layout.jsx
│       │   ├── Sidebar.jsx
│       │   ├── Topbar.jsx
│       │   ├── ProtectedRoute.jsx
│       │   └── RoleGuard.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── Signup.jsx
│           ├── Dashboard.jsx
│           ├── Vendors/
│           │   ├── VendorList.jsx
│           │   ├── VendorForm.jsx
│           │   └── VendorDetail.jsx
│           ├── RFQs/
│           │   ├── RFQList.jsx
│           │   ├── RFQCreate.jsx
│           │   └── RFQDetail.jsx
│           ├── Quotations/
│           │   ├── QuotationSubmit.jsx
│           │   ├── QuotationCompare.jsx
│           │   └── MyQuotations.jsx
│           ├── Approvals/
│           │   ├── ApprovalQueue.jsx
│           │   └── ApprovalDetail.jsx
│           ├── PurchaseOrders/
│           │   ├── POList.jsx
│           │   └── PODetail.jsx
│           ├── Invoices/
│           │   ├── InvoiceList.jsx
│           │   └── InvoiceDetail.jsx
│           ├── ActivityLogs.jsx
│           └── Reports.jsx
│
└── uploads/                     # created on app startup, gitignored
```

---

## PHASE 0 — PostgreSQL Local Setup (No Docker)

> This is the first thing the agent must do before any code is written. The database must be running and verified before Phase 1 starts.

### Step 0.1 — Install PostgreSQL Locally

Detect the operating system first, then follow the correct path.

#### Windows

```
1. Download PostgreSQL 15 installer from:
   https://get.enterprisedb.com/postgresql/postgresql-15.6-1-windows-x64.exe

2. Run installer with these settings:
   - Installation directory: C:\Program Files\PostgreSQL\15
   - Data directory: C:\Program Files\PostgreSQL\15\data
   - Password for postgres superuser: postgres123
   - Port: 5432
   - Locale: Default

3. When prompted, DO NOT install Stack Builder (uncheck it).

4. Add PostgreSQL bin to system PATH:
   - Open System Environment Variables
   - Edit PATH variable
   - Add: C:\Program Files\PostgreSQL\15\bin

5. Verify in a new terminal:
   psql --version
   Expected: psql (PostgreSQL) 15.x
```

#### macOS

```
# Option A — Homebrew (recommended)
brew install postgresql@15
brew services start postgresql@15
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
psql --version

# Option B — Postgres.app (GUI, easiest)
# Download from https://postgresapp.com/
# Move to Applications, Open app, click Initialize
sudo mkdir -p /etc/paths.d
echo /Applications/Postgres.app/Contents/Versions/latest/bin | sudo tee /etc/paths.d/postgresapp
# Restart terminal, then: psql --version
```

#### Linux (Ubuntu / Debian)

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
psql --version
```

#### Linux (Fedora / RHEL / CentOS)

```bash
sudo dnf install -y postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

### Step 0.2 — Create the Database and User

Run these commands. On Linux/macOS prefix with `sudo -u postgres` if needed.

```sql
-- Connect as superuser
psql -U postgres

-- Create dedicated app user
CREATE USER vendorbridge_user WITH PASSWORD 'vendorbridge_pass_2025';

-- Create database
CREATE DATABASE vendorbridge_db OWNER vendorbridge_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE vendorbridge_db TO vendorbridge_user;

\q
```

**Verify the connection works:**

```bash
psql -U vendorbridge_user -d vendorbridge_db -h localhost
# Expected: vendorbridge_db=# prompt
```

If connection is refused, start PostgreSQL:

```bash
# Windows
net start postgresql-x64-15

# macOS (Homebrew)
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
```

---

### Step 0.3 — `pg_hba.conf` Fix (Linux only)

On Linux, change the default `peer` auth to `md5` for password authentication over localhost.

```bash
# Find the file
sudo find / -name pg_hba.conf 2>/dev/null
# Usually: /etc/postgresql/15/main/pg_hba.conf

# Edit
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Change:
#   local   all   all   peer
# To:
#   local   all   all   md5

# Ensure this line exists:
#   host    all   all   127.0.0.1/32   md5

# Restart
sudo systemctl restart postgresql
```

---

### Step 0.4 — Python Environment

```bash
# From project root
python -m venv venv

# Activate
source venv/bin/activate        # macOS/Linux
# OR
venv\Scripts\activate           # Windows

pip install --upgrade pip
pip install -r requirements.txt
```

---

### Step 0.5 — Verify DB Connection from Python

Create and run `check_db.py` before writing any app code:

```python
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()
url = os.getenv("DATABASE_URL")
engine = create_engine(url)

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version()"))
        print("✅ PostgreSQL connected:", result.fetchone()[0])
except Exception as e:
    print("❌ Connection failed:", e)
```

```bash
python check_db.py
# Expected: ✅ PostgreSQL connected: PostgreSQL 15.x on ...
```

> **Do not proceed to Phase 1 until this passes.**

---

## PHASE 1 — Backend Core Setup

### `backend/config.py`

```
Use pydantic_settings.BaseSettings to load .env.
Fields: DATABASE_URL, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES,
        MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM, MAIL_PORT, MAIL_SERVER,
        MAIL_TLS, MAIL_SSL, UPLOAD_DIR, FRONTEND_URL
Export singleton: settings = Settings()
```

### `backend/database.py`

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,     # recycles stale connections
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### `backend/main.py`

```
Instantiate FastAPI(title="VendorBridge API", version="1.0.0", docs_url="/docs")

CORSMiddleware:
  allow_origins=[settings.FRONTEND_URL]
  allow_credentials=True
  allow_methods=["*"]
  allow_headers=["*"]

Startup event:
  os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
  Base.metadata.create_all(bind=engine)

Mount static files:
  app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

GET /health:
  return {"status": "ok", "db": "postgresql"}

Include all routers with their prefix and tags as each phase is completed.
```

### Alembic Setup

```bash
cd backend
alembic init alembic
```

Edit `alembic/env.py`:

```
from backend.config import settings
from backend.database import Base
import backend.models   # triggers __init__.py which imports all models

config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
target_metadata = Base.metadata
```

After each model is created:

```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
```

> For circular FK (users ↔ vendors): use `use_alter=True` on one FK and add a separate `CreateForeignKeyConstraint` in the migration after both tables exist.

---

## PHASE 2 — Authentication

### Database Models

#### `models/user.py`

```sql
Table: users
  id                SERIAL PRIMARY KEY
  name              VARCHAR(100) NOT NULL
  email             VARCHAR(255) UNIQUE NOT NULL   -- Index on this column
  hashed_password   VARCHAR(255) NOT NULL
  role              VARCHAR(30) NOT NULL
                    -- values: admin, procurement_officer, vendor, manager
                    -- Add CheckConstraint
  vendor_id         INTEGER NULLABLE REFERENCES vendors(id)
                    -- only set for vendor-role users, use_alter=True
  is_active         BOOLEAN DEFAULT TRUE
  created_at        TIMESTAMP DEFAULT NOW()
  updated_at        TIMESTAMP DEFAULT NOW()
```

#### `models/vendor.py`

```sql
Table: vendors
  id              SERIAL PRIMARY KEY
  company_name    VARCHAR(200) NOT NULL
  category        VARCHAR(100)
  gst_number      VARCHAR(20) UNIQUE
  contact_person  VARCHAR(100)
  email           VARCHAR(255) UNIQUE NOT NULL
  phone           VARCHAR(20)
  address         TEXT
  status          VARCHAR(20) DEFAULT 'active'
                  -- values: active, inactive, blacklisted
  created_by      INTEGER REFERENCES users(id)
  created_at      TIMESTAMP DEFAULT NOW()
  updated_at      TIMESTAMP DEFAULT NOW()
```

#### `models/__init__.py`

```python
# Import all models here so Alembic autogenerates correctly
from .user import User
from .vendor import Vendor
from .rfq import RFQ, RFQItem, RFQAttachment, RFQVendor
from .quotation import Quotation, QuotationItem
from .approval import Approval
from .purchase_order import PurchaseOrder
from .invoice import Invoice
from .activity_log import ActivityLog
```

---

### Schemas — `schemas/user.py`

```
UserCreate:
  name: str (min_length=2, max_length=100)
  email: EmailStr
  password: str (min_length=8)
  role: Literal["admin", "procurement_officer", "vendor", "manager"]

UserLogin:
  email: EmailStr
  password: str

UserOut:
  id, name, email, role, is_active, vendor_id, created_at
  model_config = ConfigDict(from_attributes=True)

Token:
  access_token: str
  token_type: str = "bearer"
  user: UserOut
```

---

### Services — `services/auth_service.py`

```
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

create_user(db, data: UserCreate) -> User:
  Check email unique — raise HTTPException 400 "Email already registered"
  Hash password with pwd_context.hash()
  Insert user, commit, refresh
  log_activity(...)
  Return user

authenticate_user(db, email, password) -> User:
  Fetch user by email
  If not found or not is_active: raise 401 "Invalid credentials"
  If not verify_password: raise 401
  Return user

create_access_token(data: dict) -> str:
  payload = {**data, "exp": utcnow() + timedelta(minutes=EXPIRE)}
  return jwt.encode(payload, SECRET_KEY, ALGORITHM)
```

---

### Dependencies — `dependencies/auth.py`

```
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

get_current_user(token, db):
  Decode JWT — raise 401 on JWTError
  Extract "sub" (email) from payload
  Fetch user from DB
  If not found or not is_active: raise 401
  Return user

require_role(*roles):
  def dependency(current_user=Depends(get_current_user)):
    if current_user.role not in roles:
      raise HTTPException 403 "Insufficient permissions"
    return current_user
  return dependency
```

---

### Router — `routers/auth.py`

```
POST /auth/signup    → create_user(db, body)         → UserOut, 201
POST /auth/login     → authenticate_user → token     → Token
GET  /auth/me        → Depends(get_current_user)      → UserOut
```

---

### Frontend — Auth Pages

#### `src/api/axios.js`

```javascript
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })

// Request interceptor — attach JWT
api.interceptors.request.use(config => {
  const token = localStorage.getItem("vb_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — handle 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem("vb_token")
      localStorage.removeItem("vb_user")
      window.location.href = "/login"
    }
    return Promise.reject(err)
  }
)
export default api
```

#### `src/store/authStore.js`

```javascript
const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setAuth: (user, token) => {
    localStorage.setItem("vb_token", token)
    localStorage.setItem("vb_user", JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },
  clearAuth: () => {
    localStorage.removeItem("vb_token")
    localStorage.removeItem("vb_user")
    set({ user: null, token: null, isAuthenticated: false })
  }
}))

// Hydrate on load
const storedToken = localStorage.getItem("vb_token")
const storedUser  = localStorage.getItem("vb_user")
if (storedToken && storedUser) {
  useAuthStore.setState({
    token: storedToken,
    user: JSON.parse(storedUser),
    isAuthenticated: true
  })
}
```

#### `pages/Login.jsx`

```
Zod: email (EmailStr), password (min 8)
On submit: POST /auth/login → setAuth(data.user, data.access_token) → /dashboard
Show spinner while pending
toast.error on 401
Links: /signup, /forgot-password (mock)
```

#### `pages/Signup.jsx`

```
Zod: name (min 2), email, password (min 8),
     confirmPassword (must match), role (enum)
On success: auto-login → setAuth → /dashboard
```

---

## PHASE 3 — Dashboard

### Backend — `routers/dashboard.py`

```
GET /dashboard/summary — any authenticated role

For admin / procurement_officer / manager:
  pending_approvals : COUNT approvals WHERE status='pending'
  active_rfqs       : COUNT rfqs WHERE status='published'
  total_pos         : COUNT purchase_orders
  total_invoices    : COUNT invoices
  recent_purchase_orders : last 5, JOIN vendors (po_number, vendor name, status, issued_at)
  recent_invoices        : last 5, JOIN po JOIN vendor (invoice_number, total, status, generated_at)
  monthly_spend:
    SELECT TO_CHAR(DATE_TRUNC('month', generated_at), 'Mon YYYY') as month,
           SUM(total)::float as total
    FROM invoices
    WHERE generated_at >= NOW() - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', generated_at)
    ORDER BY DATE_TRUNC('month', generated_at) ASC

For vendor:
  active_rfqs     : COUNT rfqs WHERE id IN rfq_vendors for this vendor
  my_quotations   : COUNT quotations WHERE vendor_id = current_user.vendor_id
  recent_pos      : last 5 POs for this vendor
  monthly_spend   : [] (not applicable)
```

### Frontend — `pages/Dashboard.jsx`

```
useQuery(["dashboard"], () => api.get("/dashboard/summary").then(r => r.data))

Row 1 — 4 KPI Cards (show Skeleton while loading):
  Pending Approvals  — amber  — Clock icon
  Active RFQs        — blue   — FileText icon
  Purchase Orders    — emerald — ShoppingCart icon
  Total Invoices     — violet — Receipt icon

Row 2 — two tables (50/50):
  Recent Purchase Orders : PO#, Vendor, Status badge, Date
  Recent Invoices        : Invoice#, Amount (₹), Status badge, Date

Row 3 — BarChart (Recharts, full width):
  XAxis: month labels | YAxis: ₹ amount | Tooltip: "₹ 1,24,500"
  Title: "Procurement Spend — Last 6 Months"

Row 4 — Quick Actions:
  "New RFQ" (procurement_officer/admin) → /rfqs/create
  "View Vendors" → /vendors
  "Pending Approvals" (non-vendor) → /approvals
```

---

## PHASE 4 — Vendor Management

### Database Model

```sql
-- Already defined in Phase 2; add SQLAlchemy relationships now:
-- created_by_user = relationship("User", foreign_keys=[created_by])
-- rfq_assignments = relationship("RFQVendor", back_populates="vendor")
-- quotations      = relationship("Quotation",  back_populates="vendor")
```

### Schemas — `schemas/vendor.py`

```
VendorCreate:
  company_name  : str (min 2, max 200)
  category      : Literal["IT","Logistics","Manufacturing",
                           "Office Supplies","Construction","Healthcare","Other"]
  gst_number    : str — regex: ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$
  contact_person: str
  email         : EmailStr
  phone         : str (min 10 digits)
  address       : str (optional)

VendorUpdate       : all fields Optional
VendorOut          : all fields + created_by_name (from join)
VendorListResponse : vendors: List[VendorOut], total: int
```

### Services — `services/vendor_service.py`

```
create_vendor(db, data, current_user):
  Check email unique — 400 if duplicate
  Check gst_number unique — 400 if duplicate
  Insert, commit, refresh, log, return

get_vendors(db, search, category, status, skip, limit):
  If search: ILIKE across company_name, contact_person, email, gst_number (OR)
  If category: AND category = category
  If status: AND status = status
  ORDER BY created_at DESC, OFFSET skip LIMIT limit
  Return (vendors, total_count)

update_vendor_status(db, vendor_id, new_status, current_user):
  Fetch or 404
  vendor.status = new_status
  vendor.updated_at = utcnow()
  Commit, log activity
```

### Router — `routers/vendors.py`

```
POST   /vendors              — require_role("admin","procurement_officer")  → 201
GET    /vendors              — any role  — query: search, category, status, skip, limit
GET    /vendors/{id}         — any role
PUT    /vendors/{id}         — require_role("admin")
PATCH  /vendors/{id}/status  — require_role("admin") — body: {status: str}
```

### Frontend Pages

#### `pages/Vendors/VendorList.jsx`

```
TanStack Table columns:
  Company Name (link), Category, GST No, Contact, Email, Phone,
  Status badge (green=active / grey=inactive / red=blacklisted), Actions

Above table: search input (debounced 300ms), Category dropdown, Status dropdown
Right: "Add Vendor" button (admin/procurement_officer only)
Pagination: 20 per page
Loading: 5 skeleton rows | Empty: helpful message + button
```

#### `pages/Vendors/VendorForm.jsx`

```
Used for both Create (/vendors/new) and Edit (/vendors/{id}/edit)
All fields with inline Zod error messages
GST hint text: "Format: 22AAAAA0000A1Z5"
If editing: pre-populate form, submit to PUT
On success: toast "Vendor saved", navigate /vendors
On 409: toast "Email or GST already registered"
```

#### `pages/Vendors/VendorDetail.jsx`

```
Breadcrumb: Vendors > {company_name}
Left: all fields as label-value pairs
Right: Status badge, "Change Status" dropdown (admin), "Edit" button
Below: RFQ history table for this vendor (Title, Status, Deadline, Quotation Status)
```

---

## PHASE 5 — RFQ Management

### Database Models — `models/rfq.py`

```sql
Table: rfqs
  id            SERIAL PK
  title         VARCHAR(300) NOT NULL
  description   TEXT
  deadline      TIMESTAMP NOT NULL
  status        VARCHAR(20) DEFAULT 'draft'
                -- CHECK IN ('draft','published','closed')
  created_by    INTEGER REFERENCES users(id)
  created_at    TIMESTAMP DEFAULT NOW()
  updated_at    TIMESTAMP DEFAULT NOW()

Table: rfq_items
  id              SERIAL PK
  rfq_id          INTEGER REFERENCES rfqs(id) ON DELETE CASCADE
  product_name    VARCHAR(200) NOT NULL
  quantity        NUMERIC(12,2) NOT NULL CHECK(quantity > 0)
  unit            VARCHAR(50)
  specifications  TEXT

Table: rfq_attachments
  id            SERIAL PK
  rfq_id        INTEGER REFERENCES rfqs(id) ON DELETE CASCADE
  filename      VARCHAR(255)
  file_path     VARCHAR(500)
  uploaded_at   TIMESTAMP DEFAULT NOW()

Table: rfq_vendors
  id          SERIAL PK
  rfq_id      INTEGER REFERENCES rfqs(id) ON DELETE CASCADE
  vendor_id   INTEGER REFERENCES vendors(id)
  invited_at  TIMESTAMP DEFAULT NOW()
  UNIQUE(rfq_id, vendor_id)
```

### Services — `services/rfq_service.py`

```
create_rfq(db, data, current_user):
  Validate deadline > utcnow()             — raise 400 "Deadline must be in the future"
  Validate all vendor_ids exist in DB      — raise 400 listing unknown IDs
  Insert RFQ, bulk insert rfq_items, bulk insert rfq_vendors
  log_activity, return RFQOut

publish_rfq(db, rfq_id, current_user):
  Fetch or 404
  Check status == 'draft'                  — raise 400 "Only draft RFQs can be published"
  Check ownership or admin role
  Set status='published', updated_at=now(), commit, log

get_rfqs(db, current_user, status_filter, skip, limit):
  If vendor: JOIN rfq_vendors WHERE vendor_id == current_user.vendor_id
  Else: all RFQs, optional status filter
  ORDER BY created_at DESC, return (rfqs, total)

save_attachment(db, rfq_id, file: UploadFile):
  Create dir: uploads/rfq_{rfq_id}/
  Save file to disk with sanitized filename
  Insert RFQAttachment row, return record
```

### Router — `routers/rfqs.py`

```
POST   /rfqs                  — require_role("procurement_officer","admin") → 201
GET    /rfqs                  — any role — query: status, skip, limit
GET    /rfqs/{id}             — any role (vendor access verified in service)
PUT    /rfqs/{id}             — require_role("procurement_officer","admin") — draft only
PATCH  /rfqs/{id}/publish     — require_role("procurement_officer","admin")
PATCH  /rfqs/{id}/close       — require_role("procurement_officer","admin")
POST   /rfqs/{id}/attachments — require_role("procurement_officer","admin") — multipart
```

### Frontend Pages

#### `pages/RFQs/RFQCreate.jsx`

```
4-step wizard with progress bar:
  Info → Items → Vendors → Attachments

Step 1 — Basic Info:
  Title (text, char counter X/300), Description (textarea),
  Deadline (react-day-picker, disable past dates and today)

Step 2 — Line Items:
  Dynamic rows: Product Name* | Quantity* (>0) | Unit* | Specifications
  "+ Add Item" | "×" remove (disabled if only 1 row remains)
  Zod: items array min length 1

Step 3 — Assign Vendors:
  GET /vendors?status=active&limit=100
  Searchable checkbox list — each item: checkbox + name + category badge
  "X vendors selected" counter — Zod: min 1

Step 4 — Attachments (optional):
  Dropzone — accepted: .pdf .doc .docx .xls .xlsx .png .jpg
  Max 5MB per file — show file name, size, remove button

Submit:
  POST /rfqs → then POST /rfqs/{id}/attachments for each file
  On success: toast "RFQ Created!" → /rfqs/{id}
```

#### `pages/RFQs/RFQList.jsx`

```
Table: Title, Status badge, Deadline (color by urgency), Vendors count,
       Quotations count, Created by, Actions
Deadline color: green (>7d) | amber (3-7d) | red (<3d) | grey strikethrough (past)
Filters: status dropdown, title search
"New RFQ" button (procurement_officer/admin)
```

#### `pages/RFQs/RFQDetail.jsx`

```
Breadcrumb: RFQs > {title}
Header: Title, status badge, deadline
Tabs: Overview | Line Items | Vendors | Attachments

Action bar (role-based):
  "Publish RFQ"          — procurement_officer, status==draft
  "Compare Quotations"   — procurement_officer/manager, ≥2 quotations submitted
  "Submit Quotation"     — vendor only, status==published, vendor is assigned
  "Close RFQ"            — procurement_officer/admin
```

---

## PHASE 6 — Quotation Submission

### Database Models — `models/quotation.py`

```sql
Table: quotations
  id            SERIAL PK
  rfq_id        INTEGER REFERENCES rfqs(id)
  vendor_id     INTEGER REFERENCES vendors(id)
  status        VARCHAR(20) DEFAULT 'submitted'
                -- CHECK IN ('submitted','under_review','accepted','rejected')
  delivery_days INTEGER NOT NULL CHECK(delivery_days > 0)
  notes         TEXT
  subtotal      NUMERIC(14,2)
  submitted_at  TIMESTAMP DEFAULT NOW()
  updated_at    TIMESTAMP DEFAULT NOW()
  UNIQUE(rfq_id, vendor_id)

Table: quotation_items
  id              SERIAL PK
  quotation_id    INTEGER REFERENCES quotations(id) ON DELETE CASCADE
  rfq_item_id     INTEGER REFERENCES rfq_items(id)
  unit_price      NUMERIC(14,2) NOT NULL CHECK(unit_price > 0)
  quantity        NUMERIC(12,2) NOT NULL
  total_price     NUMERIC(14,2)   -- computed in Python: unit_price * quantity
```

### Services — `services/quotation_service.py`

```
submit_quotation(db, data, current_user):
  Resolve vendor from current_user.vendor_id   — raise 403 if not linked
  Fetch RFQ or 404
  Check rfq.status == 'published'              — raise 400 "RFQ is not open"
  Check vendor in rfq_vendors                  — raise 403 "Not invited"
  Check no existing quotation (unique)         — raise 409 "Already submitted"
  Validate all rfq_item_ids covered            — raise 400 listing missing items

  For each item:
    total = unit_price * rfq_item.quantity
  subtotal = sum(totals)

  Insert Quotation, then QuotationItems
  log_activity, return QuotationOut

edit_quotation(db, quotation_id, data, current_user):
  Fetch or 404
  Check vendor owns it                         — raise 403
  Check status == 'submitted'                  — raise 400 "Cannot edit at this stage"
  Update items, recompute subtotal, commit
```

### Router — `routers/quotations.py`

```
POST /quotations                   — require_role("vendor")
PUT  /quotations/{id}              — require_role("vendor") — status==submitted only
GET  /quotations/my                — require_role("vendor")
GET  /quotations/rfq/{rfq_id}     — require_role("procurement_officer","manager","admin")
GET  /quotations/{id}              — owner vendor or procurement roles
GET  /quotations/compare/{rfq_id} — require_role("procurement_officer","manager","admin")
```

### Compare Endpoint Response Shape

```json
{
  "rfq": {
    "id": 1,
    "title": "Office Supplies Q3",
    "items": [{ "id": 1, "product_name": "A4 Paper", "quantity": 100, "unit": "ream" }]
  },
  "quotations": [
    {
      "id": 1,
      "vendor_name": "ABC Supplies",
      "delivery_days": 5,
      "subtotal": 15000,
      "items": [
        { "rfq_item_id": 1, "product_name": "A4 Paper", "unit_price": 150, "quantity": 100, "total_price": 15000 }
      ]
    }
  ],
  "lowest_prices": { "1": 150 }
}
```

`lowest_prices` is a dict of `rfq_item_id → lowest unit_price` across all quotations — used by frontend to highlight cells.

### Frontend Pages

#### `pages/Quotations/QuotationSubmit.jsx`

```
Load RFQ detail to get items
For each item: Product Name, Required Qty, Unit + unit_price input
Live calculation: row Total = unit_price × quantity
Bottom summary: Subtotal = ₹ sum of all totals
Delivery days input (integer, min 1) + Notes textarea
On success: toast "Quotation submitted!" → /quotations/my
```

#### `pages/Quotations/MyQuotations.jsx`

```
Vendor-only page
Table: RFQ Title, Submitted At, Delivery Days, Subtotal (₹), Status badge
Actions: View | Edit (only if status==submitted)
```

#### `pages/Quotations/QuotationCompare.jsx`

```
Header: "Comparing X quotations for: {RFQ Title}"

Comparison table:
  Rows    = each RFQ line item (product, qty, unit)
  Columns = each vendor
  Cells   = unit_price — lowest cell highlighted green per row

Footer rows:
  Delivery (days)  — highlight lowest in green
  Subtotal (₹)     — highlight lowest in green

Vendor column header: Vendor Name, status badge
"Select for Approval" at bottom of each column
  → confirm dialog → POST /approvals → /approvals
```

---

## PHASE 7 — Approval Workflow

### Database Model — `models/approval.py`

```sql
Table: approvals
  id              SERIAL PK
  quotation_id    INTEGER REFERENCES quotations(id)
  rfq_id          INTEGER REFERENCES rfqs(id)
  requested_by    INTEGER REFERENCES users(id)
  reviewed_by     INTEGER REFERENCES users(id) NULLABLE
  status          VARCHAR(20) DEFAULT 'pending'
                  -- CHECK IN ('pending','approved','rejected')
  remarks         TEXT
  requested_at    TIMESTAMP DEFAULT NOW()
  reviewed_at     TIMESTAMP NULLABLE
```

### Services — `services/approval_service.py`

```
request_approval(db, quotation_id, current_user):
  Check no existing pending/approved approval for this quotation — raise 409
  Insert Approval, set quotation.status='under_review', commit, log

approve(db, approval_id, remarks, current_user):
  Fetch or 404
  Check status=='pending'             — raise 400 "Already reviewed"
  approval.status='approved', reviewed_by, reviewed_at=now()
  quotation.status='accepted'
  All other quotations for same RFQ → status='rejected'
  RFQ.status='closed'
  Commit, log
  Auto-call po_service.create_po(db, quotation_id)

reject(db, approval_id, remarks, current_user):
  Remarks required (min 10 chars)     — raise 400 if empty
  approval.status='rejected', reviewed_by, reviewed_at=now()
  quotation.status='rejected'
  Commit, log

get_approvals(db, current_user, status_filter):
  admin/manager    : all approvals
  proc_officer     : WHERE requested_by == current_user.id
```

### Router — `routers/approvals.py`

```
POST /approvals                — require_role("procurement_officer","admin")
                                 body: { quotation_id: int }
GET  /approvals                — require_role("manager","admin","procurement_officer")
                                 query: status
GET  /approvals/{id}           — same roles
POST /approvals/{id}/approve   — require_role("manager","admin")
                                 body: { remarks: str (optional) }
POST /approvals/{id}/reject    — require_role("manager","admin")
                                 body: { remarks: str (required, min 10 chars) }
```

### Frontend Pages

#### `pages/Approvals/ApprovalQueue.jsx`

```
Table: RFQ Title, Vendor Name, Quotation Total, Requested By, Date, Status badge, Actions
Filter: status dropdown (All / Pending / Approved / Rejected)
Pending rows: amber row highlight
"Review" → ApprovalDetail
```

#### `pages/Approvals/ApprovalDetail.jsx`

```
Header: RFQ title, requested by, requested at

Quotation summary card:
  Vendor name, subtotal, delivery days, line items table

Vertical stepper (approval timeline):
  1. Request Created    ✅ {user} at {time}
  2. Under Review       ⏳ (spinning if pending)
  3. Decision           ✅/❌ {reviewer} at {time} + remarks

Approve/Reject form (manager only, status==pending):
  Remarks textarea
  "Approve" (green) | "Reject" (red)
  Reject requires remarks (min 10 chars)
  Confirm dialog before submit

On approve: toast "Quotation approved! PO auto-generated" → /purchase-orders
On reject:  toast "Quotation rejected" → /approvals
```

---

## PHASE 8 — Purchase Orders

### Database Model — `models/purchase_order.py`

```sql
Table: purchase_orders
  id              SERIAL PK
  po_number       VARCHAR(30) UNIQUE NOT NULL  -- format: PO-2025-0001
  quotation_id    INTEGER REFERENCES quotations(id)
  approval_id     INTEGER REFERENCES approvals(id)
  vendor_id       INTEGER REFERENCES vendors(id)
  issued_by       INTEGER REFERENCES users(id)
  status          VARCHAR(20) DEFAULT 'issued'
                  -- CHECK IN ('issued','fulfilled','cancelled')
  issued_at       TIMESTAMP DEFAULT NOW()
  updated_at      TIMESTAMP DEFAULT NOW()
```

### `utils/number_generator.py`

```python
def generate_po_number(db) -> str:
    year  = datetime.utcnow().year
    count = db.query(PurchaseOrder).filter(
        extract('year', PurchaseOrder.issued_at) == year
    ).count()
    return f"PO-{year}-{str(count + 1).zfill(4)}"

def generate_invoice_number(db) -> str:
    year  = datetime.utcnow().year
    count = db.query(Invoice).filter(
        extract('year', Invoice.generated_at) == year
    ).count()
    return f"INV-{year}-{str(count + 1).zfill(4)}"
```

### Services — `services/po_service.py`

```
create_po(db, quotation_id, issued_by_user_id=None):
  Fetch quotation or 404
  Check no existing PO for this quotation  — raise 409
  Fetch approved Approval for this quotation
  po_number = generate_po_number(db)
  Insert PurchaseOrder, commit, log, return
```

### Router — `routers/purchase_orders.py`

```
GET   /purchase-orders       — require_role("procurement_officer","admin","manager")
                               vendor also sees their own POs
                               query: status, vendor_id, skip, limit
GET   /purchase-orders/{id}  — same roles + vendor sees own POs
PATCH /purchase-orders/{id}/status — require_role("procurement_officer","admin")
                                     body: { status: "fulfilled" | "cancelled" }
```

### Frontend Pages

#### `pages/PurchaseOrders/POList.jsx`

```
Table: PO Number, Vendor Name, Subtotal, Status badge, Issued At, Actions
Filter: status dropdown
Click row or "View" → PODetail
```

#### `pages/PurchaseOrders/PODetail.jsx`

```
Header: PO Number, status badge, issued at
Vendor info card: name, email, phone, GST

Line Items table (from quotation items):
  Product | Qty | Unit | Unit Price | Total

Summary card (right-aligned):
  Subtotal | Tax (18% GST) | Grand Total

Action buttons:
  "Generate Invoice" → POST /invoices/{po_id} → /invoices/{new_id}
  "Mark Fulfilled"   — status==issued
  "Cancel"           — status==issued

Approval info: approved by, approved at, remarks
```

---

## PHASE 9 — Invoice Generation

### Database Model — `models/invoice.py`

```sql
Table: invoices
  id              SERIAL PK
  invoice_number  VARCHAR(30) UNIQUE NOT NULL   -- format: INV-2025-0001
  po_id           INTEGER REFERENCES purchase_orders(id)
  tax_rate        NUMERIC(5,2) DEFAULT 18.00    -- GST %
  subtotal        NUMERIC(14,2)
  tax_amount      NUMERIC(14,2)
  total           NUMERIC(14,2)
  status          VARCHAR(20) DEFAULT 'generated'
                  -- CHECK IN ('generated','sent','paid')
  generated_by    INTEGER REFERENCES users(id)
  generated_at    TIMESTAMP DEFAULT NOW()
  sent_at         TIMESTAMP NULLABLE
  updated_at      TIMESTAMP DEFAULT NOW()
```

### `utils/pdf_generator.py`

```
generate_invoice_pdf(invoice, po, vendor, quotation_items) -> bytes:
  Use ReportLab — render to io.BytesIO (in-memory, not written to disk)

  Page layout (A4):
    Header:
      Left:  "VendorBridge" wordmark, address, GSTIN
      Right: "INVOICE" (large caps), invoice number, date, PO reference

    Bill To section:
      Vendor company name, contact person, address, GST number

    Line Items table:
      Columns: #, Product/Service, Qty, Unit, Unit Price (₹), Total (₹)
      Alternating row shading, bold header row

    Summary (right-aligned):
      Subtotal:    ₹ X
      GST (18%):   ₹ X
      ─────────────────
      TOTAL:       ₹ X  (bold, larger)

    Footer:
      "Thank you for your business"
      "Payment due within 30 days"

  Return PDF as bytes
```

### `utils/email_sender.py`

```
async send_invoice_email(invoice, vendor_email, vendor_name, pdf_bytes):
  FastMail MessageSchema:
    recipients : [vendor_email]
    subject    : f"Invoice {invoice_number} from VendorBridge"
    body       : professional plain-text email with invoice details
    attachments: [{ file: pdf_bytes, filename: f"{invoice_number}.pdf",
                    mime_type: "application/pdf" }]
  Send via FastMail instance configured from settings
```

### Services — `services/invoice_service.py`

```
create_invoice(db, po_id, current_user):
  Fetch PO or 404
  Check no existing invoice for this PO       — raise 409
  tax_rate   = 18.00
  tax_amount = round(subtotal * 18 / 100, 2)
  total      = round(subtotal + tax_amount, 2)
  Insert Invoice, commit, log, return

async send_invoice(db, invoice_id, current_user):
  Fetch invoice or 404
  pdf_bytes = generate_invoice_pdf(invoice, po, vendor, items)
  await send_invoice_email(invoice, vendor.email, vendor.company_name, pdf_bytes)
  invoice.status = 'sent'
  invoice.sent_at = utcnow()
  Commit, log
```

### Router — `routers/invoices.py`

```
POST  /invoices/{po_id}        — require_role("procurement_officer","admin")
GET   /invoices                — any procurement role, vendor sees own
GET   /invoices/{id}           — procurement role or vendor (own only)

GET   /invoices/{id}/pdf       — any auth user
  Generate PDF bytes in memory
  Return Response(content=pdf_bytes, media_type="application/pdf",
    headers={"Content-Disposition": f'attachment; filename="{invoice_number}.pdf"'})

POST  /invoices/{id}/send-email — require_role("procurement_officer","admin")
  Call send_invoice service
  Return { "message": f"Invoice sent to {vendor_email}" }

PATCH /invoices/{id}/status     — require_role("procurement_officer","admin")
  body: { status: "paid" }
```

### Frontend Pages

#### `pages/Invoices/InvoiceDetail.jsx`

```
Header: Invoice Number, status badge, generated at
Left column:  Bill To (vendor details)
Right column: Invoice meta (number, date, PO reference)

Line Items table: Product | Qty | Unit | Unit Price | Total

Summary box (right-aligned):
  Subtotal : ₹ X,XX,XXX
  GST 18%  : ₹ X,XXX
  ─────────────────────
  Total    : ₹ X,XX,XXX  (bold)

Action buttons:
  "Download PDF"   → GET /invoices/{id}/pdf (new tab or download)
  "Print"          → window.print() with @media print CSS hiding nav/sidebar
  "Send via Email" → POST /invoices/{id}/send-email + confirm dialog
                     "Send to {vendor_email}?"
  "Mark as Paid"   → PATCH /invoices/{id}/status { status: "paid" }
```

---

## PHASE 10 — Activity Logs

### Database Model — `models/activity_log.py`

```sql
Table: activity_logs
  id            SERIAL PK
  user_id       INTEGER REFERENCES users(id)
  action        VARCHAR(50)    -- CREATE, UPDATE, DELETE, LOGIN, APPROVE, REJECT, SEND
  entity_type   VARCHAR(50)    -- vendor, rfq, quotation, approval, purchase_order, invoice
  entity_id     INTEGER
  description   TEXT
  ip_address    VARCHAR(45) NULLABLE
  created_at    TIMESTAMP DEFAULT NOW()
```

### `utils/logger.py`

```python
def log_activity(db, user_id, action, entity_type, entity_id, description, ip_address=None):
    log = ActivityLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        ip_address=ip_address
    )
    db.add(log)
    # Do NOT commit here — let the calling service commit everything atomically
```

### Router — `routers/activity_logs.py`

```
GET /activity-logs  — any auth user
  query: entity_type, action, start_date, end_date, skip=0, limit=50

  Scoping by role:
    admin / manager        : all logs
    procurement_officer    : own logs + all procurement entity logs
    vendor                 : own logs only

  Return: { logs: List[ActivityLogOut], total: int }

GET /notifications   — any auth user
  Return last 10 activity logs relevant to current user (unread indicator only)
```

### Frontend — `pages/ActivityLogs.jsx`

```
Filters bar:
  Entity Type dropdown: All / Vendor / RFQ / Quotation / Approval / PO / Invoice
  Action dropdown: All / CREATE / UPDATE / APPROVE / REJECT / LOGIN
  Date range: From / To pickers
  "Clear Filters" button

Timeline list (visual, not table):
  Each entry:
    Left:  colored circle icon by entity_type
           vendor=blue | rfq=purple | approval=amber | invoice=green
    Right: description (bold action + entity details)
           "by {user_name} • {relative_time}" (e.g. "2 hours ago")
  "Load More" button (50 per load)

Topbar notification bell:
  Badge: unread count from GET /notifications
  Dropdown on click: last 10 notification entries
```

---

## PHASE 11 — Reports & Analytics

### Router — `routers/reports.py`

All endpoints require `require_role("admin", "manager")`.

```
GET /reports/procurement-stats:
  total_rfqs, total_quotations, total_purchase_orders, total_invoices,
  total_spend (SUM of invoice totals),
  avg_quotations_per_rfq (float),
  approval_rate (approved / total approvals × 100, float)

GET /reports/monthly-spend:
  query param: months (default 12)
  PostgreSQL DATE_TRUNC('month', generated_at)
  Return: [{ month: "Jan 2025", total: 125000.00 }]

GET /reports/vendor-performance:
  Per vendor:
    vendor_id, company_name, category,
    total_quotations_submitted, quotations_won (status='accepted'),
    win_rate (float %), avg_delivery_days, total_po_value
  ORDER BY total_po_value DESC

GET /reports/spending-by-category:
  JOIN vendors on vendor_id, GROUP BY vendor.category
  Return: [{ category: "IT", total: 500000 }]

GET /reports/export:
  query params: start_date, end_date, entity (rfqs|pos|invoices|vendors)
  Build CSV in memory (io.StringIO + csv module)
  Return StreamingResponse(media_type="text/csv")
  Header: Content-Disposition: attachment; filename="vendorbridge_{entity}_{date}.csv"
```

### Frontend — `pages/Reports.jsx`

```
Top row — 4 KPI stat cards:
  Total Spend (₹) | Approval Rate (%) | Avg Quotations/RFQ | Total Vendors

Row 2 (2-column):
  Left  (60%): BarChart — Monthly Spend last 12 months (Recharts)
  Right (40%): PieChart — Spending by Category (Recharts PieChart + legend)

Row 3 — Vendor Performance Table (TanStack Table):
  Vendor | Category | Quotations | Won | Win Rate | Avg Delivery | Total PO Value
  Win Rate color: green >50% | amber 25-50% | red <25%
  All numeric columns sortable

Export section:
  Entity dropdown + date range pickers + "Export CSV" button
  Triggers: GET /reports/export?entity=X&start_date=Y&end_date=Z
  Browser downloads file automatically
```

---

## PHASE 12 — Final Hardening

### Backend Checklist

```
1. Global exception handlers in main.py:

   @app.exception_handler(HTTPException)
   → JSONResponse({"error": exc.detail, "status_code": exc.status_code})

   @app.exception_handler(RequestValidationError)
   → JSONResponse({"error": "Validation error", "details": exc.errors()}, 422)

   @app.exception_handler(Exception)
   → log the error, JSONResponse({"error": "Internal server error"}, 500)

2. All *Out Pydantic schemas must have:
   model_config = ConfigDict(from_attributes=True)

3. All routers included in main.py with correct prefixes:
   /auth, /dashboard, /vendors, /rfqs, /quotations,
   /approvals, /purchase-orders, /invoices, /activity-logs, /reports

4. Final Alembic migration:
   alembic revision --autogenerate -m "complete_schema"
   alembic upgrade head

5. Verify /docs Swagger page loads — all endpoints visible.

6. Manual end-to-end test via Swagger:
   Signup admin → Signup vendor → Create vendor record → Link vendor user
   → Create RFQ → Assign vendor → Publish → Submit quotation
   → Compare → Request approval → Approve → View PO
   → Generate Invoice → Download PDF → Send email
```

### Frontend Checklist

```
1. All API errors handled with toast.error messages
2. All loading states show Skeleton or spinner
3. All empty states: illustration + message + action button
4. React Query error boundaries around all data-fetching components
5. Sidebar.jsx filters nav links by user.role
6. ProtectedRoute wraps all non-auth pages in App.jsx
7. RoleGuard wraps role-sensitive pages
```

### `src/App.jsx` Route Structure

```
/login         → Login    (public)
/signup        → Signup   (public)

/ (ProtectedRoute) → Layout
  /dashboard                         → Dashboard
  /vendors                           → VendorList
  /vendors/new                       → VendorForm       (admin, procurement_officer)
  /vendors/:id                       → VendorDetail
  /vendors/:id/edit                  → VendorForm       (admin)
  /rfqs                              → RFQList
  /rfqs/create                       → RFQCreate        (procurement_officer, admin)
  /rfqs/:id                          → RFQDetail
  /quotations/my                     → MyQuotations     (vendor)
  /quotations/submit/:rfqId          → QuotationSubmit  (vendor)
  /quotations/compare/:rfqId         → QuotationCompare (procurement_officer, manager, admin)
  /approvals                         → ApprovalQueue
  /approvals/:id                     → ApprovalDetail
  /purchase-orders                   → POList
  /purchase-orders/:id               → PODetail
  /invoices                          → InvoiceList
  /invoices/:id                      → InvoiceDetail
  /activity-logs                     → ActivityLogs
  /reports                           → Reports          (admin, manager)
```

---

## README.md

```markdown
# VendorBridge

A Procurement & Vendor Management ERP built with FastAPI + React + PostgreSQL.

## Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (locally installed)

## Setup

### 1. Database
Ensure PostgreSQL is running locally, then:

  psql -U postgres
  CREATE USER vendorbridge_user WITH PASSWORD 'vendorbridge_pass_2025';
  CREATE DATABASE vendorbridge_db OWNER vendorbridge_user;
  GRANT ALL PRIVILEGES ON DATABASE vendorbridge_db TO vendorbridge_user;
  \q

### 2. Backend
  cd backend
  python -m venv venv
  source venv/bin/activate      # Windows: venv\Scripts\activate
  pip install -r requirements.txt
  cp .env.example .env          # fill in your values
  python ../check_db.py         # verify DB connection
  alembic upgrade head
  uvicorn main:app --reload --port 8000

### 3. Frontend
  cd frontend
  npm install
  cp .env.example .env
  npm run dev

## Access
- Frontend : http://localhost:5173
- API Docs : http://localhost:8000/docs

## User Roles
Create users via POST /auth/signup with one of these roles:
  admin | procurement_officer | vendor | manager

## Core Workflow
  1. admin creates Vendor records and user accounts
  2. procurement_officer creates and publishes an RFQ
  3. vendor submits a quotation for the RFQ
  4. procurement_officer compares quotations and requests approval
  5. manager approves — PO is auto-generated
  6. procurement_officer generates Invoice from PO
  7. Invoice can be downloaded as PDF, printed, or emailed to vendor
```

---

> This is the complete, self-contained agent prompt. Feed it phase by phase and the agent will build a fully functional VendorBridge ERP in one 8-hour session.
