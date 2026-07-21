/* ============================================================
   PAINEL DE GESTÃO ACADÊMICA
   Aplicação principal
   ============================================================ */

(function () {
    "use strict";

    const F = window.DashboardFilters;
    const G = window.DashboardCharts;

    // ---------------------------------------------------------
    // Arquivos produzidos pelo Agente 5
    // ---------------------------------------------------------

    const ARQUIVOS = {
        indicadoresGerais:
            "data/indicadores_gerais.json",

        indicadoresPorAno:
            "data/indicadores_por_ano.json",

        indicadoresVinculo:
            "data/indicadores_por_vinculo.json",

        alunos:
            "data/alunos.json",

        alunosPorAno:
            "data/alunos_por_ano.json",

        disciplinas:
            "data/disciplinas.json",

        disciplinasHistoricas:
            "data/disciplinas_historicas.json",

        turmas:
            "data/turmas.json",

        turmasHistoricas:
            "data/turmas_historicas.json",

        ranking:
            "data/ranking_geral.json",

        monitoramento:
            "data/monitoramento_permanencia.json",

        metadados:
            "data/metadados.json"
    };

    const estado = {
        paginaAtual: "visao-geral",

        dados: {
            indicadoresGerais: [],
            indicadoresPorAno: [],
            indicadoresVinculo: [],
            alunos: [],
            alunosPorAno: [],
            disciplinas: [],
            disciplinasHistoricas: [],
            turmas: [],
            turmasHistoricas: [],
            ranking: [],
            monitoramento: [],
            metadados: {}
        }
    };

    const TITULOS_PAGINAS = {
        "visao-geral": "Visão geral",
        "alunos": "Alunos",
        "disciplinas": "Disciplinas",
        "turmas": "Turmas",
        "rankings": "Destaques",
        "monitoramento": "Monitoramento"
    };

    // ---------------------------------------------------------
    // Elementos e utilidades
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

        if (
            valor &&
            Array.isArray(valor.dados)
        ) {
            return valor.dados;
        }

        return [];
    }

    function linhaVazia(
        colunas,
        mensagem = "Nenhum registro encontrado."
    ) {
        return `
            <tr>
                <td
                    colspan="${colunas}"
                    class="empty-table"
                >
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

    function nomeAluno(aluno) {
        return (
            aluno.nome_aluno_final ||
            aluno.nome_aluno ||
            "Sem identificação"
        );
    }

    function turmaAluno(aluno) {
        return (
            aluno.turma_atual ||
            aluno.turma ||
            "—"
        );
    }

    function obterAnoReferencia() {
        const metadados = estado.dados.metadados;

        const anoMetadados = F.numero(
            metadados.ano_referencia
        );

        if (anoMetadados !== null) {
            return anoMetadados;
        }

        const anos = estado.dados.indicadoresPorAno
            .map((item) => F.numero(item.ano))
            .filter((valor) => valor !== null);

        return anos.length
            ? Math.max(...anos)
            : null;
    }

    function valorAlunoNoPeriodo(
        aluno,
        campoAtual,
        campoHistorico
    ) {
        const atual = F.numero(aluno?.[campoAtual]);

        if (atual !== null) {
            return atual;
        }

        return F.numero(aluno?.[campoHistorico]);
    }

    // ---------------------------------------------------------
    // Carregamento
    // ---------------------------------------------------------

    async function carregarJSON(
        caminho,
        obrigatorio = true
    ) {
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
            console.warn(
                `Não foi possível carregar ${caminho}:`,
                erro
            );

            if (obrigatorio) {
                throw new Error(
                    `Arquivo obrigatório não encontrado: ${caminho}`
                );
            }

            return null;
        }
    }

    async function carregarDados() {
        mostrar("loadingState");
        ocultar("errorState");
        ocultar("dashboardContent");

        const resultados = await Promise.all([
            carregarJSON(
                ARQUIVOS.indicadoresGerais,
                false
            ),

            carregarJSON(
                ARQUIVOS.indicadoresPorAno,
                true
            ),

            carregarJSON(
                ARQUIVOS.indicadoresVinculo,
                false
            ),

            carregarJSON(
                ARQUIVOS.alunos,
                true
            ),

            carregarJSON(
                ARQUIVOS.alunosPorAno,
                false
            ),

            carregarJSON(
                ARQUIVOS.disciplinas,
                true
            ),

            carregarJSON(
                ARQUIVOS.disciplinasHistoricas,
                false
            ),

            carregarJSON(
                ARQUIVOS.turmas,
                true
            ),

            carregarJSON(
                ARQUIVOS.turmasHistoricas,
                false
            ),

            carregarJSON(
                ARQUIVOS.ranking,
                false
            ),

            carregarJSON(
                ARQUIVOS.monitoramento,
                false
            ),

            carregarJSON(
                ARQUIVOS.metadados,
                false
            )
        ]);

        const [
            indicadoresGerais,
            indicadoresPorAno,
            indicadoresVinculo,
            alunos,
            alunosPorAno,
            disciplinas,
            disciplinasHistoricas,
            turmas,
            turmasHistoricas,
            ranking,
            monitoramento,
            metadados
        ] = resultados;

        estado.dados.indicadoresGerais =
            garantirArray(indicadoresGerais);

        estado.dados.indicadoresPorAno =
            garantirArray(indicadoresPorAno);

        estado.dados.indicadoresVinculo =
            garantirArray(indicadoresVinculo);

        estado.dados.alunos =
            garantirArray(alunos);

        estado.dados.alunosPorAno =
            garantirArray(alunosPorAno);

        estado.dados.disciplinas =
            garantirArray(disciplinas);

        estado.dados.disciplinasHistoricas =
            garantirArray(disciplinasHistoricas);

        estado.dados.turmas =
            garantirArray(turmas);

        estado.dados.turmasHistoricas =
            garantirArray(turmasHistoricas);

        estado.dados.ranking =
            garantirArray(ranking).length
                ? garantirArray(ranking)
                : [...estado.dados.alunos];

        estado.dados.monitoramento =
            garantirArray(monitoramento).length
                ? garantirArray(monitoramento)
                : [...estado.dados.alunos];

        estado.dados.metadados =
            metadados &&
            typeof metadados === "object"
                ? metadados
                : {};

        ocultar("loadingState");
        mostrar("dashboardContent");
    }

    // ---------------------------------------------------------
    // Preparação dos filtros
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
                estado.dados.disciplinasHistoricas,
                "ano"
            )
        ];

        const anosUnicos = [...new Set(
            anos
                .map((valor) => F.texto(valor))
                .filter(Boolean)
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
                estado.dados.turmasHistoricas,
                "turma"
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

        const baseDisciplinas =
            estado.dados.disciplinasHistoricas.length
                ? estado.dados.disciplinasHistoricas
                : estado.dados.disciplinas;

        const disciplinas = F.valoresUnicos(
            baseDisciplinas,
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

        /*
         * A lista de vínculos já está definida diretamente
         * no HTML. Garantimos apenas a seleção inicial.
         */
        const filtroVinculo =
            elemento("filtroVinculo");

        if (
            filtroVinculo &&
            !filtroVinculo.value
        ) {
            filtroVinculo.value = "ATIVOS";
        }
    }

    // ---------------------------------------------------------
    // Seleção das bases de disciplinas e turmas
    // ---------------------------------------------------------

    function obterBaseDisciplinas(filtros) {
        const anoReferencia = obterAnoReferencia();

        const usandoAnoHistorico =
            filtros.ano &&
            Number(filtros.ano) !== anoReferencia;

        if (
            usandoAnoHistorico &&
            estado.dados.disciplinasHistoricas.length
        ) {
            return estado.dados.disciplinasHistoricas;
        }

        return estado.dados.disciplinas;
    }

    function obterBaseTurmas(filtros) {
        const anoReferencia = obterAnoReferencia();

        const usandoAnoHistorico =
            filtros.ano &&
            Number(filtros.ano) !== anoReferencia;

        if (
            usandoAnoHistorico &&
            estado.dados.turmasHistoricas.length
        ) {
            return estado.dados.turmasHistoricas;
        }

        return estado.dados.turmas;
    }

    // ---------------------------------------------------------
    // Dados filtrados
    // ---------------------------------------------------------

    function obterDadosFiltrados() {
        const filtros = F.obterFiltrosAtuais();

        const alunosPorAno = F.filtrarAlunosPorAno(
            estado.dados.alunosPorAno,
            filtros
        );

        let idsPermitidos = null;

        if (
            (filtros.ano || filtros.turma) &&
            estado.dados.alunosPorAno.length
        ) {
            idsPermitidos = new Set(
                alunosPorAno
                    .map((item) =>
                        F.texto(item.id_aluno_final)
                    )
                    .filter(Boolean)
            );
        }

        const alunos = F.filtrarAlunos(
            estado.dados.alunos,
            filtros,
            idsPermitidos
        );

        const disciplinas = F.filtrarDisciplinas(
            obterBaseDisciplinas(filtros),
            filtros
        );

        const turmas = F.filtrarTurmas(
            obterBaseTurmas(filtros),
            filtros
        );

        const ranking = F.filtrarRanking(
            estado.dados.ranking,
            filtros,
            idsPermitidos
        );

        const indicadoresPorAno =
            estado.dados.indicadoresPorAno.filter(
                (item) =>
                    !filtros.ano ||
                    F.correspondeExatamente(
                        item.ano,
                        filtros.ano
                    )
            );

        const mapaAnual = new Map();

        alunosPorAno.forEach((registro) => {
            mapaAnual.set(
                F.texto(registro.id_aluno_final),
                registro
            );
        });

        return {
            filtros,
            alunos,
            alunosPorAno,
            disciplinas,
            turmas,
            ranking,
            indicadoresPorAno,
            indicadoresVinculo:
                estado.dados.indicadoresVinculo,
            mapaAnual
        };
    }

    function obterMetricasAluno(
        aluno,
        dadosFiltrados
    ) {
        const registroAnual =
            dadosFiltrados.mapaAnual.get(
                F.texto(aluno.id_aluno_final)
            );

        if (
            dadosFiltrados.filtros.ano &&
            registroAnual
        ) {
            return {
                media: F.numero(
                    registroAnual.media_notas
                ),

                frequencia: F.numero(
                    registroAnual.frequencia_media
                ),

                classificacao:
                    registroAnual.classificacao ||
                    aluno.classificacao,

                turma:
                    registroAnual.turma ||
                    turmaAluno(aluno),

                serie:
                    registroAnual.serie_numero ??
                    aluno.serie_atual,

                tendencia: aluno.tendencia
            };
        }

        return {
            media: valorAlunoNoPeriodo(
                aluno,
                "media_ano_referencia",
                "media_historica"
            ),

            frequencia: valorAlunoNoPeriodo(
                aluno,
                "frequencia_ano_referencia",
                "frequencia_media"
            ),

            classificacao:
                aluno.classificacao ||
                aluno.classificacao_historica,

            turma: turmaAluno(aluno),
            serie: aluno.serie_atual,
            tendencia: aluno.tendencia
        };
    }

    // ---------------------------------------------------------
    // Indicadores principais
    // ---------------------------------------------------------

    function atualizarIndicadores(dados) {
        const alunosComMetricas = dados.alunos.map(
            (aluno) => ({
                aluno,
                metricas: obterMetricasAluno(
                    aluno,
                    dados
                )
            })
        );

        const medias = alunosComMetricas
            .map((item) => item.metricas.media)
            .filter((valor) => valor !== null);

        const frequencias = alunosComMetricas
            .map((item) => item.metricas.frequencia)
            .filter((valor) => valor !== null);

        const mediaGeral = medias.length
            ? medias.reduce(
                (soma, valor) => soma + valor,
                0
            ) / medias.length
            : null;

        const frequenciaMedia = frequencias.length
            ? frequencias.reduce(
                (soma, valor) => soma + valor,
                0
            ) / frequencias.length
            : null;

        const atencao = alunosComMetricas.filter(
            ({ aluno, metricas }) => {
                const classificacao =
                    F.normalizarTexto(
                        metricas.classificacao
                    );

                const risco = F.normalizarTexto(
                    aluno.nivel_risco
                );

                return (
                    classificacao.includes("ATENCAO") ||
                    classificacao.includes("CRITICO") ||
                    risco.includes("ALTO") ||
                    risco.includes("MEDIO")
                );
            }
        ).length;

        const evasao = dados.alunos.filter(
            (aluno) =>
                F.normalizarVinculo(
                    aluno.situacao_vinculo
                ) === "EVADIDO PROVAVEL"
        ).length;

        const formandos = dados.alunos.filter(
            (aluno) =>
                F.normalizarVinculo(
                    aluno.situacao_vinculo
                ) === "FORMANDO"
        ).length;

        definirTexto(
            "kpiAlunos",
            F.formatarInteiro(dados.alunos.length)
        );

        definirTexto(
            "kpiMedia",
            F.formatarNumero(mediaGeral, 2)
        );

        definirTexto(
            "kpiFrequencia",
            F.formatarPercentual(
                frequenciaMedia,
                1
            )
        );

        definirTexto(
            "kpiAtencao",
            F.formatarInteiro(atencao)
        );

        definirTexto(
            "kpiEvasao",
            F.formatarInteiro(evasao)
        );

        definirTexto(
            "kpiFormandos",
            F.formatarInteiro(formandos)
        );

        atualizarVariacoesAnuais(
            dados,
            mediaGeral,
            frequenciaMedia
        );
    }

    function atualizarVariacoesAnuais(
        dados,
        mediaAtual,
        frequenciaAtual
    ) {
        const serie = [...estado.dados.indicadoresPorAno]
            .filter((item) =>
                F.numero(item.ano) !== null
            )
            .sort(
                (a, b) =>
                    F.numero(a.ano) -
                    F.numero(b.ano)
            );

        if (serie.length < 2) {
            definirTexto(
                "kpiMediaVariacao",
                "Sem comparação anual"
            );

            definirTexto(
                "kpiFrequenciaVariacao",
                "Sem comparação anual"
            );

            return;
        }

        const anoSelecionado = F.numero(
            dados.filtros.ano
        );

        let indiceAtual = serie.length - 1;

        if (anoSelecionado !== null) {
            const localizado = serie.findIndex(
                (item) =>
                    F.numero(item.ano) ===
                    anoSelecionado
            );

            if (localizado >= 0) {
                indiceAtual = localizado;
            }
        }

        if (indiceAtual === 0) {
            definirTexto(
                "kpiMediaVariacao",
                "Primeiro ano da série"
            );

            definirTexto(
                "kpiFrequenciaVariacao",
                "Primeiro ano da série"
            );

            return;
        }

        const anterior = serie[indiceAtual - 1];

        const mediaAnterior = F.numero(
            anterior.media_geral
        );

        const frequenciaAnterior = F.numero(
            anterior.frequencia_media
        );

        const variacaoMedia =
            mediaAtual !== null &&
            mediaAnterior !== null
                ? mediaAtual - mediaAnterior
                : null;

        const variacaoFrequencia =
            frequenciaAtual !== null &&
            frequenciaAnterior !== null
                ? frequenciaAtual -
                  frequenciaAnterior
                : null;

        definirTexto(
            "kpiMediaVariacao",
            variacaoMedia === null
                ? "Sem comparação anual"
                : `${F.formatarVariacao(
                    variacaoMedia,
                    2
                )} em relação ao ano anterior`
        );

        definirTexto(
            "kpiFrequenciaVariacao",
            variacaoFrequencia === null
                ? "Sem comparação anual"
                : `${F.formatarVariacao(
                    variacaoFrequencia,
                    1,
                    " p.p."
                )} em relação ao ano anterior`
        );
    }

    // ---------------------------------------------------------
    // Alertas gerenciais
    // ---------------------------------------------------------

    function atualizarAlertas(dados) {
        let baixaFrequencia = 0;
        let queda = 0;
        let semDados = 0;

        dados.alunos.forEach((aluno) => {
            const metricas = obterMetricasAluno(
                aluno,
                dados
            );

            if (
                metricas.frequencia !== null &&
                metricas.frequencia < 75
            ) {
                baixaFrequencia += 1;
            }

            if (
                F.normalizarTexto(
                    aluno.tendencia
                ).includes("DECRESCENTE")
            ) {
                queda += 1;
            }

            if (
                metricas.media === null &&
                metricas.frequencia === null
            ) {
                semDados += 1;
            }
        });

        const disciplinasCriticas =
            dados.disciplinas.filter((item) => {
                const media = F.numero(
                    item.media_notas
                );

                const abaixo = F.numero(
                    item.percentual_notas_abaixo_6
                );

                return (
                    (media !== null && media < 6) ||
                    (abaixo !== null && abaixo >= 40)
                );
            }).length;

        definirTexto(
            "alertaBaixaFrequencia",
            F.formatarInteiro(baixaFrequencia)
        );

        definirTexto(
            "alertaQuedaDesempenho",
            F.formatarInteiro(queda)
        );

        definirTexto(
            "alertaDisciplinasCriticas",
            F.formatarInteiro(
                disciplinasCriticas
            )
        );

        definirTexto(
            "alertaSemDados",
            F.formatarInteiro(semDados)
        );
    }

    // ---------------------------------------------------------
    // Top 10 — atenção
    // ---------------------------------------------------------

    function calcularPrioridade(
        aluno,
        metricas
    ) {
        let pontuacao = F.numero(
            aluno.pontos_risco,
            0
        );

        const risco = F.normalizarTexto(
            aluno.nivel_risco
        );

        const vinculo = F.normalizarVinculo(
            aluno.situacao_vinculo
        );

        if (risco.includes("ALTO")) {
            pontuacao += 5;
        } else if (risco.includes("MEDIO")) {
            pontuacao += 2;
        }

        if (
            metricas.frequencia !== null &&
            metricas.frequencia < 75
        ) {
            pontuacao +=
                (75 - metricas.frequencia) / 5;
        }

        if (
            metricas.media !== null &&
            metricas.media < 6
        ) {
            pontuacao +=
                (6 - metricas.media) * 2;
        }

        if (
            F.normalizarTexto(
                aluno.tendencia
            ).includes("DECRESCENTE")
        ) {
            pontuacao += 2;
        }

        if (
            vinculo === "EVADIDO PROVAVEL" ||
            vinculo === "INATIVO PROVAVEL"
        ) {
            pontuacao += 4;
        }

        return pontuacao;
    }

    function renderizarAtencaoResumo(dados) {
        const corpo = elemento(
            "tabelaAtencaoResumo"
        );

        if (!corpo) {
            return;
        }

        const registros = dados.alunos
            .map((aluno) => {
                const metricas = obterMetricasAluno(
                    aluno,
                    dados
                );

                return {
                    aluno,
                    metricas,
                    prioridade: calcularPrioridade(
                        aluno,
                        metricas
                    )
                };
            })
            .filter((item) => {
                const classificacao =
                    F.normalizarTexto(
                        item.metricas.classificacao
                    );

                const risco = F.normalizarTexto(
                    item.aluno.nivel_risco
                );

                return (
                    item.prioridade > 0 ||
                    classificacao.includes("ATENCAO") ||
                    classificacao.includes("CRITICO") ||
                    risco.includes("ALTO")
                );
            })
            .sort(
                (a, b) =>
                    b.prioridade - a.prioridade
            )
            .slice(0, 10);

        if (!registros.length) {
            corpo.innerHTML = linhaVazia(
                7,
                "Nenhum caso prioritário na seleção atual."
            );

            return;
        }

        corpo.innerHTML = registros
            .map(({ aluno, metricas }) => `
                <tr>
                    <td>
                        <strong>
                            ${F.escaparHTML(
                                nomeAluno(aluno)
                            )}
                        </strong>
                    </td>

                    <td>
                        ${F.escaparHTML(
                            metricas.turma
                        )}
                    </td>

                    <td class="numeric-column">
                        ${F.formatarNumero(
                            metricas.media,
                            2
                        )}
                    </td>

                    <td class="numeric-column">
                        ${F.formatarPercentual(
                            metricas.frequencia,
                            1
                        )}
                    </td>

                    <td>
                        ${F.criarBadge(
                            aluno.tendencia,
                            "tendencia"
                        )}
                    </td>

                    <td>
                        ${F.criarBadge(
                            aluno.nivel_risco,
                            "risco"
                        )}
                    </td>

                    <td
                        title="${F.escaparHTML(
                            aluno.motivos_risco ||
                            aluno.motivo_situacao_vinculo ||
                            ""
                        )}"
                    >
                        ${F.escaparHTML(
                            limitarTexto(
                                aluno.motivos_risco ||
                                aluno.motivo_situacao_vinculo ||
                                "Necessita verificação"
                            )
                        )}
                    </td>
                </tr>
            `)
            .join("");
    }

    // ---------------------------------------------------------
    // Top 10 — destaques
    // ---------------------------------------------------------

    function renderizarDestaquesResumo(dados) {
        const corpo = elemento(
            "tabelaDestaquesResumo"
        );

        if (!corpo) {
            return;
        }

        const registros = dados.ranking
            .filter((aluno) => {
                const elegivel =
                    aluno.elegivel_ranking;

                return (
                    elegivel === undefined ||
                    elegivel === null ||
                    F.booleano(elegivel)
                );
            })
            .map((aluno) => ({
                aluno,

                metricas: obterMetricasAluno(
                    aluno,
                    dados
                )
            }))
            .filter(
                (item) =>
                    item.metricas.media !== null
            )
            .sort((a, b) => {
                const indiceA = F.numero(
                    a.aluno.indice_merito,
                    0
                );

                const indiceB = F.numero(
                    b.aluno.indice_merito,
                    0
                );

                if (indiceA !== indiceB) {
                    return indiceB - indiceA;
                }

                return (
                    b.metricas.media -
                    a.metricas.media
                );
            })
            .slice(0, 10);

        if (!registros.length) {
            corpo.innerHTML = linhaVazia(
                6,
                "Nenhum aluno elegível para o ranking."
            );

            return;
        }

        corpo.innerHTML = registros
            .map(({ aluno, metricas }, indice) => `
                <tr>
                    <td class="position-column">
                        <strong>${indice + 1}º</strong>
                    </td>

                    <td>
                        <strong>
                            ${F.escaparHTML(
                                nomeAluno(aluno)
                            )}
                        </strong>
                    </td>

                    <td>
                        ${F.escaparHTML(
                            metricas.turma
                        )}
                    </td>

                    <td class="numeric-column">
                        ${F.formatarNumero(
                            metricas.media,
                            2
                        )}
                    </td>

                    <td class="numeric-column">
                        ${F.formatarPercentual(
                            metricas.frequencia,
                            1
                        )}
                    </td>

                    <td>
                        ${F.criarBadge(
                            aluno.tendencia,
                            "tendencia"
                        )}
                    </td>
                </tr>
            `)
            .join("");
    }

    // ---------------------------------------------------------
    // Tabela de alunos
    // ---------------------------------------------------------

    function renderizarTabelaAlunos(dados) {
        const corpo = elemento("tabelaAlunos");

        if (!corpo) {
            return;
        }

        definirTexto(
            "totalAlunosTabela",
            F.formatarInteiro(dados.alunos.length)
        );

        const registros = [...dados.alunos]
            .sort((a, b) =>
                F.compararValores(
                    nomeAluno(a),
                    nomeAluno(b)
                )
            );

        if (!registros.length) {
            corpo.innerHTML = linhaVazia(8);
            return;
        }

        corpo.innerHTML = registros
            .slice(0, 500)
            .map((aluno) => {
                const metricas = obterMetricasAluno(
                    aluno,
                    dados
                );

                return `
                    <tr>
                        <td>
                            <strong>
                                ${F.escaparHTML(
                                    nomeAluno(aluno)
                                )}
                            </strong>
                        </td>

                        <td>
                            ${F.escaparHTML(
                                metricas.turma
                            )}
                        </td>

                        <td class="numeric-column">
                            ${F.escaparHTML(
                                metricas.serie ?? "—"
                            )}
                        </td>

                        <td>
                            ${F.criarBadge(
                                aluno.situacao_vinculo,
                                "vinculo"
                            )}
                        </td>

                        <td class="numeric-column">
                            ${F.formatarNumero(
                                metricas.media,
                                2
                            )}
                        </td>

                        <td class="numeric-column">
                            ${F.formatarPercentual(
                                metricas.frequencia,
                                1
                            )}
                        </td>

                        <td>
                            ${F.criarBadge(
                                metricas.classificacao
                            )}
                        </td>

                        <td>
                            ${F.criarBadge(
                                aluno.nivel_risco,
                                "risco"
                            )}
                        </td>
                    </tr>
                `;
            })
            .join("");
    }

    // ---------------------------------------------------------
    // Tabela de disciplinas
    // ---------------------------------------------------------

    function renderizarTabelaDisciplinas(
        disciplinas
    ) {
        const corpo = elemento(
            "tabelaDisciplinas"
        );

        if (!corpo) {
            return;
        }

        const registros = [...disciplinas]
            .sort((a, b) => {
                const mediaA = F.numero(
                    a.media_notas,
                    Infinity
                );

                const mediaB = F.numero(
                    b.media_notas,
                    Infinity
                );

                if (mediaA !== mediaB) {
                    return mediaA - mediaB;
                }

                return F.compararValores(
                    a.disciplina,
                    b.disciplina
                );
            });

        if (!registros.length) {
            corpo.innerHTML = linhaVazia(7);
            return;
        }

        corpo.innerHTML = registros
            .slice(0, 500)
            .map((item) => `
                <tr>
                    <td>
                        <strong>
                            ${F.escaparHTML(
                                item.disciplina ||
                                "Sem disciplina"
                            )}
                        </strong>
                    </td>

                    <td class="numeric-column">
                        ${F.escaparHTML(
                            item.ano ?? "—"
                        )}
                    </td>

                    <td class="numeric-column">
                        ${F.formatarInteiro(
                            item.alunos_distintos
                        )}
                    </td>

                    <td class="numeric-column">
                        ${F.formatarNumero(
                            item.media_notas,
                            2
                        )}
                    </td>

                    <td class="numeric-column">
                        ${F.formatarPercentual(
                            item.frequencia_media,
                            1
                        )}
                    </td>

                    <td class="numeric-column">
                        ${F.formatarPercentual(
                            item.percentual_notas_abaixo_6,
                            1
                        )}
                    </td>

                    <td class="numeric-column">
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

        const registros = [...turmas]
            .sort((a, b) => {
                const anoA = F.numero(a.ano, 0);
                const anoB = F.numero(b.ano, 0);

                if (anoA !== anoB) {
                    return anoB - anoA;
                }

                return F.compararValores(
                    a.turma,
                    b.turma
                );
            });

        if (!registros.length) {
            corpo.innerHTML = linhaVazia(8);
            return;
        }

        corpo.innerHTML = registros
            .slice(0, 500)
            .map((item) => `
                <tr>
                    <td>
                        <strong>
                            ${F.escaparHTML(
                                item.turma ||
                                "Sem turma"
                            )}
                        </strong>
                    </td>

                    <td class="numeric-column">
                        ${F.escaparHTML(
                            item.ano ?? "—"
                        )}
                    </td>

                    <td class="numeric-column">
                        ${F.escaparHTML(
                            item.serie_numero ?? "—"
                        )}
                    </td>

                    <td class="numeric-column">
                        ${F.formatarInteiro(
                            item.alunos_distintos
                        )}
                    </td>

                    <td class="numeric-column">
                        ${F.formatarNumero(
                            item.media_notas,
                            2
                        )}
                    </td>

                    <td class="numeric-column">
                        ${F.formatarPercentual(
                            item.frequencia_media,
                            1
                        )}
                    </td>

                    <td class="numeric-column">
                        ${F.formatarInteiro(
                            item.disciplinas_distintas
                        )}
                    </td>

                    <td class="numeric-column">
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
    // Ranking completo
    // ---------------------------------------------------------

    function renderizarRanking(dados) {
        const corpo = elemento("tabelaRanking");

        if (!corpo) {
            return;
        }

        const registros = dados.ranking
            .filter((aluno) => {
                const elegivel =
                    aluno.elegivel_ranking;

                return (
                    elegivel === undefined ||
                    elegivel === null ||
                    F.booleano(elegivel)
                );
            })
            .sort((a, b) => {
                const posicaoA = F.numero(
                    a.posicao
                );

                const posicaoB = F.numero(
                    b.posicao
                );

                if (
                    posicaoA !== null &&
                    posicaoB !== null
                ) {
                    return posicaoA - posicaoB;
                }

                return (
                    F.numero(
                        b.indice_merito,
                        0
                    ) -
                    F.numero(
                        a.indice_merito,
                        0
                    )
                );
            });

        if (!registros.length) {
            corpo.innerHTML = linhaVazia(7);
            return;
        }

        corpo.innerHTML = registros
            .slice(0, 200)
            .map((aluno, indice) => {
                const metricas = obterMetricasAluno(
                    aluno,
                    dados
                );

                const posicao =
                    F.numero(aluno.posicao) ??
                    indice + 1;

                return `
                    <tr>
                        <td class="position-column">
                            <strong>${posicao}º</strong>
                        </td>

                        <td>
                            <strong>
                                ${F.escaparHTML(
                                    nomeAluno(aluno)
                                )}
                            </strong>
                        </td>

                        <td>
                            ${F.escaparHTML(
                                metricas.turma
                            )}
                        </td>

                        <td class="numeric-column">
                            ${F.formatarNumero(
                                metricas.media,
                                2
                            )}
                        </td>

                        <td class="numeric-column">
                            ${F.formatarPercentual(
                                metricas.frequencia,
                                1
                            )}
                        </td>

                        <td class="numeric-column">
                            ${F.formatarNumero(
                                aluno.indice_merito,
                                2
                            )}
                        </td>

                        <td>
                            ${F.criarBadge(
                                metricas.classificacao
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

    function renderizarMonitoramento(dados) {
        let riscoAlto = 0;
        let baixaFrequencia = 0;
        let queda = 0;
        let semDados = 0;
        let evasao = 0;

        const registros = dados.alunos
            .map((aluno) => {
                const metricas = obterMetricasAluno(
                    aluno,
                    dados
                );

                const prioridade =
                    calcularPrioridade(
                        aluno,
                        metricas
                    );

                const risco = F.normalizarTexto(
                    aluno.nivel_risco
                );

                const vinculo = F.normalizarVinculo(
                    aluno.situacao_vinculo
                );

                if (risco.includes("ALTO")) {
                    riscoAlto += 1;
                }

                if (
                    metricas.frequencia !== null &&
                    metricas.frequencia < 75
                ) {
                    baixaFrequencia += 1;
                }

                if (
                    F.normalizarTexto(
                        aluno.tendencia
                    ).includes("DECRESCENTE")
                ) {
                    queda += 1;
                }

                if (
                    metricas.media === null &&
                    metricas.frequencia === null
                ) {
                    semDados += 1;
                }

                if (
                    vinculo === "EVADIDO PROVAVEL"
                ) {
                    evasao += 1;
                }

                return {
                    aluno,
                    metricas,
                    prioridade
                };
            })
            .filter(
                (item) =>
                    item.prioridade > 0 ||
                    item.metricas.media === null
            )
            .sort(
                (a, b) =>
                    b.prioridade -
                    a.prioridade
            );

        definirTexto(
            "monitorRiscoAlto",
            F.formatarInteiro(riscoAlto)
        );

        definirTexto(
            "monitorBaixaFrequencia",
            F.formatarInteiro(baixaFrequencia)
        );

        definirTexto(
            "monitorQueda",
            F.formatarInteiro(queda)
        );

        definirTexto(
            "monitorSemDados",
            F.formatarInteiro(semDados)
        );

        definirTexto(
            "monitorEvasao",
            F.formatarInteiro(evasao)
        );

        const corpo = elemento(
            "tabelaMonitoramento"
        );

        if (!corpo) {
            return;
        }

        if (!registros.length) {
            corpo.innerHTML = linhaVazia(
                8,
                "Nenhum caso de atenção na seleção atual."
            );

            return;
        }

        corpo.innerHTML = registros
            .slice(0, 300)
            .map(({ aluno, metricas }) => `
                <tr>
                    <td>
                        <strong>
                            ${F.escaparHTML(
                                nomeAluno(aluno)
                            )}
                        </strong>
                    </td>

                    <td>
                        ${F.escaparHTML(
                            metricas.turma
                        )}
                    </td>

                    <td>
                        ${F.criarBadge(
                            aluno.situacao_vinculo,
                            "vinculo"
                        )}
                    </td>

                    <td class="numeric-column">
                        ${F.formatarNumero(
                            metricas.media,
                            2
                        )}
                    </td>

                    <td class="numeric-column">
                        ${F.formatarPercentual(
                            metricas.frequencia,
                            1
                        )}
                    </td>

                    <td>
                        ${F.criarBadge(
                            aluno.tendencia,
                            "tendencia"
                        )}
                    </td>

                    <td>
                        ${F.criarBadge(
                            aluno.nivel_risco,
                            "risco"
                        )}
                    </td>

                    <td
                        title="${F.escaparHTML(
                            aluno.motivos_risco ||
                            aluno.motivo_situacao_vinculo ||
                            ""
                        )}"
                    >
                        ${F.escaparHTML(
                            limitarTexto(
                                aluno.motivos_risco ||
                                aluno.motivo_situacao_vinculo ||
                                "Necessita verificação",
                                90
                            )
                        )}
                    </td>
                </tr>
            `)
            .join("");
    }

    // ---------------------------------------------------------
    // Gráficos
    // ---------------------------------------------------------

    function atualizarGraficos(dados) {
        G.renderizarTodos({
            indicadoresPorAno:
                dados.indicadoresPorAno,

            indicadoresVinculo:
                dados.indicadoresVinculo,

            alunos:
                dados.alunos,

            todosAlunos:
                estado.dados.alunos,

            disciplinas:
                dados.disciplinas,

            turmas:
                dados.turmas
        });
    }

    // ---------------------------------------------------------
    // Atualização geral
    // ---------------------------------------------------------

    function atualizarDashboard() {
        const dados = obterDadosFiltrados();

        definirTexto(
            "rotuloPopulacao",
            F.rotuloPopulacao(
                dados.filtros.vinculo
            )
        );

        atualizarIndicadores(dados);
        atualizarAlertas(dados);

        renderizarAtencaoResumo(dados);
        renderizarDestaquesResumo(dados);

        renderizarTabelaAlunos(dados);
        renderizarTabelaDisciplinas(
            dados.disciplinas
        );
        renderizarTabelaTurmas(
            dados.turmas
        );
        renderizarRanking(dados);
        renderizarMonitoramento(dados);

        atualizarGraficos(dados);
    }

    // ---------------------------------------------------------
    // Navegação
    // ---------------------------------------------------------

    function abrirPagina(nomePagina) {
        const pagina =
            TITULOS_PAGINAS[nomePagina]
                ? nomePagina
                : "visao-geral";

        estado.paginaAtual = pagina;

        document
            .querySelectorAll(".page-section")
            .forEach((secao) => {
                secao.classList.remove("active");
            });

        elemento(
            `page-${pagina}`
        )?.classList.add("active");

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

        elemento("sidebar")?.classList.remove(
            "open"
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        setTimeout(() => {
            window.dispatchEvent(
                new Event("resize")
            );
        }, 100);
    }

    // ---------------------------------------------------------
    // Atualização e metadados
    // ---------------------------------------------------------

    function exibirAtualizacao() {
        const metadados =
            estado.dados.metadados;

        const data =
            metadados.gerado_em ||
            metadados.data_atualizacao ||
            metadados.data_processamento ||
            metadados.atualizado_em;

        definirTexto(
            "dataAtualizacao",
            data
                ? `Atualizado em ${F.formatarDataHora(
                    data
                )}`
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
                botao.addEventListener(
                    "click",
                    () => {
                        abrirPagina(
                            botao.dataset.page
                        );
                    }
                );
            });

        document
            .querySelectorAll(
                "[data-open-page]"
            )
            .forEach((botao) => {
                botao.addEventListener(
                    "click",
                    () => {
                        abrirPagina(
                            botao.dataset.openPage
                        );
                    }
                );
            });

        elemento("menuButton")?.addEventListener(
            "click",
            () => {
                elemento("sidebar")?.classList.toggle(
                    "open"
                );
            }
        );

        [
            "filtroAno",
            "filtroVinculo",
            "filtroTurma",
            "filtroDisciplina"
        ].forEach((id) => {
            elemento(id)?.addEventListener(
                "change",
                atualizarDashboard
            );
        });

        let temporizadorBusca = null;

        elemento("filtroBusca")?.addEventListener(
            "input",
            () => {
                clearTimeout(
                    temporizadorBusca
                );

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

        document.addEventListener(
            "click",
            (evento) => {
                const sidebar =
                    elemento("sidebar");

                const botaoMenu =
                    elemento("menuButton");

                if (
                    window.innerWidth <= 900 &&
                    sidebar?.classList.contains("open") &&
                    !sidebar.contains(evento.target) &&
                    !botaoMenu?.contains(evento.target)
                ) {
                    sidebar.classList.remove("open");
                }
            }
        );
    }

    // ---------------------------------------------------------
    // Inicialização
    // ---------------------------------------------------------

    async function iniciar() {
        try {
            if (!F) {
                throw new Error(
                    "O arquivo filters.js não foi carregado."
                );
            }

            if (!G) {
                throw new Error(
                    "O arquivo charts.js não foi carregado."
                );
            }

            configurarEventos();
            abrirPagina("visao-geral");

            await carregarDados();

            popularFiltros();
            exibirAtualizacao();
            atualizarDashboard();
        } catch (erro) {
            console.error(
                "Erro ao iniciar o dashboard:",
                erro
            );

            ocultar("loadingState");
            ocultar("dashboardContent");
            mostrar("errorState");

            const caixaErro =
                elemento("errorState");

            const paragrafo =
                caixaErro?.querySelector("p");

            if (paragrafo) {
                paragrafo.textContent =
                    `${erro.message} Verifique os arquivos da pasta data.`;
            }
        }
    }

    document.addEventListener(
        "DOMContentLoaded",
        iniciar
    );
})();
