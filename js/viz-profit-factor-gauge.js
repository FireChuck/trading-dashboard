/**
 * viz-profit-factor-gauge.js — B12: Profit Factor Gauge (Custom SVG)
 * Half-circle speedometer 0-3.0+. Zones: Red(<1), Yellow(1-1.5), Green(>1.5).
 * Animated needle sweep.
 */
(function(){
  'use strict';
  const S={container:null,ro:null,obs:null,af:null};
  function theme(){
    const d=document.documentElement.getAttribute('data-theme')==='dark';
    return{bg:d?'#1A1B1E':'#FAFAF9',text:d?'#E8E8EC':'#1C1917',muted:d?'#9B9BA1':'#78716C',red:d?'#F87171':'#DC2626',yellow:d?'#FBBF24':'#D97706',green:d?'#4ADE80':'#16A34A',track:d?'#222326':'#EFEFED'};
  }
  function p2c(cx,cy,r,a){const rad=(a-90)*Math.PI/180;return{x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)};}
  function arc(cx,cy,r,s,e){const sp=p2c(cx,cy,r,s),ep=p2c(cx,cy,r,e),l=(e-s)>180?1:0;return`M ${sp.x} ${sp.y} A ${r} ${r} 0 ${l} 1 ${ep.x} ${ep.y}`;}
  function pfAngle(v){return 180-Math.max(0,Math.min(3,v))/3*180;}
  function render(botData,tf){
    if(!S.container)return;if(S.af){cancelAnimationFrame(S.af);S.af=null;}
    const T=theme(),data=botData[tf]||botData.daily,pf=Math.min(data.profitFactor||0,3.5),
    W=S.container.clientWidth||300,H=Math.max(W*.65,180),cx=W/2,cy=H*.78,r=Math.min(W/2-20,H*.6);
    const zRed=pfAngle(1),zYellow=pfAngle(1.5),tAngle=pfAngle(pf),
    ac=pf<1?T.red:pf<1.5?T.yellow:T.green;
    let svg=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
    svg+=`<path d="${arc(cx,cy,r,180,0)}" fill="none" stroke="${T.track}" stroke-width="18" stroke-linecap="round"/>`;
    svg+=`<path d="${arc(cx,cy,r,180,zRed)}" fill="none" stroke="${T.red}" stroke-width="18" stroke-linecap="round" opacity=".3"/>`;
    svg+=`<path d="${arc(cx,cy,r,zRed,zYellow)}" fill="none" stroke="${T.yellow}" stroke-width="18" opacity=".3"/>`;
    svg+=`<path d="${arc(cx,cy,r,zYellow,0)}" fill="none" stroke="${T.green}" stroke-width="18" stroke-linecap="round" opacity=".3"/>`;
    svg+=`<path id="ga" d="${arc(cx,cy,r,180,180)}" fill="none" stroke="${ac}" stroke-width="18" stroke-linecap="round"/>`;
    const nr=r-15;
    svg+=`<line id="gn" x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy-nr}" stroke="${T.text}" stroke-width="2.5" stroke-linecap="round" transform="rotate(180,${cx},${cy})"/>`;
    svg+=`<circle cx="${cx}" cy="${cy}" r="6" fill="${T.text}"/><circle cx="${cx}" cy="${cy}" r="3" fill="${T.bg}"/>`;
    svg+=`<text x="${cx}" y="${cy+28}" text-anchor="middle" fill="${ac}" font-size="22" font-weight="800" font-family="var(--sans)" id="gv">0.00</text>`;
    svg+=`<text x="${cx}" y="${cy+44}" text-anchor="middle" fill="${T.muted}" font-size="10" font-family="var(--sans)">Profit Factor</text>`;
    [{v:0,a:180},{v:.5,a:150},{v:1,a:120},{v:1.5,a:90},{v:2,a:60},{v:2.5,a:30},{v:3,a:0}].forEach(l=>{
      const p=p2c(cx,cy,r+16,l.a);svg+=`<text x="${p.x}" y="${p.y+4}" text-anchor="middle" fill="${T.muted}" font-size="9" font-family="var(--mono)">${l.v}</text>`;
    });
    const rl=p2c(cx,cy,r-30,150),yl=p2c(cx,cy,r-30,105),gl=p2c(cx,cy,r-30,45);
    svg+=`<text x="${rl.x}" y="${rl.y}" text-anchor="middle" fill="${T.red}" font-size="8" font-weight="600" font-family="var(--sans)" opacity=".7">RISK</text>`;
    svg+=`<text x="${yl.x}" y="${yl.y}" text-anchor="middle" fill="${T.yellow}" font-size="8" font-weight="600" font-family="var(--sans)" opacity=".7">CAUTION</text>`;
    svg+=`<text x="${gl.x}" y="${gl.y}" text-anchor="middle" fill="${T.green}" font-size="8" font-weight="600" font-family="var(--sans)" opacity=".7">HEALTHY</text>`;
    svg+=`</svg>`;
    S.container.innerHTML=svg;
    const a=document.getElementById('ga'),n=document.getElementById('gn'),v=document.getElementById('gv'),st=performance.now();
    function anim(now){
      const t=Math.min((now-st)/900,1),e=1-Math.pow(1-t,3),ca=180-e*(180-tAngle),cp=e*pf;
      a.setAttribute('d',arc(cx,cy,r,180,ca));
      n.setAttribute('transform',`rotate(${ca},${cx},${cy})`);
      v.textContent=cp.toFixed(2);
      if(t<1)S.af=requestAnimationFrame(anim);
    }
    S.af=requestAnimationFrame(anim);
  }
  window.VizProfitFactorGauge={
    init(c,b,t){S.container=c;render(b,t);S.ro=new ResizeObserver(()=>{if(S._b)render(S._b,S._t)});S.ro.observe(c);S.obs=new MutationObserver(()=>{if(S._b)render(S._b,S._t)});S.obs.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});},
    update(b,t){S._b=b;S._t=t;render(b,t);},
    destroy(){if(S.af)cancelAnimationFrame(S.af);if(S.ro)S.ro.disconnect();if(S.obs)S.obs.disconnect();if(S.container)S.container.innerHTML='';S.container=null;}
  };
})();
