import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn more about this podcast and the project.",
};

export default function AboutPage() {
  return (
    <section>
      {/* <h2 className="mb-2 text-xl font-semibold">Quienes Somos</h2> */}
      <p className="mb-2">
        Bienvenidos, mi gente, al podcast donde tres socios de toda la vida se
        sientan a conversar como si estuvieran en una esquina de Cuba.
      </p>
      <p className="mb-2">
        Porque sí, aunque uno esté en <strong>Boston</strong>, el otro en 
        <strong> Milwaukee</strong> y el otro en <strong>La Habana</strong>, hay
        un hilo invisible que siempre los conecta: Cuba, su gente, su forma de
        hablar, su manera de ver el mundo.
      </p>

      <p className="mb-2">
        La idea empezó como un simple “oye, deberíamos grabar esto”, y aquí
        estamos: tres voces, tres estilos. Dos de ellos son mueleros de
        nacimiento, pa’ qué negarlo. El otro habla menos, pero cuando abre la
        boca suelta algo que cambia el rumbo de la conversación. Y entre los
        tres se arma una química que solo se entiende si tú también eres cubano…
        o al menos te sientes parte de esa energía.
      </p>

      <p className="mb-2">¿Y de qué se habla aquí? De todo y de nada. Ese es el truco.</p>

      <p className="mb-2">
        No hay libreto, no hay filtro. La conversación arranca en el día a día
        de la isla y termina —siempre sin avisar— en temas universales,
        espirituales, raros, profundos o simplemente cómicos. Como si el
        universo dijera: “caballeros, siéntense a hablar”, y la tecnología
        hiciera su magia (o brujería) para que ocurra.
      </p>

      <p className="mb-2">
        Así que si quieres reír, pensar, recordar, cuestionarte o simplemente
        sentirte acompañado, dale play y únete a esta tertulia entre socios
        separados por kilómetros, pero unidos por la misma raíz.
      </p>

      <p className="mb-2">Ponte cómodo, que esta talla se va a poner buena.</p>
    </section>
  );
}
