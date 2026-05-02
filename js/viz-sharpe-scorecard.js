/**
 * viz-sharpe-scorecard.js — B14: Sharpe Ratio Scorecard (Custom HTML/CSS/SVG)
 * Large value, trend arrow, sparkline, rating badge. Color: <1 red, 1-2 yellow, >2 green.
 */
(function(){
  'use strict';
  const S={container:null,ro:null,obs:null};
  function theme(){
    const d=document.documentElement.getAttribute('data-theme')==='dark';
    return{text:d?'#E8E8EC':'#1C1917',muted:d?'#9B9BA1':'#78716C',red:d?'#F87171':'#DC2626',yellow:d?'#FBBF24':'#D97706',green:d?'#4ADE80':'#16A34A'};
  }
  function sColor(v){return v>=2?'green':v>=1?'yellow':'red';}
  function spark(pts,w,h,col){
    if(!pts||pts.length<2)return'';
    const mx=Math.max(...pts),mn=Math.min(...pts),rng=mx-mn||1,pad=4;
    const cs=pts.map((v,i)=>{const x=pad+(i/(pts.length-1))*(w-pad*2),y=pad+(1-(v-mn)/rng)*(h-pad*2);return`${x},${y}`;}).join(' ');
    const area=`${pad},${h-pad} ${cs} ${w-pad},${h-pad}`;
    return`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block"><polygon points="${area}" fill="${col}" opacity=".1"/><polyline points="${cs}" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${cs.split(' ').pop().split(',')[0]}" cy="${cs.split(' ').pop().split(',')[1]}" r="3" fill="${col}"/></svg>`;
  }
  function render(botData,tf){
    if(!S.container)return;const T=theme(),data=botData[tf]||botData.daily,sh=data.sharpe||0,
    trend=data.sharpeTrend||[sh],W=S.container.clientWidth||300,H=200,ck=sColor(sh),col=T[ck],
    td=trend.length>=2?trend[trend.length-1]-trend[trend.length-2]:0,
    ti=td>.05?'↑':td<-.05?'↓':'→',tl=td>.05?'Rising':td<-.05?'Falling':'Stable',
    tc=td>.05?T.green:td<-.05?T.red:T.muted;
    let rating,rb;
    if(sh>=2){rating='Excellent';rb=T.green;}else if(sh>=1.5){rating='Good';rb=T.green;}else if(sh>=1){rating='Moderate';rb=T.yellow;}else{rating='Poor';rb=T.red;}
    const sw=Math.min(W-40,240),sh2=40;
    let h=`<div style="width:100%;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px">`;
    h+=`<span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:${rb};background:${rb}15;padding:3px 10px;border-radius:20px;font-family:var(--sans)">${rating}</span>`;
    h+=`<div style="display:flex;align-items:baseline;gap:6px"><span style="font-size:${Math.min(W/4,48)}px;font-weight:900;color:${col};font-family:var(--sans);line-height:1">${sh.toFixed(2)}</span><span style="font-size:${Math.min(W/10,13)}px;color:${tc};font-family:var(--sans);font-weight:500">${ti} ${tl}</span></div>`;
    h+=`<div style="font-size:11px;color:${T.muted};font-family:var(--sans)">Sharpe Ratio</div>`;
    h+=`<div style="margin-top:4px">${spark(trend,sw,sh2,col)}</div>`;
    h+=`<div style="display:flex;justify-content:space-between;width:${sw}px"><span style="font-size:9px;color:${T.muted};font-family:var(--mono)">T-6</span><span style="font-size:9px;color:${T.muted};font-family:var(--mono)">Now</span></div>`;
    h+=`</div>`;
    S.container.innerHTML=h;
  }
  window.VizSharpeScorecard={
    init(c,b,t){S.container=c;render(b,t);S.ro=new ResizeObserver(()=>{if(S._b)render(S._b,S._t)});S.ro.observe(c);S.obs=new MutationObserver(()=>{if(S._b)render(S._b,S._t)});S.obs.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});},
    update(b,t){S._b=b;S._t=t;render(b,t);},
    destroy(){if(S.ro)S.ro.disconnect();if(S.obs)S.obs.disconnect();if(S.container)S.container.innerHTML='';S.container=null;}
  };
})();
