// ============================================================
// DATOS GENERALES
// ============================================================

const D = window.SALARY_DATA;
const A = window.AGES;


// Selector rápido de elementos HTML
const $ = (selector) => document.querySelector(selector);


// Formateador de moneda argentina
const fmt = (numero) =>
    new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 2
    }).format(numero);


// ============================================================
// VARIABLES DE LA CALCULADORA
// ============================================================

// Lista de cargos agregados por el usuario
let items = [];

// Número secuencial para identificar cada cargo
let seq = 0;

// Último cargo seleccionado.
// Se utiliza para el gráfico comparador.
let last = null;


// ============================================================
// FUNCIONES AUXILIARES
// ============================================================


// ------------------------------------------------------------
// Detectar si el cargo corresponde a horas cátedra
// ------------------------------------------------------------

const isHour = (cargo) =>
    cargo.name.includes("HS CATEDRA");


// ------------------------------------------------------------
// Generar opciones del selector de cargos
// ------------------------------------------------------------

function co(selected = "") {

    return `
        <option value="">
            — Seleccionar cargo —
        </option>
    ` +
    D.map((cargo, index) => {

        const codigo = cargo.code.replace(/[A-Z]$/, "");

        const seleccionado =
            String(index) === String(selected)
                ? "selected"
                : "";

        return `
            <option
                value="${index}"
                ${seleccionado}
            >
                ${codigo} · ${cargo.name}
            </option>
        `;

    }).join("");
}


// ------------------------------------------------------------
// Generar opciones del selector de antigüedad
// ------------------------------------------------------------

function ao(selected = "") {

    return `
        <option value="">
            — Seleccionar antigüedad —
        </option>
    ` +
    A.map((antiguedad) => {

        const seleccionado =
            String(antiguedad) === String(selected)
                ? "selected"
                : "";

        let texto;

        if (antiguedad === 0) {

            texto = "Sin antigüedad";

        } else {

            texto =
                antiguedad +
                " año" +
                (antiguedad === 1 ? "" : "s");
        }

        return `
            <option
                value="${antiguedad}"
                ${seleccionado}
            >
                ${texto}
            </option>
        `;

    }).join("");
}


// ============================================================
// AGREGAR CARGO
// ============================================================

function add() {

    items.push({

        id: ++seq,

        cargo: "",

        age: "",

        qty: 1

    });


    render();


    // Colocar automáticamente el cursor
    // sobre el selector del nuevo cargo.

    setTimeout(() => {

        document
            .querySelector(
                `[data-id="${seq}"] select`
            )
            .focus();

    }, 10);
}


// ============================================================
// ELIMINAR CARGO
// ============================================================

function remove(id) {

    items = items.filter(
        (item) => item.id !== id
    );

    render();
}


// ============================================================
// ACTUALIZAR DATOS DE UN CARGO
// ============================================================

function update(id, field, value) {

    const item = items.find(
        (item) => item.id === id
    );


    item[field] = value;


    // Si cambia el cargo,
    // se reinicia la antigüedad.

    if (field === "cargo") {

        item.age = "";


        // Guardamos el último cargo
        // para mostrarlo en el comparador.

        last =
            value === ""
                ? last
                : +value;
    }


    render();
}


// ============================================================
// COMPROBAR SI UN CARGO ESTÁ COMPLETO
// ============================================================

function valid(item) {

    return (
        item.cargo !== "" &&
        item.age !== ""
    );
}


// ============================================================
// CALCULAR VALOR DE UN CARGO
// ============================================================

function value(item) {

    // Si falta cargo o antigüedad,
    // no se realiza ningún cálculo.

    if (!valid(item)) {
        return 0;
    }


    const cargo = D[+item.cargo];


    // --------------------------------------------------------
    // Cantidad
    // --------------------------------------------------------
    //
    // Para horas cátedra:
    // se utiliza la cantidad ingresada.
    //
    // Para cargos:
    // siempre se considera una unidad.
    // --------------------------------------------------------

    const cantidad =
        isHour(cargo)
            ? Math.max(
                1,
                +item.qty || 1
            )
            : 1;


    // Buscar posición de la antigüedad
    // dentro del arreglo de antigüedades.

    const indiceAntiguedad =
        A.indexOf(+item.age);


    // Obtener sueldo de bolsillo
    // correspondiente.

    return (
        cargo.pocket[indiceAntiguedad] *
        cantidad
    );
}


// ============================================================
// RENDERIZAR CALCULADORA
// ============================================================

function render() {

    // --------------------------------------------------------
    // GENERAR TODOS LOS CARGOS
    // --------------------------------------------------------

    $("#items").innerHTML =
        items.map((item, numero) => {

            // Cargo seleccionado
            const cargo =
                item.cargo !== ""
                    ? D[+item.cargo]
                    : null;


            // ¿Es hora cátedra?
            const esHora =
                cargo &&
                isHour(cargo);


            // ¿Está completo?
            const completo =
                valid(item);


            // Código del cargo
            const codigo =
                cargo
                    ? cargo.code.replace(
                        /[A-Z]$/,
                        ""
                    )
                    : "";


            // Cantidad
            const cantidad =
                esHora
                    ? Math.max(
                        1,
                        +item.qty || 1
                    )
                    : 1;


            // Básico
            const basico =
                cargo
                    ? cargo.basic * cantidad
                    : 0;


            // ------------------------------------------------
            // HTML DEL CARGO
            // ------------------------------------------------

            return `

                <div
                    class="line-item"
                    data-id="${item.id}"
                >

                    <!-- CABECERA -->

                    <div class="line-head">

                        <b>
                            Cargo ${numero + 1}
                        </b>

                        <button
                            class="remove"
                            onclick="remove(${item.id})"
                        >
                            Eliminar ×
                        </button>

                    </div>


                    <!-- CUERPO -->

                    <div class="line-body">


                        <!-- SELECTORES -->

                        <div class="line-grid">


                            <!-- CARGO -->

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

                                    ${co(item.cargo)}

                                </select>

                            </label>


                            <!-- ANTIGÜEDAD -->

                            <label>

                                Antigüedad

                                <select
                                    ${cargo ? "" : "disabled"}

                                    onchange="
                                        update(
                                            ${item.id},
                                            'age',
                                            this.value
                                        )
                                    "
                                >

                                    ${ao(item.age)}

                                </select>

                            </label>


                            <!-- CANTIDAD -->

                            <label
                                style="
                                    opacity:
                                    ${esHora ? 1 : 0.48}
                                "
                            >

                                Cantidad
                                ${esHora ? " de horas" : ""}


                                <input
                                    type="number"

                                    min="1"
                                    max="60"

                                    value="${item.qty}"

                                    ${esHora ? "" : "disabled"}

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
                                        esHora
                                            ? "Cantidad de horas."
                                            : "Una unidad por cargo."
                                    }

                                </small>

                            </label>

                        </div>


                        <!-- RESULTADO DEL CARGO -->

                        <div class="line-result">

                            <div>

                                <small>

                                    ${
                                        completo
                                            ? "BOLSILLO DE REFERENCIA"
                                            : "COMPLETÁ CARGO Y ANTIGÜEDAD"
                                    }

                                </small>


                                <strong>

                                    ${
                                        completo
                                            ? fmt(value(item))
                                            : "—"
                                    }

                                </strong>

                            </div>


                            <!-- INFORMACIÓN ADICIONAL -->

                            <div class="line-meta">

                                ${
                                    cargo

                                        ? `
                                            Código ${codigo}
                                            ·
                                            Índice ${cargo.index.toLocaleString("es-AR")}
                                            ·
                                            Básico ${fmt(basico)}
                                        `

                                        : `
                                            Elegí primero un cargo
                                        `
                                }

                            </div>

                        </div>

                    </div>

                </div>
            `;

        }).join("");


    // ========================================================
    // ESTADO INICIAL
    // ========================================================

    $("#emptyState")
        .classList
        .toggle(
            "hidden",
            items.length > 0
        );


    // ========================================================
    // BOTÓN AGREGAR OTRO CARGO
    // ========================================================

    $("#addArea")
        .classList
        .toggle(
            "hidden",
            items.length === 0
        );


    // ========================================================
    // CARGOS COMPLETOS
    // ========================================================

    const cargosCompletos =
        items.filter(valid);


    // ========================================================
    // TOTAL
    // ========================================================

    const total =
        cargosCompletos.reduce(
            (suma, item) =>
                suma + value(item),
            0
        );


    // Mostrar u ocultar total

    $("#grand")
        .classList
        .toggle(
            "hidden",
            !cargosCompletos.length
        );


    // Mostrar importe

    $("#grandTotal").textContent =
        fmt(total);


    // Descripción

    $("#grandDesc").textContent =
        cargosCompletos.length

            ? `
                ${cargosCompletos.length}
                ${
                    cargosCompletos.length === 1
                        ? "cargo seleccionado"
                        : "cargos seleccionados"
                }
            `

            : "";


    // ========================================================
    // ACTUALIZAR GRÁFICO
    // ========================================================

    bars(
        last === null
            ? null
            : D[last]
    );
}


// ============================================================
// BOTONES DE LA CALCULADORA
// ============================================================


// Agregar primer cargo

$("#firstAdd").onclick = add;


// Agregar otro cargo

$("#addItem").onclick = add;


// Limpiar toda la liquidación

$("#clearAll").onclick = () => {

    items = [];

    last = null;

    render();
};


// ============================================================
// GRÁFICO COMPARADOR DE ANTIGÜEDAD
// ============================================================

function bars(cargo) {

    // --------------------------------------------------------
    // Si todavía no hay cargo seleccionado
    // --------------------------------------------------------

    if (!cargo) {

        $("#bars").innerHTML = `

            <div
                style="
                    color: var(--muted);
                    padding: 60px 0;
                "
            >

                Seleccioná un cargo para ver
                la comparación por antigüedad.

            </div>
        `;

        return;
    }


    // --------------------------------------------------------
    // Valor máximo
    // --------------------------------------------------------

    const maximo =
        Math.max(...cargo.pocket);


    // --------------------------------------------------------
    // Generar barras
    // --------------------------------------------------------

    $("#bars").innerHTML =
        cargo.pocket
            .map((valor, index) => {

                const altura =
                    Math.max(
                        3,
                        valor / maximo * 190
                    );


                const antiguedad =
                    A[index] === 0
                        ? "0"
                        : A[index] + " a.";


                const valorCompacto =
                    new Intl.NumberFormat(
                        "es-AR",
                        {
                            notation: "compact",
                            maximumFractionDigits: 1
                        }
                    ).format(valor);


                return `

                    <div class="bar">

                        <i
                            style="
                                height: ${altura}px
                            "
                        ></i>

                        <b>
                            ${antiguedad}
                        </b>

                        <small>
                            ${valorCompacto}
                        </small>

                    </div>
                `;

            })
            .join("");
}


// ============================================================
// GRILLA SALARIAL
// ============================================================


// ------------------------------------------------------------
// ENCABEZADO DE LA TABLA
// ------------------------------------------------------------

$("#thead").innerHTML = `

    <tr>

        <th>
            Código · Cargo
        </th>

        ${
            A.map((antiguedad) => {

                return `

                    <th>

                        ${
                            antiguedad === 0
                                ? "Sin antig."
                                : antiguedad + " años"
                        }

                    </th>
                `;

            }).join("")
        }

    </tr>
`;


// ============================================================
// GENERAR TABLA
// ============================================================

function table(busqueda = "") {

    // --------------------------------------------------------
    // Normalizar búsqueda
    // --------------------------------------------------------

    const consulta =
        busqueda
            .toLowerCase()
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            );


    // --------------------------------------------------------
    // Filtrar cargos
    // --------------------------------------------------------

    const resultados =
        D.filter((cargo) => {

            const texto =
                (
                    cargo.code +
                    " " +
                    cargo.name
                )
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(
                        /[\u0300-\u036f]/g,
                        ""
                    );


            return texto.includes(
                consulta
            );
        });


    // --------------------------------------------------------
    // Generar filas
    // --------------------------------------------------------

    $("#tbody").innerHTML =
        resultados
            .map((cargo) => {

                const codigo =
                    cargo.code.replace(
                        /[A-Z]$/,
                        ""
                    );


                const valores =
                    cargo.pocket
                        .map(fmt)
                        .map((valor) => {

                            return `
                                <td>
                                    ${valor}
                                </td>
                            `;

                        })
                        .join("");


                return `

                    <tr>

                        <td>

                            <b>
                                ${codigo}
                                ·
                                ${cargo.name}
                            </b>

                        </td>

                        ${valores}

                    </tr>
                `;

            })
            .join("");
}


// ============================================================
// BUSCADOR
// ============================================================

$("#search")
    .addEventListener(
        "input",
        (event) => {

            table(
                event.target.value
            );
        }
    );


// ============================================================
// DESCARGAR GRILLA EN CSV
// ============================================================

$("#csv").onclick = () => {

    // --------------------------------------------------------
    // Crear matriz de datos
    // --------------------------------------------------------

    const lineas = [

        [
            "Código",
            "Cargo",

            ...A.map(
                (antiguedad) =>
                    antiguedad + " años"
            )
        ],


        ...D.map((cargo) => [

            cargo.code,

            cargo.name,

            ...cargo.pocket

        ])

    ];


    // --------------------------------------------------------
    // Convertir a CSV
    // --------------------------------------------------------

    const csv =
        "\ufeff" +

        lineas
            .map((fila) => {

                return fila
                    .map((valor) => {

                        return `"${String(valor)
                            .replaceAll(
                                '"',
                                '""'
                            )}"`;

                    })
                    .join(";");

            })
            .join("\n");


    // --------------------------------------------------------
    // Crear archivo
    // --------------------------------------------------------

    const enlace =
        document.createElement("a");


    enlace.href =
        URL.createObjectURL(

            new Blob(
                [csv],
                {
                    type:
                        "text/csv;charset=utf-8"
                }
            )

        );


    enlace.download =
        "grilla-AMET-agosto-2026.csv";


    // --------------------------------------------------------
    // Descargar
    // --------------------------------------------------------

    enlace.click();
};


// ============================================================
// INICIALIZACIÓN
// ============================================================


// Generar tabla salarial

table();


// Inicializar calculadora vacía

render();