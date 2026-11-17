# Dashboard de beneficiarios de Guayaquil

Dashboard de una página, hecho con HTML, CSS y JavaScript. No necesita instalar dependencias ni compilar.

Incluye mapa de parroquias, conteos, búsqueda, selección por parroquia, descarga de todos los beneficiarios o de una parroquia en Excel, y limpieza de la selección al hacer clic en un espacio vacío. Conserva las correcciones de las etiquetas al hacer zoom.

## Datos personales y acceso

La carpeta `downloads/` contiene nombres, cédulas, teléfonos y correos de los beneficiarios. Sube este paquete a un repositorio privado si conservarás esos datos.

GitHub Pages publica los sitios en Internet por defecto, incluso si el repositorio es privado. La protección de acceso del enlace anterior pertenece a Sites y no se transfiere a esta copia. Este proyecto estático no incorpora un inicio de sesión. Mantén Pages desactivado salvo que tengas autorización para publicar los datos o hayas configurado un alojamiento que proteja tanto la página como las descargas.

Documentación: [visibilidad de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) y [publicación privada en Enterprise Cloud](https://docs.github.com/en/enterprise-cloud%40latest/pages/getting-started-with-github-pages/about-privately-published-github-pages-sites).

## Subir a GitHub

1. Descomprime este ZIP.
2. Crea un repositorio privado, por ejemplo `dashboard-guayaquil`.
3. En el repositorio, entra a **Add file → Upload files**.
4. Sube los archivos descomprimidos y la carpeta `downloads/`. `index.html` debe quedar en la raíz del repositorio. No subas únicamente el ZIP.
5. Guarda con **Commit changes**.

## Publicar en GitHub Pages

Aplica primero la indicación de acceso anterior. Para publicar una copia que pueda exponerse:

1. Abre **Settings → Pages**.
2. En **Build and deployment → Source**, elige **Deploy from a branch**.
3. Selecciona la rama **main** y la carpeta **/(root)**.
4. Pulsa **Save** y espera a que GitHub muestre la URL del sitio.

Las rutas son relativas y funcionan bajo la ruta del repositorio. Se incluye `.nojekyll`. La disponibilidad de Pages depende del plan y de las políticas de tu cuenta.

Guía oficial: [configurar la fuente de publicación](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Probar en tu equipo

Desde la carpeta descomprimida, si tienes Python instalado:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Abre `http://127.0.0.1:8000`. Esta versión carga archivos JSON y debe abrirse mediante un servidor HTTP.

## Archivos

- `index.html`: página principal.
- `styles.css`: diseño y etiquetas del mapa.
- `app.js`: selección, mapa, búsqueda y descargas.
- `data.json`: conteos y nombres de parroquias.
- `geography.json`: geometría del mapa.
- `downloads/`: 23 archivos Excel, uno con todos los registros y 22 grupos según el campo parroquia.

## Alcance de los datos

El reporte contiene 7.311 beneficiarios con cédula única y 21 parroquias identificadas. Las 561 filas cuyo campo parroquia dice “GUAYAQUIL” se conservan como “Sin parroquia específica”. Chongón aparece como un punto de referencia porque la capa municipal utilizada no incluye su límite. Las fuentes están disponibles en “Fuentes y notas” dentro del dashboard.

Período de registro: 8 de septiembre a 16 de noviembre de 2026. Los datos representan el archivo suministrado y no se actualizan automáticamente.
