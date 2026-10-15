'use strict';
// Ephemeral device location: never persisted or sent to the ratings API.
window.VibeNearby=(()=>{
  const radiusKm=5;
  let origin=null,pending=false,onChange=()=>{},message='Finding nearby venues…';
  function distanceKm(a,b){const rad=x=>x*Math.PI/180,dlat=rad(b[0]-a[0]),dlon=rad(b[1]-a[1]);const h=Math.sin(dlat/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(dlon/2)**2;return 6371*2*Math.asin(Math.sqrt(Math.min(1,h)));}
  function matches(point){return !origin||!!point&&distanceKm(origin,point)<=radiusKm;}
  function draw(){document.getElementById('nearbyStatus').textContent=message;document.getElementById('retryLocation').disabled=pending;document.getElementById('nearMe').disabled=pending;onChange();}
  function locate(){if(pending)return;if(!navigator.geolocation){message='Location unavailable · Showing all pilot venues.';draw();return;}pending=true;message='Finding venues within 5 km…';draw();navigator.geolocation.getCurrentPosition(p=>{pending=false;const {latitude,longitude,accuracy}=p.coords;if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180){message='Could not determine location · Showing all pilot venues.';origin=null;}else{origin=[latitude,longitude];message='Within 5 km of you'+(accuracy>1000?' · Location approximate':'')+' · Location not saved';}draw();},err=>{pending=false;message=origin?'Location refresh failed · Using your previous 5 km area.':err.code===1?'Location permission denied · Showing all pilot venues. Enable location in browser settings to see nearby venues.':'Could not find your location · Showing all pilot venues. Tap Use my location to retry.';draw();},{enableHighAccuracy:false,timeout:12000,maximumAge:60000});}
  function init(callback){onChange=callback;document.getElementById('retryLocation').onclick=locate;locate();}
  return {init,locate,matches,distanceKm,radiusKm,get origin(){return origin;}};
})();
