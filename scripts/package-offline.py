"""Package the built landing for opening directly via file://, without a server."""
from pathlib import Path
import re
import shutil
import zipfile

root = Path(__file__).resolve().parents[1]
dist = root / 'dist'
out = root / 'offline'
out.mkdir(exist_ok=True)
html = (dist / 'index.html').read_text()
def inline_script(match):
    source = (dist / match.group(1).lstrip('/')).read_text()
    source = source.replace('/media/', './media/').replace('</script', '<\\/script')
    return '<script type="module">' + source + '</script>'
html = re.sub(r'<script type="module" crossorigin src="([^"]+)"></script>', inline_script, html)
html = re.sub(r'<link rel="stylesheet" crossorigin href="([^"]+)">', lambda m: '<style>' + (dist / m.group(1).lstrip('/')).read_text() + '</style>', html)
(out / 'index.html').write_text(html)
shutil.copytree(dist / 'media', out / 'media', dirs_exist_ok=True)
(out / 'КАК ОТКРЫТЬ.txt').write_text('Распакуйте архив целиком. Откройте index.html двойным щелчком в Chrome, Edge, Firefox или Safari.\nПапка media должна оставаться рядом с index.html — в ней находятся видео.\nИнтернет, установка программ и сервер не нужны.\nЕсли браузер запрещает локальное сохранение плана, используйте кнопку скачивания JSON.\n', encoding='utf-8')
archive = root / 'RIVER-local.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    current_files = [Path('index.html'), Path('КАК ОТКРЫТЬ.txt')]
    current_files += [Path('media') / path.relative_to(dist / 'media')
                      for path in sorted((dist / 'media').rglob('*')) if path.is_file()]
    for relative in current_files:
        z.write(out / relative, Path('RIVER-local') / relative)
print(archive)
