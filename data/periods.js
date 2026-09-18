/* ============================================================
   AMET REGIONAL 1
   PERÍODOS SALARIALES DISPONIBLES
   ============================================================

   Este archivo funciona como índice de las grillas disponibles.

   Cada vez que aparezca una nueva grilla salarial solamente
   tendremos que:

   1. Crear el nuevo archivo mensual.
   2. Agregarlo a esta lista.

   Ejemplo futuro:

   {
       id: "2026-09",
       label: "Septiembre 2026",
       file: "data/2026-09.js"
   }

   ============================================================ */


window.AMET_PERIODS = [

    {

        id:
            "2026-08",

        label:
            "Agosto 2026",

        file:
            "data/2026-08.js"

    }

];


/* ============================================================
   PERÍODO PREDETERMINADO
   ============================================================ */

window.AMET_DEFAULT_PERIOD =
    "2026-08";