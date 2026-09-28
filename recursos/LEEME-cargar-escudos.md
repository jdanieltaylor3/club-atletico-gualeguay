# Cargar escudo del club y escudos de equipos

Dejá acá los archivos y avisame cuando estén. Nada de esto se sube al sitio tal cual: yo los integro en `assets/img/` y genero el build.

## Qué dejar y cómo llamarlos

### 1. Escudo del club (obligatorio para sacar los colores)

Un archivo, SVG o PNG (si es PNG, cuanto más fondo transparente y más grande, mejor):

```
recursos/escudo-club.svg        (o escudo-club.png)
```

De acá extraigo los **colores oficiales** y reemplazo el placeholder del header (hoy es un círculo verde con "CAG").

### 2. Escudos de los equipos (opcional: solo los que tengan)

Carpeta nueva `recursos/equipos/` con un archivo por escudo (SVG o PNG), nombre libre:

```
recursos/equipos/Amistad FC.png
recursos/equipos/Centenario.svg
```

- No hace falta que estén TODOS los equipos: los que no tengan archivo muestran un círculo con la inicial del nombre (ya implementado).
- SI podés, poné el nombre igual al del club/equipo tal cual está en `data/torneos/*.json`; si no, igual lo mapeo yo.

### 3. Fotos reales (opcional, para las noticias)

Si tenés fotos de la sede o de los torneos, se pueden dejar en `recursos/fotos/` y las uso en las noticias (hoy usan placeholders "Foto 1/2").

## Después de dejarlos

1. Avisame en el chat ("dejé los archivos").
2. Yo: muevo los archivos a `assets/img/`, extraigo colores si hay escudo, agrego los campos `escudo` a los JSON de torneos y regenero.
3. Validamos y commitamos.