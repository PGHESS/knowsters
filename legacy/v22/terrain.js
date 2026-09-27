/* Ground polygons traced against the painted maps. A small footprint keeps feet off edges.
   The walk surface is two-dimensional, not the old road-centerline graph. */
(()=>{'use strict';
const ground={
 village:[[[3,53],[14,49],[18,43],[19,39],[24,39],[28,43],[30,49],[35,50],[36,40],[40,29],[44,25],[52,25],[60,30],[63,36],[66,42],[70,42],[73,40],[78,42],[79,49],[84,54],[89,57],[95,61],[97,69],[92,70],[87,64],[81,63],[78,67],[70,68],[65,74],[62,84],[59,90],[49,93],[43,89],[43,79],[40,70],[35,64],[29,63],[27,69],[22,69],[20,63],[11,61],[3,61]]],
 forest:[[[1,57],[13,54],[24,54],[34,55],[37,48],[39,43],[46,39],[55,39],[64,40],[68,35],[69,25],[74,19],[83,16],[89,21],[91,29],[86,35],[80,38],[75,42],[68,48],[60,51],[51,49],[47,48],[44,53],[44,59],[47,64],[51,68],[56,73],[61,74],[62,81],[63,86],[58,88],[52,84],[47,79],[45,73],[43,68],[40,63],[35,62],[28,65],[18,66],[8,65],[1,63]]],
 canyon:[
 [[1,61],[13,60],[21,56],[28,48],[35,44],[41,42],[43,47],[37,51],[32,55],[26,62],[21,67],[13,70],[1,70]],
 [[39,41],[46,39],[54,39],[58,41],[59,46],[53,47],[46,47],[40,49]],
 [[56,41],[63,39],[69,36],[70,29],[74,23],[79,19],[86,18],[89,22],[88,28],[86,35],[82,41],[77,46],[70,48],[63,48],[60,50],[63,54],[68,58],[71,64],[71,70],[72,75],[78,77],[80,82],[77,85],[71,84],[66,80],[64,76],[63,69],[62,62],[59,56],[56,51]]
 ],
 lake:[
 [[1,61],[14,61],[24,57],[29,51],[33,48],[36,51],[35,55],[31,61],[28,66],[21,70],[11,71],[1,70]],
 [[32,48],[40,46],[49,44],[54,45],[55,49],[48,51],[40,54],[34,55]],
 [[52,43],[59,40],[66,40],[72,37],[75,32],[77,27],[81,26],[85,28],[87,33],[84,37],[79,42],[76,46],[71,49],[64,50],[60,52],[56,55],[55,59],[58,63],[61,67],[63,72],[67,75],[73,75],[79,78],[83,79],[83,84],[76,86],[69,84],[64,82],[60,80],[58,74],[56,68],[53,64],[51,60],[52,54]]
 ],
 pass:[
 [[1,67],[12,67],[21,64],[27,59],[32,54],[36,51],[42,47],[46,50],[40,56],[36,61],[32,65],[27,70],[20,75],[9,77],[1,76]],
 [[40,48],[46,44],[54,44],[59,47],[60,52],[53,53],[46,53],[42,55]],
 [[56,47],[63,44],[70,42],[75,39],[77,34],[78,30],[85,30],[89,34],[87,39],[82,45],[77,49],[71,51],[64,53],[65,57],[69,62],[73,69],[75,74],[81,75],[88,77],[90,82],[85,86],[78,87],[72,84],[68,81],[66,75],[65,69],[62,62],[59,56]]
 ],
 sanctuary:[
 [[1,69],[13,68],[20,64],[27,58],[34,53],[42,48],[49,45],[55,43],[58,47],[57,52],[50,55],[43,58],[37,62],[30,69],[22,75],[13,79],[1,79]],
 [[48,46],[55,43],[59,44],[65,43],[71,41],[76,38],[79,33],[83,31],[86,34],[86,39],[82,43],[76,48],[70,52],[64,52],[58,52],[53,53]]
 ]
};
// Solid house footprints within otherwise open village grounds.
const solid={village:[[[44,58],[60,58],[64,76],[58,83],[46,82]],[[19,30],[28,30],[28,38],[19,38]]],sanctuary:[[[50,57],[58,56],[70,61],[78,70],[78,87],[68,94],[56,87],[50,74]]]};
const bounds=p=>[Math.max(1.5,Math.min(98.5,Number(p?.[0])||1.5)),Math.max(5,Math.min(96,Number(p?.[1])||5))];
const dist=(a,b)=>Math.hypot((a[0]-b[0])*1.5,a[1]-b[1]);
function inside(p,polygon){let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function raw(zone,p){return p[0]>=1.5&&p[0]<=98.5&&p[1]>=5&&p[1]<=96&&(ground[zone]||[]).some(poly=>inside(p,poly))&&!(solid[zone]||[]).some(poly=>inside(p,poly));}
function walkable(map,p){const zone=map.zone||map;return [[0,0],[-.38,0],[.38,0],[0,-.55],[0,.55]].every(([x,y])=>raw(zone,[p[0]+x,p[1]+y]));}
function clear(map,a,b){const n=Math.max(1,Math.ceil(dist(a,b)/.35));for(let i=0;i<=n;i++)if(!walkable(map,[a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n]))return false;return true;}
const cached=new Map(),W=101;
function grid(map){if(cached.has(map.zone))return cached.get(map.zone);const cells=new Uint8Array(W*W),points=[];for(let y=5;y<=96;y++)for(let x=2;x<=98;x++)if(walkable(map,[x,y])){cells[y*W+x]=1;points.push([x,y]);}
 let start=points.reduce((a,b)=>dist(a,map.spawn)<dist(b,map.spawn)?a:b),queue=[start[1]*W+start[0]],connected=new Uint8Array(W*W);connected[queue[0]]=1;
 for(let head=0;head<queue.length;head++){const at=queue[head],a=[at%W,Math.floor(at/W)];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const b=[a[0]+dx,a[1]+dy],i=b[1]*W+b[0];if(cells[i]&&!connected[i]&&clear(map,a,b)){connected[i]=1;queue.push(i);}}}
 const result={cells:connected,points:points.filter(p=>connected[p[1]*W+p[0]])};cached.set(map.zone,result);return result;
}
function safe(map,p){p=bounds(p);const g=grid(map),near=g.points.reduce((a,b)=>dist(a,p)<dist(b,p)?a:b);return walkable(map,p)&&clear(map,p,near)?p:[...near];}
function route(map,from,to){const start=safe(map,from),end=safe(map,to);if(clear(map,start,end))return[start,end];const g=grid(map),anchor=p=>g.points.filter(q=>dist(p,q)<3&&clear(map,p,q)).sort((a,b)=>dist(a,p)-dist(b,p))[0];const a=anchor(start),b=anchor(end);if(!a||!b)return[start];
 const begin=a[1]*W+a[0],goal=b[1]*W+b[0],cost=new Float64Array(W*W).fill(Infinity),prev=new Int32Array(W*W).fill(-1),closed=new Uint8Array(W*W),heap=[];
 function push(i,f){let n=heap.length;heap.push({i,f});while(n){const p=(n-1)>>1;if(heap[p].f<=f)break;heap[n]=heap[p];n=p;}heap[n]={i,f};}
 function pop(){const top=heap[0],last=heap.pop();if(heap.length){let n=0;heap[0]=last;while(true){let c=n*2+1;if(c>=heap.length)break;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=last.f)break;heap[n]=heap[c];n=c;}heap[n]=last;}return top.i;}
 cost[begin]=0;push(begin,dist(a,b));while(heap.length){const i=pop();if(closed[i])continue;if(i===goal)break;closed[i]=1;const p=[i%W,Math.floor(i/W)];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const q=[p[0]+dx,p[1]+dy],j=q[1]*W+q[0];if(!g.cells[j]||closed[j]||!clear(map,p,q))continue;const c=cost[i]+dist(p,q);if(c<cost[j]){cost[j]=c;prev[j]=i;push(j,c+dist(q,b));}}}
 if(!Number.isFinite(cost[goal]))return[start];const path=[end];for(let i=goal;i!==-1;i=prev[i])path.unshift([i%W,Math.floor(i/W)]);path.unshift(start);
 const smooth=[start];let at=0;while(at<path.length-1){let next=path.length-1;while(next>at+1&&!clear(map,path[at],path[next]))next--;smooth.push(path[next]);at=next;}return smooth;
}
function move(map,from,to,slide=true){const n=Math.max(1,Math.ceil(dist(from,to)/.3));let p=[...from];for(let i=0;i<n;i++){const dx=(to[0]-from[0])/n,dy=(to[1]-from[1])/n,next=[p[0]+dx,p[1]+dy];if(walkable(map,next))p=next;else if(slide){if(walkable(map,[p[0]+dx,p[1]]))p[0]+=dx;if(walkable(map,[p[0],p[1]+dy]))p[1]+=dy;}else break;}return p;}
window.KnowstersTerrain={ground,solid,walkable,clear,safe,route,move,grid};
})();
