(() => {
  'use strict';
  const F=DashFilters,C=DashCharts;
  const DATA='data/';
  const db={alunos:[],anos:[],historico:[],indicadores:[],disciplinas:[],turmas:[],ranking:[],meta:{}};
  const el=id=>document.getElementById(id);
  const name=a=>F.txt(a.nome_aluno_final||a.nome_aluno||a.nome);
  const id=a=>F.txt(a.id_aluno_final||a.id_aluno||a.id||name(a));
  const avg=a=>F.num(a.media_historica??a.media_geral??a.media);
  const freq=a=>F.num(a.frequencia_media??a.frequencia_historica??a.frequencia_percentual);
  const esc=v=>F.txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const val=(o,...keys)=>{for(const k of keys)if(o[k]!==undefined&&o[k]!==null&&o[k]!=='')return o[k];return null;};
  async function json(file,optional=false){try{const r=await fetch(DATA+file);if(!r.ok)throw Error(r.status);return await r.json()}catch(e){if(optional)return [];throw Error(`Arquivo data/${file} não encontrado`);}}
  async function load(){
    try{
      const all=await Promise.all([json('alunos_situacao_atual.json',true),json('alunos.json'),json('alunos_por_ano.json',true),json('historico_academico.json',true),json('indicadores_por_ano.json',true),json('disciplinas.json',true),json('turmas.json',true),json('ranking_geral.json',true),json('metadados.json',true)]);
      db.alunos=all[0].length?all[0]:all[1]; db.anos=all[2];db.historico=all[3];db.indicadores=all[4];db.disciplinas=all[5];db.turmas=all[6];db.ranking=all[7];db.meta=Array.isArray(all[8])?(all[8][0]||{}):all[8];
      init(); render(); el('loading').classList.add('hidden');el('content').classList.remove('hidden');
    }catch(e){el('loading').classList.add('hidden');el('error').classList.remove('hidden');el('error').querySelector('p').textContent=e.message;}
  }
  function state(){
    const vg=el('filtroVinculo').value, map={ATIVOS:'ativos',ATIVO:'ativo',FORMANDO:'formando',CONCLUINTE_RECENTE:'formando',EGRESSO:'egresso',INATIVOS:'inativos'};
    return {vinculo:map[vg]||'todos',turma:el('filtroTurma').value||'todas',desempenho:el('filtroDesempenho').value||'todos',risco:el('filtroRisco').value||'todos',busca:el('filtroBusca').value};
  }
  function filtered(){
    const s=state();return db.alunos.filter(a=>{
      const g=F.statusGroup(a);
      if(s.vinculo==='ativos'&&!['ativo','formando'].includes(g))return false;
      if(s.vinculo==='inativos'&&!['inativo','evasao'].includes(g))return false;
      if(!['todos','ativos','inativos'].includes(s.vinculo)&&g!==s.vinculo)return false;
      if(s.turma!=='todas'&&F.turma(a)!==s.turma)return false;
      if(s.desempenho!=='todos'&&F.norm(F.currentClass(a))!==F.norm(s.desempenho))return false;
      if(s.risco!=='todos'&&F.norm(F.risk(a))!==F.norm(s.risco))return false;
      return !s.busca||F.norm(name(a)).includes(F.norm(s.busca));
    });
  }
  function init(){
    [...new Set(db.alunos.map(F.turma).filter(Boolean))].sort().forEach(t=>el('filtroTurma').insertAdjacentHTML('beforeend',`<option>${esc(t)}</option>`));
    ['filtroVinculo','filtroTurma','filtroDesempenho','filtroRisco'].forEach(x=>el(x).addEventListener('change',render));el('filtroBusca').addEventListener('input',render);
    el('limpar').onclick=()=>{el('filtroVinculo').value='ATIVOS';el('filtroTurma').value='';el('filtroDesempenho').value='';el('filtroRisco').value='';el('filtroBusca').value='';render();};
    document.querySelectorAll('button.nav').forEach(b=>b.onclick=()=>page(b.dataset.page,b));
    document.addEventListener('dash:vinculo',e=>{const m={Ativos:'ATIVO',Formandos:'FORMANDO',Egressos:'EGRESSO',Inativos:'INATIVOS','Evasão provável':'INATIVOS'};el('filtroVinculo').value=m[e.detail]||'';page('alunos');render();});
    document.addEventListener('dash:desempenho',e=>{el('filtroDesempenho').value=F.norm(e.detail)==='atencao'?'ATENCAO':F.norm(e.detail)==='critico'?'CRITICO':F.norm(e.detail)==='destaque'?'DESTAQUE':F.norm(e.detail)==='regular'?'REGULAR':'SEM_DADOS';page('alunos');render();});
    document.body.addEventListener('click',e=>{const row=e.target.closest('[data-id]');if(row)openStudent(row.dataset.id);});
    el('closeStudent').onclick=closeStudent;el('studentModal').onclick=e=>{if(e.target===el('studentModal'))closeStudent();};document.addEventListener('keydown',e=>{if(e.key==='Escape')closeStudent();});
    const date=val(db.meta,'data_atualizacao','gerado_em','atualizado_em');el('atualizacao').textContent=date?`Atualizado em ${date}`:'Dados carregados';
  }
  function page(p,button){document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id===`page-${p}`));document.querySelectorAll('button.nav').forEach(x=>x.classList.toggle('active',x===button||x.dataset.page===p));el('tituloPagina').textContent={geral:'Visão geral',alunos:'Alunos',disciplinas:'Disciplinas',turmas:'Turmas atuais',ranking:'Destaques',monitoramento:'Monitoramento'}[p];}
  function mean(rows,getter){const n=rows.map(getter).filter(x=>x!=null);return n.length?n.reduce((a,b)=>a+b,0)/n.length:null;}
  function rowStudent(a){return `<tr data-id="${esc(id(a))}"><td><strong>${esc(name(a))}</strong></td><td>${esc(F.turma(a))}</td><td>${esc(val(a,'serie_atual','serie_numero')??'—')}</td><td>${esc(val(a,'ultimo_ano','ano_mais_recente','ano')??'—')}</td><td>${F.badge(F.currentStatus(a))}</td><td>${F.dec(avg(a))}</td><td>${F.pct(freq(a))}</td><td>${F.badge(F.currentClass(a))}</td><td>${F.badge(F.risk(a))}</td></tr>`;}
  function empty(cols){return `<tr><td colspan="${cols}" class="empty">Nenhum registro para os filtros selecionados.</td></tr>`;}
  function render(){
    const a=filtered();el('kpiAlunos').textContent=a.length;el('kpiMedia').textContent=F.dec(mean(a,avg));el('kpiFrequencia').textContent=F.pct(mean(a,freq));
    const attention=a.filter(x=>['alto','critico','atencao'].some(k=>F.norm(F.risk(x)).includes(k)||F.norm(F.currentClass(x)).includes(k)));const evas=a.filter(x=>F.statusGroup(x)==='evasao');const form=a.filter(x=>F.statusGroup(x)==='formando');el('kpiAtencao').textContent=attention.length;el('kpiEvasao').textContent=evas.length;el('kpiFormandos').textContent=form.length;
    el('tabelaAlunos').innerHTML=a.length?a.sort((x,y)=>name(x).localeCompare(name(y),'pt-BR')).map(rowStudent).join(''):empty(9);
    const pri=[...attention].sort((x,y)=>(F.num(y.pontuacao_risco)||0)-(F.num(x.pontuacao_risco)||0)).slice(0,10);el('resumoAtencao').innerHTML=pri.length?pri.map(x=>`<tr data-id="${esc(id(x))}"><td><strong>${esc(name(x))}</strong></td><td>${esc(F.turma(x))}</td><td>${F.dec(avg(x))}</td><td>${F.pct(freq(x))}</td><td>${F.badge(F.risk(x))}</td><td>${esc(val(x,'motivo_risco','motivo_monitoramento')||'Verificar trajetória')}</td></tr>`).join(''):empty(6);
    renderRanking(a);renderMonitor(a);renderStatic();C.evolution(db.indicadores);C.vinculos(a);C.desempenho(a);C.bars('chartDisciplinas',[...db.disciplinas].sort((x,y)=>(F.num(x.media_geral??x.media)||99)-(F.num(y.media_geral??y.media)||99)).slice(0,10),'disciplina','media_geral');C.bars('chartTurmas',db.turmas.slice(0,15),'turma','media_geral', '#18864b');
    el('populacaoAtual').textContent=`${a.length} alunos na seleção atual`;
  }
  function renderRanking(selected){const ids=new Set(selected.map(id));let r=db.ranking.length?db.ranking:db.alunos;r=r.filter(x=>ids.has(id(x))).sort((x,y)=>(F.num(y.indice_merito)||0)-(F.num(x.indice_merito)||0));const html=r.slice(0,100).map((x,i)=>`<tr data-id="${esc(id(x))}"><td>${i+1}º</td><td><strong>${esc(name(x))}</strong></td><td>${esc(F.turma(x))}</td><td>${F.dec(avg(x))}</td><td>${F.pct(freq(x))}</td><td>${F.dec(x.indice_merito)}</td><td>${F.badge(F.currentClass(x))}</td></tr>`).join('');el('tabelaRanking').innerHTML=html||empty(7);el('resumoRanking').innerHTML=r.slice(0,10).map((x,i)=>`<tr data-id="${esc(id(x))}"><td>${i+1}º</td><td><strong>${esc(name(x))}</strong></td><td>${esc(F.turma(x))}</td><td>${F.dec(avg(x))}</td><td>${F.pct(freq(x))}</td></tr>`).join('')||empty(5);}
  function renderMonitor(a){const r=[...a].sort((x,y)=>(F.num(y.pontuacao_risco)||0)-(F.num(x.pontuacao_risco)||0));el('tabelaMonitoramento').innerHTML=r.map(x=>`<tr data-id="${esc(id(x))}"><td><strong>${esc(name(x))}</strong></td><td>${esc(F.turma(x))}</td><td>${F.badge(F.currentStatus(x))}</td><td>${F.dec(avg(x))}</td><td>${F.pct(freq(x))}</td><td>${esc(val(x,'tendencia_desempenho','tendencia')||'—')}</td><td>${F.badge(F.risk(x))}</td><td>${esc(val(x,'motivo_risco','motivo_monitoramento')||'—')}</td></tr>`).join('')||empty(8);}
  function renderStatic(){el('tabelaDisciplinas').innerHTML=db.disciplinas.map(x=>`<tr><td><strong>${esc(val(x,'disciplina','nome_disciplina')||'—')}</strong></td><td>${esc(x.ano??'—')}</td><td>${esc(val(x,'quantidade_alunos','alunos')??'—')}</td><td>${F.dec(val(x,'media_geral','media'))}</td><td>${F.pct(val(x,'frequencia_media','frequencia_percentual'))}</td><td>${esc(val(x,'notas_abaixo_6','quantidade_notas_abaixo_6')??'—')}</td></tr>`).join('')||empty(6);el('tabelaTurmas').innerHTML=db.turmas.map(x=>`<tr><td><strong>${esc(x.turma||'—')}</strong></td><td>${esc(x.ano??'—')}</td><td>${esc(x.serie_numero??'—')}</td><td>${esc(val(x,'quantidade_alunos','alunos')??'—')}</td><td>${F.dec(val(x,'media_geral','media'))}</td><td>${F.pct(val(x,'frequencia_media','frequencia_percentual'))}</td><td>${esc(val(x,'quantidade_disciplinas','disciplinas')??'—')}</td></tr>`).join('')||empty(7);}
  function openStudent(studentId){const a=db.alunos.find(x=>id(x)===studentId);if(!a)return;const years=db.anos.filter(x=>id(x)===studentId||F.norm(name(x))===F.norm(name(a)));const hist=db.historico.filter(x=>id(x)===studentId||F.norm(name(x))===F.norm(name(a)));el('studentName').textContent=name(a);el('studentCurrent').textContent=`${F.turma(a)} · ${F.currentStatus(a)} · último registro: ${val(a,'ultimo_ano','ano_mais_recente','ano')||'não informado'}`;el('studentKpis').innerHTML=`<div><span>Média histórica</span><strong>${F.dec(avg(a))}</strong></div><div><span>Frequência</span><strong>${F.pct(freq(a))}</strong></div><div><span>Desempenho</span><strong>${esc(F.currentClass(a))}</strong></div><div><span>Risco atual</span><strong>${esc(F.risk(a))}</strong></div>`;el('studentYears').innerHTML=years.length?years.sort((x,y)=>Number(x.ano)-Number(y.ano)).map(x=>`<tr><td>${esc(x.ano)}</td><td>${esc(x.turma||'—')}</td><td>${esc(x.serie_numero??'—')}</td><td>${F.dec(val(x,'media_geral','media_historica','media'))}</td><td>${F.pct(val(x,'frequencia_media','frequencia_percentual'))}</td><td>${esc(val(x,'quantidade_notas','notas_validas')??'—')}</td><td>${F.badge(val(x,'classificacao','classificacao_historica')||'—')}</td></tr>`).join(''):empty(7);el('studentHistory').innerHTML=hist.length?hist.sort((x,y)=>Number(x.ano)-Number(y.ano)||Number(x.bimestre_numero)-Number(y.bimestre_numero)).map(x=>`<tr><td>${esc(x.ano)}</td><td>${esc(x.bimestre_numero??'—')}</td><td>${esc(x.disciplina||'—')}</td><td>${esc(x.turma||'—')}</td><td>${F.dec(x.nota)}</td><td>${F.pct(x.frequencia_percentual)}</td><td>${esc(x.numero_faltas_horas??'—')}</td></tr>`).join(''):empty(7);C.student(years);el('studentModal').classList.remove('hidden');document.body.style.overflow='hidden';}
  function closeStudent(){el('studentModal').classList.add('hidden');document.body.style.overflow='';}
  load();
})();
