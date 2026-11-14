// compacta os <script> internos de um HTML (sem src) com terser
const fs = require('fs'); const {minify} = require('terser');
(async () => {
  for (const f of process.argv.slice(2)) {
    let h = fs.readFileSync(f, 'utf8'); const re = /<script>([\s\S]*?)<\/script>/g; let out = '', last = 0, m, n = 0, before = h.length;
    while ((m = re.exec(h))) {
      const r = await minify(m[1], {compress: {passes: 2}, mangle: true, format: {comments: false}, ecma: 2020});
      out += h.slice(last, m.index) + '<script>' + r.code.replace(/<\/script/gi, '<\\/script') + '</script>'; last = re.lastIndex; n++;
    }
    out += h.slice(last); fs.writeFileSync(f, out); console.log(f.split('/').pop(), n, 'scripts', Math.round(before / 1024) + 'KB ->', Math.round(out.length / 1024) + 'KB');
  }
})().catch(e => { console.error(e); process.exit(1); });
