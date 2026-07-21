(() => {
  "use strict";

  // ==========================================================
  // DEPENDÊNCIAS
  // ==========================================================

  const F = window.DashFilters;
  const C = window.DashCharts;

  if (!F || !C) {
    console.error(
      "DashFilters ou DashCharts não foram carregados."
    );

    return;
  }

  // ==========================================================
  // CONFIGURAÇÃO
  // ==========================================================

  const DATA_PATH = "data/";

  const db = {
    alunos: [],
    alunosPorAno: [],
    historico: [],
    indicadoresPorAno: [],
    disciplinas: [],
    turmas: [],
    ranking: [],
    metadados: {}
  };

  // ==========================================================
  // UTILITÁRIOS
  // ==========================================================

  function el(id) {
    return document.getElementById(id);
  }

  function nomeAluno(aluno) {
    return F.txt(
      aluno?.nome_aluno_final ||
      aluno?.nome_aluno ||
      aluno?.nome ||
      ""
    );
  }

  function idAluno(aluno) {
    return F.txt(
      aluno?.id_aluno_final ||
      aluno?.id_aluno ||
      aluno?.id ||
      nomeAluno(aluno)
    );
  }

  function mediaAluno(aluno) {
    return F.num(
      aluno?.media_historica ??
      aluno?.media_notas ??
      aluno?.media_geral ??
      aluno?.media
    );
  }

  function frequenciaAluno(aluno) {
    return F.num(
      aluno?.frequencia_media ??
      aluno?.frequencia_historica ??
      aluno?.frequencia_percentual ??
      aluno?.frequencia
    );
  }

  function primeiroValor(objeto, ...campos) {
    for (const campo of campos) {
      const valor = objeto?.[campo];

      if (
        valor !== undefined &&
        valor !== null &&
        valor !== ""
      ) {
        return valor;
      }
    }

    return null;
  }

  function escapeHtml(valor) {
    return F.txt(valor).replace(
      /[&<>"']/g,
      caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[caractere]
    );
  }

  function mediaLista(lista, getter) {
    const valores = lista
      .map(getter)
      .filter(valor => valor !== null);

    if (!valores.length) {
      return null;
    }

    return valores.reduce(
      (soma, valor) => soma + valor,
      0
    ) / valores.length;
  }

  function linhaVazia(colunas, mensagem) {
    return `
      <tr>
        <td colspan="${colunas}" class="empty">
          ${escapeHtml(
            mensagem ||
            "Nenhum registro para os filtros selecionados."
          )}
        </td>
      </tr>
    `;
  }

  function compararNomes(a, b) {
    return nomeAluno(a).localeCompare(
      nomeAluno(b),
      "pt-BR"
    );
  }

  // ==========================================================
  // CARREGAMENTO SEM CACHE
  // ==========================================================

  async function carregarJson(
    arquivo,
    opcional = false
  ) {
    const separador = arquivo.includes("?")
      ? "&"
      : "?";

    const url =
      `${DATA_PATH}${arquivo}` +
      `${separador}v=${Date.now()}`;

    try {
      const resposta = await fetch(url, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache"
        }
      });

      if (!resposta.ok) {
        throw new Error(
          `${resposta.status} ${resposta.statusText}`
        );
      }

      return await resposta.json();
    } catch (erro) {
      if (opcional) {
        console.warn(
          `Arquivo opcional não carregado: ${arquivo}`,
          erro
        );

        return [];
      }

      throw new Error(
        `Não foi possível carregar data/${arquivo}.`
      );
    }
  }

  async function carregarDados() {
    try {
      const [
        alunos,
        alunosPorAno,
        historico,
        indicadoresPorAno,
        disciplinas,
        turmas,
        ranking,
        metadados
      ] = await Promise.all([
        carregarJson("alunos.json"),
        carregarJson("alunos_por_ano.json", true),
        carregarJson("historico_academico.json", true),
        carregarJson("indicadores_por_ano.json", true),
        carregarJson("disciplinas.json", true),
        carregarJson("turmas.json", true),
        carregarJson("ranking_geral.json", true),
        carregarJson("metadados.json", true)
      ]);

      db.alunos = Array.isArray(alunos)
        ? alunos
        : [];

      db.alunosPorAno = Array.isArray(alunosPorAno)
        ? alunosPorAno
        : [];

      db.historico = Array.isArray(historico)
        ? historico
        : [];

      db.indicadoresPorAno =
        Array.isArray(indicadoresPorAno)
          ? indicadoresPorAno
          : [];

      db.disciplinas = Array.isArray(disciplinas)
        ? disciplinas
        : [];

      db.turmas = Array.isArray(turmas)
        ? turmas
        : [];

      db.ranking = Array.isArray(ranking)
        ? ranking
        : [];

      db.metadados = Array.isArray(metadados)
        ? metadados[0] || {}
        : metadados || {};

      if (!db.alunos.length) {
        throw new Error(
          "O arquivo alunos.json não possui registros."
        );
      }

      inicializarInterface();
      renderizarTudo();

      el("loading")?.classList.add("hidden");
      el("content")?.classList.remove("hidden");
    } catch (erro) {
      console.error(erro);

      el("loading")?.classList.add("hidden");
      el("error")?.classList.remove("hidden");

      const mensagem = el("error")?.querySelector("p");

      if (mensagem) {
        mensagem.textContent = erro.message;
      }
    }
  }

  // ==========================================================
  // ESTADO DOS FILTROS
  // ==========================================================

  function estadoFiltros() {
    const vinculoSelecionado =
      el("filtroVinculo")?.value || "";

    const mapaVinculos = {
      ATIVO: "ativo",
      FORMANDO: "ultimo_ano",
      CONCLUINTE_RECENTE: "concluinte_recente",
      EGRESSO: "egresso",
      EVADIDO_PROVAVEL: "evasao",
      INATIVO: "inativo"
    };

    const desempenhoSelecionado =
      el("filtroDesempenho")?.value || "";

    const mapaDesempenho = {
      DESTAQUE: "destaque",
      REGULAR: "regular",
      ATENCAO: "atencao",
      CRITICO: "critico",
      SEM_DADOS: "sem_dados"
    };

    const riscoSelecionado =
      el("filtroRisco")?.value || "";

    const mapaRisco = {
      BAIXO: "baixo",
      MEDIO: "medio",
      ALTO: "alto"
    };

    return {
      vinculo:
        mapaVinculos[vinculoSelecionado] ||
        "todos",

      turma:
        el("filtroTurma")?.value ||
        "todas",

      desempenho:
        mapaDesempenho[desempenhoSelecionado] ||
        "todos",

      risco:
        mapaRisco[riscoSelecionado] ||
        "todos",

      busca:
        el("filtroBusca")?.value ||
        ""
    };
  }

  function alunosFiltrados() {
    return F.apply(
      db.alunos,
      estadoFiltros()
    );
  }

  // ==========================================================
  // INICIALIZAÇÃO
  // ==========================================================

  function inicializarInterface() {
    preencherTurmas();
    configurarFiltros();
    configurarNavegacao();
    configurarEventosGraficos();
    configurarAcoesCards();
    configurarModal();
    mostrarAtualizacao();
  }

  function preencherTurmas() {
    const campo = el("filtroTurma");

    if (!campo) {
      return;
    }

    const turmas = [
      ...new Set(
        db.alunos
          .map(aluno => F.turma(aluno))
          .filter(turma => {
            const normalizada = F.norm(turma);

            return (
              turma &&
              normalizada !== "sem turma"
            );
          })
      )
    ].sort((a, b) =>
      a.localeCompare(b, "pt-BR", {
        numeric: true
      })
    );

    campo.innerHTML =
      '<option value="">Todas as turmas</option>';

    turmas.forEach(turma => {
      campo.insertAdjacentHTML(
        "beforeend",
        `
          <option value="${escapeHtml(turma)}">
            ${escapeHtml(turma)}
          </option>
        `
      );
    });
  }

  function configurarFiltros() {
    [
      "filtroVinculo",
      "filtroTurma",
      "filtroDesempenho",
      "filtroRisco"
    ].forEach(id => {
      el(id)?.addEventListener(
        "change",
        renderizarTudo
      );
    });

    el("filtroBusca")?.addEventListener(
      "input",
      renderizarTudo
    );

    el("limpar")?.addEventListener(
      "click",
      limparFiltros
    );

    el("quickRemove")?.addEventListener(
      "click",
      limparFiltros
    );
  }

  function limparFiltros() {
    if (el("filtroVinculo")) {
      el("filtroVinculo").value = "";
    }

    if (el("filtroTurma")) {
      el("filtroTurma").value = "";
    }

    if (el("filtroDesempenho")) {
      el("filtroDesempenho").value = "";
    }

    if (el("filtroRisco")) {
      el("filtroRisco").value = "";
    }

    if (el("filtroBusca")) {
      el("filtroBusca").value = "";
    }

    renderizarTudo();
  }

  // ==========================================================
  // NAVEGAÇÃO
  // ==========================================================

  function configurarNavegacao() {
    document
      .querySelectorAll("button.nav")
      .forEach(botao => {
        botao.addEventListener("click", () => {
          abrirPagina(
            botao.dataset.page,
            botao
          );
        });
      });
  }

  function abrirPagina(pagina, botao = null) {
    document
      .querySelectorAll(".page")
      .forEach(elemento => {
        elemento.classList.toggle(
          "active",
          elemento.id === `page-${pagina}`
        );
      });

    document
      .querySelectorAll("button.nav")
      .forEach(elemento => {
        const ativo = botao
          ? elemento === botao
          : elemento.dataset.page === pagina;

        elemento.classList.toggle(
          "active",
          ativo
        );
      });

    const titulos = {
      geral: "Visão geral",
      alunos: "Alunos",
      disciplinas: "Disciplinas",
      turmas: "Turmas atuais",
      ranking: "Destaques",
      monitoramento: "Monitoramento"
    };

    if (el("tituloPagina")) {
      el("tituloPagina").textContent =
        titulos[pagina] || "Painel Acadêmico";
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    window.setTimeout(() => {
      C.resizeAll();
    }, 100);
  }

  // ==========================================================
  // EVENTOS DOS GRÁFICOS
  // ==========================================================

  function configurarEventosGraficos() {
    document.addEventListener(
      "dash:vinculo",
      evento => {
        const grupo =
          evento.detail?.grupo ||
          evento.detail;

        const valores = {
          ativo: "ATIVO",
          ultimo_ano: "FORMANDO",
          concluinte_recente:
            "CONCLUINTE_RECENTE",
          egresso: "EGRESSO",
          evasao: "EVADIDO_PROVAVEL",
          inativo: "INATIVO",
          sem_classificacao: ""
        };

        if (
          el("filtroVinculo") &&
          valores[grupo] !== undefined
        ) {
          el("filtroVinculo").value =
            valores[grupo];
        }

        abrirPagina("alunos");
        renderizarTudo();
      }
    );

    document.addEventListener(
      "dash:desempenho",
      evento => {
        const grupo =
          evento.detail?.grupo ||
          evento.detail;

        const valores = {
          destaque: "DESTAQUE",
          regular: "REGULAR",
          atencao: "ATENCAO",
          critico: "CRITICO",
          sem_dados: "SEM_DADOS"
        };

        if (
          el("filtroDesempenho") &&
          valores[grupo] !== undefined
        ) {
          el("filtroDesempenho").value =
            valores[grupo];
        }

        abrirPagina("alunos");
        renderizarTudo();
      }
    );
  }

  // ==========================================================
  // AÇÕES DOS CARDS
  // ==========================================================

  function configurarAcoesCards() {
    document
      .querySelectorAll("[data-action]")
      .forEach(botao => {
        botao.addEventListener(
          "click",
          () => {
            const acao =
              botao.dataset.action;

            if (acao === "todos") {
              limparFiltros();
              abrirPagina("alunos");
              return;
            }

            if (acao === "atencao") {
              if (el("filtroDesempenho")) {
                el("filtroDesempenho").value =
                  "CRITICO";
              }

              abrirPagina("alunos");
              renderizarTudo();
              return;
            }

            if (acao === "evasao") {
              if (el("filtroVinculo")) {
                el("filtroVinculo").value =
                  "EVADIDO_PROVAVEL";
              }

              abrirPagina("alunos");
              renderizarTudo();
              return;
            }

            if (acao === "formandos") {
              if (el("filtroVinculo")) {
                el("filtroVinculo").value =
                  "FORMANDO";
              }

              abrirPagina("alunos");
              renderizarTudo();
            }
          }
        );
      });
  }

  // ==========================================================
  // ATUALIZAÇÃO E FILTRO VISUAL
  // ==========================================================

  function mostrarAtualizacao() {
    const data = primeiroValor(
      db.metadados,
      "gerado_em",
      "data_atualizacao",
      "atualizado_em"
    );

    if (!el("atualizacao")) {
      return;
    }

    if (!data) {
      el("atualizacao").textContent =
        "Dados carregados";

      return;
    }

    const convertida = new Date(data);

    if (Number.isNaN(convertida.getTime())) {
      el("atualizacao").textContent =
        `Atualizado em ${data}`;

      return;
    }

    el("atualizacao").textContent =
      `Atualizado em ${convertida.toLocaleString(
        "pt-BR"
      )}`;
  }

  function atualizarBarraFiltro() {
    const estado = estadoFiltros();
    const partes = [];

    if (estado.vinculo !== "todos") {
      partes.push(
        F.statusLabel(estado.vinculo)
      );
    }

    if (estado.turma !== "todas") {
      partes.push(estado.turma);
    }

    if (estado.desempenho !== "todos") {
      partes.push(
        `Desempenho: ${estado.desempenho}`
      );
    }

    if (estado.risco !== "todos") {
      partes.push(`Risco: ${estado.risco}`);
    }

    if (estado.busca) {
      partes.push(`Busca: ${estado.busca}`);
    }

    const barra = el("quickBar");
    const texto = el("quickLabel");

    if (!barra || !texto) {
      return;
    }

    if (!partes.length) {
      barra.classList.add("hidden");
      texto.textContent = "";
      return;
    }

    texto.textContent = partes.join(" · ");
    barra.classList.remove("hidden");
  }

  // ==========================================================
  // RENDERIZAÇÃO GERAL
  // ==========================================================

  function renderizarTudo() {
    const alunos = alunosFiltrados();

    atualizarBarraFiltro();
    renderizarResumo(alunos);
    renderizarAlunos(alunos);
    renderizarRanking(alunos);
    renderizarMonitoramento(alunos);
    renderizarDisciplinas();
    renderizarTurmas();
    renderizarGraficos(alunos);
  }

  function renderizarResumo(alunos) {
    const media = mediaLista(
      alunos,
      mediaAluno
    );

    const frequencia = mediaLista(
      alunos,
      frequenciaAluno
    );

    const atencao = alunos.filter(aluno => {
      const desempenho =
        F.performanceGroup(aluno);

      const risco =
        F.riskGroup(aluno);

      return (
        desempenho === "critico" ||
        desempenho === "atencao" ||
        risco === "alto"
      );
    });

    const evasao = alunos.filter(
      aluno =>
        F.statusGroup(aluno) === "evasao"
    );

    const ultimoAno = alunos.filter(
      aluno =>
        F.statusGroup(aluno) ===
        "ultimo_ano"
    );

    if (el("kpiAlunos")) {
      el("kpiAlunos").textContent =
        alunos.length;
    }

    if (el("kpiMedia")) {
      el("kpiMedia").textContent =
        F.dec(media);
    }

    if (el("kpiFrequencia")) {
      el("kpiFrequencia").textContent =
        F.pct(frequencia);
    }

    if (el("kpiAtencao")) {
      el("kpiAtencao").textContent =
        atencao.length;
    }

    if (el("kpiEvasao")) {
      el("kpiEvasao").textContent =
        evasao.length;
    }

    if (el("kpiFormandos")) {
      el("kpiFormandos").textContent =
        ultimoAno.length;
    }

    if (el("populacaoAtual")) {
      el("populacaoAtual").textContent =
        `${alunos.length} alunos na seleção atual`;
    }

    renderizarResumoAtencao(atencao);
  }

  // ==========================================================
  // TABELA DE ALUNOS
  // ==========================================================

  function linhaAluno(aluno) {
    return `
      <tr data-id="${escapeHtml(idAluno(aluno))}">
        <td>
          <strong>
            ${escapeHtml(nomeAluno(aluno))}
          </strong>
        </td>

        <td>
          ${escapeHtml(F.turma(aluno))}
        </td>

        <td>
          ${escapeHtml(
            primeiroValor(
              aluno,
              "serie_atual",
              "serie_numero"
            ) ?? "—"
          )}
        </td>

        <td>
          ${escapeHtml(
            primeiroValor(
              aluno,
              "ultimo_ano",
              "ano_mais_recente",
              "ano"
            ) ?? "—"
          )}
        </td>

        <td>
          ${F.statusBadge(aluno)}
        </td>

        <td>
          ${F.dec(mediaAluno(aluno))}
        </td>

        <td>
          ${F.pct(frequenciaAluno(aluno))}
        </td>

        <td>
          ${F.badge(
            F.currentClass(aluno),
            "desempenho"
          )}
        </td>

        <td>
          ${F.badge(
            F.risk(aluno),
            "risco"
          )}
        </td>
      </tr>
    `;
  }

  function renderizarAlunos(alunos) {
    const corpo = el("tabelaAlunos");

    if (!corpo) {
      return;
    }

    const ordenados = [...alunos].sort(
      compararNomes
    );

    corpo.innerHTML = ordenados.length
      ? ordenados.map(linhaAluno).join("")
      : linhaVazia(9);
  }

  // ==========================================================
  // RESUMO DE ATENÇÃO
  // ==========================================================

  function renderizarResumoAtencao(alunos) {
    const corpo = el("resumoAtencao");

    if (!corpo) {
      return;
    }

    const prioridades = [...alunos]
      .sort((a, b) => {
        const riscoB = F.num(
          b.pontos_risco ??
          b.pontuacao_risco
        ) || 0;

        const riscoA = F.num(
          a.pontos_risco ??
          a.pontuacao_risco
        ) || 0;

        return riscoB - riscoA;
      })
      .slice(0, 10);

    corpo.innerHTML = prioridades.length
      ? prioridades.map(aluno => `
          <tr data-id="${escapeHtml(idAluno(aluno))}">
            <td>
              <strong>
                ${escapeHtml(nomeAluno(aluno))}
              </strong>
            </td>

            <td>
              ${escapeHtml(F.turma(aluno))}
            </td>

            <td>
              ${F.dec(mediaAluno(aluno))}
            </td>

            <td>
              ${F.pct(frequenciaAluno(aluno))}
            </td>

            <td>
              ${F.badge(
                F.risk(aluno),
                "risco"
              )}
            </td>

            <td>
              ${escapeHtml(
                primeiroValor(
                  aluno,
                  "motivos_risco",
                  "motivo_risco",
                  "motivo_monitoramento",
                  "motivo_situacao_vinculo"
                ) ||
                "Verificar trajetória acadêmica"
              )}
            </td>
          </tr>
        `).join("")
      : linhaVazia(6);
  }

  // ==========================================================
  // RANKING
  // ==========================================================

  function construirRanking(alunos) {
    return [...alunos]
      .filter(aluno => {
        return (
          mediaAluno(aluno) !== null ||
          F.num(aluno.indice_merito) !== null
        );
      })
      .sort((a, b) => {
        const indiceB =
          F.num(b.indice_merito) ??
          (mediaAluno(b) || 0) * 10;

        const indiceA =
          F.num(a.indice_merito) ??
          (mediaAluno(a) || 0) * 10;

        if (indiceB !== indiceA) {
          return indiceB - indiceA;
        }

        return compararNomes(a, b);
      });
  }

  function renderizarRanking(alunos) {
    const ranking = construirRanking(alunos);

    const corpoCompleto =
      el("tabelaRanking");

    const corpoResumo =
      el("resumoRanking");

    if (corpoCompleto) {
      corpoCompleto.innerHTML = ranking.length
        ? ranking.map((aluno, indice) => `
            <tr data-id="${escapeHtml(idAluno(aluno))}">
              <td>${indice + 1}º</td>

              <td>
                <strong>
                  ${escapeHtml(nomeAluno(aluno))}
                </strong>
              </td>

              <td>
                ${escapeHtml(F.turma(aluno))}
              </td>

              <td>
                ${F.dec(mediaAluno(aluno))}
              </td>

              <td>
                ${F.pct(frequenciaAluno(aluno))}
              </td>

              <td>
                ${F.dec(aluno.indice_merito)}
              </td>

              <td>
                ${F.badge(
                  F.currentClass(aluno),
                  "desempenho"
                )}
              </td>
            </tr>
          `).join("")
        : linhaVazia(7);
    }

    if (corpoResumo) {
      const dezPrimeiros =
        ranking.slice(0, 10);

      corpoResumo.innerHTML =
        dezPrimeiros.length
          ? dezPrimeiros.map(
              (aluno, indice) => `
                <tr data-id="${escapeHtml(idAluno(aluno))}">
                  <td>${indice + 1}º</td>

                  <td>
                    <strong>
                      ${escapeHtml(nomeAluno(aluno))}
                    </strong>
                  </td>

                  <td>
                    ${escapeHtml(F.turma(aluno))}
                  </td>

                  <td>
                    ${F.dec(mediaAluno(aluno))}
                  </td>

                  <td>
                    ${F.pct(frequenciaAluno(aluno))}
                  </td>
                </tr>
              `
            ).join("")
          : linhaVazia(5);
    }
  }

  // ==========================================================
  // MONITORAMENTO
  // ==========================================================

  function renderizarMonitoramento(alunos) {
    const corpo =
      el("tabelaMonitoramento");

    if (!corpo) {
      return;
    }

    const ordenados = [...alunos].sort(
      (a, b) => {
        const pontosB = F.num(
          b.pontos_risco ??
          b.pontuacao_risco
        ) || 0;

        const pontosA = F.num(
          a.pontos_risco ??
          a.pontuacao_risco
        ) || 0;

        return pontosB - pontosA;
      }
    );

    corpo.innerHTML = ordenados.length
      ? ordenados.map(aluno => `
          <tr data-id="${escapeHtml(idAluno(aluno))}">
            <td>
              <strong>
                ${escapeHtml(nomeAluno(aluno))}
              </strong>
            </td>

            <td>
              ${escapeHtml(F.turma(aluno))}
            </td>

            <td>
              ${F.statusBadge(aluno)}
            </td>

            <td>
              ${F.dec(mediaAluno(aluno))}
            </td>

            <td>
              ${F.pct(frequenciaAluno(aluno))}
            </td>

            <td>
              ${escapeHtml(
                primeiroValor(
                  aluno,
                  "tendencia",
                  "tendencia_desempenho"
                ) || "—"
              )}
            </td>

            <td>
              ${F.badge(
                F.risk(aluno),
                "risco"
              )}
            </td>

            <td>
              ${escapeHtml(
                primeiroValor(
                  aluno,
                  "motivos_risco",
                  "motivo_risco",
                  "motivo_monitoramento",
                  "motivo_situacao_vinculo"
                ) || "—"
              )}
            </td>
          </tr>
        `).join("")
      : linhaVazia(8);
  }

  // ==========================================================
  // DISCIPLINAS
  // ==========================================================

  function renderizarDisciplinas() {
    const corpo =
      el("tabelaDisciplinas");

    if (!corpo) {
      return;
    }

    corpo.innerHTML = db.disciplinas.length
      ? db.disciplinas.map(item => `
          <tr>
            <td>
              <strong>
                ${escapeHtml(
                  primeiroValor(
                    item,
                    "disciplina",
                    "nome_disciplina"
                  ) || "—"
                )}
              </strong>
            </td>

            <td>
              ${escapeHtml(item.ano ?? "—")}
            </td>

            <td>
              ${escapeHtml(
                primeiroValor(
                  item,
                  "alunos_distintos",
                  "quantidade_alunos",
                  "alunos"
                ) ?? "—"
              )}
            </td>

            <td>
              ${F.dec(
                primeiroValor(
                  item,
                  "media_notas",
                  "media_geral",
                  "media"
                )
              )}
            </td>

            <td>
              ${F.pct(
                primeiroValor(
                  item,
                  "frequencia_media",
                  "frequencia_percentual"
                )
              )}
            </td>

            <td>
              ${escapeHtml(
                primeiroValor(
                  item,
                  "notas_abaixo_6",
                  "quantidade_notas_abaixo_6"
                ) ?? "—"
              )}
            </td>
          </tr>
        `).join("")
      : linhaVazia(6);
  }

  // ==========================================================
  // TURMAS
  // ==========================================================

  function renderizarTurmas() {
    const corpo =
      el("tabelaTurmas");

    if (!corpo) {
      return;
    }

    corpo.innerHTML = db.turmas.length
      ? db.turmas.map(item => `
          <tr>
            <td>
              <strong>
                ${escapeHtml(
                  item.turma || "—"
                )}
              </strong>
            </td>

            <td>
              ${escapeHtml(item.ano ?? "—")}
            </td>

            <td>
              ${escapeHtml(
                item.serie_numero ?? "—"
              )}
            </td>

            <td>
              ${escapeHtml(
                primeiroValor(
                  item,
                  "alunos_distintos",
                  "quantidade_alunos",
                  "alunos"
                ) ?? "—"
              )}
            </td>

            <td>
              ${F.dec(
                primeiroValor(
                  item,
                  "media_notas",
                  "media_geral",
                  "media"
                )
              )}
            </td>

            <td>
              ${F.pct(
                primeiroValor(
                  item,
                  "frequencia_media",
                  "frequencia_percentual"
                )
              )}
            </td>

            <td>
              ${escapeHtml(
                primeiroValor(
                  item,
                  "disciplinas_distintas",
                  "quantidade_disciplinas",
                  "disciplinas"
                ) ?? "—"
              )}
            </td>
          </tr>
        `).join("")
      : linhaVazia(7);
  }

  // ==========================================================
  // EVOLUÇÃO DA POPULAÇÃO SELECIONADA
  // ==========================================================

  function evolucaoSelecionada(alunos) {
    if (!db.alunosPorAno.length) {
      return db.indicadoresPorAno;
    }

    const ids = new Set(
      alunos.map(idAluno)
    );

    const registros = db.alunosPorAno.filter(
      item => ids.has(idAluno(item))
    );

    if (!registros.length) {
      return [];
    }

    const grupos = new Map();

    registros.forEach(item => {
      const ano = item.ano;

      if (!grupos.has(ano)) {
        grupos.set(ano, {
          ano,
          medias: [],
          frequencias: []
        });
      }

      const grupo = grupos.get(ano);

      const media = F.num(
        primeiroValor(
          item,
          "media_notas",
          "media_geral",
          "media"
        )
      );

      const frequencia = F.num(
        primeiroValor(
          item,
          "frequencia_media",
          "frequencia_percentual"
        )
      );

      if (media !== null) {
        grupo.medias.push(media);
      }

      if (frequencia !== null) {
        grupo.frequencias.push(frequencia);
      }
    });

    return [...grupos.values()]
      .map(grupo => ({
        ano: grupo.ano,

        media_geral: grupo.medias.length
          ? grupo.medias.reduce(
              (soma, valor) => soma + valor,
              0
            ) / grupo.medias.length
          : null,

        frequencia_media:
          grupo.frequencias.length
            ? grupo.frequencias.reduce(
                (soma, valor) => soma + valor,
                0
              ) / grupo.frequencias.length
            : null
      }))
      .sort(
        (a, b) =>
          Number(a.ano) - Number(b.ano)
      );
  }

  // ==========================================================
  // GRÁFICOS
  // ==========================================================

  function renderizarGraficos(alunos) {
    C.evolution(
      evolucaoSelecionada(alunos)
    );

    C.vinculos(alunos);
    C.desempenho(alunos);

    const disciplinasCriticas =
      [...db.disciplinas]
        .map(item => ({
          ...item,

          nome_grafico:
            primeiroValor(
              item,
              "disciplina",
              "nome_disciplina"
            ) || "Sem disciplina",

          media_grafico:
            F.num(
              primeiroValor(
                item,
                "media_notas",
                "media_geral",
                "media"
              )
            )
        }))
        .filter(
          item =>
            item.media_grafico !== null
        )
        .sort(
          (a, b) =>
            a.media_grafico -
            b.media_grafico
        )
        .slice(0, 10);

    C.bars(
      "chartDisciplinas",
      disciplinasCriticas,
      "nome_grafico",
      "media_grafico"
    );

    const turmasGrafico =
      [...db.turmas]
        .map(item => ({
          ...item,

          turma_grafico:
            item.turma ||
            "Sem turma",

          media_grafico:
            F.num(
              primeiroValor(
                item,
                "media_notas",
                "media_geral",
                "media"
              )
            )
        }))
        .filter(
          item =>
            item.media_grafico !== null
        )
        .sort(
          (a, b) =>
            b.media_grafico -
            a.media_grafico
        )
        .slice(0, 15);

    C.bars(
      "chartTurmas",
      turmasGrafico,
      "turma_grafico",
      "media_grafico",
      "#18864b"
    );
  }

  // ==========================================================
  // MODAL DO ALUNO
  // ==========================================================

  function configurarModal() {
    document.body.addEventListener(
      "click",
      evento => {
        const linha =
          evento.target.closest("[data-id]");

        if (!linha) {
          return;
        }

        abrirAluno(linha.dataset.id);
      }
    );

    el("closeStudent")?.addEventListener(
      "click",
      fecharAluno
    );

    el("studentModal")?.addEventListener(
      "click",
      evento => {
        if (
          evento.target ===
          el("studentModal")
        ) {
          fecharAluno();
        }
      }
    );

    document.addEventListener(
      "keydown",
      evento => {
        if (evento.key === "Escape") {
          fecharAluno();
        }
      }
    );
  }

  function abrirAluno(studentId) {
    const aluno = db.alunos.find(
      item =>
        idAluno(item) === studentId
    );

    if (!aluno) {
      return;
    }

    const anos = db.alunosPorAno.filter(
      item => {
        return (
          idAluno(item) === studentId ||
          F.norm(nomeAluno(item)) ===
          F.norm(nomeAluno(aluno))
        );
      }
    );

    const historico = db.historico.filter(
      item => {
        return (
          idAluno(item) === studentId ||
          F.norm(nomeAluno(item)) ===
          F.norm(nomeAluno(aluno))
        );
      }
    );

    if (el("studentName")) {
      el("studentName").textContent =
        nomeAluno(aluno);
    }

    if (el("studentCurrent")) {
      const ultimoAno = primeiroValor(
        aluno,
        "ultimo_ano",
        "ano_mais_recente",
        "ano"
      );

      el("studentCurrent").textContent =
        `${F.turma(aluno)} · ` +
        `${F.currentStatusLabel(aluno)} · ` +
        `último registro: ${ultimoAno || "não informado"}`;
    }

    if (el("studentKpis")) {
      el("studentKpis").innerHTML = `
        <div>
          <span>Média histórica</span>
          <strong>
            ${F.dec(mediaAluno(aluno))}
          </strong>
        </div>

        <div>
          <span>Frequência</span>
          <strong>
            ${F.pct(frequenciaAluno(aluno))}
          </strong>
        </div>

        <div>
          <span>Desempenho</span>
          <strong>
            ${escapeHtml(
              F.currentClass(aluno)
            )}
          </strong>
        </div>

        <div>
          <span>Vínculo atual</span>
          <strong>
            ${escapeHtml(
              F.currentStatusLabel(aluno)
            )}
          </strong>
        </div>
      `;
    }

    renderizarAnosAluno(anos);
    renderizarHistoricoAluno(historico);

    C.student(anos);

    el("studentModal")?.classList.remove(
      "hidden"
    );

    document.body.style.overflow =
      "hidden";
  }

  function renderizarAnosAluno(anos) {
    const corpo = el("studentYears");

    if (!corpo) {
      return;
    }

    const ordenados = [...anos].sort(
      (a, b) =>
        Number(a.ano) - Number(b.ano)
    );

    corpo.innerHTML = ordenados.length
      ? ordenados.map(item => `
          <tr>
            <td>
              ${escapeHtml(item.ano)}
            </td>

            <td>
              ${escapeHtml(
                item.turma || "—"
              )}
            </td>

            <td>
              ${escapeHtml(
                item.serie_numero ?? "—"
              )}
            </td>

            <td>
              ${F.dec(
                primeiroValor(
                  item,
                  "media_notas",
                  "media_geral",
                  "media"
                )
              )}
            </td>

            <td>
              ${F.pct(
                primeiroValor(
                  item,
                  "frequencia_media",
                  "frequencia_percentual"
                )
              )}
            </td>

            <td>
              ${escapeHtml(
                primeiroValor(
                  item,
                  "quantidade_notas",
                  "notas_validas"
                ) ?? "—"
              )}
            </td>

            <td>
              ${F.badge(
                primeiroValor(
                  item,
                  "classificacao",
                  "classificacao_historica"
                ) || "—",
                "desempenho"
              )}
            </td>
          </tr>
        `).join("")
      : linhaVazia(
          7,
          "Não há resumo anual disponível."
        );
  }

  function renderizarHistoricoAluno(historico) {
    const corpo = el("studentHistory");

    if (!corpo) {
      return;
    }

    const ordenados = [...historico].sort(
      (a, b) => {
        const diferencaAno =
          Number(a.ano) - Number(b.ano);

        if (diferencaAno !== 0) {
          return diferencaAno;
        }

        const diferencaBimestre =
          Number(a.bimestre_numero || 0) -
          Number(b.bimestre_numero || 0);

        if (diferencaBimestre !== 0) {
          return diferencaBimestre;
        }

        return F.txt(a.disciplina)
          .localeCompare(
            F.txt(b.disciplina),
            "pt-BR"
          );
      }
    );

    corpo.innerHTML = ordenados.length
      ? ordenados.map(item => `
          <tr>
            <td>
              ${escapeHtml(item.ano)}
            </td>

            <td>
              ${escapeHtml(
                item.bimestre_numero ?? "—"
              )}
            </td>

            <td>
              ${escapeHtml(
                item.disciplina || "—"
              )}
            </td>

            <td>
              ${escapeHtml(
                item.turma || "—"
              )}
            </td>

            <td>
              ${F.dec(item.nota)}
            </td>

            <td>
              ${F.pct(
                item.frequencia_percentual
              )}
            </td>

            <td>
              ${escapeHtml(
                item.numero_faltas_horas ??
                "—"
              )}
            </td>
          </tr>
        `).join("")
      : linhaVazia(
          7,
          "Não há histórico por disciplina disponível."
        );
  }

  function fecharAluno() {
    el("studentModal")?.classList.add(
      "hidden"
    );

    document.body.style.overflow = "";
  }

  // ==========================================================
  // INÍCIO
  // ==========================================================

  carregarDados();
})();
