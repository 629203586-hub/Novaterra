"""Export the integrated Italy page, its shared shell, CSS and module graph offline."""
from pathlib import Path
import re,json,base64,posixpath,sys
root=Path(__file__).resolve().parent.parent
s=(root/'dist/italy.html').read_text()
m=re.search(r'<script type="importmap">(.*?)</script>',s,re.S);d=json.loads(m[1]);result={}
for key,url in d['imports'].items():
 source=(root/'dist'/url).read_text()
 source=re.sub(r"(\bfrom\s*|\bimport\s*)(['\"])(\.[^'\"]+)\2",lambda a:a[1]+a[2]+posixpath.normpath(posixpath.join(posixpath.dirname(key),a[3]))+a[2],source)
 result[key]='data:text/javascript;base64,'+base64.b64encode(source.encode()).decode()
s=s[:m.start(1)]+json.dumps({'imports':result},separators=(',',':'))+s[m.end(1):]
s=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>'+ (root/'dist'/m[1]).read_text()+'</style>',s)
s=s.replace('<script type="module" src="world-shell.js"></script>','<script type="module">'+(root/'dist/world-shell.js').read_text()+'</script>')
s=s.replace('href="index.html#destinations"','href="https://little-elsewhere-vance.chenvance.chatgpt.site/index.html#destinations"')
target=Path(sys.argv[1]) if len(sys.argv)>1 else root/'work/italy-offline.html';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(s)
print(target)
