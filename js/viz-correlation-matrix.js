/**
 * viz-correlation-matrix.js — A8: 3×3 Heatmap of inter-bot correlation
 * Custom SVG. Blue(-1) → White(0) → Red(+1). Hover tooltip.
 */
(function(){
  'use strict';
  const S={container:null,ro:null,obs:null};
  function theme(){const T=window.ThemeColors();return{bg:T.bg,text:T.text,muted:T.textMuted,border:T.border,tipBg:T.tipBg,tipBorder:T.tipBorder};}
  function cColor(v){
    if(v>=0){const t=Math.min(v,1);return`rgb(255,${Math.round(255*(1-t))},${Math.round(255*(1-t))})`;}
    const t=Math.min(-v,1);return`rgb(${Math.round(255*(1-t))},${Math.round(255*(1-t))},255)`;
  }
  function tColor(v){return Math.abs(v)>0.55?'#FFF':'#1C1917';}
  function render(botData,tf){
    if(!S.container)return;const T=theme(),bots=['momentumAlpha','meanReverter','scalpMaster'],
    labels={momentumAlpha:'Momentum\nAlpha',meanReverter:'Mean\nReverter',scalpMaster:'Scalp\nMaster'},
    data=botData[tf]||botData.daily,W=S.container.clientWidth||400,H=Math.max(W*.85,280),
    m={t:40,r:20,b:20,l:90},sz=Math.min((W-m.l-m.r)/3,(H-m.t-m.b)/3);
    let h=`<div style="position:relative;width:100%;height:${H}px"><svg width="100%" height="100%" viewBox="0 0 ${W} ${H}">`;
    h+=`<text x="${W/2}" y="24" text-anchor="middle" fill="${T.text}" font-size="13" font-weight="600" font-family="var(--sans)">Bot Correlation Matrix</text>`;
    // legend
    for(let i=0;i<=20;i++){const v=-1+(i/20)*2,x=W-130+i*6;h+=`<rect x="${x}" y="8" width="6" height="10" fill="${cColor(v)}" rx="1"/>`;}
    h+=`<text x="${W-130}" y="28" fill="${T.muted}" font-size="9" font-family="var(--sans)">-1</text>`;
    h+=`<text x="${W-70}" y="28" fill="${T.muted}" font-size="9" text-anchor="middle" font-family="var(--sans)">0</text>`;
    h+=`<text x="${W-10}" y="28" fill="${T.muted}" font-size="9" text-anchor="end" font-family="var(--sans)">+1</text>`;
    bots.forEach((bid,i)=>{
      labels[bid].split('\n').forEach((ln,li)=>{
        h+=`<text x="${m.l-8}" y="${m.t+i*sz+sz/2+(li-.5)*13}" text-anchor="end" fill="${T.text}" font-size="11" font-family="var(--sans)" dominant-baseline="middle">${ln}</text>`;
      });
      bots.forEach((cid,j)=>{
        const val=bid===cid?1:(data.correlation[cid]??0),x=m.l+j*sz,y=m.t+i*sz;
        h+=`<rect class="cc" data-r="${bid}" data-c="${cid}" data-v="${val}" x="${x}" y="${y}" width="${sz-2}" height="${sz-2}" fill="${cColor(val)}" rx="4" stroke="${T.border}" stroke-width=".5" style="cursor:pointer;transition:opacity .15s"/>`;
        h+=`<text x="${x+sz/2}" y="${y+sz/2}" text-anchor="middle" dominant-baseline="middle" fill="${tColor(val)}" font-size="14" font-weight="700" font-family="var(--mono)">${val.toFixed(2)}</text>`;
      });
    });
    bots.forEach((bid,j)=>{
      labels[bid].split('\n').forEach((ln,li)=>{
        h+=`<text x="${m.l+j*sz+sz/2}" y="${m.t+3*sz+12+li*13}" text-anchor="middle" fill="${T.muted}" font-size="10" font-family="var(--sans)">${ln}</text>`;
      });
    });
    h+=`</svg><div class="ctt" style="display:none;position:absolute;padding:8px 12px;background:${T.tipBg};border:1px solid ${T.tipBorder};border-radius:8px;font-size:12px;font-family:var(--sans);box-shadow:var(--shadow-md);pointer-events:none;z-index:10;white-space:nowrap"><div class="ctt-t" style="color:${T.text};font-weight:600"></div></div></div>`;
    S.container.innerHTML=h;
    const tip=S.container.querySelector('.ctt'),tipT=S.container.querySelector('.ctt-t');
    S.container.querySelectorAll('.cc').forEach(c=>{
      c.onmouseenter=function(){const r=this.dataset.r.replace(/([A-Z])/g,' $1').trim(),co=this.dataset.c.replace(/([A-Z])/g,' $1').trim(),v=+this.dataset.v;tipT.textContent=`${r} × ${co}: ${v>=0?'+':''}${v.toFixed(2)}`;tip.style.display='block';this.style.opacity='.8';};
      c.onmousemove=function(e){const rc=S.container.getBoundingClientRect();tip.style.left=(e.clientX-rc.left+12)+'px';tip.style.top=(e.clientY-rc.top-35)+'px';};
      c.onmouseleave=function(){tip.style.display='none';this.style.opacity='1';};
    });
  }
  window.VizCorrelationMatrix={
    init(c,b,t){S.container=c;render(b,t);S.ro=new ResizeObserver(()=>{if(S._b)render(S._b,S._t)});S.ro.observe(c);S.obs=new MutationObserver(()=>{if(S._b)render(S._b,S._t)});S.obs.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});},
    update(b,t){S._b=b;S._t=t;render(b,t);},
    destroy(){if(S.ro)S.ro.disconnect();if(S.obs)S.obs.disconnect();if(S.container)S.container.innerHTML='';S.container=null;}
  };
})();
