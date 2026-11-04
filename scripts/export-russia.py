"""Export Moscow and its exact local dependency graph as one offline HTML."""
from pathlib import Path
import re,json,base64,posixpath,sys
root=Path(__file__).resolve().parent.parent
s=(root/'dist/russia.html').read_text();imports=json.loads(re.search(r'<script type="importmap">(.*?)</script>',s,re.S)[1])['imports']; modules={}
def resolve(spec,parent):
 if spec.startswith('.'):
  return posixpath.normpath(posixpath.join(posixpath.dirname(parent),spec))
 for k,v in imports.items():
  if spec==k or (k.endswith('/') and spec.startswith(k)):return posixpath.normpath(v+(spec[len(k):] if k.endswith('/') else ''))
 raise ValueError('Unresolved module '+spec)
def module(path):
 path=posixpath.normpath(path)
 if path in modules:return path
 modules[path]=''
 source=(root/'dist'/path).read_text()
 def rewrite(m):
  spec=resolve(m[3],path);module(spec);return m[1]+m[2]+spec+m[2]
 source=re.sub(r"(\bfrom\s*|\bimport\s*)(['\"])([^'\"]+)\2",rewrite,source)
 modules[path]=source
 return path
entry=module('assets/russia-worlds/src/main.js')
result={k:'data:text/javascript;base64,'+base64.b64encode(v.encode()).decode() for k,v in modules.items()}
s=re.sub(r'<script type="importmap">.*?</script>','<script type="importmap">'+json.dumps({'imports':result},separators=(',',':'))+'</script>',s,flags=re.S)
s=s.replace('<script type="module" src="assets/russia-worlds/src/main.js"></script>',f'<script type="module">import "{entry}";</script>')
s=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>'+(root/'dist'/m[1]).read_text()+'</style>',s)
s=s.replace('<script type="module" src="world-shell.js"></script>','<script type="module">'+(root/'dist/world-shell.js').read_text()+'</script>')
s=s.replace('href="index.html#destinations"','href="https://little-elsewhere-vance.chenvance.chatgpt.site/index.html#destinations"')
# Keep the dependency license with the standalone artifact.
s=s.replace('</head>','<!-- Three.js MIT license: '+(root/'dist/assets/italy-worlds/vendor/three/LICENSE.txt').read_text().replace('--','—')+' -->\n</head>')
target=Path(sys.argv[1]) if len(sys.argv)>1 else root/'work/russia-offline.html';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(s);print(f'{target} ({len(modules)} local modules)')
