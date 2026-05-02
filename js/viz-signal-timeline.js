/**
 * viz-signal-timeline.js — A10: Vertical Signal Timeline (Custom HTML/CSS)
 * Scrollable feed with animated entries, color-coded by P&L.
 */
(function(){
  'use strict';
  const S={container:null,ro:null,obs:null};
  function theme(){
    const d=document.documentElement.getAttribute('data-theme')==='dark';
    return{bg:d?'#1A1B1E':'#FAFAF9',cardBg:d?'#222326':'#FFF',text:d?'#E8E8EC':'#1C1917',muted:d?'#9B9BA1':'#78716C',profit:d?'#4ADE80':'#16A34A',loss:d?'#F87171':'#DC2626',line:d?'#3A3B3E':'#D6D3D1'};
  }
  function render(botData,tf){
    if(!S.container)return;const T=theme(),data=botData[tf]||botData.daily,sigs=data.signals||[],H=360;
    let h=`<div style="position:relative;width:100%;height:${H}px;overflow:hidden">`;
    h+=`<div style="font-size:13px;font-weight:600;color:${T.text};margin-bottom:10px;font-family:var(--sans);display:flex;justify-content:space-between;align-items:center"><span>Signal Timeline</span><span style="font-size:11px;color:${T.muted};font-weight:400">${sigs.length} signals</span></div>`;
    h+=`<div style="position:relative;height:calc(100% - 30px);overflow-y:auto;overflow-x:hidden;padding-right:4px" class="ss">`;
    h+=`<div style="position:absolute;left:52px;top:0;bottom:0;width:2px;background:${T.line};border-radius:1px"></div>`;
    sigs.forEach((s,i)=>{
      const win=s.pnl>=0,pc=win?T.profit:T.loss;
      const dbg=win?(T.cardBg==='#FFF'?'#F0FDF4':'#0D2818'):(T.cardBg==='#FFF'?'#FEF2F2':'#2D1215');
      const db=win?'rgba(22,163,74,.2)':'rgba(220,38,38,.2)';
      h+=`<div class="se" style="display:flex;align-items:flex-start;margin-bottom:8px;opacity:0;animation:sfi .3s ease ${i*50}ms forwards">`;
      h+=`<div style="min-width:42px;text-align:right;padding-right:12px;padding-top:8px"><div style="font-size:10px;color:${T.muted};font-family:var(--mono)">${s.time}</div></div>`;
      h+=`<div style="position:relative;z-index:1"><div style="width:12px;height:12px;border-radius:50%;background:${pc};border:2px solid ${T.cardBg};margin-top:8px;box-shadow:0 0 0 2px ${pc}40"></div></div>`;
      h+=`<div style="flex:1;margin-left:12px;background:${T.cardBg};border:1px solid ${db};border-radius:10px;padding:10px 14px;min-width:0;box-shadow:var(--shadow-sm)">`;
      h+=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><span style="font-size:11px;font-weight:600;color:${pc};font-family:var(--sans);text-transform:uppercase;letter-spacing:.5px">${s.direction}</span><span style="font-size:12px;font-weight:700;color:${pc};font-family:var(--mono)">${win?'+':''}$${s.pnl.toLocaleString()}</span></div>`;
      h+=`<div style="display:flex;gap:8px;flex-wrap:wrap"><span style="font-size:11px;color:${T.text};font-family:var(--mono);font-weight:500">${s.pair}</span><span style="font-size:10px;color:${T.muted};font-family:var(--sans)">@ ${s.entry.toLocaleString()}</span><span style="font-size:10px;color:${T.muted};font-family:var(--sans);background:${T.bg};padding:1px 6px;border-radius:4px">${s.session}</span></div>`;
      h+=`</div></div>`;
    });
    h+=`</div></div>`;
    if(!document.getElementById('stlCSS')){
      const st=document.createElement('style');st.id='stlCSS';
      st.textContent=`@keyframes sfi{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}.ss::-webkit-scrollbar{width:4px}.ss::-webkit-scrollbar-track{background:transparent}.ss::-webkit-scrollbar-thumb{background:var(--border-primary);border-radius:4px}`;
      document.head.appendChild(st);
    }
    S.container.innerHTML=h;
    const el=S.container.querySelector('.ss');
    if(el)setTimeout(()=>{el.scrollTop=el.scrollHeight;},sigs.length*50+100);
  }
  window.VizSignalTimeline={
    init(c,b,t){S.container=c;render(b,t);S.ro=new ResizeObserver(()=>{if(S._b)render(S._b,S._t)});S.ro.observe(c);S.obs=new MutationObserver(()=>{if(S._b)render(S._b,S._t)});S.obs.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});},
    update(b,t){S._b=b;S._t=t;render(b,t);},
    destroy(){if(S.ro)S.ro.disconnect();if(S.obs)S.obs.disconnect();if(S.container)S.container.innerHTML='';S.container=null;}
  };
})();
