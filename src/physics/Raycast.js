/** Ray-vs-AABB slab test. Returns {x,y,distance,normalX,normalY} or null. */
export function raycastAABB(origin, direction, bounds, maxDistance = Infinity) {
  const minX=bounds.x-bounds.width/2, maxX=bounds.x+bounds.width/2;
  const minY=bounds.y-bounds.height/2, maxY=bounds.y+bounds.height/2;
  let tmin=-Infinity,tmax=Infinity,nx=0,ny=0;
  for(const [o,d,min,max,axis] of [[origin.x,direction.x,minX,maxX,"x"],[origin.y,direction.y,minY,maxY,"y"]]) {
    if(Math.abs(d)<1e-12) { if(o<min||o>max)return null; continue; }
    let t1=(min-o)/d,t2=(max-o)/d, sign=-Math.sign(d);
    if(t1>t2){[t1,t2]=[t2,t1];}
    if(t1>tmin){tmin=t1;nx=axis==="x"?sign:0;ny=axis==="y"?sign:0;}
    tmax=Math.min(tmax,t2);
    if(tmin>tmax)return null;
  }
  const distance=tmin>=0?tmin:tmax>=0?0:-1;
  if(distance<0||distance>maxDistance)return null;
  return {x:origin.x+direction.x*distance,y:origin.y+direction.y*distance,distance,normalX:nx,normalY:ny};
}
