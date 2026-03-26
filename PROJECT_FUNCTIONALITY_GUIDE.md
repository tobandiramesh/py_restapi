# Medivra Employee Desk - Complete Functionality Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Core Features](#core-features)
3. [AI Assistants](#ai-assistants)
4. [Employee Management](#employee-management)
5. [Search & Filtering](#search--filtering)
6. [Data Visualization](#data-visualization)
7. [Authentication](#authentication)
8. [Technical Architecture](#technical-architecture)
9. [Use Cases](#use-cases)

---

## 🎯 Project Overview

**Medivra Employee Desk** is a comprehensive people & culture platform that combines:
- Smart employee data management
- AI-powered workforce insights
- Interactive analytics and visualization
- Multi-provider AI assistance (Local, GitHub Copilot, ChatGPT, Gemini, Anthropic, Perplexity, DeepSeek)

**URL:** `localhost:5000`  
**Tech Stack:** Flask (Python) backend + Vanilla JS frontend + SQLite database

---

## 🚀 Core Features

### 1. **Employee Management System**
- ✅ Create new employee records (name, email, salary, department, manager, location)
- ✅ Search employees by ID
- ✅ View detailed employee cards
- ✅ Edit existing employee information
- ✅ Delete employee records
- ✅ Email validation
- ✅ Salary range validation ($1,000 - $10,000,000)

**Database Schema:**
```sql
CREATE TABLE employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  salary INTEGER NOT NULL,
  department TEXT NOT NULL,
  manager TEXT NOT NULL,
  geo_location TEXT NOT NULL
)
```

### 2. **Employee Directory & Pagination**
- ✅ Full employee roster display in sortable table
- ✅ Pagination (5 records per page)
- ✅ Sort by any column (ID, Name, Email, Salary, Department, Manager, Location)
- ✅ Ascending/Descending sort toggle
- ✅ Dynamic page navigation (Next/Previous)

### 3. **Real-Time Statistics Dashboard**
- ✅ **Total Employees** - Count of visible records
- ✅ **Departments** - Unique teams represented
- ✅ **Average Salary** - Calculated from visible records
- ✅ **Top Manager Load** - Manager with most direct reports
- ✅ Animated stat counters (smooth transitions)

### 4. **Workforce Insights Panel**
- ✅ Dynamic workforce summary generation
- ✅ Suggested actions based on current data
- ✅ Department mix visualization (pie/bar chart)
- ✅ Manager coverage visualization (pie/bar chart)
- ✅ Export charts as PNG images
- ✅ Real-time update on data changes

---

## 🤖 AI Assistants

### A. **Local Medivra Assistant** (In-App, No API Key)

#### Supported Patterns:

#### 🎯 **Greetings**
- **Patterns:** "hello", "hi", "hey", "how are you"
- **Response:** Employee count + general greeting
- **Example:** "hello"

#### ❓ **Help/Capabilities**
- **Patterns:** "help", "what can you do", "capabilities"
- **Response:** Detailed pattern guide with 10 categories + clickable "Try:" examples
- **Example:** "help"

#### 📊 **Summary/Insights**
- **Patterns:** "summary", "summarize", "overview", "insight", "insights"
- **Response:** 
  - Employee count
  - Department count
  - Average salary
  - Top department (name + headcount)
  - Top manager (name + reports)
  - Highest paid employee (name + salary)
- **Example:** "summary"

#### 🏢 **Department Analysis**
- **Patterns:** Any department name (e.g., "Engineering", "Marketing", "Product")
- **Response:** Department headcount + average salary
- **Example:** "Engineering team"

#### 👔 **Manager Analysis**
- **Patterns:** Any manager name (e.g., "Sarah Smith", "Michael Brown")
- **Response:** Direct reports count + team preview (first 4 names)
- **Example:** "manager Sarah Smith"

#### 💰 **Salary Range**
- **Patterns:** "between/from $X and/to $Y"
- **Response:** Count of employees in salary range
- **Example:** "between 70000 and 100000"

#### 📈 **Salary Above Threshold**
- **Patterns:** "above/over/greater than/more than $X"
- **Response:** Count of employees above threshold
- **Example:** "salary above 80000"

#### 📉 **Salary Below Threshold**
- **Patterns:** "below/under/less than $X"
- **Response:** Count of employees below threshold
- **Example:** "salary below 75000"

#### 👋 **Polite Closing**
- **Patterns:** "thanks", "thank you", "goodbye", "bye"
- **Response:** Acknowledgment message

#### 🌤️ **Weather Queries**
- **Patterns:** "weather", "temperature", "forecast", "rain", "humidity"
- **Response:** Not available; redirects to employee analytics

#### ℹ️ **Default Behavior**
- **Unrelated Queries:** Automatically route to GitHub Copilot
- **Example:** "write a cover letter" → GitHub Copilot response

---

### B. **GitHub Copilot (API-Based)**
- **Auth:** GitHub token (from `.env`)
- **Model:** gpt-4o-mini
- **Base URL:** `https://models.inference.ai.azure.com`
- **Use Cases:** General text drafting, cover letters, emails, proposals
- **Features:** HR-focused system prompt for contextual responses

---

### C. **ChatGPT / OpenAI**
- **Auth:** OpenAI API Key (from `.env`)
- **Model:** gpt-4o-mini (configurable)
- **Base URL:** `https://api.openai.com/v1`
- **Features:** Full ChatGPT capabilities with HR/workforce context

---

### D. **Gemini (Google)**
- **Auth:** Google API Key (from `.env`)
- **Model:** gemini-2.0-flash
- **Base URL:** `https://generativelanguage.googleapis.com/v1beta/openai`
- **Features:** OpenAI-compatible endpoint, multimodal support

---

### E. **Anthropic / Claude**
- **Auth:** Anthropic API Key (from `.env`)
- **Model:** claude-3-5-sonnet-latest
- **Base URL:** `https://api.anthropic.com`
- **Features:** Expert analysis, detailed reasoning

---

### F. **Perplexity**
- **Auth:** Perplexity API Key (from `.env`)
- **Model:** Sonar
- **Base URL:** `https://api.perplexity.ai`
- **Features:** Web search integrated responses

---

### G. **DeepSeek**
- **Auth:** DeepSeek API Key (from `.env`)
- **Model:** deepseek-chat
- **Base URL:** `https://api.deepseek.com/v1`
- **Features:** Fast, cost-effective reasoning

---

## 🎯 AI Query Routing

### **Intelligent Routing Logic:**

```
User Query (Local Medivra)
│
├─ Matches Local Pattern? (salary, department, manager, summary, etc.)
│  ├─ YES → Process with Local Medivra Chatbot
│  └─ NO → Route to GitHub Copilot
│
└─ Explicit Provider? (GitHub Copilot, ChatGPT, Gemini, etc.)
   └─ Route to Selected Provider
```

### **Local Patterns (Stay Local):**
- `salary`, `between`, `above`, `below`, `engineering`, `marketing`, `product`, `manager`, `employee`, `summary`, `help`, etc.

### **Unrelated Queries (Route to Copilot):**
- "write a cover letter"
- "plan a team building event"
- "create interview questions"
- "how do I manage remote teams"
- Any query without workforce context

---

## 📊 Search & Filtering

### **Data Assistant Mode** (Visual Table Filtering)

#### Features:
- 🔍 Real-time employee table filtering
- 📑 Sorting by any column
- 💰 Salary band filtering (range, above, below)
- 🏢 Department filtering
- 👔 Manager team lookup
- 📍 Location-based search
- ✨ Updates stats & charts dynamically

#### Example Queries:
- "salary above 80000" → Show high earners
- "engineering team" → Show Engineering dept
- "between 50000 and 100000" → Show salary range
- "manager Sarah Smith" → Show Sarah's reports
- "show all" → Reset filters

---

### **Local Chat Mode** (AI Responses)

#### Features:
- 🤖 Conversational AI responses
- 📈 Analytics-focused answers
- 🎯 Multiple dispatch to different AI providers
- 📝 Help guide with clickable "Try:" examples

---

## 📈 Data Visualization

### **Charts:**
1. **Department Mix Chart** (Pie/Bar)
   - Shows distribution of employees across departments
   - Color-coded segments
   - Export as PNG

2. **Manager Coverage Chart** (Pie/Bar)
   - Shows distribution of direct reports by manager
   - Highlights management structure
   - Export as PNG

### **Statistics Cards:**
- Animated counters
- Real-time updates
- Responsive layout

### **Export Features:**
- 📊 Export department chart as PNG
- 📊 Export manager chart as PNG
- 📄 Export AI summary as text

---

## 🔐 Authentication

### **Login System:**
- ✅ Username/Password authentication
- ✅ Session management
- ✅ Login-required decorator for protected routes
- ✅ Logout functionality
- ✅ Configurable credentials via `.env`

### **Default Credentials:**
```
Username: admin
Password: medivra123
```

**Environment Variables:**
```
MEDIVRA_APP_USERNAME=admin
MEDIVRA_APP_PASSWORD=medivra123
```

---

## 🏗️ Technical Architecture

### **Backend (Flask)**
- **Framework:** Flask 2.x
- **Database:** SQLite3
- **Authentication:** Session-based with decorators
- **API Routes:** RESTful JSON endpoints
- **AI Integration:** Multi-provider support

### **Frontend (Vanilla JavaScript)**
- **UI Framework:** None (pure HTML/CSS/JS)
- **Charts:** Chart.js library
- **Voice Input:** Web Speech API (Google Chrome)
- **Responsive Design:** CSS Grid/Flexbox
- **Dark Mode:** CSS variable theming

### **Database:**
- **Type:** SQLite (`employees.db`)
- **Location:** Project root
- **Tables:** `employees` (id, name, email, salary, department, manager, geo_location)
- **Indexes:** ID (primary key), Email (unique)

### **API Endpoints:**

#### Authentication
```
GET  /login          - Login page
POST /login          - Process login
GET  /logout         - Logout
```

#### Employee Management
```
GET  /                        - Dashboard
POST /api/employees           - Create employee
GET  /api/employees           - Get all employees (with filters)
GET  /api/employees/<id>      - Get single employee
PUT  /api/employees/<id>      - Update employee
DELETE /api/employees/<id>    - Delete employee
```

#### AI/Chat
```
POST /api/ai/chat             - Send AI query
GET  /api/ai/status           - Check AI provider status
POST /api/ai/insights         - Generate insights
```

#### Voice
```
POST /api/ai/voice-reply      - Toggle voice replies
```

---

## 🛠️ Environment Configuration

### **.env File Required:**
```
# Flask
FLASK_SECRET_KEY=<your-secret-key>

# GitHub Models (Copilot)
GITHUB_TOKEN=<github-pat-token>
GITHUB_MODELS_BASE_URL=https://models.inference.ai.azure.com
GITHUB_COPILOT_MODEL=gpt-4o-mini

# OpenAI
OPENAI_API_KEY=<openai-api-key>
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_CHATGPT_MODEL=gpt-4o-mini

# Google Gemini
GOOGLE_API_KEY=<google-api-key>
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
GEMINI_MODEL=gemini-2.0-flash

# Anthropic (Claude)
ANTHROPIC_API_KEY=<anthropic-api-key>
ANTHROPIC_BASE_URL=https://api.anthropic.com
ANTHROPIC_MODEL=claude-3-5-sonnet-latest

# Perplexity
PERPLEXITY_API_KEY=<perplexity-api-key>
PERPLEXITY_BASE_URL=https://api.perplexity.ai
PERPLEXITY_MODEL=sonar

# DeepSeek
DEEPSEEK_API_KEY=<deepseek-api-key>
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat

# App Login
MEDIVRA_APP_USERNAME=admin
MEDIVRA_APP_PASSWORD=medivra123
```

---

## 📝 Use Cases

### **For HR Managers:**
1. ✅ Quick workforce reviews ("what's our average salary?")
2. ✅ Department analysis ("show engineering team")
3. ✅ Manager oversight ("manager Sarah Smith")
4. ✅ Salary benchmarking ("employees above 80000")
5. ✅ Team planning ("hiring guidance")

### **For Recruiters:**
1. ✅ Candidate salary research
2. ✅ Department structure understanding
3. ✅ Hiring recommendation drafting (via GitHub Copilot)
4. ✅ Team location insights ("Hyderabad team")

### **For Executives:**
1. ✅ Workforce summary reports
2. ✅ Department performance metrics
3. ✅ Suggested actions & insights
4. ✅ Visual analytics (charts/export)

### **For Data Analysis:**
1. ✅ Filter by multiple criteria
2. ✅ Salary distribution analysis
3. ✅ Department composition
4. ✅ Manager span of control
5. ✅ Geographic distribution

---

## 🎮 Quick Start

### **Installation:**
```bash
# 1. Navigate to project
cd py_restapi

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create .env file with API keys
# (see Environment Configuration section)

# 4. Initialize database
python app.py  # Auto-creates DB and seeds data

# 5. Open browser
# http://localhost:5000

# 6. Login
# Username: admin
# Password: medivra123
```

### **Test Local Medivra:**
- Type: "help" → See all patterns + clickable examples
- Type: "summary" → Get workforce overview
- Type: "engineering" → Filter by department
- Type: "salary above 80000" → Show high earners

### **Test GitHub Copilot Routing:**
- Type: "write a cover letter" → Routes to Copilot
- Type: "plan a team building event" → Routes to Copilot
- Type: "draft an email" → Routes to Copilot

---

## 📊 Data Schema

```
Employees Table
├── id (PK, AutoIncrement)
├── name (TEXT)
├── email (UNIQUE, TEXT)
├── salary (INTEGER)
├── department (TEXT)
├── manager (TEXT)
└── geo_location (TEXT)

Sample Data:
- John Doe, john.doe@company.com, 75000, Engineering, Sarah Smith, New York
- Jane Smith, jane.smith@company.com, 85000, Product, Michael Brown, San Francisco
- Alice Johnson, alice.johnson@company.com, 95000, Engineering, Sarah Smith, Seattle
- Bob Wilson, bob.wilson@company.com, 70000, Marketing, Emily Davis, Boston
- Sarah Smith, sarah.smith@company.com, 120000, Engineering, Michael Brown, New York
```

---

## 🎨 UI Features

### **Theme Support:**
- ✅ Light Mode (default)
- ✅ Dark Mode (toggle in header)
- ✅ Persistent theme preference

### **Accessibility:**
- ✅ Keyboard navigation support
- ✅ Focus-visible states
- ✅ ARIA labels
- ✅ Color contrast compliance

### **Responsive Design:**
- ✅ Desktop optimized
- ✅ Mobile-friendly
- ✅ Tablet support
- ✅ Flexible grid layout

---

## 🔗 Related Directories

```
py_restapi/
├── app.py                    # Main Flask application
├── requirements.txt          # Python dependencies
├── .env                      # Configuration (API keys)
├── employees.db              # SQLite database
├── templates/
│   ├── index.html           # Main dashboard
│   └── login.html           # Login page
├── static/
│   ├── app.js               # Frontend logic
│   └── style.css            # Styling
├── docs/
│   └── PROJECT_EXECUTION_AND_IMPLEMENTATION_GUIDE.md
└── java_employee_desk/      # Java Spring Boot version (optional)
```

---

## 🚀 Advanced Features

### **Voice Input:**
- 🎤 Ctrl + Space to activate voice recognition
- Toggle voice replies On/Off
- Transcribed queries auto-execute
- Real-time transcription feedback

### **Quick-Action Examples:**
- Clickable "Try:" examples in help
- Auto-populate query input
- Instant execution
- Educational for new users

### **Multi-AI Provider Support:**
- Seamless provider switching
- Unified response format
- Status checking per provider
- Fallback to local if API fails

### **Data Export:**
- 📊 Chart export as PNG
- 📄 Summary export as text
- 📋 Employee data accessible

---

## 📞 Support & Troubleshooting

### **Common Issues:**

| Issue | Solution |
|-------|----------|
| API key not found | Ensure `.env` has correct API keys |
| Database error | Delete `employees.db`, restart app |
| AI not responding | Check internet connection, API quota |
| Theme not persisting | Clear browser cache, hard refresh (Ctrl+F5) |
| Voice input not working | Use Chrome/Edge browser, allow microphone access |

---

## 📄 License & Attribution

**Project:** Medivra Employee Desk  
**Version:** 1.0  
**Tech Stack:** Flask, JavaScript, SQLite, Chart.js  
**AI Providers:** GitHub Models, OpenAI, Google Gemini, Anthropic, Perplexity, DeepSeek  

---

**Last Updated:** March 26, 2026  
**Maintained By:** Medivra Development Team
