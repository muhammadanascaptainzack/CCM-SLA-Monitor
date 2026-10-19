# Citrus Pvt Ltd — PTA District CVAS Complaint Management System (CMS)

Official Regulatory Complaint Management System, Network Operations Center (NOC) Dispatch Console, and Subscriber Self-Service Portal for **Citrus Pvt Ltd** (PTA District CVAS Data & Internet Licensee).

---

## Key Features

1. **Public Introduction & Subscriber Portal (`/`):**
   - **Register Complaint / Customer Login (Top CTA):** Customers can register and sign in privately using **Google OAuth (Gmail Popup)** or direct **Gmail + Password** registration.
   - **Cloud Complaint History (Firebase Firestore):** Authenticated Gmail subscribers have their profile and complaint history synced to Google Cloud Firestore in real time.
   - **Quick Ticket Reference Tracker:** Instant lookup of ticket SLA status and NOC updates using a PTA Ticket Number (e.g., `PTA-FSD-2026-0041`).

2. **Private NOC Staff & Admin Gateway (Footer Link):**
   - Accessible via the **"NOC Staff & Admin Login"** button at the very bottom of the introduction page.
   - Strictly private login form (no staff or customer credentials are exposed on the public UI).
   - **Role-Based Access Control:**
     - **System Administrator (`admin`):** Full access to all NOC modules, SLA settings, and the **Staff & Access** tab to create, manage, and reset credentials for NOC supervisors and field technicians.
     - **NOC Supervisor (`support_agent`):** Can acknowledge (ACK) complaints, assign field technicians, post live online updates, and update ticket statuses.
     - **Field Lineman / Fiber Splicer (`technician`):** Can record optical Rx power (`dBm`), latency, root-cause notes, and mark tickets resolved.
     - **PTA Compliance Officer (`compliance_officer`):** Access to the statutory 2-year PTA Inspection Register, SLA breach audits, and CSV exports.

---

## Default Staff & Administrator Credentials

To access the Admin & NOC Control Panel, scroll to the **very bottom** of the main page and click **"NOC Staff & Admin Login"**:

| Role | Email | Default Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@citrus.net.pk` | `admin123` | Full NOC control + **Staff & Access** management (create/edit team logins) |
| **NOC Supervisor** | `noc.bilal@citrus.net.pk` | `noc123` | Acknowledge tickets, assign technicians, post live updates |
| **Field Technician** | `field.kamran@citrus.net.pk` | `field123` | Field splicing logs, optical telemetry (`dBm`), status updates |
| **Compliance Officer** | `compliance@citrus.net.pk` | `pta123` | PTA Regulatory Inspection Register & SLA compliance reports |

> **Security Tip:** After logging in as `admin@citrus.net.pk`, open the **Staff & Access** tab to update default passwords or provision new NOC team accounts.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start the full-stack development server (Express API + Vite frontend on port 3000)
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Linux Server Deployment Guide (`/opt/citrus-cms`)

### 1. Fresh Installation on Ubuntu / Debian Linux

```bash
# Install Node.js 20 LTS and unzip
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs unzip build-essential

# Create application directory
sudo mkdir -p /opt/citrus-cms
cd /opt/citrus-cms

# Extract project files into /opt/citrus-cms, then install and build:
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

### 2. Running in Production (PM2 or systemd)

#### Using PM2:
```bash
sudo npm install -g pm2
cd /opt/citrus-cms
NODE_ENV=production PORT=3000 pm2 start npm --name "citrus-cms" -- start
pm2 save
pm2 startup
```

#### Using systemd (`/etc/systemd/system/citrus-cms.service`):
```ini
[Unit]
Description=Citrus Pvt Ltd PTA Complaint Management System
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/citrus-cms
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```
Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable citrus-cms
sudo systemctl start citrus-cms
```

---

## Updating an Existing Linux Server Installation

Follow these steps to update `/opt/citrus-cms` with new code while preserving your existing tickets and accounts in `/opt/citrus-cms/data/complaints-db.json`:

```bash
# 1. Back up your existing live database
cp /opt/citrus-cms/data/complaints-db.json /root/complaints-db-backup.json

# 2. Upload and extract the updated project files (or run `git pull`)
cd /opt/citrus-cms
unzip -o /root/citrus-cms.zip -d /opt/citrus-cms

# 3. Restore your database backup
mkdir -p /opt/citrus-cms/data
cp /root/complaints-db-backup.json /opt/citrus-cms/data/complaints-db.json

# 4. Clean install dependencies (prevents the npm 'edgesOut' error)
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps

# 5. Build the production frontend bundle
npm run build

# 6. Restart the service
pm2 restart citrus-cms
# OR if using systemd:
sudo systemctl restart citrus-cms
```

---

## Firebase Cloud Sync & Authorized Domains

Customer profiles (`customers/{uid}`) and complaint histories (`complaints/{complaintId}`) are synced to **Google Cloud Firestore** using the configuration in `firebase-applet-config.json`.

If you host the application on your own custom domain (e.g., `cms.citrus.net.pk`) and want customers to use the **Google OAuth Popup** button:
1. Open the [Firebase Console](https://console.firebase.google.com/) and select project `ai-studio-citruspvtltdptad-42dcabf4-9d96-45b2-8c3d-89bdf4fb9b38`.
2. Navigate to **Authentication** → **Settings** → **Authorized domains**.
3. Click **Add domain** and add your domain or server hostname.
*(Note: Direct Gmail + Password customer registration and sign-in works on any IP address or domain without additional setup.)*
