window.DashCharts = (() => {
  "use strict";

  // ==========================================================
  // INSTÂNCIAS E CORES
  // ==========================================================

  const charts = {};

  const colors = {
    green: "#18864b",
    greenLight: "#61b67e",
    greenSoft: "#a8d9b9",

    navy: "#242342",
    blue: "#3d5f92",

    amber: "#c78308",
    amberLight: "#e0aa43",

    red: "#c83c3c",
    redDark: "#9f2929",

    gray: "#a2a1ae",
    grayLight: "#d1d0d8",

    white: "#ffffff"
  };

  // ==========================================================
  // CONFIGURAÇÃO GERAL
  // ==========================================================

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,

    interaction: {
      mode: "nearest",
      intersect: true
    },

    plugins: {
      legend: {
        position: "bottom",

        labels: {
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          padding: 16,
          color: "#565568",
          font: {
            family: "Inter",
            size: 11,
            weight: "600"
          }
        }
      },

      tooltip: {
        backgroundColor: "#242342",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        padding: 12,
        cornerRadius: 8,
        displayColors: true
      }
    }
  };

  // ==========================================================
  // UTILITÁRIOS
  // ==========================================================

  function numero(valor) {
    const convertido = Number(valor);

    return Number.isFinite(convertido)
      ? convertido
      : null;
  }

  function destruir(id) {
    if (charts[id]) {
      charts[id].destroy();
      delete charts[id];
    }
  }

  function criar(id, configuracao) {
    const elemento = document.getElementById(id);

    if (!elemento) {
      return null;
    }

    destruir(id);

    charts[id] = new Chart(elemento, configuracao);

    return charts[id];
  }

  function ordenarPorAno(linhas) {
    return [...(linhas || [])].sort(
      (a, b) => Number(a.ano) - Number(b.ano)
    );
  }

  function primeiroValor(objeto, campos) {
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

  // ==========================================================
  // EVOLUÇÃO ACADÊMICA
  // ==========================================================

  function evolution(linhas) {
    const dados = ordenarPorAno(linhas);

    const anos = dados.map(item => item.ano);

    const medias = dados.map(item => {
      return primeiroValor(item, [
        "media_geral",
        "media_notas",
        "media"
      ]);
    });

    const frequencias = dados.map(item => {
      return primeiroValor(item, [
        "frequencia_media",
        "frequencia_percentual",
        "frequencia"
      ]);
    });

    criar("chartEvolucao", {
      type: "line",

      data: {
        labels: anos,

        datasets: [
          {
            label: "Média",
            data: medias,
            borderColor: colors.navy,
            backgroundColor: "rgba(36, 35, 66, 0.10)",
            pointBackgroundColor: colors.white,
            pointBorderColor: colors.navy,
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 3,
            fill: true,
            tension: 0.25,
            spanGaps: true,
            yAxisID: "y"
          },

          {
            label: "Frequência",
            data: frequencias,
            borderColor: colors.green,
            backgroundColor: colors.green,
            pointBackgroundColor: colors.white,
            pointBorderColor: colors.green,
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 3,
            fill: false,
            tension: 0.25,
            spanGaps: true,
            yAxisID: "y1"
          }
        ]
      },

      options: {
        ...baseOptions,

        scales: {
          x: {
            grid: {
              color: "rgba(36, 35, 66, 0.08)"
            },

            ticks: {
              color: "#68677b",
              font: {
                family: "Inter"
              }
            }
          },

          y: {
            min: 0,
            max: 10,

            title: {
              display: true,
              text: "Média",
              color: "#68677b"
            },

            grid: {
              color: "rgba(36, 35, 66, 0.08)"
            },

            ticks: {
              color: "#68677b"
            }
          },

          y1: {
            min: 0,
            max: 100,
            position: "right",

            title: {
              display: true,
              text: "Frequência",
              color: "#68677b"
            },

            grid: {
              drawOnChartArea: false
            },

            ticks: {
              color: "#68677b",

              callback(valor) {
                return `${valor}%`;
              }
            }
          }
        }
      }
    });
  }

  // ==========================================================
  // GRÁFICO DE ROSCA
  // ==========================================================

  function doughnut(
    id,
    labels,
    values,
    palette,
    grupos,
    evento
  ) {
    const total = values.reduce(
      (soma, valor) => soma + Number(valor || 0),
      0
    );

    criar(id, {
      type: "doughnut",

      data: {
        labels,

        datasets: [
          {
            data: values,
            backgroundColor: palette,
            borderColor: colors.white,
            borderWidth: 3,
            hoverOffset: 7
          }
        ]
      },

      options: {
        ...baseOptions,

        cutout: "62%",

        onClick(_, elementos) {
          if (!elementos.length || !evento) {
            return;
          }

          const indice = elementos[0].index;

          evento({
            grupo: grupos[indice],
            label: labels[indice],
            valor: values[indice]
          });
        },

        plugins: {
          ...baseOptions.plugins,

          tooltip: {
            ...baseOptions.plugins.tooltip,

            callbacks: {
              label(contexto) {
                const valor = Number(contexto.raw || 0);

                const percentual = total > 0
                  ? (valor / total) * 100
                  : 0;

                return (
                  `${contexto.label}: ${valor} ` +
                  `(${percentual.toLocaleString("pt-BR", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1
                  })}%)`
                );
              }
            }
          }
        }
      }
    });
  }

  // ==========================================================
  // VÍNCULOS
  // ==========================================================

  function vinculos(alunos) {
    const categorias = [
      {
        grupo: "ativo",
        label: "Ativos",
        cor: colors.green
      },
      {
        grupo: "ultimo_ano",
        label: "Último ano",
        cor: colors.greenLight
      },
      {
        grupo: "concluinte_recente",
        label: "Concluintes recentes",
        cor: colors.greenSoft
      },
      {
        grupo: "egresso",
        label: "Egressos",
        cor: colors.navy
      },
      {
        grupo: "evasao",
        label: "Evasão provável",
        cor: colors.red
      },
      {
        grupo: "inativo",
        label: "Inativos",
        cor: colors.amber
      },
      {
        grupo: "sem_classificacao",
        label: "Sem classificação",
        cor: colors.gray
      }
    ];

    const contagens = Object.fromEntries(
      categorias.map(item => [item.grupo, 0])
    );

    (alunos || []).forEach(aluno => {
      const grupo = DashFilters.statusGroup(aluno);

      if (contagens[grupo] === undefined) {
        contagens.sem_classificacao += 1;
        return;
      }

      contagens[grupo] += 1;
    });

    const labels = categorias.map(item => item.label);

    const valores = categorias.map(
      item => contagens[item.grupo]
    );

    const paleta = categorias.map(item => item.cor);

    const grupos = categorias.map(item => item.grupo);

    doughnut(
      "chartVinculos",
      labels,
      valores,
      paleta,
      grupos,
      detalhe => {
        document.dispatchEvent(
          new CustomEvent("dash:vinculo", {
            detail: detalhe
          })
        );
      }
    );
  }

  // ==========================================================
  // DESEMPENHO
  // ==========================================================

  function desempenho(alunos) {
    const categorias = [
      {
        grupo: "destaque",
        label: "Destaque",
        cor: colors.green
      },
      {
        grupo: "regular",
        label: "Regular",
        cor: colors.navy
      },
      {
        grupo: "atencao",
        label: "Atenção",
        cor: colors.amber
      },
      {
        grupo: "critico",
        label: "Crítico",
        cor: colors.red
      },
      {
        grupo: "sem_dados",
        label: "Sem dados",
        cor: colors.gray
      }
    ];

    const contagens = Object.fromEntries(
      categorias.map(item => [item.grupo, 0])
    );

    (alunos || []).forEach(aluno => {
      const grupo = DashFilters.performanceGroup(aluno);

      if (contagens[grupo] === undefined) {
        contagens.sem_dados += 1;
        return;
      }

      contagens[grupo] += 1;
    });

    const labels = categorias.map(item => item.label);

    const valores = categorias.map(
      item => contagens[item.grupo]
    );

    const paleta = categorias.map(item => item.cor);

    const grupos = categorias.map(item => item.grupo);

    doughnut(
      "chartDesempenho",
      labels,
      valores,
      paleta,
      grupos,
      detalhe => {
        document.dispatchEvent(
          new CustomEvent("dash:desempenho", {
            detail: detalhe
          })
        );
      }
    );
  }

  // ==========================================================
  // GRÁFICO DE BARRAS
  // ==========================================================

  function bars(
    id,
    linhas,
    labelKey,
    valueKey,
    color = colors.red,
    maximo = 10
  ) {
    const dados = Array.isArray(linhas)
      ? linhas
      : [];

    const labels = dados.map(item => {
      const valor = item?.[labelKey];

      return valor === null || valor === undefined
        ? "Sem identificação"
        : String(valor);
    });

    const valores = dados.map(item => {
      return numero(item?.[valueKey]);
    });

    criar(id, {
      type: "bar",

      data: {
        labels,

        datasets: [
          {
            label: "Média",
            data: valores,
            backgroundColor: color,
            borderColor: color,
            borderWidth: 1,
            borderRadius: 5,
            barThickness: 18,
            maxBarThickness: 24
          }
        ]
      },

      options: {
        ...baseOptions,

        indexAxis: "y",

        scales: {
          x: {
            beginAtZero: true,
            max: maximo,

            grid: {
              color: "rgba(36, 35, 66, 0.08)"
            },

            ticks: {
              color: "#68677b"
            }
          },

          y: {
            grid: {
              display: false
            },

            ticks: {
              color: "#68677b",

              callback(valor) {
                const label = this.getLabelForValue(valor);

                if (String(label).length > 32) {
                  return `${String(label).slice(0, 29)}…`;
                }

                return label;
              }
            }
          }
        },

        plugins: {
          ...baseOptions.plugins,

          legend: {
            display: false
          }
        }
      }
    });
  }

  // ==========================================================
  // HISTÓRICO INDIVIDUAL
  // ==========================================================

  function student(linhas) {
    const dados = ordenarPorAno(linhas);

    const anos = dados.map(item => item.ano);

    const medias = dados.map(item => {
      return primeiroValor(item, [
        "media_notas",
        "media_geral",
        "media_historica",
        "media"
      ]);
    });

    const frequencias = dados.map(item => {
      return primeiroValor(item, [
        "frequencia_media",
        "frequencia_percentual",
        "frequencia"
      ]);
    });

    criar("chartAluno", {
      type: "line",

      data: {
        labels: anos,

        datasets: [
          {
            label: "Média anual",
            data: medias,
            borderColor: colors.navy,
            backgroundColor: "rgba(36, 35, 66, 0.08)",
            pointBackgroundColor: colors.white,
            pointBorderColor: colors.navy,
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 3,
            tension: 0.25,
            fill: true,
            spanGaps: true,
            yAxisID: "y"
          },

          {
            label: "Frequência",
            data: frequencias,
            borderColor: colors.green,
            backgroundColor: colors.green,
            pointBackgroundColor: colors.white,
            pointBorderColor: colors.green,
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 3,
            tension: 0.25,
            fill: false,
            spanGaps: true,
            yAxisID: "y1"
          }
        ]
      },

      options: {
        ...baseOptions,

        scales: {
          x: {
            grid: {
              color: "rgba(36, 35, 66, 0.08)"
            },

            ticks: {
              color: "#68677b"
            }
          },

          y: {
            min: 0,
            max: 10,

            title: {
              display: true,
              text: "Média",
              color: "#68677b"
            },

            grid: {
              color: "rgba(36, 35, 66, 0.08)"
            },

            ticks: {
              color: "#68677b"
            }
          },

          y1: {
            min: 0,
            max: 100,
            position: "right",

            title: {
              display: true,
              text: "Frequência",
              color: "#68677b"
            },

            grid: {
              drawOnChartArea: false
            },

            ticks: {
              color: "#68677b",

              callback(valor) {
                return `${valor}%`;
              }
            }
          }
        }
      }
    });
  }

  // ==========================================================
  // CONTROLE
  // ==========================================================

  function destroyAll() {
    Object.keys(charts).forEach(id => destruir(id));
  }

  function resizeAll() {
    Object.values(charts).forEach(chart => {
      if (chart) {
        chart.resize();
      }
    });
  }

  // ==========================================================
  // API PÚBLICA
  // ==========================================================

  return {
    evolution,
    vinculos,
    desempenho,
    bars,
    student,
    destroyAll,
    resizeAll
  };
})();
