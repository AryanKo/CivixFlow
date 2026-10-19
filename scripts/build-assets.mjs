import { mkdirSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
mkdirSync('assets/vendor', { recursive: true });
execFileSync(process.execPath, ['node_modules/tailwindcss/lib/cli.js', '-c', 'tailwind.config.cjs', '-i', 'assets/css/tailwind.css', '-o', 'assets/vendor/tailwind.css', '--minify'], {stdio:'inherit'});
copyFileSync('node_modules/chart.js/dist/chart.umd.js', 'assets/vendor/chart.umd.js');
copyFileSync('node_modules/lucide/dist/umd/lucide.js', 'assets/vendor/lucide.js');
copyFileSync('node_modules/lucide/LICENSE', 'assets/vendor/lucide-LICENSE.txt');
copyFileSync('node_modules/chart.js/LICENSE.md', 'assets/vendor/chartjs-LICENSE.txt');
copyFileSync('node_modules/tailwindcss/LICENSE', 'assets/vendor/tailwind-LICENSE.txt');
