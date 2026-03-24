const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

let filesToUpdate = [];
function processFile(filePath) {
  if (!filePath.endsWith('.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  // For Lucide Loader2/RefreshCw, replace any text-color with text-[var(--accent)]
  newContent = newContent.replace(/(<(?:Loader2|RefreshCw)[^>]*?className=[\"'\`][^\"'\`]*?)text-[a-zA-Z0-9\-\/\[\]\(\)\-\_]+/g, '$1text-[var(--accent)]');
  
  // For ones without text-color but with animate-spin
  newContent = newContent.replace(/(<(?:Loader2|RefreshCw)[^>]*?className=[\"'\`])([^\"'\`]*?)animate-spin([^\"'\`]*?)([\"'\`])/g, (match, prefix, before, after, suffix) => {
    let fullClass = prefix + before + 'animate-spin' + after + suffix;
    if (!fullClass.includes('text-')) {
      return prefix + before + 'animate-spin text-[var(--accent)]' + after + suffix;
    }
    return match;
  });

  // For CSS based spinners with animate-spin and border
  // Only target the specific ones found in the project.
  newContent = newContent.replace(/border-white\/20/g, 'border-[var(--accent)]/20');
  newContent = newContent.replace(/border-black/g, 'border-[var(--accent)]');
  newContent = newContent.replace(/border-t-white\/50/g, 'border-t-transparent');
  newContent = newContent.replace(/border-t-white/g, 'border-t-[var(--accent)]');
  newContent = newContent.replace(/border-t-rose-500/g, 'border-t-[var(--accent)]');
  
  if (content !== newContent && (content.includes('Loader2') || content.includes('animate-spin'))) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    filesToUpdate.push(filePath);
  }
}

walkDir('c:/Users/Admin/Desktop/wac/components', processFile);
walkDir('c:/Users/Admin/Desktop/wac/app', processFile);

console.log('Updated spinners in ' + filesToUpdate.length + ' files:');
filesToUpdate.forEach(f => console.log('OK ' + path.basename(f)));
