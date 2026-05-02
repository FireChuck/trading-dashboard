/**
 * viz-allocation-treemap.js — A9: Capital Allocation Treemap (Custom HTML/CSS)
 * Nested Bot → Pair. Color by performance. Hover zoom effect.
 */
(function(){
  'use strict';
  const S={container:null,ro:null,obs:null};
  function theme(){const T=window.ThemeColors();return{text:T.text,muted:T.textMuted,tipBg:T.tipBg,tipBorder:T.tipBorder};}
  }
  function treemapLayout(items,x,y,w,h){
    if(!items.length||w<=0||h<=0)return[];
    if(items.length===1)return[{...items[0],x,y,w,h}];
    const total=items.reduce((s,i)=>s+i.value,0);
    if(total<=0)return[];
    const sorted=[...items].sort((a,b)=>b.value-a.value),wide=w>=h;
    let row=[],rowArea=0;
    for(const item of sorted){
      const frac=item.value/total;
      if(row.length===0){row.push(item);rowArea=frac;}
      else{
        const newArea=rowArea+frac;
        const cross=wide?h:w;
        let worstNew=0,worstOld=0;
        for(const r of row){const m=cross*(r.value/total/newArea);worstNew=Math.max(worstNew,Math.max(m/cross,cross/m));}
        for(const r of row){const m=cross*(r.value/total/rowArea);worstOld=Math.max(worstOld,Math.max(m/cross,cross/m));}
        if(newArea<=0.6||worstNew<=worstOld){row.push(item);rowArea=newArea;}else break;
      }
    }
    const rects=[],rowTotal=row.reduce((s,i)=>s+i.value,0),rowFrac=rowTotal/total,crossSize=wide?w*rowFrac:h*rowFrac;
    let offset=0;
    for(const item of row){
      const f=item.value/rowTotal,ms=(wide?h:w)*f;
      if(wide)rects.push({...item,x,y:y+offset,w:crossSize,h:ms});
      else rects.push({...item,x:x+offset,y,w:ms,h:crossSize});
      offset+=ms;
    }
    const rem=sorted.slice(row.length);
    if(rem.length>0){
      const rt=rem.reduce((s,i)=>s+i.value,0);
      if(wide)rects.push(...treemapLayout(rem,x+crossSize,y,w-crossSize,h));
      else rects.push(...treemapLayout(rem,x,y+crossSize,w,h-crossSize));
    }
    return rects;
  }
  function render(botData,tf){
    if(!S.container)return;const T=theme(),data=botData[tf]||botData.daily,W=S.container.clientWidth||400,H=Math.max(W*.7,250),pad=3;
    const names={momentumAlpha:'Momentum Alpha',meanReverter:'Mean Reverter',scalpMaster:'Scalp Master'};
    const colors={momentumAlpha:'#5B8DEF',meanReverter:'#F59E0B',scalpMaster:'#10B981'};
    const perf={momentumAlpha:3200,meanReverter:1200,scalpMaster:2800};
    const items=[];
    for(const[bid,alloc]of Object.entries(data.allocation)){
      for(const[pair,pct]of Object.entries(alloc)){
        items.push({botId:bid,pair,value:pct,label:`${names[bid]} — ${pair}`,botName:names[bid],botColor:colors[bid],p:perf[bid]*(pct/100)});
      }
    }
    const rects=treemapLayout(items,0,0,W-pad*2,H-50);
    let h=`<div style="position:relative;width:100%;height:${H}px">`;
    h+=`<div style="font-size:13px;font-weight:600;color:${T.text};margin-bottom:8px;font-family:var(--sans)">Capital Allocation</div>`;
    rects.forEach(r=>{
      const g=2,x=r.x+pad+g,y=r.y+pad+g,w=Math.max(r.w-g*2,1),ht=Math.max(r.h-g*2,1),op=.15+(r.value/50)*.35;
      h+=`<div class="tm" data-l="${r.label}" data-p="${r.pair}" data-a="${r.value}" data-pf="${r.p}" data-op="${op}" style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${ht}px;background:${r.botColor};opacity:${op};border-radius:6px;border:1px solid ${r.botColor}40;cursor:pointer;transition:all .2s ease;display:flex;flex-direction:column;justify-content:center;align-items:center;overflow:hidden">`;
      h+=`<div style="font-size:${Math.min(w/8,14)}px;font-weight:700;color:${T.text};font-family:var(--sans);text-shadow:0 1px 3px rgba(0,0,0,.3)">${r.pair}</div>`;
      if(ht>40)h+=`<div style="font-size:${Math.min(w/10,11)}px;color:${T.muted};font-family:var(--sans);margin-top:2px">${r.value}%</div>`;
      if(ht>60)h+=`<div style="font-size:${Math.min(w/12,10)}px;color:${T.muted};font-family:var(--sans);margin-top:1px;opacity:.7">${r.botName}</div>`;
      h+=`</div>`;
    });
    h+=`<div style="display:flex;gap:12px;margin-top:${H-45}px;flex-wrap:wrap">`;
    for(const[id,nm]of Object.entries(names))h+=`<div style="display:flex;align-items:center;gap:4px"><div style="width:10px;height:10px;border-radius:2px;background:${colors[id]}"></div><span style="font-size:10px;color:${T.muted};font-family:var(--sans)">${nm}</span></div>`;
    h+=`</div><div class="ttm" style="display:none;position:absolute;padding:8px 12px;background:${T.tipBg};border:1px solid ${T.tipBorder};border-radius:8px;font-size:12px;font-family:var(--sans);box-shadow:var(--shadow-md);pointer-events:none;z-index:10"></div></div>`;
    S.container.innerHTML=h;
    const tip=S.container.querySelector('.ttm');
    S.container.querySelectorAll('.tm').forEach(c=>{
      c.onmouseenter=function(){this.style.opacity='.5';this.style.transform='scale(1.02)';tip.innerHTML=`<div style="font-weight:600;color:${T.text}">${this.dataset.l}</div><div style="color:${T.muted};margin-top:2px">Allocation: ${this.dataset.a}%</div>`;tip.style.display='block';};
      c.onmousemove=function(e){const rc=S.container.getBoundingClientRect();tip.style.left=(e.clientX-rc.left+12)+'px';tip.style.top=(e.clientY-rc.top-45)+'px';};
      c.onmouseleave=function(){this.style.opacity=this.dataset.op;this.style.transform='scale(1)';tip.style.display='none';};
    });
  }
  window.VizAllocationTreemap={
    init(c,b,t){S.container=c;render(b,t);S.ro=new ResizeObserver(()=>{if(S._b)render(S._b,S._t)});S.ro.observe(c);S.obs=new MutationObserver(()=>{if(S._b)render(S._b,S._t)});S.obs.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});},
    update(b,t){S._b=b;S._t=t;render(b,t);},
    destroy(){if(S.ro)S.ro.disconnect();if(S.obs)S.obs.disconnect();if(S.container)S.container.innerHTML='';S.container=null;}
  };
})();
