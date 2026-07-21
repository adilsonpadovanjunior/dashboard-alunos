/* ============================================================
   PAINEL DE GESTÃO ACADÊMICA
   Filtros, formatação e funções auxiliares
   ============================================================ */

(function () {
    "use strict";

    // ---------------------------------------------------------
    // Valores e textos
    // ---------------------------------------------------------

    function texto(valor) {
        if (valor === null || valor === undefined) {
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

    function numero(valor, valorPadrao = null) {
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

        /*
         * Trata números brasileiros e números JSON.
         *
         * Exemplos:
         *  "7,50"     -> 7.5
         *  "1.234,5"  -> 1234.5
         *  "75.2"     -> 75.2
         */
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

        const conteudo = normalizarTexto(valor);

        return [
            "TRUE",
            "VERDADEIRO",
            "SIM",
            "YES",
            "1"
        ].includes(conteudo);
    }

    // ---------------------------------------------------------
    // Formatação
    // ---------------------------------------------------------

    function formatarNumero(valor, casas = 1) {
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

        return Math.round(convertido).toLocaleString("pt-BR");
    }

    function formatarPercentual(valor, casas = 1) {
        const convertido = numero(valor);

        if (convertido === null) {
            return "—";
        }

        return `${formatarNumero(convertido, casas)}%`;
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

        const sinal = convertido > 0 ? "+" : "";

        return (
            `${sinal}${formatarNumero(convertido, casas)}` +
            sufixo
        );
    }

    // ---------------------------------------------------------
    // Ordenação e valores únicos
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

    function valoresUnicos(dados, campo) {
        if (!Array.isArray(dados)) {
            return [];
        }

        const mapa = new Map();

        dados.forEach((item) => {
            const valor = item?.[campo];
            const chave = normalizarTexto(valor);

            if (chave && !mapa.has(chave)) {
                mapa.set(chave, valor);
            }
        });

        return [...mapa.values()].sort(compararValores);
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

        const opcaoInicial = document.createElement("option");
        opcaoInicial.value = valorInicial;
        opcaoInicial.textContent = rotuloInicial;
        elemento.appendChild(opcaoInicial);

        valores.forEach((valor) => {
            const opcao = document.createElement("option");
            opcao.value = texto(valor);
            opcao.textContent = texto(valor);
            elemento.appendChild(opcao);
        });

        const valorExiste = [...elemento.options].some(
            (opcao) => opcao.value === valorAtual
        );

        elemento.value = valorExiste
            ? valorAtual
            : valorInicial;
    }

    // ---------------------------------------------------------
    // Filtros da interface
    // ---------------------------------------------------------

    function obterFiltrosAtuais() {
        return {
            ano: texto(
                document.getElementById("filtroAno")?.value
            ),

            vinculo: texto(
                document.getElementById("filtroVinculo")?.value
            ),

            turma: texto(
                document.getElementById("filtroTurma")?.value
            ),

            disciplina: texto(
                document.getElementById(
                    "filtroDisciplina"
                )?.value
            ),

            busca: normalizarTexto(
                document.getElementById("filtroBusca")?.value
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
            filtros.busca ||
            (
                filtros.vinculo &&
                filtros.vinculo !== "ATIVOS"
            )
        );
    }

    function limparFiltros() {
        const filtroAno =
            document.getElementById("filtroAno");

        const filtroVinculo =
            document.getElementById("filtroVinculo");

        const filtroTurma =
            document.getElementById("filtroTurma");

        const filtroDisciplina =
            document.getElementById("filtroDisciplina");

        const filtroBusca =
            document.getElementById("filtroBusca");

        if (filtroAno) {
            filtroAno.value = "";
        }

        /*
         * Ativos e formandos continuam sendo a população
         * inicial depois de limpar os filtros.
         */
        if (filtroVinculo) {
            filtroVinculo.value = "ATIVOS";
        }

        if (filtroTurma) {
            filtroTurma.value = "";
        }

        if (filtroDisciplina) {
            filtroDisciplina.value = "";
        }

        if (filtroBusca) {
            filtroBusca.value = "";
        }
    }

    // ---------------------------------------------------------
    // Comparações
    // ---------------------------------------------------------

    function correspondeExatamente(valor, filtro) {
        if (!filtro) {
            return true;
        }

        return (
            normalizarTexto(valor) ===
            normalizarTexto(filtro)
        );
    }

    function contemTexto(valor, busca) {
        if (!busca) {
            return true;
        }

        return normalizarTexto(valor).includes(
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
            contemTexto(item?.[campo], busca)
        );
    }

    // ---------------------------------------------------------
    // Situações de vínculo
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
            "CONCLUINTE RECENTE": "Concluinte recente",
            "EGRESSO": "Egresso",
            "INATIVO": "Inativo",
            "INATIVO PROVAVEL": "Inativo provável",
            "EVADIDO PROVAVEL": "Evasão provável",
            "SEM CLASSIFICACAO": "Sem classificação"
        };

        return rotulos[vinculo] || texto(valor) ||
            "Sem classificação";
    }

    function rotuloPopulacao(valor) {
        const filtro = normalizarVinculo(valor);

        const rotulos = {
            "": "Todos os vínculos",
            "ATIVOS": "Ativos e formandos",
            "ATIVO": "Somente ativos",
            "FORMANDO": "Formandos",
            "CONCLUINTE RECENTE": "Concluintes recentes",
            "EGRESSO": "Egressos",
            "INATIVOS": "Inativos e evasão provável"
        };

        return rotulos[filtro] || texto(valor);
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
                [...idsPermitidos].map((id) => texto(id))
            )
            : null;

        return dados.filter((aluno) => {
            const idAluno = texto(
                aluno.id_aluno_final
            );

            const atendeIds =
                !conjuntoIds ||
                conjuntoIds.has(idAluno);

            const atendeVinculo = correspondeVinculo(
                aluno.situacao_vinculo,
                filtros.vinculo,
                aluno.elegivel_indicadores_ativos
            );

            const atendeTurma = correspondeExatamente(
                aluno.turma_atual ?? aluno.turma,
                filtros.turma
            );

            const atendeBusca = contemBuscaEmCampos(
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
            const atendeAno = correspondeExatamente(
                registro.ano,
                filtros.ano
            );

            const atendeVinculo = correspondeVinculo(
                registro.situacao_vinculo,
                filtros.vinculo,
                registro.elegivel_indicadores_ativos
            );

            const atendeTurma = correspondeExatamente(
                registro.turma,
                filtros.turma
            );

            const atendeBusca = contemBuscaEmCampos(
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
                atendeBusca
            );
        });
    }

    // ---------------------------------------------------------
    // Filtro de disciplinas
    // ---------------------------------------------------------

    function filtrarDisciplinas(
        dados,
        filtros
    ) {
        if (!Array.isArray(dados)) {
            return [];
        }

        return dados.filter((disciplina) => {
            const atendeAno = correspondeExatamente(
                disciplina.ano,
                filtros.ano
            );

            const atendeDisciplina =
                correspondeExatamente(
                    disciplina.disciplina,
                    filtros.disciplina
                );

            const atendeBusca = contemBuscaEmCampos(
                disciplina,
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
    // Filtro de turmas
    // ---------------------------------------------------------

    function filtrarTurmas(
        dados,
        filtros
    ) {
        if (!Array.isArray(dados)) {
            return [];
        }

        return dados.filter((turma) => {
            const atendeAno = correspondeExatamente(
                turma.ano,
                filtros.ano
            );

            const atendeTurma = correspondeExatamente(
                turma.turma,
                filtros.turma
            );

            const atendeBusca = contemBuscaEmCampos(
                turma,
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
    // Filtro do ranking
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
                [...idsPermitidos].map((id) => texto(id))
            )
            : null;

        return dados.filter((aluno) => {
            const atendeIds =
                !conjuntoIds ||
                conjuntoIds.has(
                    texto(aluno.id_aluno_final)
                );

            const atendeVinculo = correspondeVinculo(
                aluno.situacao_vinculo,
                filtros.vinculo,
                aluno.elegivel_indicadores_ativos
            );

            const atendeTurma = correspondeExatamente(
                aluno.turma_atual ?? aluno.turma,
                filtros.turma
            );

            const atendeBusca = contemBuscaEmCampos(
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
                atendeBusca
            );
        });
    }

    // ---------------------------------------------------------
    // Classes visuais
    // ---------------------------------------------------------

    function classeClassificacao(valor) {
        const classificacao = normalizarTexto(valor);

        if (
            classificacao.includes("DESTAQUE") ||
            classificacao.includes("EXCELENTE") ||
            classificacao.includes("MUITO BOM")
        ) {
            return "badge-success";
        }

        if (
            classificacao.includes("ATENCAO") ||
            classificacao.includes("REGULAR") ||
            classificacao.includes("MODERADO")
        ) {
            return "badge-warning";
        }

        if (
            classificacao.includes("CRITICO") ||
            classificacao.includes("INSUFICIENTE")
        ) {
            return "badge-danger";
        }

        return "badge-neutral";
    }

    function classeRisco(valor) {
        const risco = normalizarTexto(valor);

        if (
            risco.includes("ALTO") ||
            risco.includes("CRITICO")
        ) {
            return "badge-danger";
        }

        if (
            risco.includes("MEDIO") ||
            risco.includes("MODERADO")
        ) {
            return "badge-warning";
        }

        if (
            risco.includes("BAIXO") ||
            risco.includes("SEM RISCO")
        ) {
            return "badge-success";
        }

        return "badge-neutral";
    }

    function classeVinculo(valor) {
        const vinculo = normalizarVinculo(valor);

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
        const tendencia = normalizarTexto(valor);

        if (
            tendencia.includes("CRESCENTE") ||
            tendencia.includes("ALTA")
        ) {
            return "badge-success";
        }

        if (
            tendencia.includes("DECRESCENTE") ||
            tendencia.includes("QUEDA")
        ) {
            return "badge-danger";
        }

        if (tendencia.includes("ESTAVEL")) {
            return "badge-purple";
        }

        return "badge-neutral";
    }

    // ---------------------------------------------------------
    // Criação de badges
    // ---------------------------------------------------------

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
            conteudo = conteudo || "Sem histórico";
            classe = classeTendencia(conteudo);
        } else {
            conteudo = conteudo || "Sem informação";
            classe = classeClassificacao(conteudo);
        }

        return `
            <span class="badge ${classe}">
                ${escaparHTML(conteudo)}
            </span>
        `;
    }

    // ---------------------------------------------------------
    // Apoio para indicadores
    // ---------------------------------------------------------

    function media(dados, campo) {
        if (!Array.isArray(dados)) {
            return null;
        }

        const valores = dados
            .map((item) => numero(item?.[campo]))
            .filter((valor) => valor !== null);

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

        return dados.reduce((total, item) => {
            const valor = numero(item?.[campo], 0);
            return total + valor;
        }, 0);
    }

    function contarDistintos(dados, campo) {
        if (!Array.isArray(dados)) {
            return 0;
        }

        return new Set(
            dados
                .map((item) => texto(item?.[campo]))
                .filter(Boolean)
        ).size;
    }

    // ---------------------------------------------------------
    // Disponibilização para os outros scripts
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

        filtrarAlunos,
        filtrarAlunosPorAno,
        filtrarDisciplinas,
        filtrarTurmas,
        filtrarRanking,

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
