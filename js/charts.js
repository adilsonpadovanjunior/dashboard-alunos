/* ============================================================
   DASHBOARD DE ALUNOS — GRÁFICOS
   Requer Chart.js carregado no index.html
   ============================================================ */

(function () {
    "use strict";

    const graficos = {};

    const CORES = {
        azul: "#2563eb",
        azulClaro: "rgba(37, 99, 235, 0.16)",
        verde: "#16a34a",
        verdeClaro: "rgba(22, 163, 74, 0.16)",
        amarelo: "#d97706",
        vermelho: "#dc2626",
        roxo: "#7c3aed",
        ciano: "#0891b2",
        cinza: "#64748b",
        grade: "rgba(148, 163, 184, 0.20)",
        texto: "#475569"
    };

    const PALETA = [
        "#2563eb",
        "#16a34a",
        "#d97706",
        "#7c3aed",
        "#0891b2",
        "#dc2626",
        "#4f46e5",
        "#059669",
        "#ea580c",
        "#9333ea"
    ];

    // ---------------------------------------------------------
    // Configuração geral
    // ---------------------------------------------------------

    function chartDisponivel() {
        return typeof window.Chart !== "undefined";
    }

    function obterCanvas(id) {
        return document.getElementById(id);
    }

    function destruirGrafico(id) {
        if (graficos[id]) {
            graficos[id].destroy();
            delete graficos[id];
        }
    }

    function destruirTodos() {
        Object.keys(graficos).forEach(destruirGrafico);
    }

    function prepararGrafico(id) {
        destruirGrafico(id);

        const canvas = obterCanvas(id);

        if (!canvas || !chartDisponivel()) {
            return null;
        }

        return canvas.getContext("2d");
    }

    function numero(valor, valorPadrao = 0) {
        const convertido = Number(valor);
        return Number.isFinite(convertido) ? convertido : valorPadrao;
    }

    function formatarNumero(valor, casas = 1) {
        return numero(valor).toLocaleString("pt-BR", {
            minimumFractionDigits: casas,
            maximumFractionDigits: casas
        });
    }

    function ordenarTexto(a, b) {
        return String(a ?? "").localeCompare(
            String(b ?? ""),
            "pt-BR",
            {
                numeric: true,
                sensitivity: "base"
            }
        );
    }

    function opcoesComuns() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "index",
                intersect: false
            },
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: CORES.texto,
                        usePointStyle: true,
                        pointStyle: "circle",
                        padding: 18,
                        font: {
                            family: "Inter",
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: "#0f172a",
                    titleColor: "#ffffff",
                    bodyColor: "#e2e8f0",
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: CORES.texto,
                        font: {
                            family: "Inter"
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: CORES.grade
                    },
                    ticks: {
                        color: CORES.texto,
                        font: {
                            family: "Inter"
                        }
                    }
                }
            }
        };
    }

    function mensagemSemChart() {
        if (!chartDisponivel()) {
            console.error(
                "Chart.js não foi carregado. Confira o link CDN no index.html."
            );
        }
    }

    // ---------------------------------------------------------
    // Evolução anual
    // ---------------------------------------------------------

    function renderizarEvolucao(dados = []) {
        const id = "chartEvolucao";
        const contexto = prepararGrafico(id);

        if (!contexto) {
            mensagemSemChart();
            return;
        }

        const registros = [...dados].sort(
            (a, b) => numero(a.ano) - numero(b.ano)
        );

        const labels = registros.map((item) => item.ano);
        const medias = registros.map((item) =>
            numero(item.media_geral)
        );
        const frequencias = registros.map((item) =>
            numero(item.frequencia_media)
        );

        const opcoes = opcoesComuns();

        opcoes.scales.y = {
            beginAtZero: true,
            suggestedMax: 10,
            grid: {
                color: CORES.grade
            },
            ticks: {
                color: CORES.texto
            },
            title: {
                display: true,
                text: "Média das notas",
                color: CORES.texto
            }
        };

        opcoes.scales.yFrequencia = {
            position: "right",
            beginAtZero: true,
            suggestedMax: 100,
            grid: {
                drawOnChartArea: false
            },
            ticks: {
                color: CORES.texto,
                callback: (valor) => `${valor}%`
            },
            title: {
                display: true,
                text: "Frequência",
                color: CORES.texto
            }
        };

        graficos[id] = new Chart(contexto, {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: "Média geral",
                        data: medias,
                        borderColor: CORES.azul,
                        backgroundColor: CORES.azulClaro,
                        fill: true,
                        tension: 0.35,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        borderWidth: 3,
                        yAxisID: "y"
                    },
                    {
                        label: "Frequência média",
                        data: frequencias,
                        borderColor: CORES.verde,
                        backgroundColor: CORES.verdeClaro,
                        tension: 0.35,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        borderWidth: 3,
                        yAxisID: "yFrequencia"
                    }
                ]
            },
            options: opcoes
        });
    }

    // ---------------------------------------------------------
    // Distribuição de desempenho dos alunos
    // ---------------------------------------------------------

    function renderizarDesempenho(alunos = []) {
        const id = "chartDesempenho";
        const contexto = prepararGrafico(id);

        if (!contexto) {
            mensagemSemChart();
            return;
        }

        const faixas = {
            "Excelente": 0,
            "Bom": 0,
            "Regular": 0,
            "Insuficiente": 0,
            "Sem dados": 0
        };

        alunos.forEach((aluno) => {
            const media = Number(aluno.media_historica);

            if (!Number.isFinite(media)) {
                faixas["Sem dados"] += 1;
            } else if (media >= 8) {
                faixas["Excelente"] += 1;
            } else if (media >= 7) {
                faixas["Bom"] += 1;
            } else if (media >= 6) {
                faixas["Regular"] += 1;
            } else {
                faixas["Insuficiente"] += 1;
            }
        });

        graficos[id] = new Chart(contexto, {
            type: "doughnut",
            data: {
                labels: Object.keys(faixas),
                datasets: [{
                    data: Object.values(faixas),
                    backgroundColor: [
                        CORES.verde,
                        CORES.azul,
                        CORES.amarelo,
                        CORES.vermelho,
                        CORES.cinza
                    ],
                    borderColor: "#ffffff",
                    borderWidth: 3,
                    hoverOffset: 8
                }]
            },
            options: {
                ...opcoesComuns(),
                cutout: "62%",
                scales: {},
                plugins: {
                    ...opcoesComuns().plugins,
                    tooltip: {
                        ...opcoesComuns().plugins.tooltip,
                        callbacks: {
                            label: function (context) {
                                const total = context.dataset.data.reduce(
                                    (soma, valor) => soma + valor,
                                    0
                                );

                                const quantidade = context.raw;
                                const percentual = total
                                    ? (quantidade / total) * 100
                                    : 0;

                                return (
                                    ` ${context.label}: ${quantidade} ` +
                                    `(${formatarNumero(percentual, 1)}%)`
                                );
                            }
                        }
                    }
                }
            }
        });
    }

    // ---------------------------------------------------------
    // Comparativo entre turmas
    // ---------------------------------------------------------

    function renderizarTurmas(dados = []) {
        const id = "chartTurmas";
        const contexto = prepararGrafico(id);

        if (!contexto) {
            mensagemSemChart();
            return;
        }

        const registros = [...dados]
            .sort((a, b) =>
                numero(b.media_notas) - numero(a.media_notas)
            )
            .slice(0, 12);

        const labels = registros.map((item) => {
            const ano = item.ano ? ` — ${item.ano}` : "";
            return `${item.turma ?? "Sem turma"}${ano}`;
        });

        const medias = registros.map((item) =>
            numero(item.media_notas)
        );

        const opcoes = opcoesComuns();

        opcoes.indexAxis = "y";
        opcoes.scales.x = {
            beginAtZero: true,
            suggestedMax: 10,
            grid: {
                color: CORES.grade
            },
            ticks: {
                color: CORES.texto
            }
        };

        opcoes.scales.y = {
            grid: {
                display: false
            },
            ticks: {
                color: CORES.texto
            }
        };

        graficos[id] = new Chart(contexto, {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "Média da turma",
                    data: medias,
                    backgroundColor: CORES.azul,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: opcoes
        });
    }

    // ---------------------------------------------------------
    // Níveis de risco
    // ---------------------------------------------------------

    function renderizarRisco(alunos = []) {
        const id = "chartRisco";
        const contexto = prepararGrafico(id);

        if (!contexto) {
            mensagemSemChart();
            return;
        }

        const niveis = {
            "Baixo": 0,
            "Médio": 0,
            "Alto": 0,
            "Sem classificação": 0
        };

        alunos.forEach((aluno) => {
            const risco = String(
                aluno.nivel_risco ?? ""
            ).toLowerCase();

            if (risco.includes("alto") || risco.includes("crítico")) {
                niveis["Alto"] += 1;
            } else if (
                risco.includes("médio") ||
                risco.includes("medio") ||
                risco.includes("moderado")
            ) {
                niveis["Médio"] += 1;
            } else if (
                risco.includes("baixo") ||
                risco.includes("sem risco")
            ) {
                niveis["Baixo"] += 1;
            } else {
                niveis["Sem classificação"] += 1;
            }
        });

        graficos[id] = new Chart(contexto, {
            type: "bar",
            data: {
                labels: Object.keys(niveis),
                datasets: [{
                    label: "Quantidade de alunos",
                    data: Object.values(niveis),
                    backgroundColor: [
                        CORES.verde,
                        CORES.amarelo,
                        CORES.vermelho,
                        CORES.cinza
                    ],
                    borderRadius: 7,
                    borderSkipped: false
                }]
            },
            options: opcoesComuns()
        });
    }

    // ---------------------------------------------------------
    // Disciplinas com menor média
    // ---------------------------------------------------------

    function renderizarDisciplinas(dados = []) {
        const id = "chartDisciplinas";
        const contexto = prepararGrafico(id);

        if (!contexto) {
            mensagemSemChart();
            return;
        }

        const agrupadas = {};

        dados.forEach((item) => {
            const disciplina =
                String(item.disciplina ?? "").trim() ||
                "Sem disciplina";

            const media = Number(item.media_notas);
            const quantidade = Math.max(
                numero(item.quantidade_notas, 1),
                1
            );

            if (!Number.isFinite(media)) {
                return;
            }

            if (!agrupadas[disciplina]) {
                agrupadas[disciplina] = {
                    somaPonderada: 0,
                    quantidade: 0
                };
            }

            agrupadas[disciplina].somaPonderada +=
                media * quantidade;

            agrupadas[disciplina].quantidade += quantidade;
        });

        const registros = Object.entries(agrupadas)
            .map(([disciplina, valores]) => ({
                disciplina,
                media:
                    valores.somaPonderada /
                    valores.quantidade
            }))
            .sort((a, b) => a.media - b.media)
            .slice(0, 10);

        const opcoes = opcoesComuns();

        opcoes.indexAxis = "y";
        opcoes.scales.x = {
            beginAtZero: true,
            suggestedMax: 10,
            grid: {
                color: CORES.grade
            },
            ticks: {
                color: CORES.texto
            }
        };

        opcoes.scales.y = {
            grid: {
                display: false
            },
            ticks: {
                color: CORES.texto
            }
        };

        graficos[id] = new Chart(contexto, {
            type: "bar",
            data: {
                labels: registros.map(
                    (item) => item.disciplina
                ),
                datasets: [{
                    label: "Média da disciplina",
                    data: registros.map((item) => item.media),
                    backgroundColor: registros.map(
                        (_, indice) => PALETA[indice % PALETA.length]
                    ),
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: opcoes
        });
    }

    // ---------------------------------------------------------
    // Atualização conjunta
    // ---------------------------------------------------------

    function renderizarTodos(dados = {}) {
        renderizarEvolucao(
            dados.indicadoresPorAno ?? []
        );

        renderizarDesempenho(
            dados.alunos ?? []
        );

        renderizarTurmas(
            dados.turmas ?? []
        );

        renderizarRisco(
            dados.alunos ?? []
        );

        renderizarDisciplinas(
            dados.disciplinas ?? []
        );
    }

    // ---------------------------------------------------------
    // Disponibilização para o app.js
    // ---------------------------------------------------------

    window.DashboardCharts = {
        renderizarEvolucao,
        renderizarDesempenho,
        renderizarTurmas,
        renderizarRisco,
        renderizarDisciplinas,
        renderizarTodos,
        destruirGrafico,
        destruirTodos
    };
})();
