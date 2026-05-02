/**
 * viz-win-rate-donut.js — B11: Win Rate Donut (Chart.js)
 * Center text = Win Rate %. Animated, responsive.
 */
(function(){
  'use strict';
  const S={container:null,chart:null,ro:null,obs:null};
  function theme(){
    const d=document.documentElement.getAttribute('data-theme')==='dark';
    return{text:d?'#E8E8EC':'#1C1917',muted:d?'#9B9BA1':'#78716C',profit:d?'#4ADE80':'#16A34A',loss:d?'#F87171':'#DC2626'};
  }
  function render(botData,tf){
    if(!S.container)return;const T=theme(),data=botData[tf]||botData.daily,wr=data.winRate||0,lr=100-wr,W=S.container.clientWidth||300,H=Math.max(W*.75,220);
    if(S.chart){S.chart.destroy();S.chart=null;}
    S.container.innerHTML=`<div style="position:relative;width:100%;height:${H}px"><canvas id="wrd" width="${W}" height="${H}"></canvas><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none"><div style="font-size:${Math.min(W/5,32)}px;font-weight:800;color:${T.text};font-family:var(--sans);line-height:1">${wr.toFixed(1)}%</div><div style="font-size:11px;color:${T.muted};font-family:var(--sans);margin-top:2px">Win Rate</div></div></div>`;
    const ctx=document.getElementById('wrd').getContext('2d');
    S.chart=new Chart(ctx,{
      type:'doughnut',
      data:{labels:['Wins','Losses'],datasets:[{data:[wr,lr],backgroundColor:[T.profit,T.loss],borderWidth:0,borderRadius:6,spacing:3}]},
      options:{responsive:false,cutout:'72%',animation:{animateRotate:true,duration:800,easing:'easeOutQuart'},
        plugins:{legend:{display:false},tooltip:{backgroundColor:T.text,titleColor:'#FFF',bodyColor:'#FFF',cornerRadius:8,padding:10,bodyFont:{family:'var(--sans)',size:12},callbacks:{label:c=>` ${c.label}: ${c.parsed.toFixed(1)}%`}}}}
    });
  }
  window.VizWinRateDonut={
    init(c,b,t){S.container=c;render(b,t);S.ro=new ResizeObserver(()=>{if(S._b)render(S._b,S._t)});S.ro.observe(c);S.obs=new MutationObserver(()=>{if(S._b)render(S._b,S._t)});S.obs.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});},
    update(b,t){S._b=b;S._t=t;render(b,t);},
    destroy(){if(S.chart){S.chart.destroy();S.chart=null;}if(S.ro)S.ro.disconnect();if(S.obs)S.obs.disconnect();if(S.container)S.container.innerHTML='';S.container=null;}
  };
})();
