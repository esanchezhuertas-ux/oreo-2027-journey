export function makeGraph(data, lang='es') {
  const source=data[lang], ref=data.es;
  const ids=new Map(source.nodes.map((n,i)=>[n[0],ref.nodes[i][0]]));
  const sections=source.sections.map((s,i)=>({id:ref.sections[i][0],title:s[1]}));
  const sectionIds=new Map(source.sections.map((s,i)=>[s[0],sections[i].id]));
  const nodes=new Map(source.nodes.map((n,i)=>[ref.nodes[i][0],{id:ref.nodes[i][0],sourceId:n[0],text:n[1],section:sectionIds.get(n[2]),decision:n[3]==='DIAMOND',error:n[4]?.r>.8&&n[4]?.g<.9&&n[4]?.b<.85&&n[4]?.g>n[4]?.b-0.1&&n[4]?.g<.86}]));
  const edges=source.edges.map((e,i)=>({id:i,from:ids.get(e[0]),to:ids.get(e[1]),label:e[2],error:e[3]?.r>.5&&e[3]?.r>(e[3]?.g||0)*1.5,return:e[4]}));
  if(edges.some(e=>!nodes.has(e.from)||!nodes.has(e.to)))throw Error('Unresolved flow connection');
  return {nodes,edges,sections,outgoing:id=>edges.filter(e=>e.from===id),incoming:id=>edges.filter(e=>e.to===id)};
}
export function validPath(graph, path) {
  if(!Array.isArray(path)||!path.length||path.length>256||path.some(id=>!graph.nodes.has(id)))return false;
  return path.every((id,i)=>i===0||graph.outgoing(path[i-1]).some(e=>e.to===id));
}
export function advance(graph,path,to){if(!graph.outgoing(path.at(-1)).some(e=>e.to===to))throw Error('Not an outgoing branch');return [...path.slice(-254),to];}
export function normalize(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}

export function canExplore(graph,id){return graph.nodes.has(id)&&graph.outgoing(id).length>0;}
