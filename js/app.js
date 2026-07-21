/* ============================================================
   DASHBOARD DE ALUNOS — APLICAÇÃO PRINCIPAL
   ============================================================ */

(function () {
    "use strict";

    const F = window.DashboardFilters;
    const G = window.DashboardCharts;

    const ARQUIVOS = {
        indicadoresGerais: "data/indicadores_gerais.json",
        indicadoresPorAno: "data/indicadores_por_ano.json",
        alunos: "data/alunos.json",
        alunosPorAno: "data/alunos_por_ano.json",
        disciplinas: "data/disciplinas.json",
        turmas: "data/turmas.json",
        ranking: "data/ranking_geral.json",
        metadados: "data/metadados.json"
    };

    const estado = {
        dados: {
            indicadoresGerais: [],
            indicadoresPorAno: [],
            alunos: [],
            alunosPorAno: [],
            disciplinas: [],
            turmas: [],
            ranking: [],
            metadados: {}
        },
        paginaAtual: "visao-geral"
    };

    const TITULOS_PAGINAS = {
        "visao-geral": "Visão geral",
        "alunos": "Alunos",
        "disciplinas": "Disciplinas",
        "turmas": "Turmas",
        "rankings": "Rankings",
        "monitoramento": "Monitoramento"
    };

    // ---------------------------------------------------------
    // Utilidades
    // ---------------------------------------------------------

    function elemento(id) {
        return document.getElementById(id);
    }

    function definirTexto(id, valor) {
        const alvo = elemento(id);

        if (alvo) {
            alvo.textContent = valor;
        }
    }

    function mostrar(id) {
        elemento(id)?.classList.remove("hidden");
    }

    function ocultar(id) {
        elemento(id)?.classList.add("hidden");
    }

    function garantirArray(valor) {
        if (Array.isArray(valor)) {
            return valor;
        }

        if (valor && Array.isArray(valor.dados)) {
            return valor.dados;
        }

        if (valor && typeof valor === "object") {
            return [valor];
        }

        return [];
    }

    function media(dados, campo) {
        const valores = dados
            .map((item) => Number(item?.[campo]))
            .filter(Number.isFinite);

        if (!valores.length) {
            return null;
        }

        return valores.reduce(
            (soma, valor) => soma + valor,
            0
        ) / valores.length;
    }

    function somar(dados, campo) {
        return dados.reduce((soma, item) => {
            const valor = Number(item?.[campo]);
            return soma + (Number.isFinite(valor) ? valor : 0);
        }, 0);
    }

    function linhaVazia(colunas, mensagem = "Nenhum registro encontrado.") {
        return `
            <tr>
                <td colspan="${colunas}" class="empty-table">
                    ${F.escaparHTML(mensagem)}
                </td>
            </tr>
        `;
    }

    function limitarTexto(valor, limite = 70) {
        const conteudo = F.texto(valor);

        if (conteudo.length <= limite) {
            return conteudo;
        }

        return `${conteudo.slice(0, limite - 1)}…`;
    }

    // ---------------------------------------------------------
    // Carregamento dos arquivos JSON
    // ---------------------------------------------------------

    async function carregarJSON(caminho, obrigatorio = true) {
        try {
            const resposta = await fetch(caminho, {
                cache: "no-store"
            });

            if (!resposta.ok) {
                throw new Error(
                    `${resposta.status} ${resposta.statusText}`
                );
            }

            return await resposta.json();
        } catch (erro) {
            console.error(`Erro ao carregar ${caminho}:`, erro);

            if (obrigatorio) {
                throw new Error(
                    `Não foi possível carregar o arquivo ${caminho}.`
                );
            }

            return null;
        }
    }

    async function carregarDados() {
        mostrar("loadingState");
        ocultar("errorState");
        ocultar("dashboardContent");

        const [
            indicadoresGerais,
            indicadoresPorAno,
            alunos,
            alunosPorAno,
            disciplinas,
            turmas,
            ranking,
            metadados
        ] = await Promise.all([
            carregarJSON(ARQUIVOS.indicadoresGerais, false),
            carregarJSON(ARQUIVOS.indicadoresPorAno),
            carregarJSON(ARQUIVOS.alunos),
            carregarJSON(ARQUIVOS.alunosPorAno, false),
            carregarJSON(ARQUIVOS.disciplinas),
            carregarJSON(ARQUIVOS.turmas),
            carregarJSON(ARQUIVOS.ranking, false),
            carregarJSON(ARQUIVOS.metadados, false)
        ]);

        estado.dados.indicadoresGerais =
            garantirArray(indicadoresGerais);

        estado.dados.indicadoresPorAno =
            garantirArray(indicadoresPorAno);

        estado.dados.alunos = garantirArray(alunos);
        estado.dados.alunosPorAno = garantirArray(alunosPorAno);
        estado.dados.disciplinas = garantirArray(disciplinas);
        estado.dados.turmas = garantirArray(turmas);

        estado.dados.ranking = garantirArray(ranking).length
            ? garantirArray(ranking)
            : [...estado.dados.alunos];

        estado.dados.metadados =
            metadados && typeof metadados === "object"
                ? metadados
                : {};

        ocultar("loadingState");
        mostrar("dashboardContent");
    }

    // ---------------------------------------------------------
    // Filtros
    // ---------------------------------------------------------

    function popularFiltros() {
        const anos = [
            ...F.valoresUnicos(
                estado.dados.indicadoresPorAno,
                "ano"
            ),
            ...F.valoresUnicos(
                estado.dados.alunosPorAno,
                "ano"
            ),
            ...F.valoresUnicos(
                estado.dados.turmas,
                "ano"
            )
        ];

        const anosUnicos = [...new Set(
            anos.map((valor) => F.texto(valor))
        )].sort(F.compararValores);

        const turmas = [
            ...F.valoresUnicos(
                estado.dados.alunosPorAno,
                "turma"
            ),
            ...F.valoresUnicos(
                estado.dados.alunos,
                "turma_atual"
            ),
            ...F.valoresUnicos(
                estado.dados.turmas,
                "turma"
            )
        ];

        const turmasUnicas = [...new Set(
            turmas
                .map((valor) => F.texto(valor))
                .filter(Boolean)
        )].sort(F.compararValores);

        const disciplinas = F.valoresUnicos(
            estado.dados.disciplinas,
            "disciplina"
        );

        F.preencherSelect(
            elemento("filtroAno"),
            anosUnicos,
            "Todos os anos"
        );

        F.preencherSelect(
            elemento("filtroTurma"),
            turmasUnicas,
            "Todas as turmas"
        );

        F.preencherSelect(
            elemento("filtroDisciplina"),
            disciplinas,
            "Todas as disciplinas"
        );
    }

    function obterDadosFiltrados() {
        const filtros = F.obterFiltrosAtuais();

        const alunosPorAno = F.filtrarAlunosPorAno(
            estado.dados.alunosPorAno,
            filtros
        );

        let idsPermitidos = null;

        if (
            filtros.ano &&
            estado.dados.alunosPorAno.length
        ) {
            idsPermitidos = new Set(
                alunosPorAno
                    .map((item) => F.texto(item.id_aluno_final))
                    .filter(Boolean)
            );
        }

        let alunos = F.filtrarAlunos(
            estado.dados.alunos,
            {
                ...filtros,
                ano: ""
            }
        );

        if (idsPermitidos) {
            alunos = alunos.filter((aluno) =>
                idsPermitidos.has(
                    F.texto(aluno.id_aluno_final)
                )
            );
        }

        const disciplinas = F.filtrarDisciplinas(
            estado.dados.disciplinas,
            filtros
        );

        const turmas = F.filtrarTurmas(
            estado.dados.turmas,
            filtros
        );

        const anos = estado.dados.indicadoresPorAno.filter(
            (item) =>
                !filtros.ano ||
                F.correspondeExatamente(item.ano, filtros.ano)
        );

        const ranking = F.filtrarRanking(
            estado.dados.ranking,
            filtros,
            idsPermitidos ? [...idsPermitidos] : null
        );

        return {
            filtros,
            alunos,
            alunosPorAno,
            disciplinas,
            turmas,
            indicadoresPorAno: anos,
            ranking
        };
    }

    // ---------------------------------------------------------
    // Indicadores principais
    // ---------------------------------------------------------

    function atualizarIndicadores(dados) {
        const quantidadeAlunos = dados.alunos.length;

        const mediaGeral = media(
            dados.alunos,
            "media_historica"
        );

        const frequenciaMedia = media(
            dados.alunos,
            "frequencia_media"
        );

        const alunosAtencao = dados.alunos.filter((aluno) => {
            const risco = F.normalizarTexto(aluno.nivel_risco);
            const pontos = Number(aluno.pontos_risco);

            return (
                risco.includes("alto") ||
                risco.includes("medio") ||
                risco.includes("moderado") ||
                (Number.isFinite(pontos) && pontos > 0)
            );
        }).length;

        definirTexto(
            "kpiAlunos",
            F.formatarInteiro(quantidadeAlunos)
        );

        definirTexto(
            "kpiMedia",
            F.formatarNumero(mediaGeral, 2)
        );

        definirTexto(
            "kpiFrequencia",
            F.formatarPercentual(frequenciaMedia, 1)
        );

        definirTexto(
            "kpiAtencao",
            F.formatarInteiro(alunosAtencao)
        );
    }

    // ---------------------------------------------------------
    // Tabela de alunos
    // ---------------------------------------------------------

    function renderizarTabelaAlunos(alunos) {
        const corpo = elemento("tabelaAlunos");

        if (!corpo) {
            return;
        }

        definirTexto(
            "totalAlunosTabela",
            F.formatarInteiro(alunos.length)
        );

        const ordenados = [...alunos].sort((a, b) =>
            F.compararValores(
                a.nome_aluno_final,
                b.nome_aluno_final
            )
        );

        if (!ordenados.length) {
            corpo.innerHTML = linhaVazia(7);
            return;
        }

        corpo.innerHTML = ordenados
            .slice(0, 500)
            .map((aluno) => `
                <tr>
                    <td>
                        <strong>
                            ${F.escaparHTML(
                                aluno.nome_aluno_final ||
                                aluno.nome_aluno ||
                                "Sem identificação"
                            )}
                        </strong>
                    </td>
                    <td>
                        ${F.escaparHTML(
                            aluno.turma_atual || "—"
                        )}
                    </td>
                    <td>
                        ${F.escaparHTML(
                            aluno.serie_atual || "—"
                        )}
                    </td>
                    <td>
                        ${F.formatarNumero(
                            aluno.media_historica,
                            2
                        )}
                    </td>
                    <td>
                        ${F.formatarPercentual(
                            aluno.frequencia_media,
                            1
                        )}
                    </td>
                    <td>
                        ${F.criarBadge(
                            aluno.classificacao
                        )}
                    </td>
                    <td>
                        ${F.criarBadge(
                            aluno.nivel_risco,
                            "risco"
                        )}
                    </td>
                </tr>
            `)
            .join("");
    }

    // ---------------------------------------------------------
    // Tabela de disciplinas
    // ---------------------------------------------------------

    function renderizarTabelaDisciplinas(disciplinas) {
        const corpo = elemento("tabelaDisciplinas");

        if (!corpo) {
            return;
        }

        const ordenadas = [...disciplinas].sort((a, b) =>
            F.compararValores(a.disciplina, b.disciplina)
        );

        if (!ordenadas.length) {
            corpo.innerHTML = linhaVazia(7);
            return;
        }

        corpo.innerHTML = ordenadas
            .slice(0, 500)
            .map((item) => `
                <tr>
                    <td>
                        <strong>
                            ${F.escaparHTML(
                                item.disciplina || "Sem disciplina"
                            )}
                        </strong>
                    </td>
                    <td>${F.escaparHTML(item.ano || "—")}</td>
                    <td>
                        ${F.formatarInteiro(
                            item.alunos_distintos
                        )}
                    </td>
                    <td>
                        ${F.formatarNumero(
                            item.media_notas,
                            2
                        )}
                    </td>
                    <td>
                        ${F.formatarPercentual(
                            item.frequencia_media,
                            1
                        )}
                    </td>
                    <td>
                        ${F.formatarPercentual(
                            item.percentual_notas_abaixo_6,
                            1
                        )}
                    </td>
                    <td>
                        ${F.formatarInteiro(
                            item.quantidade_notas
                        )}
                    </td>
                </tr>
            `)
            .join("");
    }

    // ---------------------------------------------------------
    // Tabela de turmas
    // ---------------------------------------------------------

    function renderizarTabelaTurmas(turmas) {
        const corpo = elemento("tabelaTurmas");

        if (!corpo) {
            return;
        }

        const ordenadas = [...turmas].sort((a, b) => {
            const comparacaoAno =
                Number(b.ano) - Number(a.ano);

            if (comparacaoAno) {
                return comparacaoAno;
            }

            return F.compararValores(a.turma, b.turma);
        });

        if (!ordenadas.length) {
            corpo.innerHTML = linhaVazia(8);
            return;
        }

        corpo.innerHTML = ordenadas
            .slice(0, 500)
            .map((item) => `
                <tr>
                    <td>
                        <strong>
                            ${F.escaparHTML(
                                item.turma || "Sem turma"
                            )}
                        </strong>
                    </td>
                    <td>${F.escaparHTML(item.ano || "—")}</td>
                    <td>
                        ${F.escaparHTML(
                            item.serie_numero || "—"
                        )}
                    </td>
                    <td>
                        ${F.formatarInteiro(
                            item.alunos_distintos
                        )}
                    </td>
                    <td>
                        ${F.formatarNumero(
                            item.media_notas,
                            2
                        )}
                    </td>
                    <td>
                        ${F.formatarPercentual(
                            item.frequencia_media,
                            1
                        )}
                    </td>
                    <td>
                        ${F.formatarInteiro(
                            item.disciplinas_distintas
                        )}
                    </td>
                    <td>
                        ${F.formatarNumero(
                            item.total_faltas_horas,
                            1
                        )}
                    </td>
                </tr>
            `)
            .join("");
    }

    // ---------------------------------------------------------
    // Ranking
    // ---------------------------------------------------------

    function renderizarRanking(ranking) {
        const corpo = elemento("tabelaRanking");

        if (!corpo) {
            return;
        }

        const elegiveis = ranking.filter((aluno) => {
            const valor = aluno.elegivel_ranking;

            if (valor === undefined || valor === null) {
                return true;
            }

            return (
                valor === true ||
                valor === 1 ||
                F.normalizarTexto(valor) === "true" ||
                F.normalizarTexto(valor) === "sim"
            );
        });

        const ordenados = [...elegiveis].sort((a, b) => {
            const posicaoA = Number(a.posicao);
            const posicaoB = Number(b.posicao);

            if (
                Number.isFinite(posicaoA) &&
                Number.isFinite(posicaoB)
            ) {
                return posicaoA - posicaoB;
            }

            return (
                Number(b.indice_merito || 0) -
                Number(a.indice_merito || 0)
            );
        });

        if (!ordenados.length) {
            corpo.innerHTML = linhaVazia(7);
            return;
        }

        corpo.innerHTML = ordenados
            .slice(0, 100)
            .map((aluno, indice) => {
                const posicao =
                    Number(aluno.posicao) || indice + 1;

                return `
                    <tr>
                        <td>
                            <strong>${posicao}º</strong>
                        </td>
                        <td>
                            <strong>
                                ${F.escaparHTML(
                                    aluno.nome_aluno_final ||
                                    aluno.nome_aluno ||
                                    "Sem identificação"
                                )}
                            </strong>
                        </td>
                        <td>
                            ${F.escaparHTML(
                                aluno.turma_atual || "—"
                            )}
                        </td>
                        <td>
                            ${F.formatarNumero(
                                aluno.media_historica,
                                2
                            )}
                        </td>
                        <td>
                            ${F.formatarPercentual(
                                aluno.frequencia_media,
                                1
                            )}
                        </td>
                        <td>
                            ${F.formatarNumero(
                                aluno.indice_merito,
                                2
                            )}
                        </td>
                        <td>
                            ${F.criarBadge(
                                aluno.classificacao
                            )}
                        </td>
                    </tr>
                `;
            })
            .join("");
    }

    // ---------------------------------------------------------
    // Monitoramento
    // ---------------------------------------------------------

    function renderizarMonitoramento(alunos) {
        const riscoAlto = alunos.filter((aluno) => {
            const risco = F.normalizarTexto(aluno.nivel_risco);

            return (
                risco.includes("alto") ||
                risco.includes("critico")
            );
        });

        const baixaFrequencia = alunos.filter((aluno) => {
            const valor = Number(aluno.frequencia_media);
            return Number.isFinite(valor) && valor < 75;
        });

        const queda = alunos.filter((aluno) => {
            const tendencia = F.normalizarTexto(aluno.tendencia);
            const variacao = Number(aluno.variacao_media);

            return (
                tendencia.includes("queda") ||
                (Number.isFinite(variacao) && variacao < -0.5)
            );
        });

        const semDados = alunos.filter((aluno) => {
            const mediaAluno = Number(aluno.media_historica);
            const quantidade = Number(aluno.quantidade_notas);

            return (
                !Number.isFinite(mediaAluno) ||
                !Number.isFinite(quantidade) ||
                quantidade === 0
            );
        });

        definirTexto(
            "monitorRiscoAlto",
            F.formatarInteiro(riscoAlto.length)
        );

        definirTexto(
            "monitorBaixaFrequencia",
            F.formatarInteiro(baixaFrequencia.length)
        );

        definirTexto(
            "monitorQueda",
            F.formatarInteiro(queda.length)
        );

        definirTexto(
            "monitorSemDados",
            F.formatarInteiro(semDados.length)
        );

        const corpo = elemento("tabelaMonitoramento");

        if (!corpo) {
            return;
        }

        const monitorados = alunos
            .filter((aluno) => {
                const risco = F.normalizarTexto(
                    aluno.nivel_risco
                );

                const frequencia = Number(
                    aluno.frequencia_media
                );

                const variacao = Number(
                    aluno.variacao_media
                );

                return (
                    risco.includes("alto") ||
                    risco.includes("medio") ||
                    risco.includes("moderado") ||
                    (
                        Number.isFinite(frequencia) &&
                        frequencia < 75
                    ) ||
                    (
                        Number.isFinite(variacao) &&
                        variacao < -0.5
                    )
                );
            })
            .sort(
                (a, b) =>
                    Number(b.pontos_risco || 0) -
                    Number(a.pontos_risco || 0)
            );

        if (!monitorados.length) {
            corpo.innerHTML = linhaVazia(
                7,
                "Nenhum aluno em situação de atenção."
            );
            return;
        }

        corpo.innerHTML = monitorados
            .slice(0, 200)
            .map((aluno) => `
                <tr>
                    <td>
                        <strong>
                            ${F.escaparHTML(
                                aluno.nome_aluno_final ||
                                aluno.nome_aluno ||
                                "Sem identificação"
                            )}
                        </strong>
                    </td>
                    <td>
                        ${F.escaparHTML(
                            aluno.turma_atual || "—"
                        )}
                    </td>
                    <td>
                        ${F.formatarNumero(
                            aluno.media_historica,
                            2
                        )}
                    </td>
                    <td>
                        ${F.formatarPercentual(
                            aluno.frequencia_media,
                            1
                        )}
                    </td>
                    <td>
                        ${F.escaparHTML(
                            aluno.tendencia || "—"
                        )}
                    </td>
                    <td>
                        ${F.criarBadge(
                            aluno.nivel_risco,
                            "risco"
                        )}
                    </td>
                    <td title="${F.escaparHTML(
                        aluno.motivos_risco || ""
                    )}">
                        ${F.escaparHTML(
                            limitarTexto(
                                aluno.motivos_risco ||
                                "Sem motivo informado"
                            )
                        )}
                    </td>
                </tr>
            `)
            .join("");
    }

    // ---------------------------------------------------------
    // Gráficos e atualização geral
    // ---------------------------------------------------------

    function atualizarDashboard() {
        const dados = obterDadosFiltrados();

        atualizarIndicadores(dados);
        renderizarTabelaAlunos(dados.alunos);
        renderizarTabelaDisciplinas(dados.disciplinas);
        renderizarTabelaTurmas(dados.turmas);
        renderizarRanking(dados.ranking);
        renderizarMonitoramento(dados.alunos);

        G.renderizarTodos({
            indicadoresPorAno: dados.indicadoresPorAno,
            alunos: dados.alunos,
            turmas: dados.turmas,
            disciplinas: dados.disciplinas
        });
    }

    // ---------------------------------------------------------
    // Navegação
    // ---------------------------------------------------------

    function abrirPagina(nomePagina) {
        const pagina = TITULOS_PAGINAS[nomePagina]
            ? nomePagina
            : "visao-geral";

        estado.paginaAtual = pagina;

        document
            .querySelectorAll(".page-section")
            .forEach((secao) => {
                secao.classList.remove("active");
            });

        elemento(`page-${pagina}`)?.classList.add("active");

        document
            .querySelectorAll(".nav-item")
            .forEach((botao) => {
                botao.classList.toggle(
                    "active",
                    botao.dataset.page === pagina
                );
            });

        definirTexto(
            "pageTitle",
            TITULOS_PAGINAS[pagina]
        );

        elemento("sidebar")?.classList.remove("open");

        setTimeout(() => {
            window.dispatchEvent(new Event("resize"));
        }, 100);
    }

    // ---------------------------------------------------------
    // Metadados
    // ---------------------------------------------------------

    function exibirAtualizacao() {
        const metadados = estado.dados.metadados;

        const data =
            metadados.data_atualizacao ||
            metadados.gerado_em ||
            metadados.data_processamento ||
            metadados.atualizado_em;

        definirTexto(
            "dataAtualizacao",
            data
                ? `Atualizado em ${F.formatarData(data)}`
                : "Dados carregados"
        );
    }

    // ---------------------------------------------------------
    // Eventos
    // ---------------------------------------------------------

    function configurarEventos() {
        document
            .querySelectorAll(".nav-item")
            .forEach((botao) => {
                botao.addEventListener("click", () => {
                    abrirPagina(botao.dataset.page);
                });
            });

        elemento("menuButton")?.addEventListener(
            "click",
            () => {
                elemento("sidebar")?.classList.toggle("open");
            }
        );

        [
            "filtroAno",
            "filtroTurma",
            "filtroDisciplina"
        ].forEach((id) => {
            elemento(id)?.addEventListener(
                "change",
                atualizarDashboard
            );
        });

        let temporizadorBusca;

        elemento("filtroBusca")?.addEventListener(
            "input",
            () => {
                clearTimeout(temporizadorBusca);

                temporizadorBusca = setTimeout(
                    atualizarDashboard,
                    250
                );
            }
        );

        elemento("limparFiltros")?.addEventListener(
            "click",
            () => {
                F.limparFiltros();
                atualizarDashboard();
            }
        );
    }

    // ---------------------------------------------------------
    // Inicialização
    // ---------------------------------------------------------

    async function iniciar() {
        try {
            if (!F || !G) {
                throw new Error(
                    "Os arquivos filters.js ou charts.js não foram carregados."
                );
            }

            configurarEventos();
            abrirPagina("visao-geral");

            await carregarDados();

            popularFiltros();
            exibirAtualizacao();
            atualizarDashboard();
        } catch (erro) {
            console.error("Erro ao iniciar o dashboard:", erro);

            ocultar("loadingState");
            ocultar("dashboardContent");
            mostrar("errorState");

            const caixaErro = elemento("errorState");

            if (caixaErro) {
                const paragrafo = caixaErro.querySelector("p");

                if (paragrafo) {
                    paragrafo.textContent =
                        `${erro.message} Verifique se os arquivos JSON estão na pasta data.`;
                }
            }
        }
    }

    document.addEventListener("DOMContentLoaded", iniciar);
})();
