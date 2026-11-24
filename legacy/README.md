# Legacy — dashboard v0.1.0

Snapshot del dashboard HTML estático previo a la migración a Astro. **No se publica**: GitHub Pages despliega únicamente `app/dist` vía `.github/workflows/deploy.yml`.

| Versión | Archivo | Notas |
|---|---|---|
| 0.1.0 | [v0.1.0.html](v0.1.0.html) | Dashboard HTML/CSS/JS + Chart.js 4 (antes `index.html` en la raíz) |
| 0.1.0 | [roadmap-v0.1.0.html](roadmap-v0.1.0.html) | Cuaderno de roadmap interactivo (antes `roadmap.html`) |

Se conservan como referencia histórica (tag `v0.1.0`) y para comparaciones visuales contra la app Astro. No se mantienen.

Para verlos localmente, sírvelos desde la raíz del repo, porque `v0.1.0.html` carga `data/sfm-data.json` con ruta relativa:

```bash
python3 -m http.server 8000
# luego abre http://localhost:8000/legacy/v0.1.0.html
```

Nota: con esa ruta relativa el fetch apunta a `legacy/data/sfm-data.json`, que no existe; para una réplica exacta usa `git checkout v0.1.0` y abre `index.html`.
