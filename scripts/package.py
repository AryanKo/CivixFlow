"""Package only the reviewed frontend assets and local preview tools."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parents[1]
output = root / 'release' / 'CivixFlow-Frontend.zip'
output.parent.mkdir(exist_ok=True)
files = ['index.html','run.py','start.bat','start.ps1','start.sh','run_server.bat',
         'run_dashboard.ps1','README.md','INTEGRATION_HANDOFF.md','THIRD_PARTY_NOTICES.md',
         'package.json','package-lock.json','tailwind.config.cjs','vercel.json',
         'scripts/package.py','scripts/build-assets.mjs','scripts/serve.mjs',
         'tests/simulation.test.mjs','tests/server.test.mjs','docs/ORIGINAL_README.md','docs/HACKATHON_PITCH.md']
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for folder in ('js','assets'):
        for path in sorted((root / folder).rglob('*')):
            if path.is_file(): archive.write(path, 'CivixFlow/' + path.relative_to(root).as_posix())
    for name in files: archive.write(root / name, 'CivixFlow/' + name)
print(output)
