/* ============================================================
   AMET REGIONAL 1 - CABA
   REGLAS GENERALES DE LIQUIDACIÓN
   ============================================================

   Este archivo contiene reglas que NO pertenecen
   específicamente a una grilla mensual.

   Por ejemplo:

   - Tramos de horas cátedra.
   - Equivalencias horarias.
   - Presentismo.
   - Descuentos generales.
   - Asignaciones familiares.
   - Afiliación sindical.

   Los importes propios de cada mes estarán en archivos como:

   data/2026-08.js
   data/2026-09.js
   etc.

   ============================================================ */


window.AMET_RULES = {


    /* ========================================================
       DESCUENTOS GENERALES DE REFERENCIA
       ======================================================== */

    discounts: {

        obraSocial: {

            code:
                "674",

            label:
                "Obra Social",

            rate:
                0.03

        },


        cajaComplementaria: {

            code:
                "648",

            label:
                "Caja Complementaria",

            rate:
                0.045

        },


        jubilacion: {

            code:
                "561",

            label:
                "Jubilación",

            rate:
                0.11

        },


        jubilacionSuplementaria: {

            code:
                "994",

            label:
                "Aporte Jubilatorio Suplementario Docente",

            rate:
                0.02

        }

    },



    /* ========================================================
       DESCUENTO TOTAL DE REFERENCIA
       ========================================================

       3 %
       + 4,5 %
       + 11 %
       + 2 %

       = 20,5 %

       ======================================================== */

    statutoryDiscountRate:
        0.205,



    /* ========================================================
       PRESENTISMO
       ========================================================

       Se mantiene centralizado para que pueda modificarse
       fácilmente si cambia la normativa.

       El adicional completo se toma como referencia
       del 10 % del sueldo básico.

       ======================================================== */

    presentism: {

        rate:
            0.10,


        levels: [

            {

                id:
                    "full",

                label:
                    "100% · Completo",

                factor:
                    1

            },


            {

                id:
                    "85",

                label:
                    "85%",

                factor:
                    0.85

            },


            {

                id:
                    "50",

                label:
                    "50%",

                factor:
                    0.50

            },


            {

                id:
                    "25",

                label:
                    "25%",

                factor:
                    0.25

            },


            {

                id:
                    "none",

                label:
                    "0% · No corresponde",

                factor:
                    0

            }

        ]

    },



    /* ========================================================
       TRAMOS DE HORAS CÁTEDRA
       ========================================================

       La grilla utiliza tres valores marginales:

       - Hora cátedra normal.
       - Hora cátedra mayor a 30.
       - Hora cátedra mayor a 40.

       ======================================================== */

    hourBands: {

        regular: {

            code:
                "5099",

            from:
                1,

            to:
                30,

            label:
                "Horas 1 a 30"

        },


        over30: {

            code:
                "5099B",

            from:
                31,

            to:
                40,

            label:
                "Horas 31 a 40"

        },


        over40: {

            code:
                "5099C",

            from:
                41,

            to:
                null,

            label:
                "Horas superiores a 40"

        },


        /*
         * Estas filas sirven para los cálculos internos.
         * No deben aparecer como cargos normales
         * en el selector del usuario.
         */

        hiddenCodes: [

            "5099B",

            "5099C"

        ]

    },



    /* ========================================================
       EQUIVALENCIAS HORARIAS
       ========================================================

       Se incluyen solamente los cargos cuya equivalencia
       está expresada explícitamente en la grilla.

       ======================================================== */

    hourEquivalences: {

        /*
         * Hora cátedra individual.
         * La cantidad la ingresa el usuario.
         */

        "5099": {

            type:
                "variable",

            hours:
                1

        },


        /*
         * Profesor TP4
         */

        "1550": {

            type:
                "fixed",

            hours:
                12

        },


        /*
         * Profesor TP3
         */

        "1549": {

            type:
                "fixed",

            hours:
                18

        },


        /*
         * Profesor TP2
         */

        "1528": {

            type:
                "fixed",

            hours:
                24

        },


        /*
         * Profesor TP1
         */

        "1507": {

            type:
                "fixed",

            hours:
                30

        },


        /*
         * Profesor TC
         */

        "1504": {

            type:
                "fixed",

            hours:
                36

        }

    },



    /* ========================================================
       CUOTA SINDICAL AMET
       ========================================================

       IMPORTANTE:

       Queremos que el usuario solamente tenga que marcar:

       [x] Afiliado/a a AMET

       y que el cálculo se haga automáticamente.

       Para eso necesitamos conocer la fórmula oficial vigente
       de la cuota sindical.

       Como todavía no verificamos el porcentaje exacto,
       NO inventamos una alícuota.

       Cuando la confirmemos solamente habrá que modificar
       este bloque.

       Ejemplo si fuera 2 %:

       enabled: true,
       type: "percent",
       value: 0.02,
       base: "gross"

       ======================================================== */

    unionFee: {

        enabled:
            false,


        organization:
            "AMET Regional 1",


        type:
            "percent",


        /*
         * Valor todavía pendiente de confirmación.
         */

        value:
            null,


        /*
         * Futuras posibilidades:

         * "basic"
         * "gross"
         * "estimatedPocket"
         * "fixed"
         */

        base:
            null,


        label:
            "Cuota sindical AMET",


        note:
            "La afiliación está disponible, pero la fórmula automática de la cuota sindical se encuentra pendiente de verificación."

    },



    /* ========================================================
       ASIGNACIONES FAMILIARES
       ========================================================

       Las reglas se mantienen acá porque no forman parte
       de la tabla de cargos.

       El período de estos valores puede ser diferente
       al período de la grilla salarial.

       ======================================================== */

    familyAllowances: {

        period:
            "Julio - Diciembre 2026",


        /*
         * Tope máximo de ingreso individual
         * para los rangos cargados.
         */

        maxIncome:
            6437322.92,


        ranges: [

            /* =================================================
               RANGO 1
               ================================================= */

            {

                id:
                    1,


                maxIncome:
                    3373269.61,


                child:
                    154839.80,


                disabledChild:
                    527978.33,


                spouse:
                    55843.86

            },


            /* =================================================
               RANGO 2
               ================================================= */

            {

                id:
                    2,


                maxIncome:
                    4919351.52,


                child:
                    93919.22,


                disabledChild:
                    335063.17,


                spouse:
                    55843.86

            },


            /* =================================================
               RANGO 3
               ================================================= */

            {

                id:
                    3,


                maxIncome:
                    6437322.92,


                child:
                    48228.79,


                disabledChild:
                    335063.17,


                spouse:
                    55843.86

            }

        ]

    },



    /* ========================================================
       CONFIGURACIÓN DE INTERFAZ
       ======================================================== */

    interface: {

        /*
         * Presentismo marcado inicialmente.
         */

        presentismDefault:
            true,


        /*
         * Afiliación AMET sin marcar inicialmente.
         */

        unionDefault:
            false,


        /*
         * Mostrar comparación con cuenta sueldo.
         */

        showBankComparison:
            true,


        /*
         * Mostrar detalle de tramos horarios.
         */

        showHourBandDetail:
            true

    }

};