// ============================================================
// DATOS GENERALES
// ============================================================

const D = window.SALARY_DATA;

const A = window.AGES;

const META = window.SALARY_META;

const HOURS = window.HOURS_EQUIVALENT;

const BANDS = window.HOUR_BANDS;


// ============================================================
// FUNCIONES GENERALES
// ============================================================

const $ = (selector) =>
    document.querySelector(selector);


const fmt = (number) =>
    new Intl.NumberFormat(
        'es-AR',
        {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 2
        }
    ).format(number || 0);


const compact = (number) =>
    new Intl.NumberFormat(
        'es-AR',
        {
            notation: 'compact',
            maximumFractionDigits: 1
        }
    ).format(number || 0);


// ============================================================
// ESTADO DE LA CALCULADORA
// ============================================================

let items = [];

let seq = 0;

let last = null;


// ============================================================
// BUSCAR UNA FILA POR CÓDIGO
// ============================================================

function getRowByCode(code) {

    return D.find(
        (row) => row.code === code
    );

}


// ============================================================
// POSICIÓN DEL VALOR DE ANTIGÜEDAD
// ============================================================
//
// pocket[0] NO es bolsillo.
//
// pocket[0] corresponde a:
// Sueldo con jerarquía.
//
// Por eso:
// 1 año  -> pocket[1]
// 4 años -> pocket[2]
// etc.
//
// ============================================================

function pocketIndex(age) {

    const position =
        A.indexOf(
            Number(age)
        );


    return position === -1
        ? -1
        : position + 1;

}


// ============================================================
// OBTENER SUELDO DE BOLSILLO
// ============================================================

function pocketValue(
    row,
    age
) {

    if (!row) {
        return 0;
    }


    const index =
        pocketIndex(age);


    if (index < 1) {
        return 0;
    }


    return Number(
        row.pocket[index] || 0
    );

}


// ============================================================
// IDENTIFICAR FILAS INTERNAS DE TOPES
// ============================================================

function isBandOnly(row) {

    return (
        row &&
        BANDS.bandOnlyCodes.includes(
            row.code
        )
    );

}


// ============================================================
// IDENTIFICAR HORA CÁTEDRA VARIABLE
// ============================================================

function isVariableHour(row) {

    return (
        row &&
        row.code === BANDS.regular
    );

}


// ============================================================
// IDENTIFICAR CARGOS CON EQUIVALENCIA HORARIA
// ============================================================

function isHourBased(row) {

    return (
        row &&
        Object.prototype.hasOwnProperty.call(
            HOURS,
            row.code
        )
    );

}


// ============================================================
// HORAS EQUIVALENTES DE UN CARGO
// ============================================================

function equivalentHours(item) {

    if (!valid(item)) {
        return 0;
    }


    const row =
        D[
            Number(item.cargo)
        ];


    if (!isHourBased(row)) {
        return 0;
    }


    // Hora cátedra común:
    // la cantidad la ingresa el usuario.

    if (isVariableHour(row)) {

        return Math.max(
            1,
            Number(item.qty) || 1
        );

    }


    // Profesor TP / TC:
    // toma las horas fijas del cargo.

    return (
        HOURS[row.code] || 0
    );

}


// ============================================================
// OPCIONES DE CARGOS
// ============================================================

function cargoOptions(
    selected = ''
) {

    const options =
        D
            .map(
                (row, index) => ({
                    row,
                    index
                })
            )

            // HS >30 y HS >40
            // se usan internamente.
            .filter(
                ({ row }) =>
                    !isBandOnly(row)
            )

            .map(
                ({ row, index }) => {

                    const isSelected =
                        String(index) ===
                        String(selected)
                            ? 'selected'
                            : '';


                    return `
                        <option
                            value="${index}"
                            ${isSelected}
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


// ============================================================
// OPCIONES DE ANTIGÜEDAD
// ============================================================

function ageOptions(
    selected = ''
) {

    return (

        `
            <option value="">
                — Seleccionar antigüedad —
            </option>
        `

        +

        A
            .map(
                (age) => {

                    const isSelected =
                        String(age) ===
                        String(selected)
                            ? 'selected'
                            : '';


                    const percent =
                        META.agePercent[age];


                    const label =
                        `${age} año${
                            age === 1
                                ? ''
                                : 's'
                        } · ${percent}%`;


                    return `
                        <option
                            value="${age}"
                            ${isSelected}
                        >
                            ${label}
                        </option>
                    `;

                }
            )

            .join('')

    );

}


// ============================================================
// AGREGAR CARGO
// ============================================================

function add() {

    items.push(
        {
            id: ++seq,

            cargo: '',

            age: '',

            qty: 1
        }
    );


    render();


    setTimeout(
        () => {

            const select =
                document.querySelector(
                    `[data-id="${seq}"] select`
                );


            if (select) {
                select.focus();
            }

        },
        10
    );

}


// ============================================================
// ELIMINAR CARGO
// ============================================================

function remove(id) {

    items =
        items.filter(
            (item) =>
                item.id !== id
        );


    render();

}


// ============================================================
// ACTUALIZAR CARGO
// ============================================================

function update(
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


    item[field] = value;


    if (field === 'cargo') {

        item.age = '';

        item.qty = 1;


        last =
            value === ''
                ? last
                : Number(value);

    }


    render();

}


// ============================================================
// VALIDAR CARGO
// ============================================================

function valid(item) {

    return (
        item.cargo !== '' &&
        item.age !== ''
    );

}


// ============================================================
// VALOR INDIVIDUAL DEL CARGO
// ============================================================

function value(item) {

    if (!valid(item)) {
        return 0;
    }


    const row =
        D[
            Number(item.cargo)
        ];


    const unitPocket =
        pocketValue(
            row,
            item.age
        );


    // Hora cátedra suelta.
    // Se multiplica por la cantidad.

    if (isVariableHour(row)) {

        return (
            unitPocket *
            Math.max(
                1,
                Number(item.qty) || 1
            )
        );

    }


    // Los demás cargos
    // ya tienen su valor completo.

    return unitPocket;

}


// ============================================================
// CÁLCULO DE TRAMOS HORARIOS
// ============================================================
//
// La grilla AMET tiene:
//
// 5099  = HS CATEDRA
// 5099B = HS CATEDRA >30
// 5099C = HS CATEDRA >40
//
// Se calcula:
//
// 1 a 30 HC  -> tarifa normal
// 31 a 40 HC -> tarifa >30
// 41+ HC     -> tarifa >40
//
// ============================================================

function hourBandCalculation(
    totalHours,
    age
) {

    const regularRow =
        getRowByCode(
            BANDS.regular
        );


    const over30Row =
        getRowByCode(
            BANDS.over30
        );


    const over40Row =
        getRowByCode(
            BANDS.over40
        );


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


    // ========================================================
    // TRAMO 1
    // ========================================================

    const regularHours =
        Math.min(
            totalHours,
            30
        );


    // ========================================================
    // TRAMO 2
    // ========================================================

    const over30Hours =
        Math.min(
            Math.max(
                totalHours - 30,
                0
            ),
            10
        );


    // ========================================================
    // TRAMO 3
    // ========================================================

    const over40Hours =
        Math.max(
            totalHours - 40,
            0
        );


    // ========================================================
    // IMPORTES
    // ========================================================

    const regularAmount =
        regularHours *
        regularRate;


    const over30Amount =
        over30Hours *
        over30Rate;


    const over40Amount =
        over40Hours *
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
            regularAmount +
            over30Amount +
            over40Amount

    };

}


// ============================================================
// CALCULAR TODOS LOS TOTALES
// ============================================================

function calculateTotals() {

    const validItems =
        items.filter(valid);


    // ========================================================
    // SUMA SIMPLE
    // ========================================================

    const directTotal =
        validItems.reduce(
            (sum, item) =>
                sum + value(item),
            0
        );


    // ========================================================
    // CARGOS CON EQUIVALENCIA HORARIA
    // ========================================================

    const hourItems =
        validItems.filter(
            (item) => {

                const row =
                    D[
                        Number(item.cargo)
                    ];


                return isHourBased(row);

            }
        );


    // ========================================================
    // CARGOS SIN EQUIVALENCIA HORARIA
    // ========================================================

    const nonHourItems =
        validItems.filter(
            (item) => {

                const row =
                    D[
                        Number(item.cargo)
                    ];


                return !isHourBased(row);

            }
        );


    // ========================================================
    // TOTAL DE CARGOS NO HORARIOS
    // ========================================================

    const nonHourTotal =
        nonHourItems.reduce(
            (sum, item) =>
                sum + value(item),
            0
        );


    // ========================================================
    // SUMA SIMPLE DE CARGOS HORARIOS
    // ========================================================

    const directHourTotal =
        hourItems.reduce(
            (sum, item) =>
                sum + value(item),
            0
        );


    // ========================================================
    // COMPROBAR ANTIGÜEDAD
    // ========================================================
    //
    // Para consolidar correctamente las HC,
    // todas deben usar la misma antigüedad.
    //
    // ========================================================

    const ageSet =
        [
            ...new Set(
                hourItems.map(
                    (item) =>
                        Number(item.age)
                )
            )
        ];


    const sameHourAge =
        ageSet.length <= 1;


    // ========================================================
    // TOTAL DE HORAS
    // ========================================================

    const totalHours =
        hourItems.reduce(
            (sum, item) =>
                sum +
                equivalentHours(item),
            0
        );


    let band = null;

    let estimatedTotal =
        directTotal;

    let adjustment = 0;

    let canApplyBands = false;


    // ========================================================
    // APLICAR TRAMOS
    // ========================================================

    if (
        hourItems.length &&
        sameHourAge
    ) {

        band =
            hourBandCalculation(
                totalHours,
                ageSet[0]
            );


        estimatedTotal =
            nonHourTotal +
            band.total;


        adjustment =
            estimatedTotal -
            directTotal;


        canApplyBands = true;

    }


    return {

        validItems,

        directTotal,

        hourItems,

        nonHourItems,

        nonHourTotal,

        directHourTotal,

        totalHours,

        sameHourAge,

        band,

        estimatedTotal,

        adjustment,

        canApplyBands

    };

}


// ============================================================
// RENDER PRINCIPAL
// ============================================================

function render() {


    // ========================================================
    // CARGOS
    // ========================================================

    $('#items').innerHTML =
        items
            .map(
                (item, number) => {

                    const row =
                        item.cargo !== ''
                            ? D[
                                Number(item.cargo)
                            ]
                            : null;


                    const variableHour =
                        isVariableHour(row);


                    const hourBased =
                        isHourBased(row);


                    const ok =
                        valid(item);


                    const hours =
                        ok && hourBased
                            ? equivalentHours(item)
                            : 0;


                    return `

                        <div
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
                                    onclick="remove(${item.id})"
                                >
                                    Eliminar ×
                                </button>

                            </div>



                            <div class="line-body">


                                <div class="line-grid">


                                    <label>

                                        Cargo / función


                                        <select
                                            onchange="
                                                update(
                                                    ${item.id},
                                                    'cargo',
                                                    this.value
                                                )
                                            "
                                        >

                                            ${
                                                cargoOptions(
                                                    item.cargo
                                                )
                                            }

                                        </select>

                                    </label>



                                    <label>

                                        Antigüedad


                                        <select

                                            ${
                                                row
                                                    ? ''
                                                    : 'disabled'
                                            }

                                            onchange="
                                                update(
                                                    ${item.id},
                                                    'age',
                                                    this.value
                                                )
                                            "
                                        >

                                            ${
                                                ageOptions(
                                                    item.age
                                                )
                                            }

                                        </select>

                                    </label>



                                    <label
                                        style="
                                            opacity:
                                            ${
                                                variableHour
                                                    ? 1
                                                    : 0.48
                                            }
                                        "
                                    >


                                        ${
                                            variableHour
                                                ? 'Cantidad de horas'
                                                : 'Cantidad'
                                        }


                                        <input

                                            type="number"

                                            min="1"

                                            max="120"

                                            value="${item.qty}"

                                            ${
                                                variableHour
                                                    ? ''
                                                    : 'disabled'
                                            }

                                            onchange="
                                                update(
                                                    ${item.id},
                                                    'qty',
                                                    this.value
                                                )
                                            "

                                        >


                                        <small>

                                            ${
                                                variableHour

                                                    ?

                                                    'Ingresá la cantidad total de horas cátedra de esta línea.'

                                                    :

                                                    hourBased

                                                        ?

                                                        `${HOURS[row.code]} HC equivalentes por cargo.`

                                                        :

                                                        'Una unidad por cargo.'
                                            }

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
                                                        value(item)
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

                                                `
                                                    Código ${row.code}
                                                    · Índice ${row.index.toLocaleString('es-AR')}
                                                    · Básico ${fmt(row.basic)}

                                                    ${
                                                        hours
                                                            ?
                                                            ` · ${hours} HC equivalentes`
                                                            :
                                                            ''
                                                    }
                                                `

                                                :

                                                'Elegí primero un cargo'
                                        }

                                    </div>


                                </div>


                            </div>


                        </div>

                    `;

                }
            )

            .join('');


    // ========================================================
    // ESTADO VACÍO
    // ========================================================

    $('#emptyState')
        .classList
        .toggle(
            'hidden',
            items.length > 0
        );


    $('#addArea')
        .classList
        .toggle(
            'hidden',
            items.length === 0
        );


    // ========================================================
    // TOTALES
    // ========================================================

    const totals =
        calculateTotals();


    renderTotals(
        totals
    );


    renderBankComparison(
        totals
    );


    bars(
        last === null
            ? null
            : D[last]
    );

}


// ============================================================
// MOSTRAR TOTALES
// ============================================================

function renderTotals(
    totals
) {

    const hasValid =
        totals.validItems.length > 0;


    $('#grand')
        .classList
        .toggle(
            'hidden',
            !hasValid
        );


    $('#settlement')
        .classList
        .toggle(
            'hidden',
            !hasValid
        );


    if (!hasValid) {
        return;
    }


    // ========================================================
    // SUMA SIMPLE
    // ========================================================

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


    // ========================================================
    // TOTAL ESTIMADO
    // ========================================================

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


    // ========================================================
    // SIN CARGOS HORARIOS
    // ========================================================

    if (
        !totals.hourItems.length
    ) {

        $('#bandsStatus')
            .textContent =

                'No hay cargos expresados en horas cátedra. El total estimado coincide con la suma de la grilla.';


        $('#bandBreakdown')
            .innerHTML = '';


        return;

    }


    // ========================================================
    // ANTIGÜEDADES DISTINTAS
    // ========================================================

    if (
        !totals.sameHourAge
    ) {

        $('#bandsStatus')
            .textContent =

                'Los cargos horarios tienen antigüedades distintas. Para evitar un cálculo arbitrario, no se aplicó el ajuste automático por tramos.';


        $('#bandBreakdown')
            .innerHTML = '';


        return;

    }


    // ========================================================
    // INFORMACIÓN
    // ========================================================

    $('#bandsStatus')
        .textContent =

            'Para los cargos expresados en horas, el motor consolida la carga total de la persona y aplica las tres filas diferenciadas publicadas en la grilla AMET.';


    const band =
        totals.band;


    // ========================================================
    // DETALLE DE TRAMOS
    // ========================================================

    $('#bandBreakdown')
        .innerHTML = `


            <div class="band-row">

                <span>
                    Horas 1 a 30
                </span>

                <b>
                    ${band.regularHours} HC
                    ×
                    ${fmt(band.regularRate)}
                </b>

                <strong>
                    ${fmt(band.regularAmount)}
                </strong>

            </div>



            <div class="band-row">

                <span>
                    Horas 31 a 40
                </span>

                <b>
                    ${band.over30Hours} HC
                    ×
                    ${fmt(band.over30Rate)}
                </b>

                <strong>
                    ${fmt(band.over30Amount)}
                </strong>

            </div>



            <div class="band-row">

                <span>
                    Horas superiores a 40
                </span>

                <b>
                    ${band.over40Hours} HC
                    ×
                    ${fmt(band.over40Rate)}
                </b>

                <strong>
                    ${fmt(band.over40Amount)}
                </strong>

            </div>


        `;

}


// ============================================================
// MOSTRAR COMPARACIÓN CON CUENTA SUELDO
// ============================================================

function renderBankComparison(
    totals
) {

    const hasValid =
        totals.validItems.length > 0;


    $('#bankComparison')
        .classList
        .toggle(
            'hidden',
            !hasValid
        );


    if (!hasValid) {

        $('#bankDifferenceBox')
            .classList
            .add(
                'hidden'
            );


        return;

    }


    $('#bankExpected')
        .textContent =
            fmt(
                totals.estimatedTotal
            );


    updateBankDifference(
        totals.estimatedTotal
    );

}


// ============================================================
// COMPARAR CON EL MONTO ACREDITADO
// ============================================================

function updateBankDifference(
    expectedTotal
) {

    const input =
        $('#bankAmount');


    const box =
        $('#bankDifferenceBox');


    const differenceElement =
        $('#bankDifference');


    const statusElement =
        $('#bankStatus');


    if (
        !input ||
        !box
    ) {
        return;
    }


    const received =
        Number(
            input.value
        );


    // ========================================================
    // CAMPO VACÍO
    // ========================================================

    if (
        !input.value.trim() ||
        Number.isNaN(received)
    ) {

        box
            .classList
            .add(
                'hidden'
            );


        return;

    }


    box
        .classList
        .remove(
            'hidden'
        );


    box
        .classList
        .remove(
            'difference-ok',
            'difference-positive',
            'difference-negative'
        );


    const difference =
        received -
        expectedTotal;


    differenceElement
        .textContent =
            fmt(
                Math.abs(
                    difference
                )
            );


    // ========================================================
    // COINCIDE
    // ========================================================

    if (
        Math.abs(difference) < 1
    ) {

        statusElement
            .textContent =

                'El monto acreditado coincide con la estimación.';


        box
            .classList
            .add(
                'difference-ok'
            );


        return;

    }


    // ========================================================
    // RECIBIÓ MÁS
    // ========================================================

    if (
        difference > 0
    ) {

        statusElement
            .textContent =

                `Recibiste ${fmt(difference)} más que la estimación.`;


        box
            .classList
            .add(
                'difference-positive'
            );


        return;

    }


    // ========================================================
    // RECIBIÓ MENOS
    // ========================================================

    statusElement
        .textContent =

            `Recibiste ${fmt(Math.abs(difference))} menos que la estimación.`;


    box
        .classList
        .add(
            'difference-negative'
        );

}


// ============================================================
// GRÁFICO POR ANTIGÜEDAD
// ============================================================

function bars(row) {

    if (!row) {

        $('#bars')
            .innerHTML = `

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
            ...values
        );


    $('#bars')
        .innerHTML =
            values
                .map(
                    (value, index) => `

                        <div class="bar">

                            <i
                                style="
                                    height:
                                    ${
                                        Math.max(
                                            3,
                                            (
                                                value /
                                                max
                                            ) * 190
                                        )
                                    }px
                                "
                            ></i>


                            <b>
                                ${A[index]} a.
                            </b>


                            <small>
                                ${compact(value)}
                            </small>

                        </div>

                    `
                )

                .join('');

}


// ============================================================
// TABLA COMPLETA
// ============================================================

function renderTable(
    query = ''
) {

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
            (row) =>

                `${row.code} ${row.name}`

                    .toLowerCase()

                    .normalize(
                        'NFD'
                    )

                    .replace(
                        /[\u0300-\u036f]/g,
                        ''
                    )

                    .includes(
                        normalized
                    )

        );


    $('#tbody')
        .innerHTML =
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
                                ${fmt(row.pocket[0])}
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


// ============================================================
// ENCABEZADO DE TABLA
// ============================================================

$('#thead')
    .innerHTML = `

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


// ============================================================
// BOTÓN PRIMER CARGO
// ============================================================

$('#firstAdd')
    .onclick =
        add;


// ============================================================
// BOTÓN AGREGAR CARGO
// ============================================================

$('#addItem')
    .onclick =
        add;


// ============================================================
// LIMPIAR CALCULADORA
// ============================================================

$('#clearAll')
    .onclick =
        () => {

            items = [];

            last = null;


            $('#bankAmount')
                .value = '';


            render();

        };


// ============================================================
// COMPARACIÓN CON BANCO
// ============================================================

$('#bankAmount')
    .addEventListener(
        'input',
        () => {

            const totals =
                calculateTotals();


            if (
                totals.validItems.length
            ) {

                updateBankDifference(
                    totals.estimatedTotal
                );

            }

        }
    );


// ============================================================
// BUSCADOR DE GRILLA
// ============================================================

$('#search')
    .addEventListener(
        'input',
        (event) => {

            renderTable(
                event.target.value
            );

        }
    );


// ============================================================
// DESCARGAR CSV
// ============================================================

$('#csv')
    .onclick =
        () => {


            const lines = [

                [
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

                        row.code,

                        row.name,

                        row.index,

                        row.indexValue,

                        row.basic,

                        row.fixed,

                        row.hierarchy,

                        row.pocket[0],

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


            const link =
                document.createElement(
                    'a'
                );


            link.href =
                URL.createObjectURL(

                    new Blob(
                        [csv],
                        {
                            type:
                                'text/csv;charset=utf-8'
                        }
                    )

                );


            link.download =
                'grilla-AMET-agosto-2026.csv';


            link.click();


            URL.revokeObjectURL(
                link.href
            );

        };


// ============================================================
// INICIO
// ============================================================

renderTable();

render();