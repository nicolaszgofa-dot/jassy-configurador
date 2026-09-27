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
  const opts = [["SINGLE","Solteira"],["TANDEM","Tandem"],["SELF_PROPELLED","Autotransportável"],["OTHER","Outra"]];
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

/* ---------- MOTOR DE REGRAS ---------- */
/* Estas três funções concentram toda a lógica de negócio e podem ser
   extraídas para um módulo de backend (Node/Python/etc.) sem alterações,
   desde que recebam o mesmo formato de `state`. */

function computeDistribution(){
  // R: cada seção começa em uma nova saída; nenhuma saída excede 10 linhas.
  // Seções não compartilham saída entre si (distribuição física coerente com a arquitetura).
  let outputIdx = 0;
  const distribution = []; // {output, section, rows}
  for(const sec of state.sections){
    let remaining = sec.rows;
    while(remaining > 0){
      outputIdx++;
      const take = Math.min(10, remaining);
      distribution.push({output: outputIdx, section: sec.id, rows: take});
      remaining -= take;
    }
  }
  const outputsUsed = outputIdx;
  const capacityExceeded = outputsUsed > 6;
  return {distribution, outputsUsed, capacityExceeded};
}

function computeCables(distribution){
  // Regra ilustrativa (pendente validação técnica R05): fours = floor(n/4), ones = n%4
  let totalFours = 0, totalOnes = 0;
  const perOutput = distribution.map(d=>{
    const fours = Math.floor(d.rows/4);
    const ones = d.rows % 4;
    totalFours += fours; totalOnes += ones;
    return {...d, fours, ones};
  });
  return {perOutput, totalFours, totalOnes};
}

function computeComponents(){
  const comps = [];
  comps.push({name:"Conjunto ECU", rule:"MANDATORY"});
  comps.push({name:"Sensor de levante", rule:"MANDATORY"});
  comps.push({name:"Sensor de semente", rule:"MANDATORY", pending:"Quantidade — R01 pendente"});
  comps.push({name:"Cabo ISOBUS", rule:"MANDATORY", pending:"Modelo/comprimento — R02 pendente"});
  if(state.hydraulic_alternator){
    comps.push({name:"Alternador hidráulico", rule:"CONDITIONAL"});
    comps.push({name:"Mangueiras hidráulicas", rule:"CONDITIONAL", pending:"Comprimento — R04 pendente"});
  } else {
    comps.push({name:"Cabo de alimentação direto da bateria", rule:"CONDITIONAL", pending:"Modelo — R03 pendente"});
  }
  return comps;
}

/* ---------- FIM DO MOTOR DE REGRAS ---------- */

function renderReview(){
  const app = document.getElementById('app');
  const {distribution, outputsUsed, capacityExceeded} = computeDistribution();
  const {perOutput, totalFours, totalOnes} = computeCables(distribution);
  const components = computeComponents();
  const archLabel = {SINGLE:"Solteira",TANDEM:"Tandem",SELF_PROPELLED:"Autotransportável",OTHER:"Outra"}[state.architecture];

  let html = stepLabel("Configuração técnica gerada") + `<h2>Resultado</h2>`;

  if(capacityExceeded){
    html += `<div class="warn">A distribuição exige ${outputsUsed} saídas, excedendo as 6 disponíveis no alternador. Esta condição não possui regra definida (R07 pendente) — configuração inválida sem definição técnica adicional.</div>`;
  }

  html += `<div class="summary-block"><h3>Entradas</h3>
    <div class="kv"><span>Tecnologia</span><span>${state.technology.replace('_',' ')}</span></div>
    <div class="kv"><span>Total de linhas</span><span>${state.total_rows}</span></div>
    <div class="kv"><span>Alternador hidráulico</span><span>${state.hydraulic_alternator ? "Sim" : "Não"}${state.total_rows>=13?' <span class="tag">R001</span>':''}</span></div>
    <div class="kv"><span>Arquitetura</span><span>${archLabel}</span></div>
    <div class="kv"><span>Seções</span><span>${state.sections.map(s=>s.rows).join(' / ')}</span></div>
  </div>`;

  html += `<div class="summary-block"><h3>Distribuição elétrica (6 saídas, máx. 10 linhas/saída)</h3>`;
  html += distribution.map(d=>`<div class="out-group">Saída ${d.output} → Seção ${d.section} — ${d.rows} linha(s)</div>`).join("");
  html += `<div class="kv"><span>Saídas utilizadas</span><span>${outputsUsed} / 6</span></div></div>`;

  html += `<div class="summary-block"><h3>Cabos de linha <span class="pending">(composição ilustrativa — R05 pendente)</span></h3>`;
  html += perOutput.map(d=>`<div class="out-group">Saída ${d.output}: ${d.fours} cabo(s) de 4 linhas${d.ones?` + ${d.ones} cabo(s) de 1 linha`:''}</div>`).join("");
  html += `<div class="kv"><span>Total cabo 4 linhas</span><span>${totalFours}</span></div>
    <div class="kv"><span>Total cabo 1 linha</span><span>${totalOnes}</span></div></div>`;

  html += `<div class="summary-block"><h3>Componentes obrigatórios</h3>`;
  html += components.map(c=>`<div class="kv"><span>${c.name}</span><span>${c.pending?`<span class="pending">${c.pending}</span>`:'✓'}</span></div>`).join("");
  html += `</div>`;

  html += `<div class="summary-block"><h3>Próximas etapas (fora do MVP)</h3>
    <div class="pending">Marca, modelo e adaptação entram na sequência seguinte, para determinar a instalação. Regras pendentes: R01–R13 (ver especificação).</div></div>`;

  html += `<div class="final-actions"><button class="ghost" id="bk">Voltar</button><button class="ghost" id="restart">Nova configuração</button></div>`;

  app.innerHTML = html;
  document.getElementById('bk').onclick = back;
  document.getElementById('restart').onclick = ()=>{
    state = {step:0, technology:null, total_rows:null, hydraulic_alternator:null, architecture:null, section_count:null, sections:[]};
    render();
  };
}

render();
