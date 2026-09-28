const STEPS = ["technology","rows","alternatorQ","architecture","sectionCount","sectionRows","review"];

let state = {
  step: 0,
  technology: null,
  total_rows: null,
  hydraulic_alternator: null,
  architecture: null,
  section_count: null,
  sections: [], // {id, rows}
};

function visibleSteps(){
  // Filters out steps that don't apply given current answers, for the trail dots.
  let s = ["technology","rows"];
  if(state.total_rows !== null && state.total_rows <= 12) s.push("alternatorQ");
  s.push("architecture");
  if(state.architecture && state.architecture !== "SINGLE"){
    s.push("sectionCount","sectionRows");
  }
  s.push("review");
  return s;
}

function renderTrail(){
  const vs = visibleSteps();
  const cur = STEPS[state.step];
  const trail = document.getElementById('trail');
  trail.innerHTML = vs.map(s=>{
    const idx = vs.indexOf(s);
    const curIdx = vs.indexOf(cur);
    let cls = idx < curIdx ? "done" : (idx===curIdx ? "now" : "");
    return `<i class="${cls}"></i>`;
  }).join("");
}

function goto(stepName){
  state.step = STEPS.indexOf(stepName);
  render();
}
function next(){
  const vs = visibleSteps();
  const cur = STEPS[state.step];
  const idx = vs.indexOf(cur);
  const nextName = vs[idx+1];
  if(nextName) goto(nextName);
}
function back(){
  const vs = visibleSteps();
  const cur = STEPS[state.step];
  const idx = vs.indexOf(cur);
  const prevName = vs[idx-1];
  if(prevName) goto(prevName);
}

function render(){
  renderTrail();
  const app = document.getElementById('app');
  const step = STEPS[state.step];
  app.innerHTML = "";
  const fns = {
    technology: renderTechnology,
    rows: renderRows,
    alternatorQ: renderAlternatorQ,
    architecture: renderArchitecture,
    sectionCount: renderSectionCount,
    sectionRows: renderSectionRows,
    review: renderReview,
  };
  fns[step]();
}

function stepLabel(t){ return `<div class="step-label">${t}</div>`; }

function renderTechnology(){
  const app = document.getElementById('app');
  app.innerHTML = stepLabel("Tecnologia") + `<h2>Qual tecnologia está sendo configurada?</h2>
    <button class="opt ${state.technology==='TITANIUM_ELECTRIC'?'sel':''}" data-v="TITANIUM_ELECTRIC">Titanium Electric</button>
    <button class="opt ${state.technology==='SELENIUM_ELECTRIC'?'sel':''}" data-v="SELENIUM_ELECTRIC">Selenium Electric</button>
    <div class="actions"><button class="primary" id="nx" ${state.technology?'':'disabled'}>Continuar</button></div>`;
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
    state.technology = b.dataset.v; render();
  });
  const nx = document.getElementById('nx');
  if(nx) nx.onclick = next;
}

function renderRows(){
  const app = document.getElementById('app');
  app.innerHTML = stepLabel("Número de linhas") + `<h2>Quantas linhas a plantadeira possui, no total?</h2>
    <input type="number" id="rows" min="1" value="${state.total_rows ?? ''}" placeholder="ex: 45">
    <div id="errBox"></div>
    <div class="actions"><button class="ghost" id="bk">Voltar</button><button class="primary" id="nx">Continuar</button></div>`;
  document.getElementById('bk').onclick = back;
  document.getElementById('nx').onclick = ()=>{
    const v = parseInt(document.getElementById('rows').value,10);
    if(!v || v<=0){ document.getElementById('errBox').innerHTML = `<div class="err">O número de linhas deve ser maior que zero.</div>`; return; }
    state.total_rows = v;
    // R001: >=13 forces alternator
    if(v >= 13){ state.hydraulic_alternator = true; } else { state.hydraulic_alternator = null; }
    // reset downstream if rows changed
    state.sections = [];
    next();
  };
}

function renderAlternatorQ(){
  const app = document.getElementById('app');
  app.innerHTML = stepLabel("Alternador hidráulico") + `<h2>A máquina necessita de alternador hidráulico?</h2>
    <p class="pending">Com ${state.total_rows} linhas (≤12), a regra técnica ainda não obriga o alternador — a decisão é informada pelo vendedor/técnico.</p>
    <button class="opt ${state.hydraulic_alternator===true?'sel':''}" data-v="1">Sim</button>
    <button class="opt ${state.hydraulic_alternator===false?'sel':''}" data-v="0">Não</button>
    <div class="actions"><button class="ghost" id="bk">Voltar</button><button class="primary" id="nx" ${state.hydraulic_alternator!==null?'':'disabled'}>Continuar</button></div>`;
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
    state.hydraulic_alternator = b.dataset.v==="1"; render();
  });
  document.getElementById('bk').onclick = back;
  document.getElementById('nx').onclick = next;
}

function renderArchitecture(){
  const app = document.getElementById('app');
  const opts = [["SINGLE","Solteira"],["TANDEM","Tandem"],["SELF_TRANSPORTABLE","Autotransportável"],["OTHER","Outra"]];
  app.innerHTML = stepLabel("Arquitetura da plantadeira") + `<h2>Qual a arquitetura da máquina?</h2>` +
    opts.map(([v,l])=>`<button class="opt ${state.architecture===v?'sel':''}" data-v="${v}">${l}</button>`).join("") +
    `<div class="actions"><button class="ghost" id="bk">Voltar</button><button class="primary" id="nx" ${state.architecture?'':'disabled'}>Continuar</button></div>`;
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
    state.architecture = b.dataset.v;
    if(state.architecture === "SINGLE"){
      state.section_count = 1;
      state.sections = [{id:1, rows: state.total_rows}];
    } else {
      state.section_count = null;
      state.sections = [];
    }
    render();
  });
  document.getElementById('bk').onclick = back;
  document.getElementById('nx').onclick = ()=>{
    if(state.architecture === "SINGLE"){ goto("review"); } else { next(); }
  };
}

function renderSectionCount(){
  const app = document.getElementById('app');
  app.innerHTML = stepLabel("Número de seções") + `<h2>Em quantas seções a máquina se divide?</h2>
    <input type="number" id="sc" min="1" value="${state.section_count ?? ''}" placeholder="ex: 3">
    <div id="errBox"></div>
    <div class="actions"><button class="ghost" id="bk">Voltar</button><button class="primary" id="nx">Continuar</button></div>`;
  document.getElementById('bk').onclick = back;
  document.getElementById('nx').onclick = ()=>{
    const v = parseInt(document.getElementById('sc').value,10);
    if(!v || v<=0){ document.getElementById('errBox').innerHTML = `<div class="err">Informe um número de seções maior que zero.</div>`; return; }
    state.section_count = v;
    const prev = state.sections;
    state.sections = Array.from({length:v},(_,i)=>({id:i+1, rows: prev[i]?.rows ?? null}));
    next();
  };
}

function renderSectionRows(){
  const app = document.getElementById('app');
  app.innerHTML = stepLabel("Linhas por seção") + `<h2>Quantas linhas em cada seção?</h2>` +
    state.sections.map(s=>`
      <div class="row-inline">
        <label>Seção ${s.id}</label>
        <input type="number" min="0" data-id="${s.id}" class="secInput" value="${s.rows ?? ''}">
      </div>`).join("") +
    `<div id="errBox"></div>
     <div class="actions"><button class="ghost" id="bk">Voltar</button><button class="primary" id="nx">Continuar</button></div>`;
  document.getElementById('bk').onclick = back;
  document.getElementById('nx').onclick = ()=>{
    const inputs = [...document.querySelectorAll('.secInput')];
    const vals = inputs.map(i=>parseInt(i.value,10));
    if(vals.some(v=>!Number.isFinite(v) || v<0)){
      document.getElementById('errBox').innerHTML = `<div class="err">Preencha o número de linhas de todas as seções.</div>`; return;
    }
    const sum = vals.reduce((a,b)=>a+b,0);
    if(sum !== state.total_rows){
      document.getElementById('errBox').innerHTML = `<div class="err">A soma das linhas das seções (${sum}) deve ser igual ao número total de linhas da plantadeira (${state.total_rows}).</div>`;
      return;
    }
    state.sections = state.sections.map((s,i)=>({...s, rows: vals[i]}));
    next();
  };
}

/* ---------- MOTOR DE REGRAS v0.2 ---------- */
/* Camadas: entrada (state) -> regras -> cálculos -> resultado. Sem preço, estoque ou ERP. */

const ALT_OUTPUTS = 6, MAX_PER_OUTPUT = 10;
const PANEL_CABLE_OPTIONS_M = [4, 9, 14]; // R014 — regra de escolha PENDENTE
const LINE_CABLES = [                      // R015 — regra de composição PENDENTE
  {type:"LINE_CABLE_1", code:"30000000687", name:"KIT CHICOTE 1 LINHA", lines:1},
  {type:"LINE_CABLE_4", code:"30000000688", name:"KIT CHICOTE 4 LINHA", lines:4},
];

function computeDistribution(){
  // R012/R013: as 6 saídas são um recurso GLOBAL; seções não reservam saídas.
  if(!state.hydraulic_alternator) return {applicable:false, distribution:[], capacity:0, capacityExceeded:false};
  const capacity = ALT_OUTPUTS * MAX_PER_OUTPUT;
  let remaining = state.total_rows;
  const distribution = [];
  for(let o = 1; o <= ALT_OUTPUTS && remaining > 0; o++){
    const take = Math.min(MAX_PER_OUTPUT, remaining);
    distribution.push({output:o, rows:take});
    remaining -= take;
  }
  return {applicable:true, distribution, capacity, capacityExceeded: state.total_rows > capacity};
}

function computeComponents(){
  const c = [];
  c.push({name:"Conjunto ECU", quantity:1, rule_id:"R002"});
  c.push({name:"Sensor de levante", quantity:1, rule_id:"R002"});
  c.push({name:"Sensor de semente", quantity:state.total_rows, rule_id:"R003"});
  c.push({name:"Cabo ISOBUS", quantity:1, rule_id:"R002", pending:"modelo/comprimento pendente"});
  if(state.hydraulic_alternator){
    c.push({name:"Alternador hidráulico", quantity:1, rule_id: state.total_rows>=13 ? "R004" : "R005"});
  } else {
    c.push({name:"Cabo de alimentação direto da bateria", quantity:1, rule_id:"R006"});
  }
  return c;
}

function buildConfiguration(){
  const dist = computeDistribution();
  return {
    technology: state.technology,
    total_rows: state.total_rows,
    hydraulic_alternator: !!state.hydraulic_alternator,
    battery_power_cable: !state.hydraulic_alternator,
    machine_architecture: state.architecture,
    section_count: state.section_count,
    sections: state.sections.map(s=>({section:s.id, rows:s.rows})),
    alternator_outputs: state.hydraulic_alternator ? ALT_OUTPUTS : null,
    max_rows_per_output: state.hydraulic_alternator ? MAX_PER_OUTPUT : null,
    electrical_distribution: dist.distribution,
    panel_cable: state.hydraulic_alternator ? {options_m:PANEL_CABLE_OPTIONS_M, selected:null, status:"PENDENTE"} : null,
    line_cables: state.hydraulic_alternator ? {options:LINE_CABLES, composition:null, status:"PENDENTE"} : null,
    components: computeComponents().map(({name,quantity,rule_id})=>({name,quantity,rule_id})),
  };
}

/* ---------- FIM DO MOTOR DE REGRAS ---------- */

function renderReview(){
  const app = document.getElementById('app');
  const dist = computeDistribution();
  const comps = computeComponents();
  const cfg = buildConfiguration();
  const archLabel = {SINGLE:"Solteira",TANDEM:"Tandem",SELF_TRANSPORTABLE:"Autotransportável",OTHER:"Outra"}[state.architecture];
  const alt = state.hydraulic_alternator;

  let h = stepLabel("Configuração técnica gerada") + `<h2>Resultado</h2>`;
  if(dist.capacityExceeded){
    h += `<div class="warn">${state.total_rows} linhas excedem a capacidade do alternador (${dist.capacity} linhas). Tratamento desse caso ainda não definido — configuração incompleta.</div>`;
  }

  h += `<div class="summary-block"><h3>Entradas</h3>
    <div class="kv"><span>Tecnologia</span><span>${state.technology.replace('_',' ')}</span></div>
    <div class="kv"><span>Número de linhas</span><span>${state.total_rows}</span></div>
    <div class="kv"><span>Alternador</span><span>${alt ? (state.total_rows>=13?'Obrigatório <span class="tag">R004</span>':'Sim <span class="tag">R005</span>') : 'Não <span class="tag">R005</span>'}</span></div>
    <div class="kv"><span>Arquitetura</span><span>${archLabel}</span></div>
    <div class="kv"><span>Seções</span><span>${state.sections.length} — ${state.sections.map(s=>s.rows).join(' / ')}</span></div>
  </div>`;

  h += `<div class="summary-block"><h3>Componentes obrigatórios</h3>` +
    comps.map(c=>`<div class="kv"><span>${c.name}<span class="tag">${c.rule_id}</span></span><span>${c.quantity}${c.pending?` <span class="pending">(${c.pending})</span>`:''}</span></div>`).join("") + `</div>`;

  if(alt){
    h += `<div class="summary-block"><h3>Estrutura de alimentação <span class="tag">R007</span><span class="tag">R008</span></h3>
      <div class="kv"><span>Saídas do alternador</span><span>${ALT_OUTPUTS}</span></div>
      <div class="kv"><span>Capacidade por saída</span><span>${MAX_PER_OUTPUT} linhas</span></div>
      <div class="kv"><span>Capacidade total</span><span>${dist.capacity} linhas</span></div>
      <div class="kv"><span>Linhas da máquina</span><span>${state.total_rows}</span></div>
      <div style="height:10px"></div>` +
      dist.distribution.map(d=>`<div class="out-group">Saída ${d.output} → ${d.rows} linha(s)</div>`).join("") +
      `<div class="pending">Distribuição global (R012/R013): as seções podem compartilhar as saídas.</div></div>`;

    h += `<div class="summary-block"><h3>Cadeia física</h3>
      <div class="out-group">Alternador</div>
      <div class="out-group">Cabo de painel — opções: ${PANEL_CABLE_OPTIONS_M.join(' m / ')} m <span class="tag">R014</span><br><span class="pending">seleção do comprimento: pendente</span></div>
      <div class="out-group">Cabos de linha <span class="tag">R015</span><br>` +
        LINE_CABLES.map(l=>`${l.name} (${l.code})`).join("<br>") +
        `<br><span class="pending">composição 1 linha / 4 linhas: pendente de validação</span></div>
      <div class="out-group">Linhas da plantadeira</div></div>`;
  }

  h += `<div class="summary-block"><h3>Estrutura da máquina (armazenada)</h3>
    <div class="pending">Arquitetura e seções são registradas para regras futuras de cabos de alimentação. Não limitam as saídas do alternador.</div></div>`;

  h += `<div class="summary-block"><h3>Configuração estruturada (JSON)</h3>
    <pre id="json" style="margin:0 0 10px;font-size:.72rem;overflow-x:auto;white-space:pre-wrap;word-break:break-word">${JSON.stringify(cfg,null,2)}</pre>
    <button class="ghost" id="copy">Copiar JSON</button></div>`;

  h += `<div class="summary-block"><h3>Pendências (não implementadas)</h3>
    <div class="pending">Comprimento do ISOBUS e do cabo de painel · mangueiras · cabo de alimentação do equipamento · composição de cabos 1/4 linhas · distribuição física por seção · marca/modelo/adaptação · comercial.</div></div>`;

  h += `<div class="final-actions"><button class="ghost" id="bk">Voltar</button><button class="ghost" id="restart">Nova configuração</button></div>`;
  app.innerHTML = h;

  document.getElementById('copy').onclick = ()=>{
    const t = JSON.stringify(cfg,null,2);
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(
      ()=>{document.getElementById('copy').textContent='Copiado ✓';},
      ()=>{const r=document.createRange();r.selectNode(document.getElementById('json'));getSelection().removeAllRanges();getSelection().addRange(r);});
  };
  document.getElementById('bk').onclick = ()=> state.architecture==="SINGLE" ? goto("architecture") : back();
  document.getElementById('restart').onclick = ()=>{
    state = {step:0, technology:null, total_rows:null, hydraulic_alternator:null, architecture:null, section_count:null, sections:[]};
    render();
  };
}

render();
