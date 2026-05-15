import React, { useRef } from 'react';
import { useDataStore } from '../../store/dataStore';
import { formatCurrency, formatDate } from '../../utils/nepaliDate';
import { useLanguageStore } from '../../store/languageStore';
import { useTranslation } from '../../utils/i18n';
import { Button } from '../ui/Button';
import { FiDownload, FiPrinter } from 'react-icons/fi';

interface ReportViewProps {
  onPrint?: () => void;
  onDownload?: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ onPrint, onDownload }) => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { transactions, expenses, getTotalSales, getTotalReceivable, getTotalPayable, getCashInHand } = useDataStore();
  const reportRef = useRef<HTMLDivElement>(null);

  const totalSales = getTotalSales();
  const totalPurchases = transactions
    .filter((t) => t.type === 'purchase')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalReceivable = getTotalReceivable();
  const totalPayable = getTotalPayable();
  const cashInHand = getCashInHand();
  const profit = totalSales - totalPurchases - totalExpenses;
  const netBalance = totalReceivable - totalPayable;
  const currentDate = formatDate(new Date().toISOString(), language);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Simple download as HTML
      const content = reportRef.current?.innerHTML || '';
      const blob = new Blob([`<!DOCTYPE html><html><head><title>Business Report</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background-color:#f2f2f2}</style></head><body>${content}</body></html>`], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `business-report-${new Date().toISOString().split('T')[0]}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div>
      <div className="flex justify-end gap-2 mb-6 print:hidden">
        <Button variant="outline" onClick={handleDownload}>
          <FiDownload className="w-4 h-4 mr-2" />
          {t('businessReports.download')}
        </Button>
        <Button variant="outline" onClick={handlePrint}>
          <FiPrinter className="w-4 h-4 mr-2" />
          {t('businessReports.print')}
        </Button>
      </div>

      <div ref={reportRef} className="bg-white dark:bg-[#15161C] p-8 rounded-lg shadow-lg print:shadow-none">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-gray-300 dark:border-[#1C1D24] pb-4">
          <h1 className="text-3xl font-bold #1A1C20 dark:text-[#EAE5DF] mb-2">
            BUSINESS FINANCIAL REPORT
          </h1>
          <p className="#6B7280 dark:text-[#44454F]">
            Generated on: {currentDate}
          </p>
        </div>

        {/* Profit & Loss Statement */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold #1A1C20 dark:text-[#EAE5DF] mb-4">
            {t('businessReports.profitLoss')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="#E3DDD2 dark:bg-[#1C1D24]">
                  <th className="border border-gray-300 dark:border-[#2A2B36] px-4 py-3 text-left font-semibold #1A1C20 dark:text-[#EAE5DF]">
                    Description
                  </th>
                  <th className="border border-gray-300 dark:border-[#2A2B36] px-4 py-3 text-right font-semibold #1A1C20 dark:text-[#EAE5DF]">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 dark:border-[#2A2B36] px-4 py-3 #1A1C20 dark:text-[#EAE5DF]">
                    {t('businessReports.totalSales')}
                  </td>
                  <td className="border border-gray-300 dark:border-[#2A2B36] px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(totalSales, language)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 dark:border-[#2A2B36] px-4 py-3 #1A1C20 dark:text-[#EAE5DF]">
                    {t('businessReports.totalPurchases')}
                  </td>
                  <td className="border border-gray-300 dark:border-[#2A2B36] px-4 py-3 text-right font-semibold text-red-600 dark:text-red-400">
                    -{formatCurrency(totalPurchases, language)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 dark:border-[#2A2B36] px-4 py-3 #1A1C20 dark:text-[#EAE5DF]">
                    {t('businessReports.totalExpenses')}
                  </td>
                  <td className="border border-gray-300 dark:border-[#2A2B36] px-4 py-3 text-right font-semibold text-red-600 dark:text-red-400">
                    -{formatCurrency(totalExpenses, language)}
                  </td>
                </tr>
                <tr className="#F4F0EA dark:bg-[#15161C]/50 font-bold">
                  <td className="border border-gray-300 dark:border-[#2A2B36] px-4 py-3 #1A1C20 dark:text-[#EAE5DF]">
                    {t('businessReports.netProfit')}
                  </td>
                  <td className={`border border-gray-300 dark:border-[#2A2B36] px-4 py-3 text-right ${
                    profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(profit, language)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Cash Flow Statement */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold #1A1C20 dark:text-[#EAE5DF] mb-4">
            {t('businessReports.cashFlow')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="#E3DDD2 dark:bg-[#1C1D24]">
                  <th className="border border-gray-300 dark:border-[#2A2B36] px-4 py-3 text-left font-semibold #1A1C20 dark:text-[#EAE5DF]">
                    Description
                  </th>
                  <th className="border border-gray-300 dark:border-[#2A2B36] px-4 py-3 text-right font-semibold #1A1C20 dark:text-[#EAE5DF]">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 dark:border-[#2A2B36] px-4 py-3 #1A1C20 dark:text-[#EAE5DF]">
                    {t('businessReports.cashInHand')}
                  </td>
                  <td className="border border-gray-300 dark:border-[#2A2B36] px-4 py-3 text-right font-semibold #1A1C20 dark:text-[#EAE5DF]">
                    {formatCurrency(cashInHand, language)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 dark:border-[#2A2B36] px-4 py-3 #1A1C20 dark:text-[#EAE5DF]">
                    {t('businessReports.totalReceivable')}
                  </td>
                  <td className="border border-gray-300 dark:border-[#2A2B36] px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(totalReceivable, language)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 dark:border-[#2A2B36] px-4 py-3 #1A1C20 dark:text-[#EAE5DF]">
                    {t('businessReports.totalPayable')}
                  </td>
                  <td className="border border-gray-300 dark:border-[#2A2B36] px-4 py-3 text-right font-semibold text-red-600 dark:text-red-400">
                    -{formatCurrency(totalPayable, language)}
                  </td>
                </tr>
                <tr className="#F4F0EA dark:bg-[#15161C]/50 font-bold">
                  <td className="border border-gray-300 dark:border-[#2A2B36] px-4 py-3 #1A1C20 dark:text-[#EAE5DF]">
                    {t('businessReports.netBalance')}
                  </td>
                  <td className={`border border-gray-300 dark:border-[#2A2B36] px-4 py-3 text-right ${
                    netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(netBalance, language)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t-2 border-gray-300 dark:border-[#1C1D24]">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm #6B7280 dark:text-[#44454F] mb-8">Prepared by:</p>
              <div className="border-t border-gray-300 dark:border-[#2A2B36] pt-2">
                <p className="font-semibold #1A1C20 dark:text-[#EAE5DF]">Business Owner</p>
              </div>
            </div>
            <div>
              <p className="text-sm #6B7280 dark:text-[#44454F] mb-8">Audited by:</p>
              <div className="border-t border-gray-300 dark:border-[#2A2B36] pt-2">
                <p className="#6B7280 dark:text-[#44454F]">_____________________</p>
                <p className="text-sm #6B7280 dark:text-[#44454F]">Auditor Signature</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

