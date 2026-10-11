// Fondos con video: mantiene en marcha solo el clip de la sección que se está
// viendo y lo pausa cuando sale. Módulo ES, sin dependencias.
//
// Sigue las reglas del sistema de movimiento del sitio:
//   - si el usuario pide menos movimiento (prefers-reduced-motion) el video no
//     se reproduce nunca y ni siquiera se descarga;
//   - en celular el CSS oculta el video y deja un fondo animado liviano: acá
//     se descarta antes de observarlo, así el mp4 no se pide;
//   - sin JS el video no arranca (el HTML no lleva autoplay) y queda el poster,
//     que es un fotograma del clip: nunca hay un hueco vacío;
//   - se usa IntersectionObserver: un clip que arranca bajo el pliegue no se
//     reproduce hasta que se ve, y reproducir lo que nadie ve es tirar datos.

// En celular el CSS oculta el video (.video-fondo video { display: none }): se
// filtra acá para no observarlo ni reproducirlo; con preload="none" el mp4
// directamente no se pide. Con menos movimiento, ni se observa.
const videos = [...document.querySelectorAll(".video-fondo video")].filter(
  (video) => getComputedStyle(video).display !== "none"
);
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
