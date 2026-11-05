#!/usr/bin/env python3
"""Reuse Little Worlds' module-graph exporter with the country's shared website shell."""
from pathlib import Path
import argparse, importlib.util, shutil, tempfile, re
ROOT=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser()
parser.add_argument('--output',type=Path,default=ROOT/'work/chongqing-offline.html')
parser.add_argument('--exporter',type=Path,default=Path('/Users/vance/.codex/skills/little-worlds-3d/assets/starter/scripts/export-html.py'))
a=parser.parse_args()
spec=importlib.util.spec_from_file_location('little_worlds_export',a.exporter);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
with tempfile.TemporaryDirectory(prefix='chongqing-export-') as tmp:
 project=Path(tmp).resolve();shutil.copytree(ROOT/'dist/assets/china-worlds',project,dirs_exist_ok=True)
 html=(ROOT/'dist/china.html').read_text()
 for css in ['world-shell.css','country-ui.css']:
  html=html.replace(f'<link rel="stylesheet" href="{css}">','<style>'+(ROOT/'dist'/css).read_text()+'</style>')
 html=html.replace('href="assets/china-worlds/styles.css"','href="./styles.css"').replace('src="assets/china-worlds/src/main.js"','src="./src/main.js"')
 html=html.replace('<script type="module" src="world-shell.js"></script>','<script type="module">'+(ROOT/'dist/world-shell.js').read_text()+'</script>')
 html=html.replace('href="index.html#destinations"','href="https://little-elsewhere-vance.chenvance.chatgpt.site/index.html#destinations"')
 (project/'index.html').write_text(html)
 shutil.copyfile(project/'vendor/three/LICENSE.txt',project/'vendor/three/LICENSE')
 count,size=module.export(project,a.output.resolve());print(f'Exported {a.output.resolve()}: {count} embedded modules, {size:,} bytes')
