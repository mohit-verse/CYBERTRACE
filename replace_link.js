const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = [...walk('app'), ...walk('components')];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes("import Link from 'next/link'")) {
    content = content.replace(/import Link from 'next\/link'/g, "import { Link } from 'next-view-transitions'");
    fs.writeFileSync(f, content);
    console.log('Updated', f);
  }
});
