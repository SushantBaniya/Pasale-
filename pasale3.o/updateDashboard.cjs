const fs = require('fs');
const filePath = 'frontend/src/app/dashboard/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add border to KPICard
content = content.replace(
    /className=\{\\$\{bgColor\} rounded-xl p-4 sm:p-5/g, 
    'className={\ border border-[#E2E8F0] dark:border-[#1C1D24] rounded-xl p-4 sm:p-5'
);

// KpiCard text color
content = content.replace(/text-\[\#1E293B\]/g, 'text-black');
content = content.replace(/text-\[\#475569\]/g, 'text-black');
content = content.replace(/text-slate-800/g, 'text-black');

// Billing amounts to green
// Currently: <td className="px-5 py-4 font-black text-[#F2DD50] text-sm text-right">
content = content.replace(
    /<td className="px-5 py-4 font-black text-\[\#F2DD50\] text-sm text-right">/g,
    '<td className="px-5 py-4 font-black text-[#10B981] text-sm text-right">'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated page.tsx');
