"""Extract synchronized PNG pairs from the supplied full-bitrate source videos.
Usage: python3 scripts/extract-spotter.py /path/to/directory-containing-videos
Original videos are not committed or downloaded by this script.
"""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

source = Path(sys.argv[1])
output = Path(__file__).resolve().parents[1] / 'public/media/spotter'
output.mkdir(parents=True, exist_ok=True)
samples = [(12, 400, 360, 1400, 680), (36, 100, 130, 930, 520), (52, 850, 126, 1050, 340)]
inputs = [('b-boxes.mp4', 'original'), ('segment.mp4', 'result')]
metadata = {}
for name, role in inputs:
    path = source / name
    info = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', str(path)]))['streams'][0]
    if (info['width'], info['height']) != (1920, 1080):
        raise ValueError('The documented crops require the supplied 1920x1080 sources')
    with path.open('rb') as f:
        digest = hashlib.file_digest(f, 'sha256').hexdigest()
    metadata[role] = {'url': 'http://9.247.247.5/media/' + name, 'bytes': path.stat().st_size, 'sha256': digest}
    for time, x, y, width, height in samples:
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(time), '-i', str(path), '-vf', f'crop={width}:{height}:{x}:{y}:exact=1', '-frames:v', '1', str(output / f'flight-{time}-{role}.png')], check=True)
provenance = {'sources': metadata, 'source_resolution': [1920,1080], 'format': 'PNG (lossless)', 'method': 'Identical timestamp and crop from supplied full-bitrate sources. No scaling, retouching or generated pixels. Visible bbox annotations excluded by crop; visually checked. Display width limited to native crop width.', 'samples': [{'time_seconds': t, 'crop_xywh': [x,y,w,h]} for t,x,y,w,h in samples]}
(output / 'provenance.json').write_text(json.dumps(provenance, ensure_ascii=False, indent=2)+'\n')
