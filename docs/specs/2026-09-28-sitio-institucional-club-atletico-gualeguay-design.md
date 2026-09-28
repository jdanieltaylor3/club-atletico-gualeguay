# Diseño — Sitio institucional Club Atlético Gualeguay

- **Fecha:** 2026-09-28
- **Estado:** aprobado por el usuario (pendiente revisión de este documento)
- **Tecnología:** sitio 100% estático — HTML5, CSS3, JavaScript vanilla + generador mínimo en Node (`build.js`). Sin backend, base de datos, autenticación, CMS ni frameworks.

---

## 1. Contexto y objetivo

Web institucional del **Club Atlético Gualeguay** (Villaguay, Entre Ríos, Argentina). El contenido deportivo principal son dos torneos de Fútbol 7 con sistema de doble eliminación por vidas:

- **Libres** (~60 equipos)
- **Veteranos** (~20 equipos)

Ambos usan el mismo sistema general y el mismo modelo de datos. El sitio debe mostrarlos, junto con contenido institucional y noticias, y vivir como proyecto estático desplegable en **GitHub Pages** y **Cloudflare Pages** sin costo.

## 2. Alcance

### Incluido (v1)
- Páginas institucionales: Inicio, Noticias, Instalaciones/Sede, Contacto, Redes (bloque en header y footer).
- Torneos: Libres y Veteranos, edición vigente **26/27** + archivo de ediciones anteriores.
- Por edición: Equipos · Fixture (partidos por ronda) · Cuadro (listas por ronda con zonas) · Goleadores.
- Visualización del cuadro por **listas por ronda** (opción A validada).

### Excluido (fuera de alcance, no introducir)
- Backend, base de datos, autenticación, usuarios, servidor, CMS, framework.
- Vista de posiciones/tabla de vidas (descartada por el usuario).
- Planteles/jugadores por equipo y tarjetas (descartados en v1).

## 3. Hallazgos de descubrimiento

| Tema | Decisión |
|---|---|
| Mantenimiento | Técnico; puede editar HTML directo y/o usar el generador (modos B y A) |
| Identidad visual | Colores + escudo existentes (se entregarán); tokens configurables |
| Imágenes | Pocas fotos por ahora → placeholders fáciles de reemplazar |
| Responsive | Móvil primero |
| Ampliaciones | Histórico de ediciones, patrocinadores, más torneos/categorías |
| Idiomas | Español |

## 4. Reglas del torneo (doble eliminación con vidas)

1. Todos los equipos comienzan con **2 vidas**; cada derrota cuesta 1 vida; al perder las 2, el equipo queda eliminado.
2. **Ronda 1:** cruces pareados por sorteo → ganadores a **Zona Ganadores** (2 vidas), perdedores a **Zona Perdedores** (1 vida).
3. **Zona Ganadores:** el que gana continúa (conserva vidas); el que pierde baja a Zona Perdedores (queda con 1 vida).
4. **Zona Perdedores:** cada partido es de eliminación directa (el perdedor queda eliminado); recibe los "descensos" de Ganadores.
5. Las rondas continúan hasta que queda **un finalista por zona**.
6. **Final al mejor de 2:** el finalista de Ganadores (2 vidas) es campeón ganando 1 partido; el de Perdedores (1 vida) necesita ganar 2.
7. **Empates:** siempre se resuelven por **penales**; nunca queda partido empatado.
8. **Número impar** en una zona → **pase libre (bye)**, sorteado/definido por el club.
9. Los **cruces de cada ronda los carga el club** (no se generan automáticamente).
10. Datos por partido: **resultado + horario + cancha + goles/goleadores**.
11. No se muestra tabla de posiciones/vidas (decisión de producto).

## 5. Mapa del sitio y navegación

```
Inicio (home)
├── Torneos (Fútbol 7)
│   ├── Libres
│   │   ├── Edición 26/27 (vigente)
│   │   └── Ediciones anteriores (archivo)
│   └── Veteranos
│       ├── Edición 26/27 (vigente)
│       └── Ediciones anteriores (archivo)
├── Noticias
│   ├── Listado + archivo por fecha
│   └── Nota (detalle)
├── Instalaciones / Sede
├── Contacto
└── Redes (bloque en header y footer)
```

- Menú principal: **Inicio · Torneos (Fútbol 7) ▾ · Noticias · Instalaciones · Contacto** + íconos de redes.
- Submenú en "Torneos": **Libres / Veteranos**.
- Móvil: hamburguesa con el mismo submenú.
- Breadcrumb en profundidad: `Torneos > Libres > 26/27`.
- Detalle de una edición: **Equipos · Fixture · Cuadro · Goleadores** (tabs).

## 6. Arquitectura de contenidos

- **Institucional (manuscrito, modo B):** Instalaciones/Sede, Contacto, Redes — HTML a mano, compartiendo header/footer por el build.
- **Dinámico desde datos (modo A):** Torneos (ediciones), Noticias, Home — generados desde JSON.
- **Home** (por build): hero con CTA a la edición vigente + última ronda (Ganadores/Perdedores) + próximos partidos + resultados recientes + últimas noticias.

### Dirección estética (referencia, sin copiar)
Estética **institucional deportiva** con la jerarquía visual, el uso de escudo/colores y la sensación profesional de argentinosjuniors.com.ar; organización de torneos, fixtures, resultados y competiciones inspirada en club12lavuelta.com/futbol. Colores y escudo reales se cargan como tokens cuando el club los entregue. Los placeholders de imagen se reemplazan sin tocar estructura.

## 7. Enfoque técnico (A + B híbrido)

- **Modo A (recomendado):** los datos viven en JSON dentro de `data/`; un generador mínimo en Node (`build.js`, sin dependencias de framework) produce el sitio estático final a partir de plantillas en `templates/`.
- **Modo B:** el mantenedor técnico puede editar cualquier página HTML final directamente; el build no pisa páginas manuscritas (se copian tal cual).
- Las páginas de edición de torneo son **shells estáticos** que cargan su JSON con `fetch` (mismo origen) y renderizan las tabs con JS vanilla; sin backend.
- Sin dependencias pesadas: solo Node para el build (gratuito, local o en CI).

## 8. Modelo de datos (JSON, fuente de verdad)

### `data/torneos/<categoria>-<edicion>.json` (ej. `libres-26-27.json`)
```json
{
  "id": "libres-26-27",
  "nombre": "Libres",
  "categoria": "libres",
  "edicion": "26/27",
  "estado": "vigente",
  "equipos": [{ "id": "eq-a", "nombre": "Equipo A" }],
  "rondas": [
    {
      "numero": 3,
      "zona": "ganadores",
      "partidos": [
        {
          "id": "p-1",
          "equipoA": "eq-a",
          "equipoB": "eq-b",
          "estado": "jugado",
          "resultado": { "golesA": 2, "golesB": 1 },
          "penales": null,
          "fecha": "2026-10-03",
          "hora": "20:30",
          "cancha": "Cancha 1"
        }
      ]
    }
  ],
  "goleadores": [{ "jugador": "López", "equipoId": "eq-a", "goles": 7 }]
}
```

- Estados de partido: `por jugar | jugado | pase-libre`.
- `penales: { a, b }` solo cuando el resultado se definió por penales (resultado empate en goles).
- Cada edición es **autocontenida** (equipos, rondas y goleadores propios) → el archivo histórico es automático.
- **Byes:** partido con `estado: "pase-libre"` (el equipo pasa sin jugar).

### `data/noticias.json`
```json
[{ "id": 1, "titulo": "...", "fecha": "2026-09-25", "resumen": "...", "categoria": "torneo", "imagen": "img/noticias/n1.jpg", "contenido": "..." }]
```

### `data/sitio.json`
Identidad (nombre, colores, escudo), redes sociales, edición vigente por categoría.

## 9. Componentes reutilizables

- **Badges:** vidas (2 vidas / 1 vida / eliminado), zona (ganadores / perdedores), penales, pase libre.
- **Tarjeta de partido** (3 estados): por jugar · jugado (resultado) · jugado por penales.
- **Controles:** navegador de ronda (◀ Ronda N ▶), tabs (Equipos/Fixture/Cuadro/Goleadores), selector de edición.
- **Paneles:** tabla de goleadores, lista de equipos con badge de vidas, tarjeta de noticia.
- **Layouts:** header (escudo + nav + redes), footer, hero + CTA, breadcrumb.
- Validados visualmente en el companion (pantalla 4). El mismo set sirve para Libres y Veteranos.

## 10. Estructura de carpetas (propuesta)

El repositorio contiene fuentes (`data/`, `templates/`, `assets/`, páginas manuscritas) y el build genera la salida publicable en **`dist/`** (único directorio que se despliega).

```
/                         raíz del repositorio
├─ dist/                  salida publicable (generada por build.js)
├─ index.html
├─ torneos/libres/26-27/  shell por edición (generado)
├─ torneos/veteranos/26-27/
├─ torneos/index.html     presentación de torneos (generada)
├─ noticias/  (listado + notas, generadas)
├─ instalaciones/  contacto/   (manuscritas, copiadas al build)
├─ data/                  JSON fuente de verdad
├─ assets/  css · js · img
├─ templates/             plantillas del build
└─ build.js               generador mínimo
```

## 11. Estrategia responsive

- **Móvil primero** (breakpoints ~480/768/1024), una columna en móvil.
- Menú hamburguesa; tabs con scroll horizontal; tarjetas táctiles de tamaño confortable.
- Zonas Ganadores/Perdedores: lado a lado en desktop, apiladas (ganadores primero) en móvil.
- Imágenes con `aspect-ratio` y lazy-load; tipografía fluida con `clamp()`.

## 12. Noticias e institucional

- Noticias en `data/noticias.json` → listado + detalle + archivo por fecha (generadas por build).
- Institucional: Instalaciones/Sede y Contacto manuscritos (modo B), con header/footer compartidos.
- Contacto: datos + formulario externo (ej. mailto o servicio gratuito tipo Google Forms) — sin backend propio.

## 13. Despliegue (todo gratuito)

- **Cloudflare Pages:** build `node build.js` → salida **`dist/`**; dominio propio y previews por PR. Plan gratuito suficiente.
- **GitHub Pages:** GitHub Actions gratuita en repos públicos → `node build.js` + publicar **`dist/`**. `.nojekyll` y rutas relativas para que el sitio funcione idéntico en ambas plataformas.
- Sin costos: hosting estático gratuito + build local en Node (gratis).

## 14. Estados de la UI (cobertura de estados)

- **Primer uso / sin datos:** edición sin equipos ni rondas → mensaje "Todavía no hay datos cargados"; home sin noticias → bloque oculto.
- **Sin partidos en la ronda:** "Esta ronda no tiene partidos cargados aún".
- **Carga:** estados de carga breves al fetchear JSON (esqueletos o texto).
- **Error:** JSON ausente o inválido → mensaje amigable + no romper el resto del sitio.
- **Accesibilidad base:** HTML semántico, navegación por teclado (menú, tabs), foco visible, texto alternativo en imágenes, alto contraste.

## 15. Ampliaciones futuras (sin rediseño)

- **Histórico de ediciones:** una edición nueva = un JSON más.
- **Patrocinadores:** bloque en home/footer + sección futura.
- **Más torneos/categorías:** mismo modelo, nuevas carpetas en `torneos/`.

## 16. Decisiones pendientes / dependencias

- Entrega de **colores y escudo** del club (se integran como tokens; mientras tanto, placeholders).
- **Fotos** para noticias y home (se reemplazan los placeholders).
- Definir si el **dominio** será propio (Cloudflare Pages lo admite gratis).