/* ============================================================
   PAINEL DE GESTÃO ACADÊMICA
   Gráficos gerenciais e detalhamento por clique
   ============================================================ */

(function () {
    "use strict";

    const graficos = {};

    // ---------------------------------------------------------
    // Paleta
    // ---------------------------------------------------------

    const CORES = {
        roxoEscuro: "#302e42",
        roxo: "#585570",
        roxoMedio: "#817d9c",
        roxoClaro: "#d8d5e5",
        roxoFundo: "rgba(88, 85, 112, 0.12)",

        verdeEscuro: "#155631",
        verde: "#23844c",
        verdeMedio: "#2c9b5c",
        verdeClaro: "#bfe3cd",
        verdeFundo: "rgba(35, 132, 76, 0.12)",

        amarelo: "#b7790d",
        vermelho: "#c13d3d",
        azul: "#32658a",
        cinza: "#858592",

        texto: "#4f4f5c",
        textoEscuro: "#25252d",
        grade: "rgba(105, 105, 119, 0.15)",
        branco: "#ffffff"
    };

    const PALETA_DISCIPLINAS = [
        "#c13d3d",
        "#c8554f",
        "#ce6b61",
        "#b7790d",
        "#c4892a",
        "#585570",
        "#696580",
        "#23844c",
        "#2c9b5c",
        "#32658a"
    ];

    // ---------------------------------------------------------
    // Utilidades
    // ---------------------------------------------------------

    function chartDisponivel() {
        return typeof window.Chart !== "undefined";
    }

    function obterCanvas(id) {
        return document.getElementById(id);
    }

    function numero(valor, padrao = 0) {
        const convertido = Number(valor);

        return Number.isFinite(convertido)
            ? convertido
            : padrao;
    }

    function formatarNumero(
        valor,
        casas = 1
    ) {
        return numero(valor).toLocaleString(
            "pt-BR",
            {
                minimumFractionDigits: casas,
                maximumFractionDigits: casas
            }
        );
    }

    function normalizarTexto(valor) {
        return String(valor ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function destruirGrafico(id) {
        if (graficos[id]) {
            graficos[id].destroy();
            delete graficos[id];
        }
    }

    function destruirTodos() {
        Object.keys(graficos).forEach(
            destruirGrafico
        );
    }

    function prepararGrafico(id) {
        destruirGrafico(id);

        const canvas = obterCanvas(id);

        if (!canvas || !chartDisponivel()) {
            return null;
        }

        return canvas.getContext("2d");
    }

    function ordenarPorAno(dados) {
        return [...dados].sort(
            (a, b) =>
                numero(a.ano) -
                numero(b.ano)
        );
    }

    function limitarRotulo(
        valor,
        limite = 34
    ) {
        const conteudo = String(valor ?? "");

        if (conteudo.length <= limite) {
            return conteudo;
        }

        return `${conteudo.slice(
            0,
            limite - 1
        )}…`;
    }

    function configuracaoFonte() {
        return {
            family: "Inter",
            size: 11
        };
    }

    function registrarErroChart() {
        if (!chartDisponivel()) {
            console.error(
                "Chart.js não foi carregado. " +
                "Confira o endereço CDN no index.html."
            );
        }
    }

    // ---------------------------------------------------------
    // Comunicação com app.js
    // ---------------------------------------------------------

    function emitirFiltroGrafico({
        tipo,
        valor,
        rotulo,
        pagina
    }) {
        window.dispatchEvent(
            new CustomEvent(
                "dashboard:chart-filter",
                {
                    detail: {
                        tipo,
                        valor,
                        rotulo,
                        pagina
                    }
                }
            )
        );
    }

    function configurarCursorInterativo(
        evento,
        elementos,
        grafico
    ) {
        grafico.canvas.style.cursor =
            elementos.length
                ? "pointer"
                : "default";
    }

    // ---------------------------------------------------------
    // Configurações compartilhadas
    // ---------------------------------------------------------

    function pluginsComuns() {
        return {
            legend: {
                position: "bottom",

                labels: {
                    color: CORES.texto,
                    usePointStyle: true,
                    pointStyle: "circle",
                    boxWidth: 8,
                    boxHeight: 8,
                    padding: 17,
                    font: configuracaoFonte()
                }
            },

            tooltip: {
                backgroundColor: CORES.roxoEscuro,
                titleColor: CORES.branco,
                bodyColor: "#eeeeF2",
                borderColor:
                    "rgba(255, 255, 255, 0.12)",
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                displayColors: true,

                titleFont: {
                    family: "Inter",
                    size: 12,
                    weight: "600"
                },

                bodyFont: {
                    family: "Inter",
                    size: 11
                }
            }
        };
    }

    function opcoesCartesianas() {
        return {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                mode: "index",
                intersect: false
            },

            animation: {
                duration: 450
            },

            plugins: pluginsComuns(),

            scales: {
                x: {
                    grid: {
                        display: false
                    },

                    border: {
                        color: CORES.grade
                    },

                    ticks: {
                        color: CORES.texto,
                        font: configuracaoFonte()
                    }
                },

                y: {
                    beginAtZero: true,

                    grid: {
                        color: CORES.grade,
                        drawTicks: false
                    },

                    border: {
                        display: false
                    },

                    ticks: {
                        color: CORES.texto,
                        padding: 8,
                        font: configuracaoFonte()
                    }
                }
            }
        };
    }

    function opcoesCirculares() {
        return {
            responsive: true,
            maintainAspectRatio: false,

            animation: {
                duration: 450
            },

            plugins: pluginsComuns()
        };
    }

    // ---------------------------------------------------------
    // Evolução acadêmica
    // ---------------------------------------------------------

    function renderizarEvolucao(dados = []) {
        const id = "chartEvolucao";
        const contexto = prepararGrafico(id);

        if (!contexto) {
            registrarErroChart();
            return;
        }

        const registros = ordenarPorAno(dados);

        const labels = registros.map(
            (item) => item.ano
        );

        const medias = registros.map(
            (item) => numero(item.media_geral)
        );

        const frequencias = registros.map(
            (item) =>
                numero(item.frequencia_media)
        );

        const opcoes = opcoesCartesianas();

        opcoes.scales.y = {
            beginAtZero: true,
            max: 10,

            grid: {
                color: CORES.grade,
                drawTicks: false
            },

            border: {
                display: false
            },

            ticks: {
                color: CORES.texto,
                padding: 8,
                stepSize: 2,
                font: configuracaoFonte()
            },

            title: {
                display: true,
                text: "Média",
                color: CORES.texto,
                font: configuracaoFonte()
            }
        };

        opcoes.scales.yFrequencia = {
            position: "right",
            beginAtZero: true,
            max: 100,

            grid: {
                drawOnChartArea: false
            },

            border: {
                display: false
            },

            ticks: {
                color: CORES.texto,
                padding: 8,
                callback: (valor) => `${valor}%`,
                font: configuracaoFonte()
            },

            title: {
                display: true,
                text: "Frequência",
                color: CORES.texto,
                font: configuracaoFonte()
            }
        };

        opcoes.plugins.tooltip.callbacks = {
            label(context) {
                if (
                    context.dataset.yAxisID ===
                    "yFrequencia"
                ) {
                    return (
                        ` ${context.dataset.label}: ` +
                        `${formatarNumero(
                            context.raw,
                            1
                        )}%`
                    );
                }

                return (
                    ` ${context.dataset.label}: ` +
                    formatarNumero(
                        context.raw,
                        2
                    )
                );
            },

            afterBody() {
                return "Clique para filtrar este ano.";
            }
        };

        opcoes.onHover =
            configurarCursorInterativo;

        opcoes.onClick = (
            evento,
            elementos
        ) => {
            if (!elementos.length) {
                return;
            }

            const indice =
                elementos[0].index;

            const ano = labels[indice];

            emitirFiltroGrafico({
                tipo: "ano",
                valor: String(ano),
                rotulo: `Ano ${ano}`,
                pagina: "visao-geral"
            });
        };

        graficos[id] = new Chart(contexto, {
            type: "line",

            data: {
                labels,

                datasets: [
                    {
                        label: "Média geral",
                        data: medias,
                        yAxisID: "y",

                        borderColor: CORES.roxo,
                        backgroundColor:
                            CORES.roxoFundo,

                        borderWidth: 2.5,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor:
                            CORES.branco,
                        pointBorderColor:
                            CORES.roxo,
                        pointBorderWidth: 2,

                        tension: 0.32,
                        fill: true
                    },

                    {
                        label: "Frequência média",
                        data: frequencias,
                        yAxisID: "yFrequencia",

                        borderColor: CORES.verde,
                        backgroundColor:
                            CORES.verdeFundo,

                        borderWidth: 2.5,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor:
                            CORES.branco,
                        pointBorderColor:
                            CORES.verde,
                        pointBorderWidth: 2,

                        tension: 0.32,
                        fill: false
                    }
                ]
            },

            options: opcoes
        });
    }

    // ---------------------------------------------------------
    // Situação dos vínculos
    // ---------------------------------------------------------

    function adicionarVinculo(
        contagem,
        vinculo,
        quantidade
    ) {
        if (vinculo === "ATIVO") {
            contagem["Ativos"] += quantidade;
            return;
        }

        if (vinculo === "FORMANDO") {
            contagem["Formandos"] += quantidade;
            return;
        }

        if (
            vinculo === "CONCLUINTE RECENTE"
        ) {
            contagem[
                "Concluintes recentes"
            ] += quantidade;

            return;
        }

        if (vinculo === "EGRESSO") {
            contagem["Egressos"] += quantidade;
            return;
        }

        if (
            vinculo === "INATIVO" ||
            vinculo === "INATIVO PROVAVEL"
        ) {
            contagem["Inativos"] += quantidade;
            return;
        }

        if (
            vinculo === "EVADIDO PROVAVEL"
        ) {
            contagem[
                "Evasão provável"
            ] += quantidade;

            return;
        }

        contagem[
            "Sem classificação"
        ] += quantidade;
    }

    function renderizarVinculos(
        alunos = [],
        indicadoresVinculo = []
    ) {
        const id = "chartVinculos";
        const contexto = prepararGrafico(id);

        if (!contexto) {
            registrarErroChart();
            return;
        }

        const contagem = {
            "Ativos": 0,
            "Formandos": 0,
            "Concluintes recentes": 0,
            "Egressos": 0,
            "Inativos": 0,
            "Evasão provável": 0,
            "Sem classificação": 0
        };

        /*
         * Quando o dashboard recebeu uma lista de alunos
         * já filtrada, a contagem deve refletir essa lista.
         */
        if (
            Array.isArray(alunos) &&
            alunos.length
        ) {
            alunos.forEach((aluno) => {
                adicionarVinculo(
                    contagem,
                    normalizarTexto(
                        aluno.situacao_vinculo
                    ),
                    1
                );
            });
        } else if (
            Array.isArray(indicadoresVinculo)
        ) {
            indicadoresVinculo.forEach((item) => {
                adicionarVinculo(
                    contagem,
                    normalizarTexto(
                        item.situacao_vinculo
                    ),
                    numero(
                        item.alunos_distintos
                    )
                );
            });
        }

        const entradas =
            Object.entries(contagem)
                .filter(
                    ([, quantidade]) =>
                        quantidade > 0
                );

        const labels = entradas.map(
            ([rotulo]) => rotulo
        );

        const valores = entradas.map(
            ([, quantidade]) => quantidade
        );

        const mapaCores = {
            "Ativos": CORES.verde,
            "Formandos": CORES.verdeMedio,
            "Concluintes recentes":
                CORES.roxoMedio,
            "Egressos": CORES.roxo,
            "Inativos": CORES.amarelo,
            "Evasão provável": CORES.vermelho,
            "Sem classificação": CORES.cinza
        };

        const mapaFiltros = {
            "Ativos": {
                valor: "ATIVO",
                pagina: "alunos"
            },

            "Formandos": {
                valor: "FORMANDO",
                pagina: "alunos"
            },

            "Concluintes recentes": {
                valor: "CONCLUINTE_RECENTE",
                pagina: "alunos"
            },

            "Egressos": {
                valor: "EGRESSO",
                pagina: "alunos"
            },

            "Inativos": {
                valor: "INATIVOS",
                pagina: "monitoramento"
            },

            "Evasão provável": {
                valor: "EVADIDO_PROVAVEL",
                pagina: "monitoramento"
            },

            "Sem classificação": {
                valor: "",
                pagina: "alunos"
            }
        };

        const opcoes = opcoesCirculares();

        opcoes.cutout = "62%";

        opcoes.plugins.tooltip.callbacks = {
            label(context) {
                const total =
                    context.dataset.data.reduce(
                        (soma, valor) =>
                            soma + valor,
                        0
                    );

                const quantidade =
                    numero(context.raw);

                const percentual = total
                    ? quantidade / total * 100
                    : 0;

                return (
                    ` ${context.label}: ` +
                    `${quantidade} ` +
                    `(${formatarNumero(
                        percentual,
                        1
                    )}%)`
                );
            },

            afterBody() {
                return "Clique para visualizar os alunos.";
            }
        };

        opcoes.onHover =
            configurarCursorInterativo;

        opcoes.onClick = (
            evento,
            elementos
        ) => {
            if (!elementos.length) {
                return;
            }

            const indice =
                elementos[0].index;

            const rotulo = labels[indice];
            const configuracao =
                mapaFiltros[rotulo];

            if (!configuracao) {
                return;
            }

            emitirFiltroGrafico({
                tipo: "vinculo",
                valor: configuracao.valor,
                rotulo,
                pagina: configuracao.pagina
            });
        };

        graficos[id] = new Chart(contexto, {
            type: "doughnut",

            data: {
                labels,

                datasets: [{
                    data: valores,

                    backgroundColor: labels.map(
                        (rotulo) =>
                            mapaCores[rotulo] ||
                            CORES.cinza
                    ),

                    borderColor: CORES.branco,
                    borderWidth: 3,
                    hoverOffset: 8
                }]
            },

            options: opcoes
        });
    }

    // ---------------------------------------------------------
    // Distribuição de desempenho
    // ---------------------------------------------------------

    function renderizarDesempenho(
        alunos = []
    ) {
        const id = "chartDesempenho";
        const contexto = prepararGrafico(id);

        if (!contexto) {
            registrarErroChart();
            return;
        }

        const faixas = {
            "Destaque": 0,
            "Regular": 0,
            "Atenção": 0,
            "Crítico": 0,
            "Sem dados": 0
        };

        alunos.forEach((aluno) => {
            const classificacao =
                normalizarTexto(
                    aluno.classificacao ||
                    aluno.classificacao_historica
                );

            if (
                classificacao.includes(
                    "DESTAQUE"
                ) ||
                classificacao.includes(
                    "EXCELENTE"
                )
            ) {
                faixas["Destaque"] += 1;
                return;
            }

            if (
                classificacao.includes(
                    "CRITICO"
                ) ||
                classificacao.includes(
                    "INSUFICIENTE"
                )
            ) {
                faixas["Crítico"] += 1;
                return;
            }

            if (
                classificacao.includes(
                    "ATENCAO"
                )
            ) {
                faixas["Atenção"] += 1;
                return;
            }

            if (
                classificacao.includes(
                    "REGULAR"
                )
            ) {
                faixas["Regular"] += 1;
                return;
            }

            const media = Number(
                aluno.media_ano_referencia ??
                aluno.media_historica
            );

            if (!Number.isFinite(media)) {
                faixas["Sem dados"] += 1;
            } else if (media >= 8.5) {
                faixas["Destaque"] += 1;
            } else if (media >= 7) {
                faixas["Regular"] += 1;
            } else if (media >= 6) {
                faixas["Atenção"] += 1;
            } else {
                faixas["Crítico"] += 1;
            }
        });

        const labels =
            Object.keys(faixas);

        const valores =
            Object.values(faixas);

        const mapaFiltros = {
            "Destaque": "DESTAQUE",
            "Regular": "REGULAR",
            "Atenção": "ATENCAO",
            "Crítico": "CRITICO",
            "Sem dados": "SEM_DADOS"
        };

        const opcoes = opcoesCirculares();

        opcoes.cutout = "60%";

        opcoes.plugins.tooltip.callbacks = {
            label(context) {
                const total =
                    context.dataset.data.reduce(
                        (soma, valor) =>
                            soma + valor,
                        0
                    );

                const quantidade =
                    numero(context.raw);

                const percentual = total
                    ? quantidade / total * 100
                    : 0;

                return (
                    ` ${context.label}: ` +
                    `${quantidade} ` +
                    `(${formatarNumero(
                        percentual,
                        1
                    )}%)`
                );
            },

            afterBody() {
                return "Clique para visualizar os alunos.";
            }
        };

        opcoes.onHover =
            configurarCursorInterativo;

        opcoes.onClick = (
            evento,
            elementos
        ) => {
            if (!elementos.length) {
                return;
            }

            const indice =
                elementos[0].index;

            const rotulo = labels[indice];

            emitirFiltroGrafico({
                tipo: "desempenho",
                valor: mapaFiltros[rotulo],
                rotulo,
                pagina:
                    rotulo === "Crítico" ||
                    rotulo === "Atenção"
                        ? "monitoramento"
                        : "alunos"
            });
        };

        graficos[id] = new Chart(contexto, {
            type: "doughnut",

            data: {
                labels,

                datasets: [{
                    data: valores,

                    backgroundColor: [
                        CORES.verde,
                        CORES.roxo,
                        CORES.amarelo,
                        CORES.vermelho,
                        CORES.cinza
                    ],

                    borderColor: CORES.branco,
                    borderWidth: 3,
                    hoverOffset: 8
                }]
            },

            options: opcoes
        });
    }

    // ---------------------------------------------------------
    // Disciplinas críticas
    // ---------------------------------------------------------

    function renderizarDisciplinas(
        dados = []
    ) {
        const id = "chartDisciplinas";
        const contexto = prepararGrafico(id);

        if (!contexto) {
            registrarErroChart();
            return;
        }

        const agrupadas = {};

        dados.forEach((item) => {
            const disciplina =
                String(
                    item.disciplina ?? ""
                ).trim() ||
                "Sem disciplina";

            const media =
                Number(item.media_notas);

            if (!Number.isFinite(media)) {
                return;
            }

            const quantidade = Math.max(
                numero(
                    item.quantidade_notas,
                    1
                ),
                1
            );

            if (!agrupadas[disciplina]) {
                agrupadas[disciplina] = {
                    somaPonderada: 0,
                    quantidade: 0
                };
            }

            agrupadas[
                disciplina
            ].somaPonderada +=
                media * quantidade;

            agrupadas[
                disciplina
            ].quantidade += quantidade;
        });

        const registros =
            Object.entries(agrupadas)
                .map(
                    ([disciplina, valores]) => ({
                        disciplina,

                        media:
                            valores.somaPonderada /
                            valores.quantidade
                    })
                )
                .filter((item) =>
                    Number.isFinite(item.media)
                )
                .sort(
                    (a, b) =>
                        a.media - b.media
                )
                .slice(0, 10);

        const labels = registros.map(
            (item) => item.disciplina
        );

        const opcoes = opcoesCartesianas();

        opcoes.indexAxis = "y";

        opcoes.scales.x = {
            beginAtZero: true,
            max: 10,

            grid: {
                color: CORES.grade,
                drawTicks: false
            },

            border: {
                display: false
            },

            ticks: {
                color: CORES.texto,
                padding: 8,
                stepSize: 2,
                font: configuracaoFonte()
            }
        };

        opcoes.scales.y = {
            grid: {
                display: false
            },

            border: {
                display: false
            },

            ticks: {
                color: CORES.texto,
                font: configuracaoFonte(),

                callback(valor) {
                    return limitarRotulo(
                        this.getLabelForValue(
                            valor
                        ),
                        31
                    );
                }
            }
        };

        opcoes.plugins.legend.display = false;

        opcoes.plugins.tooltip.callbacks = {
            title(contextos) {
                const indice =
                    contextos[0].dataIndex;

                return labels[indice];
            },

            label(context) {
                return (
                    ` Média: ` +
                    formatarNumero(
                        context.raw,
                        2
                    )
                );
            },

            afterBody() {
                return "Clique para abrir a disciplina.";
            }
        };

        opcoes.onHover =
            configurarCursorInterativo;

        opcoes.onClick = (
            evento,
            elementos
        ) => {
            if (!elementos.length) {
                return;
            }

            const indice =
                elementos[0].index;

            const disciplina =
                labels[indice];

            emitirFiltroGrafico({
                tipo: "disciplina",
                valor: disciplina,
                rotulo: disciplina,
                pagina: "disciplinas"
            });
        };

        graficos[id] = new Chart(contexto, {
            type: "bar",

            data: {
                labels,

                datasets: [{
                    label: "Média da disciplina",

                    data: registros.map(
                        (item) => item.media
                    ),

                    backgroundColor:
                        registros.map(
                            (item, indice) => {
                                if (item.media < 6) {
                                    return CORES.vermelho;
                                }

                                if (item.media < 7) {
                                    return CORES.amarelo;
                                }

                                return PALETA_DISCIPLINAS[
                                    indice %
                                    PALETA_DISCIPLINAS.length
                                ];
                            }
                        ),

                    borderRadius: 5,
                    borderSkipped: false,
                    barThickness: 18
                }]
            },

            options: opcoes
        });
    }

    // ---------------------------------------------------------
    // Turmas
    // ---------------------------------------------------------

    function renderizarTurmas(
        dados = []
    ) {
        const id = "chartTurmas";
        const contexto = prepararGrafico(id);

        if (!contexto) {
            registrarErroChart();
            return;
        }

        const registros = [...dados]
            .filter((item) =>
                Number.isFinite(
                    Number(item.media_notas)
                )
            )
            .sort(
                (a, b) =>
                    numero(b.media_notas) -
                    numero(a.media_notas)
            )
            .slice(0, 15);

        const labels = registros.map(
            (item) => {
                const turma =
                    item.turma ||
                    "Sem turma";

                const ano = item.ano
                    ? ` — ${item.ano}`
                    : "";

                return `${turma}${ano}`;
            }
        );

        const medias = registros.map(
            (item) =>
                numero(item.media_notas)
        );

        const frequencias = registros.map(
            (item) =>
                numero(item.frequencia_media)
        );

        const opcoes = opcoesCartesianas();

        opcoes.scales.y = {
            beginAtZero: true,
            max: 10,

            grid: {
                color: CORES.grade,
                drawTicks: false
            },

            border: {
                display: false
            },

            ticks: {
                color: CORES.texto,
                padding: 8,
                stepSize: 2,
                font: configuracaoFonte()
            }
        };

        opcoes.scales.yFrequencia = {
            position: "right",
            beginAtZero: true,
            max: 100,

            grid: {
                drawOnChartArea: false
            },

            border: {
                display: false
            },

            ticks: {
                color: CORES.texto,
                padding: 8,
                callback: (valor) => `${valor}%`,
                font: configuracaoFonte()
            }
        };

        opcoes.plugins.tooltip.callbacks = {
            label(context) {
                if (
                    context.dataset.yAxisID ===
                    "yFrequencia"
                ) {
                    return (
                        ` Frequência: ` +
                        `${formatarNumero(
                            context.raw,
                            1
                        )}%`
                    );
                }

                return (
                    ` Média: ` +
                    formatarNumero(
                        context.raw,
                        2
                    )
                );
            },

            afterBody() {
                return "Clique para filtrar a turma.";
            }
        };

        opcoes.onHover =
            configurarCursorInterativo;

        opcoes.onClick = (
            evento,
            elementos
        ) => {
            if (!elementos.length) {
                return;
            }

            const indice =
                elementos[0].index;

            const registro =
                registros[indice];

            emitirFiltroGrafico({
                tipo: "turma",
                valor: registro.turma,
                rotulo: `Turma ${registro.turma}`,
                pagina: "alunos"
            });
        };

        graficos[id] = new Chart(contexto, {
            type: "bar",

            data: {
                labels,

                datasets: [
                    {
                        type: "bar",
                        label: "Média",
                        data: medias,
                        yAxisID: "y",

                        backgroundColor: CORES.roxo,
                        borderRadius: 5,
                        borderSkipped: false,
                        maxBarThickness: 34
                    },

                    {
                        type: "line",
                        label: "Frequência",
                        data: frequencias,
                        yAxisID: "yFrequencia",

                        borderColor: CORES.verde,
                        backgroundColor: CORES.verde,

                        borderWidth: 2,
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        pointBackgroundColor:
                            CORES.branco,
                        pointBorderColor:
                            CORES.verde,
                        pointBorderWidth: 2,

                        tension: 0.25
                    }
                ]
            },

            options: opcoes
        });
    }

    // ---------------------------------------------------------
    // Renderização conjunta
    // ---------------------------------------------------------

    function renderizarTodos(dados = {}) {
        renderizarEvolucao(
            dados.indicadoresPorAno ?? []
        );

        renderizarVinculos(
            dados.alunos ?? [],
            dados.indicadoresVinculo ?? []
        );

        renderizarDesempenho(
            dados.alunos ?? []
        );

        renderizarDisciplinas(
            dados.disciplinas ?? []
        );

        renderizarTurmas(
            dados.turmas ?? []
        );
    }

    // ---------------------------------------------------------
    // Exposição
    // ---------------------------------------------------------

    window.DashboardCharts = {
        renderizarEvolucao,
        renderizarVinculos,
        renderizarDesempenho,
        renderizarDisciplinas,
        renderizarTurmas,
        renderizarTodos,
        destruirGrafico,
        destruirTodos
    };
})();
