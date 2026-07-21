/* ============================================================
   PAINEL DE GESTÃO ACADÊMICA
   Filtros, comparações, formatação e filtros rápidos
   ============================================================ */

(function () {
    "use strict";

    // ---------------------------------------------------------
    // Textos e valores
    // ---------------------------------------------------------

    function texto(valor) {
        if (
            valor === null ||
            valor === undefined
        ) {
            return "";
        }

        return String(valor).trim();
    }

    function normalizarTexto(valor) {
        return texto(valor)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function escaparHTML(valor) {
        return texto(valor)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function numero(
        valor,
        valorPadrao = null
    ) {
        if (
            valor === null ||
            valor === undefined ||
            valor === ""
        ) {
            return valorPadrao;
        }

        if (typeof valor === "number") {
            return Number.isFinite(valor)
                ? valor
                : valorPadrao;
        }

        let conteudo = texto(valor);

        if (!conteudo) {
            return valorPadrao;
        }

        if (
            conteudo.includes(",") &&
            conteudo.includes(".")
        ) {
            conteudo = conteudo
                .replace(/\./g, "")
                .replace(",", ".");
        } else if (conteudo.includes(",")) {
            conteudo = conteudo.replace(",", ".");
        }

        const convertido = Number(conteudo);

        return Number.isFinite(convertido)
            ? convertido
            : valorPadrao;
    }

    function booleano(valor) {
        if (typeof valor === "boolean") {
            return valor;
        }

        if (valor === 1) {
            return true;
        }

        return [
            "TRUE",
            "VERDADEIRO",
            "SIM",
            "YES",
            "1"
        ].includes(normalizarTexto(valor));
    }

    // ---------------------------------------------------------
    // Formatação
    // ---------------------------------------------------------

    function formatarNumero(
        valor,
        casas = 1
    ) {
        const convertido = numero(valor);

        if (convertido === null) {
            return "—";
        }

        return convertido.toLocaleString("pt-BR", {
            minimumFractionDigits: casas,
            maximumFractionDigits: casas
        });
    }

    function formatarInteiro(valor) {
        const convertido = numero(valor);

        if (convertido === null) {
            return "—";
        }

        return Math.round(convertido)
            .toLocaleString("pt-BR");
    }

    function formatarPercentual(
        valor,
        casas = 1
    ) {
        const convertido = numero(valor);

        if (convertido === null) {
            return "—";
        }

        return `${formatarNumero(
            convertido,
            casas
        )}%`;
    }

    function formatarData(valor) {
        if (!valor) {
            return "—";
        }

        const data = new Date(valor);

        if (Number.isNaN(data.getTime())) {
            return texto(valor);
        }

        return data.toLocaleDateString("pt-BR");
    }

    function formatarDataHora(valor) {
        if (!valor) {
            return "—";
        }

        const data = new Date(valor);

        if (Number.isNaN(data.getTime())) {
            return texto(valor);
        }

        return data.toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short"
        });
    }

    function formatarVariacao(
        valor,
        casas = 1,
        sufixo = ""
    ) {
        const convertido = numero(valor);

        if (convertido === null) {
            return "Sem comparação disponível";
        }

        const sinal = convertido > 0
            ? "+"
            : "";

        return (
            `${sinal}${formatarNumero(
                convertido,
                casas
            )}${sufixo}`
        );
    }

    // ---------------------------------------------------------
    // Ordenação e selects
    // ---------------------------------------------------------

    function compararValores(a, b) {
        return texto(a).localeCompare(
            texto(b),
            "pt-BR",
            {
                numeric: true,
                sensitivity: "base"
            }
        );
    }

    function valoresUnicos(
        dados,
        campo
    ) {
        if (!Array.isArray(dados)) {
            return [];
        }

        const mapa = new Map();

        dados.forEach((item) => {
            const valor = item?.[campo];
            const chave = normalizarTexto(valor);

            if (
                chave &&
                !mapa.has(chave)
            ) {
                mapa.set(chave, valor);
            }
        });

        return [...mapa.values()]
            .sort(compararValores);
    }

    function preencherSelect(
        elemento,
        valores,
        rotuloInicial,
        valorInicial = ""
    ) {
        if (!elemento) {
            return;
        }

        const valorAtual = elemento.value;

        elemento.innerHTML = "";

        const opcaoInicial =
            document.createElement("option");

        opcaoInicial.value = valorInicial;
        opcaoInicial.textContent = rotuloInicial;

        elemento.appendChild(opcaoInicial);

        valores.forEach((valor) => {
            const opcao =
                document.createElement("option");

            opcao.value = texto(valor);
            opcao.textContent = texto(valor);

            elemento.appendChild(opcao);
        });

        const valorExiste = [
            ...elemento.options
        ].some(
            (opcao) =>
                opcao.value === valorAtual
        );

        elemento.value = valorExiste
            ? valorAtual
            : valorInicial;
    }

    // ---------------------------------------------------------
    // Leitura dos filtros da tela
    // ---------------------------------------------------------

    function obterFiltrosAtuais() {
        return {
            ano: texto(
                document.getElementById(
                    "filtroAno"
                )?.value
            ),

            vinculo: texto(
                document.getElementById(
                    "filtroVinculo"
                )?.value
            ),

            turma: texto(
                document.getElementById(
                    "filtroTurma"
                )?.value
            ),

            disciplina: texto(
                document.getElementById(
                    "filtroDisciplina"
                )?.value
            ),

            desempenho: texto(
                document.getElementById(
                    "filtroDesempenho"
                )?.value
            ),

            risco: texto(
                document.getElementById(
                    "filtroRisco"
                )?.value
            ),

            busca: normalizarTexto(
                document.getElementById(
                    "filtroBusca"
                )?.value
            )
        };
    }

    function possuiFiltrosAtivos(
        filtros = obterFiltrosAtuais()
    ) {
        return Boolean(
            filtros.ano ||
            filtros.turma ||
            filtros.disciplina ||
            filtros.desempenho ||
            filtros.risco ||
            filtros.busca ||
            (
                filtros.vinculo &&
                filtros.vinculo !== "ATIVOS"
            )
        );
    }

    function limparFiltros() {
        const valores = {
            filtroAno: "",
            filtroVinculo: "ATIVOS",
            filtroTurma: "",
            filtroDisciplina: "",
            filtroDesempenho: "",
            filtroRisco: "",
            filtroBusca: ""
        };

        Object.entries(valores).forEach(
            ([id, valor]) => {
                const campo =
                    document.getElementById(id);

                if (campo) {
                    campo.value = valor;
                }
            }
        );
    }

    // ---------------------------------------------------------
    // Comparações básicas
    // ---------------------------------------------------------

    function correspondeExatamente(
        valor,
        filtro
    ) {
        if (!filtro) {
            return true;
        }

        return (
            normalizarTexto(valor) ===
            normalizarTexto(filtro)
        );
    }

    function contemTexto(
        valor,
        busca
    ) {
        if (!busca) {
            return true;
        }

        return normalizarTexto(valor)
            .includes(
                normalizarTexto(busca)
            );
    }

    function contemBuscaEmCampos(
        item,
        busca,
        campos
    ) {
        if (!busca) {
            return true;
        }

        return campos.some((campo) =>
            contemTexto(
                item?.[campo],
                busca
            )
        );
    }

    // ---------------------------------------------------------
    // Vínculo
    // ---------------------------------------------------------

    const VINCULOS_ATIVOS = new Set([
        "ATIVO",
        "FORMANDO"
    ]);

    const VINCULOS_INATIVOS = new Set([
        "INATIVO",
        "INATIVO PROVAVEL",
        "EVADIDO PROVAVEL"
    ]);

    function normalizarVinculo(valor) {
        return normalizarTexto(valor);
    }

    function vinculoEhAtivo(valor) {
        return VINCULOS_ATIVOS.has(
            normalizarVinculo(valor)
        );
    }

    function vinculoEhInativo(valor) {
        return VINCULOS_INATIVOS.has(
            normalizarVinculo(valor)
        );
    }

    function correspondeVinculo(
        situacaoAluno,
        filtroVinculo,
        elegivelAtivos = false
    ) {
        const filtro = normalizarVinculo(
            filtroVinculo
        );

        const situacao = normalizarVinculo(
            situacaoAluno
        );

        if (!filtro) {
            return true;
        }

        if (filtro === "ATIVOS") {
            return (
                booleano(elegivelAtivos) ||
                vinculoEhAtivo(situacao)
            );
        }

        if (filtro === "INATIVOS") {
            return vinculoEhInativo(situacao);
        }

        return situacao === filtro;
    }

    function rotuloVinculo(valor) {
        const vinculo = normalizarVinculo(valor);

        const rotulos = {
            "ATIVO": "Ativo",
            "FORMANDO": "Formando",
            "CONCLUINTE RECENTE":
                "Concluinte recente",
            "EGRESSO": "Egresso",
            "INATIVO": "Inativo",
            "INATIVO PROVAVEL":
                "Inativo provável",
            "EVADIDO PROVAVEL":
                "Evasão provável",
            "SEM CLASSIFICACAO":
                "Sem classificação"
        };

        return (
            rotulos[vinculo] ||
            texto(valor) ||
            "Sem classificação"
        );
    }

    function rotuloPopulacao(valor) {
        const filtro = normalizarVinculo(valor);

        const rotulos = {
            "": "Todos os vínculos",
            "ATIVOS": "Ativos e formandos",
            "ATIVO": "Somente ativos",
            "FORMANDO": "Formandos",
            "CONCLUINTE RECENTE":
                "Concluintes recentes",
            "EGRESSO": "Egressos",
            "INATIVOS":
                "Inativos e evasão provável"
        };

        return rotulos[filtro] || texto(valor);
    }

    // ---------------------------------------------------------
    // Desempenho
    // ---------------------------------------------------------

    function normalizarDesempenho(valor) {
        const classificacao =
            normalizarTexto(valor);

        if (
            classificacao.includes("DESTAQUE") ||
            classificacao.includes("EXCELENTE")
        ) {
            return "DESTAQUE";
        }

        if (
            classificacao.includes("CRITICO") ||
            classificacao.includes("INSUFICIENTE")
        ) {
            return "CRITICO";
        }

        if (
            classificacao.includes("ATENCAO")
        ) {
            return "ATENCAO";
        }

        if (
            classificacao.includes("REGULAR")
        ) {
            return "REGULAR";
        }

        return "SEM_DADOS";
    }

    function classificarPorMetricas(
        classificacao,
        media,
        frequencia
    ) {
        if (texto(classificacao)) {
            return normalizarDesempenho(
                classificacao
            );
        }

        const nota = numero(media);
        const presenca = numero(frequencia);

        if (
            nota === null &&
            presenca === null
        ) {
            return "SEM_DADOS";
        }

        if (
            nota !== null &&
            nota >= 8.5 &&
            (
                presenca === null ||
                presenca >= 90
            )
        ) {
            return "DESTAQUE";
        }

        if (
            (
                nota !== null &&
                nota < 6
            ) ||
            (
                presenca !== null &&
                presenca < 75
            )
        ) {
            return "CRITICO";
        }

        if (
            nota !== null &&
            nota < 7
        ) {
            return "ATENCAO";
        }

        return "REGULAR";
    }

    function correspondeDesempenho(
        classificacao,
        filtro,
        media = null,
        frequencia = null
    ) {
        if (!filtro) {
            return true;
        }

        return (
            classificarPorMetricas(
                classificacao,
                media,
                frequencia
            ) === normalizarTexto(filtro)
        );
    }

    function rotuloDesempenho(valor) {
        const desempenho =
            normalizarTexto(valor);

        const rotulos = {
            "DESTAQUE": "Destaque",
            "REGULAR": "Regular",
            "ATENCAO": "Atenção",
            "CRITICO": "Crítico",
            "SEM DADOS": "Sem dados",
            "SEM_DADOS": "Sem dados"
        };

        return (
            rotulos[desempenho] ||
            texto(valor) ||
            "Sem dados"
        );
    }

    // ---------------------------------------------------------
    // Risco
    // ---------------------------------------------------------

    function normalizarRisco(valor) {
        const risco = normalizarTexto(valor);

        if (
            risco.includes("ALTO") ||
            risco.includes("CRITICO")
        ) {
            return "ALTO";
        }

        if (
            risco.includes("MEDIO") ||
            risco.includes("MODERADO")
        ) {
            return "MEDIO";
        }

        if (
            risco.includes("BAIXO") ||
            risco.includes("SEM RISCO")
        ) {
            return "BAIXO";
        }

        return "SEM_CLASSIFICACAO";
    }

    function correspondeRisco(
        valor,
        filtro
    ) {
        if (!filtro) {
            return true;
        }

        return (
            normalizarRisco(valor) ===
            normalizarTexto(filtro)
        );
    }

    // ---------------------------------------------------------
    // Filtro de alunos
    // ---------------------------------------------------------

    function filtrarAlunos(
        dados,
        filtros,
        idsPermitidos = null
    ) {
        if (!Array.isArray(dados)) {
            return [];
        }

        const conjuntoIds = idsPermitidos
            ? new Set(
                [...idsPermitidos].map(
                    (id) => texto(id)
                )
            )
            : null;

        return dados.filter((aluno) => {
            const idAluno = texto(
                aluno.id_aluno_final
            );

            const atendeIds =
                !conjuntoIds ||
                conjuntoIds.has(idAluno);

            const atendeVinculo =
                correspondeVinculo(
                    aluno.situacao_vinculo,
                    filtros.vinculo,
                    aluno.elegivel_indicadores_ativos
                );

            const atendeTurma =
                correspondeExatamente(
                    aluno.turma_atual ??
                    aluno.turma,
                    filtros.turma
                );

            const atendeDesempenho =
                correspondeDesempenho(
                    aluno.classificacao ??
                    aluno.classificacao_historica,
                    filtros.desempenho,
                    aluno.media_ano_referencia ??
                    aluno.media_historica,
                    aluno.frequencia_ano_referencia ??
                    aluno.frequencia_media
                );

            const atendeRisco =
                correspondeRisco(
                    aluno.nivel_risco,
                    filtros.risco
                );

            const atendeBusca =
                contemBuscaEmCampos(
                    aluno,
                    filtros.busca,
                    [
                        "nome_aluno_final",
                        "nome_aluno",
                        "id_aluno_final",
                        "turma_atual",
                        "turma",
                        "status_atual",
                        "situacao_vinculo",
                        "classificacao",
                        "nivel_risco"
                    ]
                );

            return (
                atendeIds &&
                atendeVinculo &&
                atendeTurma &&
                atendeDesempenho &&
                atendeRisco &&
                atendeBusca
            );
        });
    }

    // ---------------------------------------------------------
    // Filtro de alunos por ano
    // ---------------------------------------------------------

    function filtrarAlunosPorAno(
        dados,
        filtros
    ) {
        if (!Array.isArray(dados)) {
            return [];
        }

        return dados.filter((registro) => {
            const atendeAno =
                correspondeExatamente(
                    registro.ano,
                    filtros.ano
                );

            const atendeVinculo =
                correspondeVinculo(
                    registro.situacao_vinculo,
                    filtros.vinculo,
                    registro.elegivel_indicadores_ativos
                );

            const atendeTurma =
                correspondeExatamente(
                    registro.turma,
                    filtros.turma
                );

            const atendeDesempenho =
                correspondeDesempenho(
                    registro.classificacao,
                    filtros.desempenho,
                    registro.media_notas,
                    registro.frequencia_media
                );

            const atendeRisco =
                correspondeRisco(
                    registro.nivel_risco,
                    filtros.risco
                );

            const atendeBusca =
                contemBuscaEmCampos(
                    registro,
                    filtros.busca,
                    [
                        "nome_aluno_final",
                        "nome_aluno",
                        "id_aluno_final",
                        "turma",
                        "status",
                        "situacao_vinculo",
                        "classificacao"
                    ]
                );

            return (
                atendeAno &&
                atendeVinculo &&
                atendeTurma &&
                atendeDesempenho &&
                atendeRisco &&
                atendeBusca
            );
        });
    }

    // ---------------------------------------------------------
    // Disciplinas
    // ---------------------------------------------------------

    function filtrarDisciplinas(
        dados,
        filtros
    ) {
        if (!Array.isArray(dados)) {
            return [];
        }

        return dados.filter((item) => {
            const atendeAno =
                correspondeExatamente(
                    item.ano,
                    filtros.ano
                );

            const atendeDisciplina =
                correspondeExatamente(
                    item.disciplina,
                    filtros.disciplina
                );

            const atendeBusca =
                contemBuscaEmCampos(
                    item,
                    filtros.busca,
                    ["disciplina"]
                );

            return (
                atendeAno &&
                atendeDisciplina &&
                atendeBusca
            );
        });
    }

    // ---------------------------------------------------------
    // Turmas
    // ---------------------------------------------------------

    function filtrarTurmas(
        dados,
        filtros
    ) {
        if (!Array.isArray(dados)) {
            return [];
        }

        return dados.filter((item) => {
            const atendeAno =
                correspondeExatamente(
                    item.ano,
                    filtros.ano
                );

            const atendeTurma =
                correspondeExatamente(
                    item.turma,
                    filtros.turma
                );

            const atendeBusca =
                contemBuscaEmCampos(
                    item,
                    filtros.busca,
                    [
                        "turma",
                        "serie_numero"
                    ]
                );

            return (
                atendeAno &&
                atendeTurma &&
                atendeBusca
            );
        });
    }

    // ---------------------------------------------------------
    // Ranking
    // ---------------------------------------------------------

    function filtrarRanking(
        dados,
        filtros,
        idsPermitidos = null
    ) {
        if (!Array.isArray(dados)) {
            return [];
        }

        const conjuntoIds = idsPermitidos
            ? new Set(
                [...idsPermitidos].map(
                    (id) => texto(id)
                )
            )
            : null;

        return dados.filter((aluno) => {
            const atendeIds =
                !conjuntoIds ||
                conjuntoIds.has(
                    texto(aluno.id_aluno_final)
                );

            const atendeVinculo =
                correspondeVinculo(
                    aluno.situacao_vinculo,
                    filtros.vinculo,
                    aluno.elegivel_indicadores_ativos
                );

            const atendeTurma =
                correspondeExatamente(
                    aluno.turma_atual ??
                    aluno.turma,
                    filtros.turma
                );

            const atendeDesempenho =
                correspondeDesempenho(
                    aluno.classificacao ??
                    aluno.classificacao_historica,
                    filtros.desempenho,
                    aluno.media_ano_referencia ??
                    aluno.media_historica,
                    aluno.frequencia_ano_referencia ??
                    aluno.frequencia_media
                );

            const atendeRisco =
                correspondeRisco(
                    aluno.nivel_risco,
                    filtros.risco
                );

            const atendeBusca =
                contemBuscaEmCampos(
                    aluno,
                    filtros.busca,
                    [
                        "nome_aluno_final",
                        "nome_aluno",
                        "id_aluno_final",
                        "turma_atual",
                        "situacao_vinculo",
                        "classificacao"
                    ]
                );

            return (
                atendeIds &&
                atendeVinculo &&
                atendeTurma &&
                atendeDesempenho &&
                atendeRisco &&
                atendeBusca
            );
        });
    }

    // ---------------------------------------------------------
    // Filtros rápidos
    // ---------------------------------------------------------

    function correspondeFiltroRapido(
        aluno,
        tipo,
        metricas = {}
    ) {
        if (!tipo) {
            return true;
        }

        const filtro = normalizarTexto(tipo);

        const media = numero(
            metricas.media ??
            aluno.media_ano_referencia ??
            aluno.media_historica
        );

        const frequencia = numero(
            metricas.frequencia ??
            aluno.frequencia_ano_referencia ??
            aluno.frequencia_media
        );

        const desempenho =
            classificarPorMetricas(
                metricas.classificacao ??
                aluno.classificacao ??
                aluno.classificacao_historica,
                media,
                frequencia
            );

        const risco = normalizarRisco(
            aluno.nivel_risco
        );

        const vinculo = normalizarVinculo(
            aluno.situacao_vinculo
        );

        const tendencia = normalizarTexto(
            aluno.tendencia
        );

        if (
            filtro === "TODOS" ||
            filtro === "DESEMPENHO" ||
            filtro === "FREQUENCIA"
        ) {
            return true;
        }

        if (filtro === "ATENCAO") {
            return (
                desempenho === "ATENCAO" ||
                desempenho === "CRITICO" ||
                risco === "ALTO" ||
                risco === "MEDIO"
            );
        }

        if (filtro === "CRITICO") {
            return desempenho === "CRITICO";
        }

        if (filtro === "DESTAQUE") {
            return desempenho === "DESTAQUE";
        }

        if (filtro === "REGULAR") {
            return desempenho === "REGULAR";
        }

        if (filtro === "SEM DADOS") {
            return desempenho === "SEM_DADOS";
        }

        if (filtro === "BAIXA FREQUENCIA") {
            return (
                frequencia !== null &&
                frequencia < 75
            );
        }

        if (filtro === "DECRESCENTE") {
            return tendencia.includes(
                "DECRESCENTE"
            );
        }

        if (filtro === "RISCO ALTO") {
            return risco === "ALTO";
        }

        if (filtro === "EVADIDO PROVAVEL") {
            return vinculo ===
                "EVADIDO PROVAVEL";
        }

        if (filtro === "INATIVOS") {
            return vinculoEhInativo(vinculo);
        }

        if (filtro === "FORMANDO") {
            return vinculo === "FORMANDO";
        }

        return true;
    }

    function rotuloFiltroRapido(tipo) {
        const filtro = normalizarTexto(tipo);

        const rotulos = {
            "TODOS": "Todos os alunos",
            "DESEMPENHO":
                "Indicadores de desempenho",
            "FREQUENCIA":
                "Indicadores de frequência",
            "ATENCAO":
                "Alunos que necessitam atenção",
            "CRITICO":
                "Desempenho crítico",
            "DESTAQUE":
                "Alunos em destaque",
            "REGULAR":
                "Desempenho regular",
            "SEM DADOS":
                "Sem dados suficientes",
            "BAIXA FREQUENCIA":
                "Frequência abaixo de 75%",
            "DECRESCENTE":
                "Desempenho em queda",
            "RISCO ALTO":
                "Risco alto",
            "EVADIDO PROVAVEL":
                "Evasão provável",
            "INATIVOS":
                "Inativos e evasão provável",
            "FORMANDO":
                "Formandos",
            "DISCIPLINAS CRITICAS":
                "Disciplinas críticas"
        };

        return rotulos[filtro] || texto(tipo);
    }

    // ---------------------------------------------------------
    // Classes dos badges
    // ---------------------------------------------------------

    function classeClassificacao(valor) {
        const desempenho =
            normalizarDesempenho(valor);

        if (desempenho === "DESTAQUE") {
            return "badge-success";
        }

        if (
            desempenho === "ATENCAO" ||
            desempenho === "REGULAR"
        ) {
            return "badge-warning";
        }

        if (desempenho === "CRITICO") {
            return "badge-danger";
        }

        return "badge-neutral";
    }

    function classeRisco(valor) {
        const risco = normalizarRisco(valor);

        if (risco === "ALTO") {
            return "badge-danger";
        }

        if (risco === "MEDIO") {
            return "badge-warning";
        }

        if (risco === "BAIXO") {
            return "badge-success";
        }

        return "badge-neutral";
    }

    function classeVinculo(valor) {
        const vinculo =
            normalizarVinculo(valor);

        if (
            vinculo === "ATIVO" ||
            vinculo === "FORMANDO"
        ) {
            return "badge-success";
        }

        if (
            vinculo === "CONCLUINTE RECENTE" ||
            vinculo === "EGRESSO"
        ) {
            return "badge-purple";
        }

        if (
            vinculo === "INATIVO PROVAVEL"
        ) {
            return "badge-warning";
        }

        if (
            vinculo === "INATIVO" ||
            vinculo === "EVADIDO PROVAVEL"
        ) {
            return "badge-danger";
        }

        return "badge-neutral";
    }

    function classeTendencia(valor) {
        const tendencia =
            normalizarTexto(valor);

        if (
            tendencia.includes("CRESCENTE")
        ) {
            return "badge-success";
        }

        if (
            tendencia.includes("DECRESCENTE")
        ) {
            return "badge-danger";
        }

        if (
            tendencia.includes("ESTAVEL")
        ) {
            return "badge-purple";
        }

        return "badge-neutral";
    }

    function criarBadge(
        valor,
        tipo = "classificacao"
    ) {
        let conteudo = texto(valor);
        let classe = "badge-neutral";

        if (tipo === "risco") {
            conteudo = conteudo || "Sem risco";
            classe = classeRisco(conteudo);
        } else if (tipo === "vinculo") {
            conteudo = rotuloVinculo(conteudo);
            classe = classeVinculo(valor);
        } else if (tipo === "tendencia") {
            conteudo =
                conteudo || "Sem histórico";

            classe = classeTendencia(conteudo);
        } else {
            conteudo =
                conteudo || "Sem informação";

            classe =
                classeClassificacao(conteudo);
        }

        return `
            <span class="badge ${classe}">
                ${escaparHTML(conteudo)}
            </span>
        `;
    }

    // ---------------------------------------------------------
    // Indicadores auxiliares
    // ---------------------------------------------------------

    function media(dados, campo) {
        if (!Array.isArray(dados)) {
            return null;
        }

        const valores = dados
            .map((item) =>
                numero(item?.[campo])
            )
            .filter(
                (valor) => valor !== null
            );

        if (!valores.length) {
            return null;
        }

        return valores.reduce(
            (soma, valor) => soma + valor,
            0
        ) / valores.length;
    }

    function soma(dados, campo) {
        if (!Array.isArray(dados)) {
            return 0;
        }

        return dados.reduce(
            (total, item) =>
                total +
                numero(item?.[campo], 0),
            0
        );
    }

    function contarDistintos(
        dados,
        campo
    ) {
        if (!Array.isArray(dados)) {
            return 0;
        }

        return new Set(
            dados
                .map((item) =>
                    texto(item?.[campo])
                )
                .filter(Boolean)
        ).size;
    }

    // ---------------------------------------------------------
    // Exposição
    // ---------------------------------------------------------

    window.DashboardFilters = {
        texto,
        numero,
        booleano,
        normalizarTexto,
        escaparHTML,

        formatarNumero,
        formatarInteiro,
        formatarPercentual,
        formatarData,
        formatarDataHora,
        formatarVariacao,

        compararValores,
        valoresUnicos,
        preencherSelect,

        obterFiltrosAtuais,
        possuiFiltrosAtivos,
        limparFiltros,

        correspondeExatamente,
        contemTexto,
        contemBuscaEmCampos,

        normalizarVinculo,
        vinculoEhAtivo,
        vinculoEhInativo,
        correspondeVinculo,
        rotuloVinculo,
        rotuloPopulacao,

        normalizarDesempenho,
        classificarPorMetricas,
        correspondeDesempenho,
        rotuloDesempenho,

        normalizarRisco,
        correspondeRisco,

        filtrarAlunos,
        filtrarAlunosPorAno,
        filtrarDisciplinas,
        filtrarTurmas,
        filtrarRanking,

        correspondeFiltroRapido,
        rotuloFiltroRapido,

        classeClassificacao,
        classeRisco,
        classeVinculo,
        classeTendencia,
        criarBadge,

        media,
        soma,
        contarDistintos
    };
})();
