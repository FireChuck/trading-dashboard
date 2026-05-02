/**
 * viz-max-drawdown-area.js — B13: Max Drawdown Area Chart (Chart.js)
 * Downward curve, red fill, "MAX DD" watermark, max point marker.
 */
(function(){
  'use strict';
  const S={container:null,chart:null,ro:null,obs:null};
  function theme(){
    const T=window.ThemeColors();
    return{text:T.text,muted:T.textMuted,loss:T.loss,lossFill:T.lossFill,grid:T.gridLine,wm:T.dark?'rgba(248,113,113,.04)':'rgba(220,38,38,.03)',tipBg:T.tipBg,tipBorder:T.tipBorder};
  }
  function render(botData,tf){
    if(!S.container)return;const T=theme(),data=botData[tf]||botData.daily,curve=data.drawdownCurve||[],W=S.container.clientWidth||400,H=Math.max(W*.55,200);
    if(S.chart){S.chart.destroy();S.chart=null;}
    const maxDD=Math.max(...curve.map(d=>d.dd),0),maxIdx=curve.findIndex(d=>d.dd===maxDD);
    S.container.innerHTML=`<div style="position:relative;width:100%;height:${H}px"><canvas id="ddc" width="${W}" height="${H}"></canvas><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:${Math.min(W/6,42)}px;font-weight:900;color:${T.wm};font-family:var(--sans);letter-spacing:6px;pointer-events:none;user-select:none">MAX DD</div></div>`;
    const ctx=document.getElementById('ddc').getContext('2d'),grad=ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,'transparent');grad.addColorStop(.5,T.lossFill);grad.addColorStop(1,T.lossFill);
    S.chart=new Chart(ctx,{
      type:'line',
      data:{labels:curve.map(d=>d.date.slice(5)),datasets:[{data:curve.map(d=>-d.dd),borderColor:T.loss,borderWidth:2.5,backgroundColor:grad,fill:true,tension:.4,pointRadius:curve.map((_,i)=>i===maxIdx?6:0),pointBackgroundColor:curve.map((_,i)=>i===maxIdx?T.loss:'transparent'),pointBorderColor:T.loss,pointBorderWidth:2,pointHoverRadius:6}]},
      options:{responsive:false,animation:{duration:700,easing:'easeOutQuart'},
        scales:{x:{grid:{color:T.grid,drawBorder:false},ticks:{color:T.muted,font:{size:10,family:'var(--mono)'},maxRotation:0},border:{display:false}},y:{grid:{color:T.grid,drawBorder:false},ticks:{color:T.muted,font:{size:10,family:'var(--mono)'},callback:v=>'-$'+Math.abs(v).toLocaleString()},border:{display:false}}},
        plugins:{legend:{display:false},tooltip:{backgroundColor:T.tipBg,titleColor:T.text,bodyColor:T.muted,cornerRadius:8,padding:10,borderColor:T.tipBorder,bodyFont:{family:'var(--sans)',size:12},callbacks:{title:i=>i[0].label,label:c=>` Drawdown: -$${Math.abs(c.parsed.y).toLocaleString()}`}}},
        interaction:{intersect:false,mode:'index'}}
    });
  }
  window.VizMaxDrawdownArea={
    init(c,b,t){S.container=c;render(b,t);S.ro=new ResizeObserver(()=>{if(S._b)render(S._b,S._t)});S.ro.observe(c);S.obs=new MutationObserver(()=>{if(S._b)render(S._b,S._t)});S.obs.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});},
    update(b,t){S._b=b;S._t=t;render(b,t);},
    destroy(){if(S.chart){S.chart.destroy();S.chart=null;}if(S.ro)S.ro.disconnect();if(S.obs)S.obs.disconnect();if(S.container)S.container.innerHTML='';S.container=null;}
  };
})();
