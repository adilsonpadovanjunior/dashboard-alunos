/* ============================================================
   DASHBOARD DE ALUNOS — FILTROS E FUNÇÕES AUXILIARES
   ============================================================ */

(function () {
    "use strict";

    // ---------------------------------------------------------
    // Normalização e segurança
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
            .toLowerCase()
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

    function numero(valor, valorPadrao = 0) {
        if (typeof valor === "number") {
            return Number.isFinite(valor) ? valor : valorPadrao;
        }

        const convertido = Number(
            texto(valor)
                .replace(/\./g, "")
                .replace(",", ".")
        );

        return Number.isFinite(convertido) ? convertido : valorPadrao;
    }

    // ---------------------------------------------------------
    // Formatação
    // ---------------------------------------------------------

    function formatarNumero(valor, casas = 1) {
        const convertido = Number(valor);

        if (!Number.isFinite(convertido)) {
            return "—";
        }

        return convertido.toLocaleString("pt-BR", {
            minimumFractionDigits: casas,
            maximumFractionDigits: casas
        });
    }

    function formatarInteiro(valor) {
        const convertido = Number(valor);

        if (!Number.isFinite(convertido)) {
            return "—";
        }

        return Math.round(convertido).toLocaleString("pt-BR");
    }

    function formatarPercentual(valor, casas = 1) {
        const convertido = Number(valor);

        if (!Number.isFinite(convertido)) {
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

    // ---------------------------------------------------------
    // Valores únicos e ordenação
    // ---------------------------------------------------------

    function compararValores(a, b) {
        return texto(a).localeCompare(texto(b), "pt-BR", {
            numeric: true,
            sensitivity: "base"
        });
    }

    function valoresUnicos(dados, campo) {
        const valores = dados
            .map((item) => item?.[campo])
            .filter((valor) => texto(valor) !== "");

        return [...new Set(valores)].sort(compararValores);
    }

    function preencherSelect(elemento, valores, rotuloInicial) {
        if (!elemento) {
            return;
        }

        const valorAtual = elemento.value;

        elemento.innerHTML = "";

        const opcaoInicial = document.createElement("option");
        opcaoInicial.value = "";
        opcaoInicial.textContent = rotuloInicial;
        elemento.appendChild(opcaoInicial);

        valores.forEach((valor) => {
            const opcao = document.createElement("option");
            opcao.value = texto(valor);
            opcao.textContent = texto(valor);
            elemento.appendChild(opcao);
        });

        const valorAindaExiste = [...elemento.options].some(
            (opcao) => opcao.value === valorAtual
        );

        if (valorAindaExiste) {
            elemento.value = valorAtual;
        }
    }

    // ---------------------------------------------------------
    // Leitura dos filtros da página
    // ---------------------------------------------------------

    function obterFiltrosAtuais() {
        return {
            ano: texto(document.getElementById("filtroAno")?.value),
            turma: texto(document.getElementById("filtroTurma")?.value),
            disciplina: texto(
                document.getElementById("filtroDisciplina")?.value
            ),
            busca: normalizarTexto(
                document.getElementById("filtroBusca")?.value
            )
        };
    }

    function possuiFiltrosAtivos(filtros = obterFiltrosAtuais()) {
        return Boolean(
            filtros.ano ||
            filtros.turma ||
            filtros.disciplina ||
            filtros.busca
        );
    }

    function limparFiltros() {
        const campos = [
            "filtroAno",
            "filtroTurma",
            "filtroDisciplina",
            "filtroBusca"
        ];

        campos.forEach((id) => {
            const elemento = document.getElementById(id);

            if (elemento) {
                elemento.value = "";
            }
        });
    }

    // ---------------------------------------------------------
    // Comparações
    // ---------------------------------------------------------

    function correspondeExatamente(valor, filtro) {
        if (!filtro) {
            return true;
        }

        return normalizarTexto(valor) === normalizarTexto(filtro);
    }

    function contemTexto(valor, busca) {
        if (!busca) {
            return true;
        }

        return normalizarTexto(valor).includes(normalizarTexto(busca));
    }

    function contemBuscaEmCampos(item, busca, campos) {
        if (!busca) {
            return true;
        }

        return campos.some((campo) => contemTexto(item?.[campo], busca));
    }

    // ---------------------------------------------------------
    // Filtros por tipo de base
    // ---------------------------------------------------------

    function filtrarAlunos(dados, filtros) {
        return dados.filter((aluno) => {
            const anoAluno =
                aluno.ultimo_ano ??
                aluno.ano ??
                aluno.primeiro_ano;

            const turmaAluno =
                aluno.turma_atual ??
                aluno.turma;

            const atendeAno = correspondeExatamente(
                anoAluno,
                filtros.ano
            );

            const atendeTurma = correspondeExatamente(
                turmaAluno,
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
                    "status_atual",
                    "classificacao",
                    "nivel_risco"
                ]
            );

            return atendeAno && atendeTurma && atendeBusca;
        });
    }

    function filtrarAlunosPorAno(dados, filtros) {
        return dados.filter((registro) => {
            const atendeAno = correspondeExatamente(
                registro.ano,
                filtros.ano
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
                    "classificacao"
                ]
            );

            return atendeAno && atendeTurma && atendeBusca;
        });
    }

    function filtrarDisciplinas(dados, filtros) {
        return dados.filter((disciplina) => {
            const atendeAno = correspondeExatamente(
                disciplina.ano,
                filtros.ano
            );

            const atendeDisciplina = correspondeExatamente(
                disciplina.disciplina,
                filtros.disciplina
            );

            const atendeBusca = contemBuscaEmCampos(
                disciplina,
                filtros.busca,
                ["disciplina"]
            );

            return atendeAno && atendeDisciplina && atendeBusca;
        });
    }

    function filtrarTurmas(dados, filtros) {
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
                ["turma", "serie_numero"]
            );

            return atendeAno && atendeTurma && atendeBusca;
        });
    }

    function filtrarRanking(dados, filtros, idsPermitidos = null) {
        const conjuntoIds = idsPermitidos
            ? new Set(idsPermitidos.map(texto))
            : null;

        return dados.filter((aluno) => {
            const atendeIds =
                !conjuntoIds ||
                conjuntoIds.has(texto(aluno.id_aluno_final));

            const atendeTurma =
                !filtros.turma ||
                correspondeExatamente(
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
                    "classificacao"
                ]
            );

            return atendeIds && atendeTurma && atendeBusca;
        });
    }

    // ---------------------------------------------------------
    // Aparência dos indicadores
    // ---------------------------------------------------------

    function classeClassificacao(valor) {
        const classificacao = normalizarTexto(valor);

        if (
            classificacao.includes("excelente") ||
            classificacao.includes("destaque") ||
            classificacao.includes("muito bom")
        ) {
            return "badge-success";
        }

        if (
            classificacao.includes("atencao") ||
            classificacao.includes("regular") ||
            classificacao.includes("moderado")
        ) {
            return "badge-warning";
        }

        if (
            classificacao.includes("risco") ||
            classificacao.includes("critico") ||
            classificacao.includes("insuficiente")
        ) {
            return "badge-danger";
        }

        return "badge-neutral";
    }

    function classeRisco(valor) {
        const risco = normalizarTexto(valor);

        if (
            risco.includes("alto") ||
            risco.includes("critico")
        ) {
            return "badge-danger";
        }

        if (
            risco.includes("medio") ||
            risco.includes("moderado")
        ) {
            return "badge-warning";
        }

        if (
            risco.includes("baixo") ||
            risco.includes("sem risco")
        ) {
            return "badge-success";
        }

        return "badge-neutral";
    }

    function criarBadge(valor, tipo = "classificacao") {
        const conteudo = texto(valor) || "Sem informação";

        const classe =
            tipo === "risco"
                ? classeRisco(conteudo)
                : classeClassificacao(conteudo);

        return `<span class="badge ${classe}">${escaparHTML(conteudo)}</span>`;
    }

    // ---------------------------------------------------------
    // Disponibilização para os demais scripts
    // ---------------------------------------------------------

    window.DashboardFilters = {
        texto,
        numero,
        normalizarTexto,
        escaparHTML,
        formatarNumero,
        formatarInteiro,
        formatarPercentual,
        formatarData,
        compararValores,
        valoresUnicos,
        preencherSelect,
        obterFiltrosAtuais,
        possuiFiltrosAtivos,
        limparFiltros,
        correspondeExatamente,
        contemTexto,
        contemBuscaEmCampos,
        filtrarAlunos,
        filtrarAlunosPorAno,
        filtrarDisciplinas,
        filtrarTurmas,
        filtrarRanking,
        classeClassificacao,
        classeRisco,
        criarBadge
    };
})();
