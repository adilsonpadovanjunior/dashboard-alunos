window.DashFilters = (() => {
  "use strict";

  // ==========================================================
  // CONVERSÕES E NORMALIZAÇÃO
  // ==========================================================

  function txt(valor) {
    return String(valor ?? "").trim();
  }

  function norm(valor) {
    return txt(valor)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function num(valor) {
    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      return null;
    }

    const numero = Number(valor);

    return Number.isFinite(numero)
      ? numero
      : null;
  }

  function pct(valor) {
    const numero = num(valor);

    if (numero === null) {
      return "—";
    }

    return `${numero.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })}%`;
  }

  function dec(valor) {
    const numero = num(valor);

    if (numero === null) {
      return "—";
    }

    return numero.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // ==========================================================
  // CAMPOS PRINCIPAIS DO ALUNO
  // ==========================================================

  function currentStatus(aluno) {
    return txt(
      aluno.situacao_vinculo_atual ||
      aluno.situacao_vinculo ||
      aluno.status_vinculo ||
      aluno.status_atual ||
      "SEM_CLASSIFICAÇÃO"
    );
  }

  function currentStatusLabel(aluno) {
    const rotulo = txt(aluno.rotulo_situacao_vinculo);

    if (rotulo) {
      return rotulo;
    }

    return statusLabel(statusGroup(aluno));
  }

  function currentClass(aluno) {
    return txt(
      aluno.classificacao_historica ||
      aluno.classificacao ||
      "SEM DADOS"
    );
  }

  function risk(aluno) {
    return txt(
      aluno.nivel_risco ||
      aluno.risco ||
      "SEM DADOS"
    );
  }

  function turma(aluno) {
    return txt(
      aluno.turma_atual ||
      aluno.turma ||
      "SEM TURMA"
    );
  }

  // ==========================================================
  // GRUPOS DE VÍNCULO
  // ==========================================================

  function statusGroup(aluno) {
    const status = norm(currentStatus(aluno));

    /*
     * A ordem é importante.
     * Categorias específicas precisam ser verificadas
     * antes das categorias mais genéricas.
     */

    if (
      status.includes("evadido") ||
      status.includes("evasao") ||
      status.includes("abandono") ||
      status.includes("desistente")
    ) {
      return "evasao";
    }

    if (
      status.includes("concluinte recente") ||
      status.includes("concluido recente")
    ) {
      return "concluinte_recente";
    }

    if (
      status.includes("egresso") ||
      status.includes("graduado")
    ) {
      return "egresso";
    }

    if (
      status.includes("formando") ||
      status.includes("ultimo ano")
    ) {
      return "ultimo_ano";
    }

    if (
      status.includes("inativo") ||
      status.includes("trancado") ||
      status.includes("cancelado") ||
      status.includes("transferido") ||
      status.includes("jubilado")
    ) {
      return "inativo";
    }

    if (
      status === "ativo" ||
      status.includes("matriculado") ||
      status.includes("cursando") ||
      status.includes("regular")
    ) {
      return "ativo";
    }

    return "sem_classificacao";
  }

  function statusLabel(grupo) {
    const rotulos = {
      ativo: "Ativos",
      ultimo_ano: "Último ano",
      concluinte_recente: "Concluintes recentes",
      egresso: "Egressos",
      evasao: "Evasão provável",
      inativo: "Inativos",
      sem_classificacao: "Sem classificação"
    };

    return rotulos[grupo] || "Sem classificação";
  }

  function statusValue(grupo) {
    const valores = {
      ativo: "ATIVO",
      ultimo_ano: "FORMANDO",
      concluinte_recente: "CONCLUINTE_RECENTE",
      egresso: "EGRESSO",
      evasao: "EVADIDO_PROVAVEL",
      inativo: "INATIVO",
      sem_classificacao: "SEM_CLASSIFICACAO"
    };

    return valores[grupo] || "";
  }

  // ==========================================================
  // DESEMPENHO
  // ==========================================================

  function performanceGroup(aluno) {
    const classificacao = norm(currentClass(aluno));

    if (classificacao.includes("destaque")) {
      return "destaque";
    }

    if (classificacao.includes("critico")) {
      return "critico";
    }

    if (classificacao.includes("atencao")) {
      return "atencao";
    }

    if (classificacao.includes("regular")) {
      return "regular";
    }

    return "sem_dados";
  }

  // ==========================================================
  // RISCO
  // ==========================================================

  function riskGroup(aluno) {
    const nivel = norm(risk(aluno));

    if (nivel.includes("alto")) {
      return "alto";
    }

    if (nivel.includes("medio")) {
      return "medio";
    }

    if (nivel.includes("baixo")) {
      return "baixo";
    }

    return "sem_dados";
  }

  // ==========================================================
  // APLICAÇÃO DOS FILTROS
  // ==========================================================

  function apply(alunos, estado) {
    const lista = Array.isArray(alunos)
      ? alunos
      : [];

    const filtros = estado || {};

    return lista.filter(aluno => {
      const grupoVinculo = statusGroup(aluno);
      const grupoDesempenho = performanceGroup(aluno);
      const grupoRisco = riskGroup(aluno);

      const vinculoSelecionado =
        filtros.vinculo || "todos";

      const turmaSelecionada =
        filtros.turma || "todas";

      const desempenhoSelecionado =
        filtros.desempenho || "todos";

      const riscoSelecionado =
        filtros.risco || "todos";

      const busca =
        norm(filtros.busca || "");

      // Vínculo
      if (
        vinculoSelecionado !== "todos" &&
        grupoVinculo !== vinculoSelecionado
      ) {
        return false;
      }

      // Turma
      if (
        turmaSelecionada !== "todas" &&
        turma(aluno) !== turmaSelecionada
      ) {
        return false;
      }

      // Desempenho
      if (
        desempenhoSelecionado !== "todos" &&
        grupoDesempenho !== desempenhoSelecionado
      ) {
        return false;
      }

      // Risco
      if (
        riscoSelecionado !== "todos" &&
        grupoRisco !== riscoSelecionado
      ) {
        return false;
      }

      // Pesquisa pelo nome
      if (busca) {
        const nome = norm(
          aluno.nome_aluno_final ||
          aluno.nome_aluno ||
          aluno.nome ||
          ""
        );

        if (!nome.includes(busca)) {
          return false;
        }
      }

      return true;
    });
  }

  // ==========================================================
  // BADGES
  // ==========================================================

  function badge(valor, tipo = "") {
    const textoBadge = txt(valor) || "Sem dados";

    const classeValor = norm(textoBadge)
      .replace(/\s+/g, "-");

    const classeTipo = norm(tipo)
      .replace(/\s+/g, "-");

    return `
      <span class="badge ${classeTipo} ${classeValor}">
        ${textoBadge}
      </span>
    `;
  }

  function statusBadge(aluno) {
    const grupo = statusGroup(aluno);
    const rotulo = currentStatusLabel(aluno);

    return `
      <span class="badge vinculo ${grupo}">
        ${rotulo}
      </span>
    `;
  }

  // ==========================================================
  // API PÚBLICA
  // ==========================================================

  return {
    txt,
    norm,
    num,
    pct,
    dec,

    currentStatus,
    currentStatusLabel,
    currentClass,
    risk,
    turma,

    statusGroup,
    statusLabel,
    statusValue,

    performanceGroup,
    riskGroup,

    apply,
    badge,
    statusBadge
  };
})();
