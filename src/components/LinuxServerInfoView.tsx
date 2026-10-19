import React, { useState } from 'react';
import { 
  Server, 
  Terminal, 
  Cpu, 
  HardDrive, 
  Copy, 
  Check, 
  RotateCcw, 
  ShieldCheck, 
  ExternalLink,
  Code2,
  Activity
} from 'lucide-react';
import { SystemStats } from '../types/index.js';

interface LinuxServerInfoViewProps {
  stats: SystemStats | null;
  onResetDatabase: () => Promise<void>;
}

export const LinuxServerInfoView: React.FC<LinuxServerInfoViewProps> = ({
  stats,
  onResetDatabase,
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const systemdServiceConfig = `[Unit]
Description=Citrus Pvt Ltd PTA District CVAS Complaint Web Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/citrus-cms
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=4000
Environment=PTA_DISTRICT=Faisalabad

# Hardening
ProtectSystem=full
ProtectHome=true
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target`;

  const nginxReverseProxy = `server {
    listen 80;
    server_name cms.citrus.net.pk;

    # Forward to Node.js Express server on Linux localhost port 4000
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
}`;

  const curlExample = `curl -X POST http://localhost:4000/api/complaints \\
  -H "Content-Type: application/json" \\
  -d '{
    "customerId": "usr-1",
    "category": "OFC_CUT",
    "priority": "P1_CRITICAL",
    "subject": "Fiber Core Broken at Canal Junction",
    "description": "OTDR reading shows break at 2.8 km. Urgent splicer required.",
    "opticalPowerRx": "-38 dBm"
  }'`;

  const handleReset = async () => {
    if (confirm('Reset database to clean PTA sample complaints and users?')) {
      setIsResetting(true);
      try {
        await onResetDatabase();
        alert('Database reseeded with official PTA district sample records.');
        setIsResetting(false);
      } catch (err) {
        alert('Failed to reset database');
        setIsResetting(false);
      }
    }
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span className="font-semibold text-emerald-800">LINUX PRODUCTION RUNTIME</span>
            <span aria-hidden="true">·</span>
            <span>Express.js REST Engine & File Storage</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Linux Web Server Deployment & Service Architecture
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Designed for native execution on Ubuntu, Debian, RHEL/Rocky, or Docker containers on port 4000 (or 3000).
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={isResetting}
          className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>{isResetting ? 'Resetting...' : 'Reseed PTA Sample Records'}</span>
        </button>
      </div>

      {/* Live Server Diagnostics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5 text-xs">
            <span>Operating System</span>
            <Terminal className="w-4 h-4 text-slate-400" />
          </div>
          <div className="font-mono font-bold text-slate-900 text-sm truncate">
            {stats?.osPlatform || 'Linux (Node.js)'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Node: <span className="font-mono">{stats?.nodeVersion || process.version}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5 text-xs">
            <span>Process Uptime</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-mono font-bold text-slate-900 text-sm">
            {stats ? formatUptime(stats.uptimeSeconds) : '0h 15m'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Continuous Linux daemon service
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5 text-xs">
            <span>Memory Resident (RSS)</span>
            <Cpu className="w-4 h-4 text-slate-400" />
          </div>
          <div className="font-mono font-bold text-slate-900 text-sm">
            {stats?.memoryUsageMb ?? 48.5} MB
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            Low memory footprint
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5 text-xs">
            <span>Data Storage</span>
            <HardDrive className="w-4 h-4 text-slate-400" />
          </div>
          <div className="font-mono font-bold text-slate-900 text-sm">
            JSON File Store
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            /data/complaints-db.json
          </div>
        </div>
      </div>

      {/* Linux Systemd Service & Deployment Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Systemd Unit File */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                1. Linux Systemd Service File
              </h3>
              <p className="text-xs text-slate-500">
                Place in <code className="font-mono text-emerald-800">/etc/systemd/system/ptacms.service</code>
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(systemdServiceConfig, 'systemd')}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1"
            >
              {copiedSection === 'systemd' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-3 bg-slate-950 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
            {systemdServiceConfig}
          </pre>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 text-slate-700">
            <span className="font-semibold text-slate-900">Enable and Start commands:</span>
            <div className="font-mono text-[11px] text-slate-800 space-y-0.5">
              <div>$ sudo systemctl daemon-reload</div>
              <div>$ sudo systemctl enable --now ptacms.service</div>
              <div>$ sudo systemctl status ptacms</div>
            </div>
          </div>
        </div>

        {/* Nginx & REST API */}
        <div className="space-y-6">
          {/* Nginx Reverse Proxy */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  2. Nginx Reverse Proxy (SSL / HTTPS)
                </h3>
                <p className="text-xs text-slate-500">
                  Route domain traffic to port 4000
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(nginxReverseProxy, 'nginx')}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1"
              >
                {copiedSection === 'nginx' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3 bg-slate-950 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
              {nginxReverseProxy}
            </pre>
          </div>

          {/* REST API & Webhook cURL */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  3. Automated Complaint REST API
                </h3>
                <p className="text-xs text-slate-500">
                  Log tickets via webhook from billing or network monitoring
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(curlExample, 'curl')}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1"
              >
                {copiedSection === 'curl' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3 bg-slate-950 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
              {curlExample}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
