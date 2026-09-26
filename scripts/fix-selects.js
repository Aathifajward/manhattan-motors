const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(process.cwd(), 'app'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Add dark:bg-zinc-900 dark:text-white dark:[color-scheme:dark] to all inputs and textareas to fix autofill
  content = content.replace(/(<(?:input|textarea)[^>]*className="[^"]*)(")/g, (match, p1, p2) => {
    let newClasses = p1;
    // Skip checkboxes/radios where bg-zinc-900 might look weird if custom styled, but text inputs need it for autofill popup
    // To be safe, just add dark:[color-scheme:dark] to all of them
    if (!newClasses.includes('dark:[color-scheme:dark]')) newClasses += ' dark:[color-scheme:dark]';
    if (newClasses !== p1) changed = true;
    return newClasses + p2;
  });

  if (content.includes('<select')) {
    content = content.replace(/(<select[^>]*className="[^"]*)(")/g, (match, p1, p2) => {
      let newClasses = p1;
      if (!newClasses.includes('dark:bg-zinc-900')) newClasses += ' dark:bg-zinc-900';
      if (!newClasses.includes('dark:text-white')) newClasses += ' dark:text-white';
      if (!newClasses.includes('dark:[color-scheme:dark]')) newClasses += ' dark:[color-scheme:dark]';
      if (newClasses !== p1) changed = true;
      return newClasses + p2;
    });
  }

  if (content.includes('<option')) {
    content = content.replace(/<option([^>]*)>/g, (match, p1) => {
      if (p1.includes('className=')) {
        return match.replace(/className="([^"]*)"/, (m, c) => {
           if (!c.includes('dark:bg-zinc-900')) c += ' dark:bg-zinc-900';
           if (!c.includes('dark:text-white')) c += ' dark:text-white';
           changed = true;
           return `className="${c}"`;
        });
      } else {
        changed = true;
        return `<option${p1} className="dark:bg-zinc-900 dark:text-white">`;
      }
    });
  }
  
  if (content.includes('<input') && content.includes('type="file"')) {
    content = content.replace(/(<input[^>]*type="file"[^>]*className="[^"]*)(")/g, (match, p1, p2) => {
      let newClasses = p1;
      if (!newClasses.includes('dark:bg-zinc-900')) newClasses += ' dark:bg-zinc-900';
      if (!newClasses.includes('dark:text-white')) newClasses += ' dark:text-white';
      if (!newClasses.includes('file:bg-zinc-800')) {
          newClasses += ' file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-white dark:hover:file:bg-zinc-700';
      }
      if (newClasses !== p1) changed = true;
      return newClasses + p2;
    });
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
