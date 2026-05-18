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
        let newContent = content;
        
        // 1. Replace bg-[#FFFFFF] with bg-[#F7FAFC] (Background wrapper)
        newContent = newContent.replace(/bg-\[\#FFFFFF\]/g, 'bg-[#F7FAFC]');
        
        // 2. Replace bg-[#F8FAFC] with bg-[#FFFFFF] (Cards)
        newContent = newContent.replace(/bg-\[\#F8FAFC\]/g, 'bg-[#FFFFFF]');

        // 3. For index.css specifically
        if (filePath.endsWith('index.css')) {
            newContent = newContent.replace(/background-color: #FFFFFF;/g, 'background-color: #F7FAFC;');
        }
        
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            count++;
            console.log('Updated ' + filePath);
        }
    }
});

// Update tailwind config
const tailwindConfigPath = './tailwind.config.js';
if (fs.existsSync(tailwindConfigPath)) {
    let twContent = fs.readFileSync(tailwindConfigPath, 'utf8');
    let newTwContent = twContent.replace(/bg: '#FFFFFF'/g, "bg: '#F7FAFC'");
    newTwContent = newTwContent.replace(/card: '#F8FAFC'/g, "card: '#FFFFFF'");
    
    if (twContent !== newTwContent) {
        fs.writeFileSync(tailwindConfigPath, newTwContent, 'utf8');
        count++;
        console.log('Updated tailwind.config.js');
    }
}

console.log('Updated ' + count + ' files.');
