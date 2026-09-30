// Fondos con video: mantiene en marcha solo el clip de la sección que se está
// viendo y lo pausa cuando sale. Módulo ES, sin dependencias.
//
// Sigue las reglas del sistema de movimiento del sitio:
//   - si el usuario pide menos movimiento (prefers-reduced-motion) el video no
//     se reproduce nunca y ni siquiera se descarga;
//   - sin JS el video no arranca (el HTML no lleva autoplay) y queda el poster,
//     que es un fotograma del clip: nunca hay un hueco vacío;
//   - se usa IntersectionObserver: de los dos videos de la home uno arranca
//     bajo el pliegue, y reproducir un clip que nadie ve es tirar datos.

const videos = document.querySelectorAll(".video-fondo video");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduce && "IntersectionObserver" in window && videos.length) {
  const observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        const video = entrada.target;
        if (entrada.isIntersecting) {
          const promesa = video.play();
          if (promesa) promesa.catch(() => {}); // si el navegador lo rechaza, el poster queda
        } else {
          video.pause();
        }
      }
    },
    { threshold: 0 }
  );

  videos.forEach((video) => observador.observe(video));
}
