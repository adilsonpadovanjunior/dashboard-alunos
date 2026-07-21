window.DashFilters = (() => {
  const txt = v => String(v ?? '').trim();
  const norm = v => txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const num = v => { const n = Number(v); return Number.isFinite(n) ? n : null; };
  const pct = v => num(v) == null ? '—' : `${num(v).toLocaleString('pt-BR',{maximumFractionDigits:1})}%`;
  const dec = v => num(v) == null ? '—' : num(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const currentStatus = a => txt(a.situacao_vinculo_atual || a.situacao_vinculo || a.status_vinculo || 'Sem classificação');
  const currentClass = a => txt(a.classificacao_historica || a.classificacao || 'Sem dados');
  const risk = a => txt(a.nivel_risco || a.risco || 'Sem dados');
  const turma = a => txt(a.turma_atual || a.turma || 'Sem turma');
  function statusGroup(a) {
    const s=norm(currentStatus(a));
    if(s.includes('evas')) return 'evasao';
    if(s.includes('inativ')) return 'inativo';
    if(s.includes('egress') || s.includes('formado')) return 'egresso';
    if(s.includes('concluinte') || s.includes('formando')) return 'formando';
    if(s.includes('ativ')) return 'ativo';
    return 'sem_dados';
  }
  function apply(alunos, state) {
    return alunos.filter(a => {
      if(state.vinculo !== 'todos' && statusGroup(a) !== state.vinculo) return false;
      if(state.turma !== 'todas' && turma(a) !== state.turma) return false;
      if(state.desempenho !== 'todos' && norm(currentClass(a)) !== norm(state.desempenho)) return false;
      if(state.risco !== 'todos' && norm(risk(a)) !== norm(state.risco)) return false;
      const q=norm(state.busca); if(q && !norm(a.nome_aluno_final || a.nome_aluno || a.nome).includes(q)) return false;
      return true;
    });
  }
  const badge = (value, kind='') => `<span class="badge ${kind} ${norm(value).replace(/\s+/g,'-')}">${txt(value)||'Sem dados'}</span>`;
  return {txt,norm,num,pct,dec,currentStatus,currentClass,risk,turma,statusGroup,apply,badge};
})();
