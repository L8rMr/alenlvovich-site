(function(){
  const inner=window.fetch.bind(window);
  const docId=(org,kind,fy,q)=>{const h=[...`${org}|${kind}|${fy}|${q}`].reduce((a,c)=>a*31+c.charCodeAt(0)>>>0,7).toString(16).padStart(8,"0");return `00000000-0000-5000-8002-${h}0000`.slice(0,36)};
  const ready=(async()=>{try{
    const s=await (await inner("data/accruals_seed.json",{cache:"no-store"})).json();
    const col=(await (await inner("__boost__/collections?name=accruals")).json()).results[0].id;
    for(const x of s.docs) await inner(`__boost__/collections/${col}/documents/${docId(x.org,x.kind,x.fy,x.q)}`,{method:"PUT",body:JSON.stringify({data:x.data})});
  }catch(e){console.warn("demo seed",e)}})();
  window.fetch=async(url,init)=>{if(String(url).startsWith("__boost__"))await ready;return inner(url,init)};
})();
