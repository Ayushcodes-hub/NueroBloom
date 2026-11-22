# NeuroBloom — Inclusive Cognitive Therapy Through Play

**Tagline:** *Grow at Your Own Pace.*

Developed by Computer Science & Engineering students at **RNS Institute of Technology, Bengaluru**, NeuroBloom is an inclusive, adaptive digital classroom and play-based cognitive practice platform designed for neurodiverse children, parents/guardians, and special educators.

> **Important Educational Notice:** NeuroBloom is an educational and therapy-support prototype. Gameplay scores and activity trends do **not** diagnose any neurodevelopmental condition or measure clinical improvement.

## Key Capabilities

- **Public Landing Experience**: Adaptive learning overview, 4-step NeuroBloom cycle (Understand, Play, Adapt, Grow), live accessibility preview, and trusted external resources.
- **Role-Based Authentication & JWT Sessions**: Child Explorer, Parent / Guardian, Doctor / Special Educator, and Program Administrator dashboards with protected routes.
- **Child Dashboard & Calm Corner**: Daily mission tracker, XP & coin progression, achievement badges, adaptive game recommendations, and an interactive breathing & tactile Calm Corner.
- **11 Interactive Cognitive Mini-Games**: Memory Match, Pattern Sequence, Color Sorting, Shape Identification, Number Sequence, Visual Attention, Word & Image Match, Audio Memory, Maze Explorer, Sky Glider Motor Simulator, and Emotion & Expression Matching.
- **Rule-Based Adaptive Personalization Engine**: Transparent difficulty adjustments (`>= 85%` across 3 sessions steps up, `60–84%` maintains, `< 60%` across 2 sessions eases difficulty), struggle-detection hints, and category variety recommendations.
- **Accessibility Center**: Persisted controls for OpenDyslexic typography, High-Contrast mode, Larger text sizes, Reduced Motion, Web Speech API Read-Aloud, Web Audio gentle feedback, Simplified Instructions, Interaction Timing, Keyboard Navigation, and Alternative Tap-based controls.
- **Parent & Doctor Dashboards**: Longitudinal Recharts analytics, game-wise accuracy breakdowns, caregiver notes, practice reminder scheduling, educator game/difficulty recommendations, and exportable progress reports.
- **Trusted Resource Portal & Safety Center**: Curated external guidance (CDC, NICHD, Understood.org, CHADD, Autism Speaks) and India `112` safety guidance requiring explicit user interaction.

## Demo Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| Child Explorer | `aarav@neurobloom.demo` | `BloomChild123!` |
| Parent / Guardian | `meera@neurobloom.demo` | `BloomParent123!` |
| Doctor / Special Educator | `doctor@neurobloom.demo` | `BloomDoctor123!` |
| Administrator | `admin@neurobloom.demo` | `BloomAdmin123!` |

## Running Locally (Windows Setup Instructions)

### Prerequisites
- **Node.js 22+** (includes built-in `node:sqlite` support)
- **npm 10+**
- *(Optional)* Python 3.11+ if running the FastAPI reference server in `backend/`

### 1. Clone & Install
```powershell
git clone <repository-url>
cd neurobloom
npm install
copy .env.example .env
```

### 2. Start the Full-Stack Prototype (Port 3000)
```powershell
npm run dev
```
Open `http://localhost:3000` in your browser. Interactive API docs are available at `http://localhost:3000/api/docs`.

### 3. Run Automated Tests & Build Check
```powershell
npm test
npm run lint
npm run build
```

### 4. (Optional) Standalone FastAPI Backend on Windows
```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Open `http://localhost:8000/docs` for Swagger UI.
