const fs = require('fs');
const path = require('path');

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
        let newContent = content.replace(/#FBBF24/gi, '#F2DD50');
        
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            count++;
            console.log('Updated ' + filePath);
        }
    }
});

// Also update tailwind config
const tailwindConfigPath = './tailwind.config.js';
if (fs.existsSync(tailwindConfigPath)) {
    let twContent = fs.readFileSync(tailwindConfigPath, 'utf8');
    let newTwContent = twContent.replace(/#FBBF24/gi, '#F2DD50');
    if (twContent !== newTwContent) {
        fs.writeFileSync(tailwindConfigPath, newTwContent, 'utf8');
        count++;
        console.log('Updated tailwind.config.js');
    }
}

console.log('Updated ' + count + ' files.');
