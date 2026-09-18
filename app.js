/* ============================================================
   AMET REGIONAL 1 - CALCULADORA SALARIAL
   Sistema multiperíodo
   ============================================================ */


/* ============================================================
   CONFIGURACIÓN GLOBAL
   ============================================================ */

const PERIODS =
    window.AMET_PERIODS || [];


const DEFAULT_PERIOD =
    window.AMET_DEFAULT_PERIOD || '';


const RULES =
    window.AMET_RULES || {};



/* ============================================================
   PERÍODO ACTUAL
   ============================================================ */

let currentPeriodId =
    null;


let currentPeriod =
    null;


/*
 * Datos salariales del período seleccionado.
 */

let D =
    [];


/*
 * Antigüedades disponibles.
 */

let A =
    [];



/* ============================================================
   ESTADO DE LA CALCULADORA
   ============================================================ */

let items =
    [];


let seq =
    0;


let lastSelectedCargoCode =
    null;



/* ============================================================
   FUNCIONES GENERALES
   ============================================================ */

const $ = (selector) =>
    document.querySelector(selector);



const fmt = (number) =>

    new Intl.NumberFormat(
        'es-AR',
        {
            style:
                'currency',

            currency:
                'ARS',

            maximumFractionDigits:
                2
        }
    )

    .format(
        Number(number) || 0
    );



const compact = (number) =>

    new Intl.NumberFormat(
        'es-AR',
        {
            notation:
                'compact',

            maximumFractionDigits:
                1
        }
    )

    .format(
        Number(number) || 0
    );



/* ============================================================
   BUSCAR CARGO
   ============================================================ */

function getRowByCode(code) {

    return (

        D.find(
            (row) =>
                row.code === code
        )

        ||

        null

    );

}



/* ============================================================
   BUSCAR PERÍODO
   ============================================================ */

function getPeriodDescriptor(id) {

    return (

        PERIODS.find(
            (period) =>
                period.id === id
        )

        ||

        null

    );

}



/* ============================================================
   POSICIÓN DE ANTIGÜEDAD
   ============================================================ */

function pocketIndex(age) {

    const position =

        A.indexOf(
            Number(age)
        );


    return position === -1

        ?

        -1

        :

        position + 1;

}



/* ============================================================
   VALOR DE BOLSILLO
   ============================================================ */

function pocketValue(
    row,
    age
) {

    if (!row) {
        return 0;
    }


    const index =

        pocketIndex(age);


    if (
        index < 1
    ) {

        return 0;

    }


    return Number(
        row.pocket?.[index] || 0
    );

}



/* ============================================================
   CÓDIGOS INTERNOS DE TRAMOS
   ============================================================ */

function hiddenBandCodes() {

    return (

        RULES.hourBands
            ?.hiddenCodes

        ||

        []

    );

}



/* ============================================================
   FILAS INTERNAS
   ============================================================ */

function isBandOnly(row) {

    return Boolean(

        row

        &&

        hiddenBandCodes()
            .includes(
                row.code
            )

    );

}



/* ============================================================
   EQUIVALENCIA HORARIA
   ============================================================ */

function getHourEquivalence(row) {

    if (!row) {
        return null;
    }


    return (

        RULES.hourEquivalences
            ?.[row.code]

        ||

        null

    );

}



/* ============================================================
   ¿ES CARGO HORARIO?
   ============================================================ */

function isHourBased(row) {

    return Boolean(
        getHourEquivalence(row)
    );

}



/* ============================================================
   ¿ES HORA CÁTEDRA VARIABLE?
   ============================================================ */

function isVariableHour(row) {

    return (

        getHourEquivalence(row)
            ?.type

        ===

        'variable'

    );

}



/* ============================================================
   OPCIONES DE CARGOS
   ============================================================ */

function cargoOptions(
    selectedCode = ''
) {

    const options =

        D

            .filter(
                (row) =>
                    !isBandOnly(row)
            )

            .map(
                (row) => {


                    const selected =

                        row.code ===
                        selectedCode

                            ?

                            'selected'

                            :

                            '';


                    return `

                        <option
                            value="${row.code}"
                            ${selected}
                        >

                            ${row.code}
                            ·
                            ${row.name}

                        </option>

                    `;

                }
            )

            .join('');


    return `

        <option value="">
            — Seleccionar cargo —
        </option>

        ${options}

    `;

}



/* ============================================================
   OPCIONES DE ANTIGÜEDAD
   ============================================================ */

function ageOptions(
    selected = ''
) {

    const agePercent =

        currentPeriod
            ?.agePercent

        ||

        {};


    const options =

        A

            .map(
                (age) => {


                    const selectedAttr =

                        String(age)
                        ===
                        String(selected)

                            ?

                            'selected'

                            :

                            '';


                    const percent =

                        agePercent[age];


                    const percentLabel =

                        percent !== undefined

                            ?

                            ` · ${percent}%`

                            :

                            '';


                    return `

                        <option
                            value="${age}"
                            ${selectedAttr}
                        >

                            ${age}
                            año${age === 1 ? '' : 's'}
                            ${percentLabel}

                        </option>

                    `;

                }
            )

            .join('');


    return `

        <option value="">
            — Seleccionar antigüedad —
        </option>

        ${options}

    `;

}



/* ============================================================
   AGREGAR CARGO
   ============================================================ */

function addItem() {

    if (!currentPeriod) {
        return;
    }


    items.push(
        {

            id:
                ++seq,

            cargoCode:
                '',

            age:
                '',

            qty:
                1

        }
    );


    render();


    requestAnimationFrame(
        () => {


            const select =

                document.querySelector(
                    `[data-id="${seq}"] .cargo-select`
                );


            if (select) {

                select.focus();

            }

        }
    );

}



/* ============================================================
   ELIMINAR CARGO
   ============================================================ */

function removeItem(id) {

    items =

        items.filter(
            (item) =>
                item.id !== id
        );


    if (
        !items.length
    ) {

        lastSelectedCargoCode =
            null;

    }


    render();

}



/* ============================================================
   ACTUALIZAR CARGO
   ============================================================ */

function updateItem(
    id,
    field,
    value
) {

    const item =

        items.find(
            (entry) =>
                entry.id === id
        );


    if (!item) {
        return;
    }


    item[field] =
        value;


    /*
     * Si cambia el cargo,
     * reiniciamos antigüedad
     * y cantidad.
     */

    if (
        field ===
        'cargoCode'
    ) {

        item.age =
            '';


        item.qty =
            1;


        lastSelectedCargoCode =

            value

                ?

                value

                :

                null;

    }


    /*
     * Horas cátedra.
     */

    if (
        field ===
        'qty'
    ) {

        item.qty =

            Math.max(

                1,

                Math.min(

                    120,

                    Number(value)
                    ||
                    1

                )

            );

    }


    render();

}



/* ============================================================
   VALIDACIÓN
   ============================================================ */

function valid(item) {

    return Boolean(

        item.cargoCode

        &&

        item.age !== ''

    );

}



/* ============================================================
   HORAS EQUIVALENTES
   ============================================================ */

function equivalentHours(item) {

    if (
        !valid(item)
    ) {

        return 0;

    }


    const row =

        getRowByCode(
            item.cargoCode
        );


    const equivalence =

        getHourEquivalence(
            row
        );


    if (
        !equivalence
    ) {

        return 0;

    }


    /*
     * Hora cátedra individual.
     */

    if (
        equivalence.type ===
        'variable'
    ) {

        return Math.max(

            1,

            Number(item.qty)
            ||
            1

        );

    }


    /*
     * Cargo con cantidad fija
     * de horas equivalentes.
     */

    return Number(
        equivalence.hours || 0
    );

}



/* ============================================================
   VALOR INDIVIDUAL DEL CARGO
   ============================================================ */

function itemValue(item) {

    if (
        !valid(item)
    ) {

        return 0;

    }


    const row =

        getRowByCode(
            item.cargoCode
        );


    const unitValue =

        pocketValue(
            row,
            item.age
        );


    /*
     * Hora cátedra individual.
     */

    if (
        isVariableHour(row)
    ) {

        return (

            unitValue

            *

            Math.max(

                1,

                Number(item.qty)
                ||
                1

            )

        );

    }


    return unitValue;

}



/* ============================================================
   BÁSICO DEL CARGO
   ============================================================ */

function itemBasic(item) {

    if (
        !valid(item)
    ) {

        return 0;

    }


    const row =

        getRowByCode(
            item.cargoCode
        );


    if (!row) {
        return 0;
    }


    /*
     * En hora cátedra,
     * multiplicamos el básico
     * por cantidad de horas.
     */

    if (
        isVariableHour(row)
    ) {

        return (

            Number(
                row.basic || 0
            )

            *

            Math.max(

                1,

                Number(item.qty)
                ||
                1

            )

        );

    }


    return Number(
        row.basic || 0
    );

}



/* ============================================================
   CÁLCULO DE TRAMOS HORARIOS
   ============================================================ */

function hourBandCalculation(
    totalHours,
    age
) {

    const regularCode =

        RULES.hourBands
            ?.regular
            ?.code;


    const over30Code =

        RULES.hourBands
            ?.over30
            ?.code;


    const over40Code =

        RULES.hourBands
            ?.over40
            ?.code;



    const regularRow =

        getRowByCode(
            regularCode
        );


    const over30Row =

        getRowByCode(
            over30Code
        );


    const over40Row =

        getRowByCode(
            over40Code
        );


    if (
        !regularRow
        ||
        !over30Row
        ||
        !over40Row
    ) {

        return null;

    }



    const regularRate =

        pocketValue(
            regularRow,
            age
        );


    const over30Rate =

        pocketValue(
            over30Row,
            age
        );


    const over40Rate =

        pocketValue(
            over40Row,
            age
        );



    const firstLimit =

        Number(

            RULES.hourBands
                ?.regular
                ?.to

            ||

            30

        );



    const secondLimit =

        Number(

            RULES.hourBands
                ?.over30
                ?.to

            ||

            40

        );



    const regularHours =

        Math.min(
            totalHours,
            firstLimit
        );



    const over30Hours =

        Math.min(

            Math.max(

                totalHours -
                firstLimit,

                0

            ),

            secondLimit -
            firstLimit

        );



    const over40Hours =

        Math.max(

            totalHours -
            secondLimit,

            0

        );



    const regularAmount =

        regularHours
        *
        regularRate;



    const over30Amount =

        over30Hours
        *
        over30Rate;



    const over40Amount =

        over40Hours
        *
        over40Rate;



    return {

        totalHours,

        regularHours,

        over30Hours,

        over40Hours,

        regularRate,

        over30Rate,

        over40Rate,

        regularAmount,

        over30Amount,

        over40Amount,


        total:

            regularAmount

            +

            over30Amount

            +

            over40Amount

    };

}



/* ============================================================
   TOTALES GENERALES
   ============================================================ */

function calculateTotals() {

    const validItems =

        items.filter(valid);



    const directTotal =

        validItems.reduce(
            (sum, item) =>
                sum +
                itemValue(item),

            0
        );



    const hourItems =

        validItems.filter(
            (item) =>

                isHourBased(

                    getRowByCode(
                        item.cargoCode
                    )

                )
        );



    const nonHourItems =

        validItems.filter(
            (item) =>

                !isHourBased(

                    getRowByCode(
                        item.cargoCode
                    )

                )
        );



    const nonHourTotal =

        nonHourItems.reduce(
            (sum, item) =>
                sum +
                itemValue(item),

            0
        );



    const totalHours =

        hourItems.reduce(
            (sum, item) =>
                sum +
                equivalentHours(item),

            0
        );



    const hourAges = [

        ...new Set(

            hourItems.map(
                (item) =>
                    Number(
                        item.age
                    )
            )

        )

    ];



    const sameHourAge =

        hourAges.length <= 1;



    let band =
        null;


    let estimatedTotal =
        directTotal;


    let adjustment =
        0;


    let canApplyBands =
        false;



    if (
        hourItems.length

        &&

        sameHourAge
    ) {

        band =

            hourBandCalculation(
                totalHours,
                hourAges[0]
            );


        if (
            band
        ) {

            estimatedTotal =

                nonHourTotal

                +

                band.total;


            adjustment =

                estimatedTotal

                -

                directTotal;


            canApplyBands =
                true;

        }

    }



    const basicBase =

        validItems.reduce(
            (sum, item) =>
                sum +
                itemBasic(item),

            0
        );



    return {

        validItems,

        directTotal,

        hourItems,

        nonHourItems,

        nonHourTotal,

        totalHours,

        sameHourAge,

        band,

        estimatedTotal,

        adjustment,

        canApplyBands,

        basicBase

    };

}



/* ============================================================
   CARGAR OPCIONES DE PRESENTISMO
   ============================================================ */

function populatePresentismOptions() {

    const select =

        $('#presentismLevel');


    if (!select) {
        return;
    }


    const levels =

        RULES.presentism
            ?.levels

        ||

        [];


    select.innerHTML =

        levels

            .map(
                (level) => `

                    <option
                        value="${Number(level.factor)}"
                    >

                        ${level.label}

                    </option>

                `
            )

            .join('');


    /*
     * Respaldo por si falta rules.js.
     */

    if (
        !levels.length
    ) {

        select.innerHTML = `

            <option value="1">
                100% · Completo
            </option>

        `;

    }

}



/* ============================================================
   FACTOR DE PRESENTISMO
   ============================================================ */

function presentismFactor() {

    if (
        !$('#presentismEnabled')
            ?.checked
    ) {

        return 0;

    }


    return Number(

        $('#presentismLevel')
            ?.value

        ||

        1

    );

}



/* ============================================================
   CÁLCULO DE PRESENTISMO
   ============================================================ */

function calculatePresentism(
    totals
) {

    if (
        !totals.validItems.length
    ) {

        return {

            factor:
                1,

            grossFull:
                0,

            netFull:
                0,

            loss:
                0

        };

    }



    const factor =

        presentismFactor();



    const presentismRate =

        Number(

            RULES.presentism
                ?.rate

            ||

            0

        );



    const statutoryDiscountRate =

        Number(

            RULES.statutoryDiscountRate

            ||

            0

        );



    /*
     * Presentismo completo bruto.
     */

    const grossFull =

        totals.basicBase

        *

        presentismRate;



    /*
     * Aproximación neta.
     */

    const netFull =

        grossFull

        *

        (
            1 -
            statutoryDiscountRate
        );



    /*
     * Parte que deja de percibirse.
     */

    const loss =

        netFull

        *

        (
            1 -
            factor
        );



    return {

        factor,

        grossFull,

        netFull,

        loss

    };

}



/* ============================================================
   RANGO DE ASIGNACIONES FAMILIARES
   ============================================================ */

function familyRangeFromIncome(
    income
) {

    if (
        !Number.isFinite(income)

        ||

        income <= 0
    ) {

        return null;

    }


    const ranges =

        RULES.familyAllowances
            ?.ranges

        ||

        [];


    return (

        ranges.find(
            (range) =>

                income
                <=
                Number(
                    range.maxIncome
                )
        )

        ||

        null

    );

}



/* ============================================================
   ASIGNACIONES FAMILIARES
   ============================================================ */

function calculateFamilyAllowances() {

    const children =

        Math.max(

            0,

            Number(

                $('#childrenCount')
                    ?.value

                ||

                0

            )

        );



    const disabledChildren =

        Math.max(

            0,

            Number(

                $('#disabledChildrenCount')
                    ?.value

                ||

                0

            )

        );



    const spouse =

        Boolean(

            $('#spouseAllowance')
                ?.checked

        );



    const requested =

        children > 0

        ||

        disabledChildren > 0

        ||

        spouse;



    const incomeText =

        $('#familyIncome')
            ?.value
            .trim()

        ||

        '';



    const income =

        incomeText === ''

            ?

            NaN

            :

            Number(
                incomeText
            );



    /*
     * Sin asignaciones solicitadas.
     */

    if (
        !requested
    ) {

        return {

            requested:
                false,

            total:
                0,

            range:
                null,

            status:
                'No se cargaron asignaciones familiares.'

        };

    }



    /*
     * Falta ingreso.
     */

    if (
        !Number.isFinite(income)

        ||

        income <= 0
    ) {

        return {

            requested:
                true,

            total:
                0,

            range:
                null,

            status:
                'Ingresá el ingreso computable mensual para determinar el rango de asignaciones.'

        };

    }



    const range =

        familyRangeFromIncome(
            income
        );



    /*
     * Supera tope.
     */

    if (
        !range
    ) {

        return {

            requested:
                true,

            total:
                0,

            range:
                null,

            status:

                `El ingreso informado supera el tope de referencia de ${fmt(
                    RULES.familyAllowances
                        ?.maxIncome
                    ||
                    0
                )}.`

        };

    }



    const childAmount =

        children

        *

        Number(
            range.child || 0
        );



    const disabledChildAmount =

        disabledChildren

        *

        Number(
            range.disabledChild || 0
        );



    const spouseAmount =

        spouse

            ?

            Number(
                range.spouse || 0
            )

            :

            0;



    return {

        requested:
            true,

        range,

        childAmount,

        disabledChildAmount,

        spouseAmount,


        total:

            childAmount

            +

            disabledChildAmount

            +

            spouseAmount,


        status:

            `Asignaciones calculadas con el rango ${range.id} (${RULES.familyAllowances?.period || 'período vigente'}).`

    };

}



/* ============================================================
   CUOTA SINDICAL AMET
   ============================================================ */

function calculateUnionDeduction(
    totals
) {

    const affiliated =

        Boolean(

            $('#ametAffiliate')
                ?.checked

        );


    const rule =

        RULES.unionFee

        ||

        {};



    /*
     * No afiliado.
     */

    if (
        !affiliated
    ) {

        return {

            affiliated:
                false,

            amount:
                0,

            configured:
                Boolean(
                    rule.enabled
                ),

            status:
                'No se aplicó descuento sindical.'

        };

    }



    /*
     * Afiliado, pero todavía
     * sin fórmula verificada.
     */

    if (
        !rule.enabled

        ||

        rule.value === null

        ||

        rule.value === undefined
    ) {

        return {

            affiliated:
                true,

            amount:
                0,

            configured:
                false,

            status:

                rule.note

                ||

                'La cuota sindical automática todavía no está configurada.'

        };

    }



    let amount =
        0;


    let baseLabel =
        '';



    /* ========================================================
       CUOTA FIJA
       ======================================================== */

    if (
        rule.type ===
        'fixed'
    ) {

        amount =

            Number(
                rule.value
            )

            ||

            0;


        baseLabel =
            'importe fijo';

    }



    /* ========================================================
       CUOTA PORCENTUAL
       ======================================================== */

    else if (
        rule.type ===
        'percent'
    ) {

        const rate =

            Number(
                rule.value
            )

            ||

            0;


        let base =
            null;



        /*
         * Porcentaje sobre básico.
         */

        if (
            rule.base ===
            'basic'
        ) {

            base =
                totals.basicBase;


            baseLabel =
                'básico computado';

        }



        /*
         * Porcentaje sobre estimación final
         * antes de cuota sindical.
         */

        else if (
            rule.base ===
            'estimatedPocket'
        ) {

            base =
                totals.estimatedTotal;


            baseLabel =
                'total estimado';

        }



        /*
         * Porcentaje sobre suma individual.
         */

        else if (
            rule.base ===
            'directPocket'
        ) {

            base =
                totals.directTotal;


            baseLabel =
                'suma individual';

        }



        /*
         * Base todavía no implementada.
         */

        if (
            base === null
        ) {

            return {

                affiliated:
                    true,

                amount:
                    0,

                configured:
                    false,

                status:

                    `La cuota sindical está configurada con una base todavía no implementada: ${rule.base || 'sin base'}.`

            };

        }



        amount =

            base

            *

            rate;

    }



    /*
     * Tipo desconocido.
     */

    else {

        return {

            affiliated:
                true,

            amount:
                0,

            configured:
                false,

            status:

                `Tipo de cuota sindical no reconocido: ${rule.type || 'sin definir'}.`

        };

    }



    return {

        affiliated:
            true,

        amount,

        configured:
            true,

        status:

            `Cuota sindical calculada automáticamente sobre ${baseLabel}.`

    };

}



/* ============================================================
   TOTAL FINAL
   ============================================================ */

function calculateFinalAccountTotal(
    totals
) {

    const presentism =

        calculatePresentism(
            totals
        );


    const family =

        calculateFamilyAllowances();


    const union =

        calculateUnionDeduction(
            totals
        );



    const finalTotal =

        Math.max(

            0,

            totals.estimatedTotal

            -

            presentism.loss

            +

            family.total

            -

            union.amount

        );



    return {

        presentism,

        family,

        union,

        finalTotal

    };

}



/* ============================================================
   RENDER DE CARGOS
   ============================================================ */

function renderItems() {

    const container =

        $('#items');


    if (!container) {
        return;
    }



    container.innerHTML =

        items

            .map(
                (item, number) => {


                    const row =

                        getRowByCode(
                            item.cargoCode
                        );


                    const variableHour =

                        isVariableHour(
                            row
                        );


                    const hourBased =

                        isHourBased(
                            row
                        );


                    const ok =

                        valid(
                            item
                        );


                    const hours =

                        ok
                        &&
                        hourBased

                            ?

                            equivalentHours(
                                item
                            )

                            :

                            0;



                    let quantityHelp =

                        'Una unidad por cargo.';



                    if (
                        variableHour
                    ) {

                        quantityHelp =

                            'Ingresá la cantidad de horas cátedra.';

                    }


                    else if (
                        hourBased
                        &&
                        row
                    ) {

                        quantityHelp =

                            `${getHourEquivalence(row)?.hours || 0} HC equivalentes por cargo.`;

                    }



                    return `

                        <article
                            class="line-item"
                            data-id="${item.id}"
                        >


                            <div class="line-head">

                                <b>
                                    Cargo ${number + 1}
                                </b>


                                <button
                                    class="remove"
                                    type="button"
                                    data-action="remove"
                                    data-id="${item.id}"
                                >

                                    Eliminar ×

                                </button>

                            </div>



                            <div class="line-body">


                                <div class="line-grid">


                                    <label>

                                        Cargo / función


                                        <select
                                            class="cargo-select"
                                            data-action="cargo"
                                            data-id="${item.id}"
                                        >

                                            ${
                                                cargoOptions(
                                                    item.cargoCode
                                                )
                                            }

                                        </select>

                                    </label>



                                    <label>

                                        Antigüedad


                                        <select
                                            class="age-select"
                                            data-action="age"
                                            data-id="${item.id}"

                                            ${
                                                row
                                                    ?
                                                    ''
                                                    :
                                                    'disabled'
                                            }
                                        >

                                            ${
                                                ageOptions(
                                                    item.age
                                                )
                                            }

                                        </select>

                                    </label>



                                    <label
                                        class="
                                            quantity-label
                                            ${
                                                variableHour
                                                    ?
                                                    ''
                                                    :
                                                    'quantity-disabled'
                                            }
                                        "
                                    >

                                        ${
                                            variableHour
                                                ?
                                                'Cantidad de horas'
                                                :
                                                'Cantidad'
                                        }


                                        <input

                                            class="qty-input"

                                            data-action="qty"

                                            data-id="${item.id}"

                                            type="number"

                                            min="1"

                                            max="120"

                                            value="${item.qty}"

                                            ${
                                                variableHour
                                                    ?
                                                    ''
                                                    :
                                                    'disabled'
                                            }

                                        >


                                        <small>
                                            ${quantityHelp}
                                        </small>

                                    </label>


                                </div>



                                <div class="line-result">


                                    <div>

                                        <small>

                                            ${
                                                ok

                                                    ?

                                                    'BOLSILLO SEGÚN GRILLA'

                                                    :

                                                    'COMPLETÁ CARGO Y ANTIGÜEDAD'
                                            }

                                        </small>


                                        <strong>

                                            ${
                                                ok

                                                    ?

                                                    fmt(
                                                        itemValue(
                                                            item
                                                        )
                                                    )

                                                    :

                                                    '—'
                                            }

                                        </strong>

                                    </div>



                                    <div class="line-meta">

                                        ${
                                            row

                                                ?

                                                `Código ${row.code}
                                                · Índice ${Number(row.index).toLocaleString('es-AR')}
                                                · Básico ${fmt(row.basic)}
                                                ${
                                                    hours
                                                        ?
                                                        ` · ${hours} HC equivalentes`
                                                        :
                                                        ''
                                                }`

                                                :

                                                'Elegí primero un cargo'
                                        }

                                    </div>


                                </div>


                            </div>


                        </article>

                    `;

                }
            )

            .join('');

}



/* ============================================================
   RENDER DE TOTALES
   ============================================================ */

function renderTotals(
    totals
) {

    const hasValid =

        totals.validItems.length > 0;



    $('#grand')
        ?.classList
        .toggle(
            'hidden',
            !hasValid
        );



    $('#settlement')
        ?.classList
        .toggle(
            'hidden',
            !hasValid
        );



    if (
        !hasValid
    ) {

        return;

    }



    $('#grandTotal')
        .textContent =

            fmt(
                totals.directTotal
            );



    $('#grandDesc')
        .textContent =

            `${totals.validItems.length} ${
                totals.validItems.length === 1

                    ?

                    'cargo calculado'

                    :

                    'cargos calculados'
            }`;



    $('#estimatedTotal')
        .textContent =

            fmt(
                totals.estimatedTotal
            );



    $('#adjustmentTotal')
        .textContent =

            fmt(
                totals.adjustment
            );



    $('#totalHours')
        .textContent =

            totals.hourItems.length

                ?

                `${totals.totalHours} HC`

                :

                '—';



    /*
     * Sin cargos horarios.
     */

    if (
        !totals.hourItems.length
    ) {

        $('#bandBreakdown')
            .innerHTML =
                '';


        $('#bandsStatus')
            .textContent =

                'No hay cargos con equivalencia explícita en horas cátedra. El total consolidado coincide con la suma individual.';


        return;

    }



    /*
     * Antigüedades diferentes.
     */

    if (
        !totals.sameHourAge
    ) {

        $('#bandBreakdown')
            .innerHTML =
                '';


        $('#bandsStatus')
            .textContent =

                'Los cargos horarios tienen antigüedades distintas. Para evitar un cálculo arbitrario no se aplicó el ajuste automático por tramos.';


        return;

    }



    /*
     * Falta información de tramos.
     */

    if (
        !totals.band
    ) {

        $('#bandBreakdown')
            .innerHTML =
                '';


        $('#bandsStatus')
            .textContent =

                'No fue posible aplicar los tramos horarios porque faltan las filas de referencia en la grilla seleccionada.';


        return;

    }



    const band =

        totals.band;



    $('#bandsStatus')
        .textContent =

            'La carga horaria se consolida utilizando las tres filas de horas cátedra definidas en la grilla del período.';



    $('#bandBreakdown')
        .innerHTML = `


            <div class="band-row">

                <span>

                    ${
                        RULES.hourBands
                            ?.regular
                            ?.label

                        ||

                        'Horas 1 a 30'
                    }

                </span>


                <b>

                    ${band.regularHours}
                    HC ×
                    ${fmt(band.regularRate)}

                </b>


                <strong>
                    ${fmt(band.regularAmount)}
                </strong>

            </div>



            <div class="band-row">

                <span>

                    ${
                        RULES.hourBands
                            ?.over30
                            ?.label

                        ||

                        'Horas 31 a 40'
                    }

                </span>


                <b>

                    ${band.over30Hours}
                    HC ×
                    ${fmt(band.over30Rate)}

                </b>


                <strong>
                    ${fmt(band.over30Amount)}
                </strong>

            </div>



            <div class="band-row">

                <span>

                    ${
                        RULES.hourBands
                            ?.over40
                            ?.label

                        ||

                        'Horas superiores a 40'
                    }

                </span>


                <b>

                    ${band.over40Hours}
                    HC ×
                    ${fmt(band.over40Rate)}

                </b>


                <strong>
                    ${fmt(band.over40Amount)}
                </strong>

            </div>


        `;

}



/* ============================================================
   RENDER PERSONAL
   ============================================================ */

function renderPersonalSection(
    totals,
    extras
) {

    const hasValid =

        totals.validItems.length > 0;



    $('#personalSummary')
        ?.classList
        .toggle(
            'hidden',
            !hasValid
        );



    $('#presentismOptions')
        ?.classList
        .toggle(

            'hidden',

            !$('#presentismEnabled')
                ?.checked

        );



    $('#unionInfo')
        ?.classList
        .toggle(

            'hidden',

            !$('#ametAffiliate')
                ?.checked

        );



    /*
     * Información de la regla sindical.
     */

    if (
        $('#unionRuleStatus')
    ) {

        const rule =

            RULES.unionFee

            ||

            {};


        $('#unionRuleStatus')
            .textContent =

                rule.enabled

                    ?

                    'La cuota sindical se calcula automáticamente según la regla configurada.'

                    :

                    (
                        rule.note

                        ||

                        'La fórmula automática de cuota sindical todavía no está configurada.'
                    );

    }



    if (
        !hasValid
    ) {

        return;

    }



    $('#presentismFullNet')
        .textContent =

            fmt(
                extras.presentism.netFull
            );



    $('#presentismAdjustment')
        .textContent =

            extras.presentism.loss > 0

                ?

                `-${fmt(extras.presentism.loss)}`

                :

                fmt(0);



    $('#familyTotal')
        .textContent =

            fmt(
                extras.family.total
            );



    $('#familyStatus')
        .textContent =

            extras.family.status;



    $('#unionDeduction')
        .textContent =

            extras.union.amount > 0

                ?

                `-${fmt(extras.union.amount)}`

                :

                fmt(0);



    $('#unionStatus')
        .textContent =

            extras.union.status;



    $('#finalAccountTotal')
        .textContent =

            fmt(
                extras.finalTotal
            );

}



/* ============================================================
   COMPARACIÓN CON CUENTA SUELDO
   ============================================================ */

function renderBankComparison(
    totals,
    extras
) {

    const hasValid =

        totals.validItems.length > 0;



    const showBank =

        RULES.interface
            ?.showBankComparison

        !==

        false;



    $('#bankComparison')
        ?.classList
        .toggle(

            'hidden',

            !hasValid
            ||
            !showBank

        );



    if (
        !hasValid
        ||
        !showBank
    ) {

        $('#bankDifferenceBox')
            ?.classList
            .add(
                'hidden'
            );


        return;

    }



    $('#bankExpected')
        .textContent =

            fmt(
                extras.finalTotal
            );



    updateBankDifference(
        extras.finalTotal
    );

}



/* ============================================================
   DIFERENCIA BANCARIA
   ============================================================ */

function updateBankDifference(
    expectedTotal
) {

    const input =

        $('#bankAmount');


    const box =

        $('#bankDifferenceBox');


    if (
        !input
        ||
        !box
    ) {

        return;

    }



    const raw =

        input.value.trim();



    if (
        !raw
    ) {

        box
            .classList
            .add(
                'hidden'
            );


        return;

    }



    const received =

        Number(raw);



    if (
        !Number.isFinite(
            received
        )
    ) {

        box
            .classList
            .add(
                'hidden'
            );


        return;

    }



    const difference =

        received

        -

        expectedTotal;



    box
        .classList
        .remove(

            'hidden',

            'difference-ok',

            'difference-positive',

            'difference-negative'

        );



    $('#bankDifference')
        .textContent =

            fmt(

                Math.abs(
                    difference
                )

            );



    if (
        Math.abs(
            difference
        ) < 1
    ) {

        $('#bankStatus')
            .textContent =

                'El monto acreditado coincide con la estimación.';


        box
            .classList
            .add(
                'difference-ok'
            );

    }



    else if (
        difference > 0
    ) {

        $('#bankStatus')
            .textContent =

                `Recibiste ${fmt(difference)} más que la estimación.`;


        box
            .classList
            .add(
                'difference-positive'
            );

    }



    else {

        $('#bankStatus')
            .textContent =

                `Recibiste ${fmt(Math.abs(difference))} menos que la estimación.`;


        box
            .classList
            .add(
                'difference-negative'
            );

    }

}



/* ============================================================
   GRÁFICO DE ANTIGÜEDAD
   ============================================================ */

function renderBars(row) {

    const bars =

        $('#bars');


    if (!bars) {
        return;
    }



    if (
        !row
        ||
        isBandOnly(row)
    ) {

        bars.innerHTML = `

            <div class="bars-empty">

                Seleccioná un cargo
                para ver la comparación
                por antigüedad.

            </div>

        `;


        return;

    }



    const values =

        A.map(
            (age) =>

                pocketValue(
                    row,
                    age
                )
        );



    const max =

        Math.max(
            ...values,
            1
        );



    bars.innerHTML =

        values

            .map(
                (
                    currentValue,
                    index
                ) => `


                    <div class="bar">


                        <i
                            style="
                                height:
                                ${
                                    Math.max(

                                        3,

                                        (
                                            currentValue
                                            /
                                            max
                                        )

                                        *

                                        190

                                    )
                                }px
                            "
                        ></i>


                        <b>
                            ${A[index]} a.
                        </b>


                        <small>
                            ${compact(currentValue)}
                        </small>


                    </div>


                `
            )

            .join('');

}



/* ============================================================
   ENCABEZADO DE TABLA
   ============================================================ */

function renderTableHeader() {

    const thead =

        $('#thead');


    if (!thead) {
        return;
    }



    thead.innerHTML = `


        <tr>

            <th>
                Código · Cargo
            </th>


            <th>
                Básico
            </th>


            <th>
                Suma fija
            </th>


            <th>
                Sueldo c/ jerarquía
            </th>


            ${
                A
                    .map(
                        (age) => `

                            <th>
                                ${age} años
                            </th>

                        `
                    )

                    .join('')
            }

        </tr>

    `;

}



/* ============================================================
   TABLA COMPLETA
   ============================================================ */

function renderTable(
    query = ''
) {

    const tbody =

        $('#tbody');


    if (!tbody) {
        return;
    }



    const normalized =

        query

            .toLowerCase()

            .normalize(
                'NFD'
            )

            .replace(
                /[\u0300-\u036f]/g,
                ''
            );



    const rows =

        D.filter(
            (row) => {


                const text =

                    `${row.code} ${row.name}`

                        .toLowerCase()

                        .normalize(
                            'NFD'
                        )

                        .replace(
                            /[\u0300-\u036f]/g,
                            ''
                        );


                return text.includes(
                    normalized
                );

            }
        );



    tbody.innerHTML =

        rows

            .map(
                (row) => `


                    <tr>


                        <td>

                            <b>
                                ${row.code}
                                ·
                                ${row.name}
                            </b>

                        </td>


                        <td>
                            ${fmt(row.basic)}
                        </td>


                        <td>
                            ${fmt(row.fixed)}
                        </td>


                        <td>
                            ${fmt(row.pocket?.[0] || 0)}
                        </td>


                        ${
                            A
                                .map(
                                    (age) => `

                                        <td>

                                            ${
                                                fmt(
                                                    pocketValue(
                                                        row,
                                                        age
                                                    )
                                                )
                                            }

                                        </td>

                                    `
                                )

                                .join('')
                        }


                    </tr>


                `
            )

            .join('');

}



/* ============================================================
   DESCUENTOS
   ============================================================ */

function renderDiscounts() {

    const container =

        $('#discountsList');


    if (!container) {
        return;
    }



    const discounts =

        Object.values(
            RULES.discounts || {}
        );



    if (
        !discounts.length
    ) {

        container.innerHTML = `

            <p>
                No hay descuentos configurados.
            </p>

        `;


        return;

    }



    container.innerHTML =

        discounts

            .map(
                (discount) => `

                    <p>

                        <b>
                            ${discount.label}
                        </b>

                        :

                        ${
                            (
                                Number(
                                    discount.rate || 0
                                )

                                *

                                100
                            )

                            .toLocaleString(
                                'es-AR'
                            )
                        }
                        %

                    </p>

                `
            )

            .join('');

}



/* ============================================================
   GARANTÍAS
   ============================================================ */

function renderGuarantees() {

    const container =

        $('#guaranteesList');


    if (!container) {
        return;
    }



    const guarantees =

        Object.values(

            currentPeriod
                ?.guarantees

            ||

            {}

        );



    if (
        !guarantees.length
    ) {

        container.innerHTML = `

            <p>
                No hay garantías cargadas para este período.
            </p>

        `;


        return;

    }



    container.innerHTML =

        guarantees

            .map(
                (guarantee) => {


                    const note =

                        guarantee.note

                            ?

                            ` · ${guarantee.note}`

                            :

                            '';


                    return `

                        <p>

                            <b>
                                ${guarantee.label}
                            </b>

                            :

                            ${fmt(guarantee.amount)}

                            ${note}

                        </p>

                    `;

                }
            )

            .join('');

}



/* ============================================================
   FUENTE DE LA GRILLA
   ============================================================ */

function renderSource() {

    const container =

        $('#sourceInfo');


    if (!container) {
        return;
    }



    const source =

        currentPeriod
            ?.source

        ||

        {};



    container.innerHTML = `


        <p>

            <b>
                ${
                    source.title
                    ||
                    'Grilla salarial'
                }
            </b>

        </p>


        ${
            source.organization

                ?

                `<p>${source.organization}</p>`

                :

                ''
        }


        ${
            source.regional

                ?

                `<p>${source.regional}</p>`

                :

                ''
        }


        ${
            source.address

                ?

                `<p>${source.address}</p>`

                :

                ''
        }


        ${
            source.website

                ?

                `

                    <p>

                        <a
                            href="${source.website}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Sitio oficial
                        </a>

                    </p>

                `

                :

                ''
        }


        ${
            source.email

                ?

                `<p>${source.email}</p>`

                :

                ''
        }


    `;

}



/* ============================================================
   INFORMACIÓN DEL PERÍODO
   ============================================================ */

function renderPeriodMetadata() {

    if (
        !currentPeriod
    ) {

        return;

    }



    const label =

        currentPeriod.label

        ||

        currentPeriodId

        ||

        '—';



    const indexValue =

        Number(
            currentPeriod.indexValue || 0
        );



    document.title =

        `AMET Regional 1 · Calculadora Salarial · ${label}`;



    if (
        $('#heroPeriodTag')
    ) {

        $('#heroPeriodTag')
            .textContent =

                `AMET REGIONAL 1 · CABA · ${label.toUpperCase()}`;

    }



    if (
        $('#heroPeriod')
    ) {

        $('#heroPeriod')
            .textContent =
                label;

    }



    if (
        $('#heroIndexValue')
    ) {

        $('#heroIndexValue')
            .textContent =

                fmt(
                    indexValue
                );

    }



    if (
        $('#selectedPeriodLabel')
    ) {

        $('#selectedPeriodLabel')
            .textContent =
                label;

    }



    if (
        $('#periodStatus')
    ) {

        $('#periodStatus')
            .textContent =

                `${D.length} filas salariales cargadas.`;

    }



    if (
        $('#gridPeriodDescription')
    ) {

        $('#gridPeriodDescription')
            .textContent =

                `Período: ${label}`;

    }



    if (
        $('#methodPeriod')
    ) {

        $('#methodPeriod')
            .textContent =

                `Período seleccionado: ${label}.`;

    }



    const familyPeriod =

        RULES.familyAllowances
            ?.period

        ||

        '—';



    if (
        $('#familyPeriodLabel')
    ) {

        $('#familyPeriodLabel')
            .textContent =

                `Período de asignaciones: ${familyPeriod}`;

    }



    renderDiscounts();

    renderGuarantees();

    renderSource();

}



/* ============================================================
   RENDER GENERAL
   ============================================================ */

function render() {

    renderItems();



    $('#emptyState')
        ?.classList
        .toggle(

            'hidden',

            items.length > 0

        );



    $('#addArea')
        ?.classList
        .toggle(

            'hidden',

            items.length === 0

        );



    const totals =

        calculateTotals();



    const extras =

        calculateFinalAccountTotal(
            totals
        );



    renderTotals(
        totals
    );



    renderPersonalSection(
        totals,
        extras
    );



    renderBankComparison(
        totals,
        extras
    );



    renderBars(

        lastSelectedCargoCode

            ?

            getRowByCode(
                lastSelectedCargoCode
            )

            :

            null

    );

}



/* ============================================================
   CAMBIO DE PERÍODO
   ============================================================ */

function resetCalculatorForPeriodChange() {

    items =
        [];


    seq =
        0;


    lastSelectedCargoCode =
        null;


    /*
     * El monto bancario pertenece
     * al período anterior.
     */

    if (
        $('#bankAmount')
    ) {

        $('#bankAmount')
            .value =
                '';

    }

}



/* ============================================================
   LIMPIAR TODO
   ============================================================ */

function resetAll() {

    items =
        [];


    seq =
        0;


    lastSelectedCargoCode =
        null;



    if (
        $('#presentismEnabled')
    ) {

        $('#presentismEnabled')
            .checked =

                RULES.interface
                    ?.presentismDefault

                !==

                false;

    }



    if (
        $('#presentismLevel')
    ) {

        $('#presentismLevel')
            .value =
                '1';

    }



    if (
        $('#ametAffiliate')
    ) {

        $('#ametAffiliate')
            .checked =

                Boolean(

                    RULES.interface
                        ?.unionDefault

                );

    }



    if (
        $('#familyIncome')
    ) {

        $('#familyIncome')
            .value =
                '';

    }



    if (
        $('#childrenCount')
    ) {

        $('#childrenCount')
            .value =
                '0';

    }



    if (
        $('#disabledChildrenCount')
    ) {

        $('#disabledChildrenCount')
            .value =
                '0';

    }



    if (
        $('#spouseAllowance')
    ) {

        $('#spouseAllowance')
            .checked =
                false;

    }



    if (
        $('#bankAmount')
    ) {

        $('#bankAmount')
            .value =
                '';

    }



    render();

}



/* ============================================================
   DESCARGAR CSV
   ============================================================ */

function downloadCSV() {

    if (
        !currentPeriod
    ) {

        return;

    }



    const lines = [


        [

            'Período',

            'Código',

            'Cargo',

            'Índice',

            'Valor índice',

            'Básico',

            'Suma fija',

            'Jerarquía',

            'Sueldo c/ jerarquía',

            ...A.map(
                (age) =>
                    `${age} años`
            )

        ],



        ...D.map(
            (row) => [

                currentPeriod.label,

                row.code,

                row.name,

                row.index,

                row.indexValue,

                row.basic,

                row.fixed,

                row.hierarchy,

                row.pocket?.[0] || 0,

                ...A.map(
                    (age) =>

                        pocketValue(
                            row,
                            age
                        )
                )

            ]
        )

    ];



    const csv =

        '\ufeff'

        +

        lines

            .map(
                (row) =>

                    row

                        .map(
                            (value) =>

                                `"${String(value).replaceAll(
                                    '"',
                                    '""'
                                )}"`

                        )

                        .join(';')

            )

            .join('\n');



    const blob =

        new Blob(
            [csv],
            {
                type:
                    'text/csv;charset=utf-8'
            }
        );



    const url =

        URL.createObjectURL(
            blob
        );



    const link =

        document.createElement(
            'a'
        );



    link.href =
        url;



    link.download =

        `grilla-AMET-${currentPeriodId}.csv`;



    document.body
        .appendChild(
            link
        );



    link.click();



    link.remove();



    URL.revokeObjectURL(
        url
    );

}



/* ============================================================
   SELECTOR DE PERÍODOS
   ============================================================ */

function populatePeriodSelect() {

    const select =

        $('#periodSelect');


    if (!select) {
        return;
    }



    if (
        !PERIODS.length
    ) {

        select.innerHTML = `

            <option value="">
                No hay períodos configurados
            </option>

        `;


        select.disabled =
            true;


        return;

    }



    select.innerHTML =

        PERIODS

            .map(
                (period) => `

                    <option value="${period.id}">
                        ${period.label}
                    </option>

                `
            )

            .join('');



    select.disabled =
        false;

}



/* ============================================================
   ESTADO DE CARGA
   ============================================================ */

function setLoadingState(
    isLoading,
    message = ''
) {

    const select =

        $('#periodSelect');


    const firstAdd =

        $('#firstAdd');


    const addItemButton =

        $('#addItem');



    if (select) {

        select.disabled =
            isLoading;

    }



    if (firstAdd) {

        firstAdd.disabled =
            isLoading;

    }



    if (addItemButton) {

        addItemButton.disabled =
            isLoading;

    }



    if (
        $('#periodStatus')
        &&
        message
    ) {

        $('#periodStatus')
            .textContent =
                message;

    }

}



/* ============================================================
   CARGADOR DE ARCHIVOS MENSUALES
   ============================================================ */

function loadScript(
    src,
    periodId
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {


            /*
             * Ya está cargado.
             */

            if (
                window.AMET_PERIOD_DATA
                    ?.[periodId]
            ) {

                resolve();

                return;

            }



            /*
             * Script ya insertado.
             */

            const existing =

                document.querySelector(
                    `script[data-period-id="${periodId}"]`
                );



            if (
                existing
            ) {

                existing.addEventListener(

                    'load',

                    () =>
                        resolve(),

                    {
                        once:
                            true
                    }

                );


                existing.addEventListener(

                    'error',

                    () =>
                        reject(

                            new Error(
                                `No se pudo cargar ${src}`
                            )

                        ),

                    {
                        once:
                            true
                    }

                );


                return;

            }



            /*
             * Crear script dinámicamente.
             */

            const script =

                document.createElement(
                    'script'
                );


            script.src =
                src;


            script.async =
                true;


            script.dataset.periodId =
                periodId;



            script.onload =

                () =>
                    resolve();



            script.onerror =

                () =>
                    reject(

                        new Error(
                            `No se pudo cargar ${src}`
                        )

                    );



            document.head
                .appendChild(
                    script
                );

        }
    );

}



/* ============================================================
   CARGAR PERÍODO
   ============================================================ */

async function loadPeriod(
    periodId
) {

    const descriptor =

        getPeriodDescriptor(
            periodId
        );



    if (
        !descriptor
    ) {

        if (
            $('#periodStatus')
        ) {

            $('#periodStatus')
                .textContent =

                    'Período no encontrado.';

        }


        return;

    }



    setLoadingState(

        true,

        `Cargando ${descriptor.label}...`

    );



    try {


        /*
         * Crear contenedor global
         * si todavía no existe.
         */

        window.AMET_PERIOD_DATA =

            window.AMET_PERIOD_DATA

            ||

            {};



        /*
         * Cargar archivo mensual.
         */

        await loadScript(

            descriptor.file,

            periodId

        );



        const periodData =

            window.AMET_PERIOD_DATA
                ?.[periodId];



        if (
            !periodData
        ) {

            throw new Error(

                `El archivo ${descriptor.file} se cargó, pero no registró AMET_PERIOD_DATA["${periodId}"].`

            );

        }



        /*
         * Activar período.
         */

        currentPeriodId =
            periodId;


        currentPeriod =
            periodData;



        D =

            Array.isArray(
                periodData.salaryData
            )

                ?

                periodData.salaryData

                :

                [];



        A =

            Array.isArray(
                periodData.ages
            )

                ?

                periodData.ages

                :

                [];



        /*
         * Al cambiar de período
         * borramos los cargos anteriores.
         */

        resetCalculatorForPeriodChange();



        if (
            $('#periodSelect')
        ) {

            $('#periodSelect')
                .value =
                    periodId;

        }



        if (
            $('#search')
        ) {

            $('#search')
                .value =
                    '';

        }



        /*
         * Actualizar pantalla.
         */

        renderPeriodMetadata();


        renderTableHeader();


        renderTable();


        render();



        setLoadingState(

            false,

            `${D.length} filas salariales cargadas.`

        );

    }



    catch (
        error
    ) {

        console.error(
            error
        );


        currentPeriod =
            null;


        D =
            [];


        A =
            [];



        if (
            $('#periodStatus')
        ) {

            $('#periodStatus')
                .textContent =

                    `Error al cargar el período: ${error.message}`;

        }



        setLoadingState(
            false
        );

    }

}



/* ============================================================
   EVENTOS
   ============================================================ */

function attachEvents() {


    /* ========================================================
       AGREGAR CARGO
       ======================================================== */

    $('#firstAdd')
        ?.addEventListener(
            'click',
            addItem
        );



    $('#addItem')
        ?.addEventListener(
            'click',
            addItem
        );



    /* ========================================================
       LIMPIAR
       ======================================================== */

    $('#clearAll')
        ?.addEventListener(
            'click',
            resetAll
        );



    /* ========================================================
       CSV
       ======================================================== */

    $('#csv')
        ?.addEventListener(
            'click',
            downloadCSV
        );



    /* ========================================================
       CAMBIAR PERÍODO
       ======================================================== */

    $('#periodSelect')
        ?.addEventListener(
            'change',
            (event) => {


                const periodId =

                    event.target.value;


                if (
                    periodId
                ) {

                    loadPeriod(
                        periodId
                    );

                }

            }
        );



    /* ========================================================
       ELIMINAR CARGO
       ======================================================== */

    $('#items')
        ?.addEventListener(
            'click',
            (event) => {


                const button =

                    event.target.closest(
                        '[data-action="remove"]'
                    );


                if (
                    !button
                ) {

                    return;

                }


                removeItem(

                    Number(
                        button.dataset.id
                    )

                );

            }
        );



    /* ========================================================
       CAMBIOS EN CARGOS
       ======================================================== */

    $('#items')
        ?.addEventListener(
            'change',
            (event) => {


                const target =

                    event.target;


                const action =

                    target.dataset.action;


                const id =

                    Number(
                        target.dataset.id
                    );



                if (
                    !action
                    ||
                    !id
                ) {

                    return;

                }



                if (
                    action ===
                    'cargo'
                ) {

                    updateItem(

                        id,

                        'cargoCode',

                        target.value

                    );

                }



                if (
                    action ===
                    'age'
                ) {

                    updateItem(

                        id,

                        'age',

                        target.value

                    );

                }



                if (
                    action ===
                    'qty'
                ) {

                    updateItem(

                        id,

                        'qty',

                        target.value

                    );

                }

            }
        );



    /* ========================================================
       DATOS PERSONALES
       ======================================================== */

    [

        '#presentismEnabled',

        '#presentismLevel',

        '#ametAffiliate',

        '#familyIncome',

        '#childrenCount',

        '#disabledChildrenCount',

        '#spouseAllowance'

    ]

    .forEach(
        (selector) => {


            const element =

                $(selector);


            if (
                !element
            ) {

                return;

            }



            element.addEventListener(
                'input',
                render
            );


            element.addEventListener(
                'change',
                render
            );

        }
    );



    /* ========================================================
       CUENTA SUELDO
       ======================================================== */

    $('#bankAmount')
        ?.addEventListener(
            'input',
            () => {


                const totals =

                    calculateTotals();


                const extras =

                    calculateFinalAccountTotal(
                        totals
                    );


                updateBankDifference(
                    extras.finalTotal
                );

            }
        );



    /* ========================================================
       BUSCADOR
       ======================================================== */

    $('#search')
        ?.addEventListener(
            'input',
            (event) => {


                renderTable(
                    event.target.value
                );

            }
        );

}



/* ============================================================
   INICIO
   ============================================================ */

async function init() {


    /*
     * Presentismo.
     */

    populatePresentismOptions();



    /*
     * Selector de períodos.
     */

    populatePeriodSelect();



    /*
     * Eventos.
     */

    attachEvents();



    /*
     * Descuentos generales.
     */

    renderDiscounts();



    /*
     * Período de asignaciones.
     */

    if (
        $('#familyPeriodLabel')
    ) {

        $('#familyPeriodLabel')
            .textContent =

                `Período de asignaciones: ${RULES.familyAllowances?.period || '—'}`;

    }



    /*
     * Comprobar que exista
     * al menos una grilla.
     */

    if (
        !PERIODS.length
    ) {

        if (
            $('#periodStatus')
        ) {

            $('#periodStatus')
                .textContent =

                    'No hay períodos configurados en data/periods.js.';

        }


        return;

    }



    /*
     * Elegir período inicial.
     */

    const initialPeriod =

        getPeriodDescriptor(
            DEFAULT_PERIOD
        )

            ?

            DEFAULT_PERIOD

            :

            PERIODS[0].id;



    /*
     * Cargar período.
     */

    await loadPeriod(
        initialPeriod
    );

}



/* ============================================================
   EJECUCIÓN
   ============================================================ */

if (
    document.readyState ===
    'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        init
    );

}

else {

    init();

}