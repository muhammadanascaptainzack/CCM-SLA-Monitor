import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  MapPin,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { PTAMonthlyReport, DistrictName } from '../types/index.js';

interface ComplianceReportsViewProps {
  report: PTAMonthlyReport | null;
  onRefreshReport: (month: string, district: DistrictName) => void;
  isLoading: boolean;
}

export const ComplianceReportsView: React.FC<ComplianceReportsViewProps> = ({
  report,
  onRefreshReport,
  isLoading,
}) => {
  const [selectedMonth, setSelectedMonth] = useState('October 2026');
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictName>(
    report?.district || 'Sargodha'
  );

  const handlePeriodChange = (month: string, district: DistrictName) => {
    setSelectedMonth(month);
    setSelectedDistrict(district);
    onRefreshReport(month, district);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!report) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
        Loading PTA Regulatory Compliance Report...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar (Hidden in Print) */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700">Period:</span>
            <select
              value={selectedMonth}
              onChange={(e) => handlePeriodChange(e.target.value, selectedDistrict)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 font-medium focus:outline-none"
            >
              <option value="October 2026">October 2026</option>
              <option value="September 2026">September 2026</option>
              <option value="Q3 2026 (Quarterly)">Q3 2026 (Quarterly)</option>
              <option value="Q2 2026 (Quarterly)">Q2 2026 (Quarterly)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700">District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => handlePeriodChange(selectedMonth, e.target.value as DistrictName)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 font-medium focus:outline-none"
            >
              <option value="Sargodha">District Sargodha, Pakistan Only</option>
            </select>
          </div>

          {isLoading && (
            <span className="text-slate-400 animate-spin">
              <RefreshCw className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/reports/export-csv"
            download
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Form (PDF)</span>
          </button>
        </div>
      </div>

      {/* Official PTA Document Sheet (Printable A4 format) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 shadow-sm print-container print:border-none print:p-0 print:shadow-none space-y-6">
        {/* Official Header */}
        <div className="text-center pb-6 border-b-2 border-slate-900 space-y-1">
          <div className="font-serif font-bold text-lg sm:text-xl text-slate-950 tracking-wide uppercase">
            Pakistan Telecommunication Authority
          </div>
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-700">
            Consumer Protection Directorate · Quality of Service (QoS) Division
          </div>
          <div className="text-sm font-bold text-emerald-900 bg-emerald-50 inline-block px-3 py-1 rounded border border-emerald-200 mt-2">
            FORM ANNEXURE-C: DISTRICT CVAS COMPLAINT REDRESSAL & SLA COMPLIANCE REPORT
          </div>
          <div className="text-[11px] text-slate-500 pt-1">
            Pursuant to Telecom Consumers Protection Regulations 2009 & Conditions of District CVAS (Data & Internet) License
          </div>
        </div>

        {/* Licensee & Jurisdiction Metadata Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50/70 p-4 rounded-lg border border-slate-200">
          <div className="space-y-1.5">
            <div>
              <span className="text-slate-500">Licensee Operator Name: </span>
              <span className="font-bold text-slate-900">{report.licensee.licenseeName}</span>
            </div>
            <div>
              <span className="text-slate-500">PTA License Number: </span>
              <span className="font-mono font-bold text-slate-900">{report.licensee.licenseNumber}</span>
            </div>
            <div>
              <span className="text-slate-500">License Authorization: </span>
              <span className="font-medium text-slate-800">{report.licensee.licenseType}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div>
              <span className="text-slate-500">Licensed District / Jurisdiction: </span>
              <span className="font-bold text-slate-900">District {report.district}</span>
            </div>
            <div>
              <span className="text-slate-500">Reporting Regulatory Period: </span>
              <span className="font-bold text-emerald-800">{report.periodMonth}</span>
            </div>
            <div>
              <span className="text-slate-500">Designated PTA Zonal Office: </span>
              <span className="font-medium text-slate-800">{report.licensee.regionalPtaOffice}</span>
            </div>
          </div>
        </div>

        {/* Key Compliance Statistics Summary Box */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            I. Summary Statement of Complaints & SLA Performance
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 border border-slate-200 rounded-lg">
              <div className="text-slate-500">Total Registered</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {report.totalReceived}
              </div>
              <div className="text-[11px] text-slate-400">during period</div>
            </div>

            <div className="p-3 border border-slate-200 rounded-lg">
              <div className="text-slate-500">Resolved Within SLA</div>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                {report.resolvedWithinSla}
              </div>
              <div className="text-[11px] text-emerald-800 font-medium">
                {report.slaCompliancePercentage}% Compliance
              </div>
            </div>

            <div className="p-3 border border-slate-200 rounded-lg">
              <div className="text-slate-500">Mean Time to Repair (MTTR)</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {report.meanTimeToRepairHours} <span className="text-xs font-normal">hrs</span>
              </div>
              <div className="text-[11px] text-slate-400">average resolution</div>
            </div>

            <div className="p-3 border border-slate-200 rounded-lg">
              <div className="text-slate-500">Consumer Satisfaction</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {report.satisfactionRatePercentage}%
              </div>
              <div className="text-[11px] text-slate-400">verified closures</div>
            </div>
          </div>
        </div>

        {/* Official Annexure-C Category Breakdown Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              II. Category-Wise Fault Distribution & Resolution Analysis
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              PTA Mandate: Resolution &ge; 95% within SLA
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">S.No</th>
                  <th className="py-2.5 px-3">Complaint Category</th>
                  <th className="py-2.5 px-3 text-right">Received</th>
                  <th className="py-2.5 px-3 text-right">Resolved (In SLA)</th>
                  <th className="py-2.5 px-3 text-right">Beyond SLA</th>
                  <th className="py-2.5 px-3 text-right">Avg MTTR (Hrs)</th>
                  <th className="py-2.5 px-3 text-right">Compliance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.categoryStats.map((cat, idx) => {
                  const compPct = cat.total > 0 ? Math.round((cat.withinSla / cat.total) * 100) : 100;
                  return (
                    <tr key={cat.category} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{cat.label}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">{cat.total}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700 font-medium">
                        {cat.withinSla}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {cat.breached > 0 ? (
                          <span className="text-rose-700 font-semibold">{cat.breached}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">{cat.avgHours}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">
                        <span className={compPct >= 95 ? 'text-emerald-700' : 'text-amber-700'}>
                          {compPct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-semibold border-t-2 border-slate-200 text-slate-900">
                <tr>
                  <td colSpan={2} className="py-2.5 px-3">Total Consolidated</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">{report.totalReceived}</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700">
                    {report.resolvedWithinSla}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-rose-700">
                    {report.resolvedBeyondSla}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {report.meanTimeToRepairHours}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-800">
                    {report.slaCompliancePercentage}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Regulatory Audit Certification Declaration */}
        <div className="pt-6 border-t border-slate-200 text-xs text-slate-600 space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-slate-700 leading-relaxed italic">
            "I hereby solemnly declare and certify on behalf of the Licensee that the complaint data recorded herein
            has been extracted faithfully from the Linux automated CMS server. All complaints have been handled,
            tracked, and resolved within statutory timeframes in strict compliance with the Pakistan Telecommunication
            Authority (PTA) Act 1996 and Telecom Consumers Protection Regulations 2009."
          </div>

          {/* Signature & Seal Blocks */}
          <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
            <div className="space-y-2">
              <div className="w-48 border-b border-slate-900 mx-auto" />
              <div className="font-bold text-slate-900">{report.licensee.complianceOfficerName}</div>
              <div className="text-slate-500">Designated Compliance Officer</div>
              <div className="text-[11px] text-slate-400 font-mono">
                {report.licensee.complianceOfficerEmail} · {report.licensee.complianceOfficerPhone}
              </div>
            </div>

            <div className="space-y-2">
              <div className="w-48 border-b border-slate-900 mx-auto" />
              <div className="font-bold text-slate-900">Chief Executive Officer / Director</div>
              <div className="text-slate-500">{report.licensee.licenseeName}</div>
              <div className="text-[11px] text-slate-400">Corporate Seal / Authorized Stamp</div>
            </div>
          </div>

          <div className="pt-4 text-center text-[11px] text-slate-400 border-t border-slate-100 font-mono">
            Report Generated on: {new Date(report.generatedAt).toUTCString()} · PakNet Linux CMS Server v2.4 (Port 3000)
          </div>
        </div>
      </div>
    </div>
  );
};
