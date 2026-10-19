# Citrus Pvt Ltd — PTA District CVAS Complaint Portal
## Linux Server Installation & Configuration Guide (Port 4000)

This guide provides step-by-step instructions to install, configure, and run the Citrus Complaint Management System (CMS) on any Linux server (Ubuntu 20.04/22.04/24.04, Debian 11/12, or AlmaLinux/Rocky/RHEL).

---

### System Requirements
- **OS**: Ubuntu / Debian / CentOS / Rocky Linux / AlmaLinux
- **Node.js**: v18.x, v20.x, or v22.x LTS
- **Package Manager**: npm (bundled with Node.js)
- **Port**: 4000 (configurable via `PORT` environment variable)
- **Memory**: Minimum 512 MB RAM (lightweight footprint ~50 MB)

---

### Step 1: Install Node.js (Version 20 LTS)

#### On Ubuntu / Debian:
```bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install curl and git if not already installed
sudo apt install -y curl git build-essential

# Add NodeSource repository for Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js and npm
sudo apt install -y nodejs

# Verify versions
node -v   # Should output v20.x or higher
npm -v    # Should output 10.x or higher
```

#### On RHEL / AlmaLinux / Rocky Linux:
```bash
sudo dnf update -y
sudo dnf install -y curl git gcc-c++ make
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
```

---

### Step 2: Deploy Application Files

Recommended installation path: `/opt/citrus-cms`

```bash
# Create directory
sudo mkdir -p /opt/citrus-cms

# Copy or git clone your project files into /opt/citrus-cms:
# (Replace with your repository or upload files via SFTP/SCP)
cd /opt/citrus-cms

# Ensure ownership belongs to your user or www-data:
sudo chown -R $USER:$USER /opt/citrus-cms
```

---

### Step 3: Install Dependencies & Build Frontend

```bash
cd /opt/citrus-cms

# Clean any previous broken cache/locks if you encounter edgesOut error:
rm -rf node_modules package-lock.json
npm cache clean --force

# 1. Install required packages using --legacy-peer-deps
npm install --legacy-peer-deps

# 2. Build the production React frontend bundle
npm run build

# 3. Verify the 'dist' directory is created:
ls -la dist/
```

---

### Step 4: Configure Environment Variables

Create your `.env` configuration file:

```bash
cat << 'EOF' > /opt/citrus-cms/.env
NODE_ENV=production
PORT=4000
PTA_DISTRICT=Faisalabad
COMPANY_NAME="Citrus Pvt Ltd"
DISABLE_HMR=true
EOF
```

---

### Step 5: Test Run on Port 4000

Run manually once to verify everything starts cleanly:

```bash
PORT=4000 npm start
```

You should see:
```text
[Citrus CMS] Active on user port 4000 at http://0.0.0.0:4000
[Citrus CMS] Server listening on port 4000 at http://0.0.0.0:4000
```

In another terminal, test health:
```bash
curl http://localhost:4000/api/health
# Returns: {"status":"ok","timestamp":"...","uptime":...}
```
Press `Ctrl+C` once verified.

---

### Step 6: Set Up as a Background Linux Service (Systemd)

To keep Citrus CMS running 24/7 and auto-start on server reboots, create a systemd service unit:

```bash
sudo bash -c 'cat << "EOF" > /etc/systemd/system/citrus-cms.service
[Unit]
Description=Citrus Pvt Ltd PTA District CVAS Complaint Web Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/citrus-cms
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=4000
Environment=PTA_DISTRICT=Faisalabad

# Resource & process limits
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF'
```

#### Activate & Start the Service:
```bash
# Reload systemd daemon
sudo systemctl daemon-reload

# Enable service to start automatically on boot
sudo systemctl enable citrus-cms.service

# Start the service right now
sudo systemctl start citrus-cms.service

# Check service status (should show active (running))
sudo systemctl status citrus-cms.service
```

#### Useful Systemd Commands:
- **View Live Logs**: `sudo journalctl -u citrus-cms -f`
- **Restart Service**: `sudo systemctl restart citrus-cms`
- **Stop Service**: `sudo systemctl stop citrus-cms`

---

### Step 7: (Optional but Recommended) Nginx Reverse Proxy & SSL

If you want users to access the portal via standard HTTP port 80 or HTTPS (e.g. `http://complaints.citrus.net.pk` or `http://YOUR_SERVER_IP`):

```bash
sudo apt install -y nginx
```

Create `/etc/nginx/sites-available/citrus-cms`:
```nginx
server {
    listen 80;
    server_name complaints.citrus.net.pk; # Or your server IP

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable it:
```bash
sudo ln -s /etc/nginx/sites-available/citrus-cms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Free HTTPS SSL with Let's Encrypt Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d complaints.citrus.net.pk
```

---

### Step 8: Firewall Configuration (UFW or Firewalld)

Allow Port 4000 (and 80/443 for web access):

#### For Ubuntu / Debian (UFW):
```bash
sudo ufw allow 4000/tcp comment "Citrus CMS Port 4000"
sudo ufw allow 80/tcp comment "HTTP"
sudo ufw allow 443/tcp comment "HTTPS"
sudo ufw status
```

#### For CentOS / AlmaLinux (Firewalld):
```bash
sudo firewall-cmd --permanent --add-port=4000/tcp
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

### Step 9: Default Team & Admin Credentials

Once installed, visit `http://YOUR_SERVER_IP:4000` in any web browser:

| Role | Username / Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@citrus.net.pk` | `admin123` | Full Admin Console, create team logins, reset passwords, server monitoring |
| **NOC Lead** | `noc.bilal@citrus.net.pk` | `noc123` | Ticket ACK, live web update, SLA escalation |
| **Field Engineer** | `field.kamran@citrus.net.pk` | `field123` | On-site resolution, OTDR fiber restoration |
| **PTA Compliance** | `compliance@citrus.net.pk` | `pta123` | Monthly PTA Annexure-A Form generation & exports |

*To create new team members or change any passwords, click the **🔑 Admin Console** button in the top navigation bar or go to `/admin`.*
