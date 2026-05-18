const fs = require('fs');
const path = require('path');

const replacements = {
    '#A3876A': '#FBBF24',
    '#A3876A22': '#FBBF2422',
    '#A3876A30': '#FBBF2430',
    '#A3876A18': '#FBBF2418',
    '#EBE5DA': '#0F172A',
    '#F4F0EA': '#FFFFFF',
    '#E3DDD2': '#F8FAFC',
    '#DDD7CC': '#E2E8F0',
    '#1A1C20': '#1E293B',
    '#C8C3BC': '#64748B',
    '#F5F0E6': '#F1F5F9',
    '#6B7280': '#475569',
    '#3A7A5A': '#10B981'
};

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

let count = 0;
walkDir('./src', (filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css') || filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        for (const [key, value] of Object.entries(replacements)) {
            newContent = newContent.replace(new RegExp(key, 'gi'), value);
        }
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            count++;
            console.log('Updated ' + filePath);
        }
    }
});
console.log('Updated ' + count + ' files.');
