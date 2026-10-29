'use strict';
window.VibeRatingTimer=(()=>{
  const venues=new Map();
  let nextDifferent=0,venue=null,interval=null,busy=false,wasWaiting=false;
  const el=id=>document.getElementById(id);
  const submit=()=>document.querySelector('#ratingform button[type=submit]');
  function remaining(id){const now=Date.now(),same=venues.get(id)||0;return same>nextDifferent?{seconds:Math.max(0,Math.ceil((same-now)/1000)),same:true}:{seconds:Math.max(0,Math.ceil((nextDifferent-now)/1000)),same:false};}
  function refresh(){if(!venue)return;const wait=remaining(venue),waiting=wait.seconds>0;submit().disabled=busy||waiting;el('ratingCooldown').hidden=!waiting&&!wasWaiting;if(waiting){wasWaiting=true;el('ratingCooldownLabel').textContent=wait.same?'Same venue · 15-minute gap':'Different venue · 2-minute gap';el('ratingCooldownTime').textContent=String(Math.floor(wait.seconds/60)).padStart(2,'0')+':'+String(wait.seconds%60).padStart(2,'0');el('ratingCooldownStatus').textContent='You can submit when the countdown reaches zero.';}else if(wasWaiting){el('ratingCooldownTime').textContent='00:00';el('ratingCooldownStatus').textContent='Ready to rate. Submit when you’re ready.';wasWaiting=false;if(interval!==null){clearInterval(interval);interval=null;}}}
  function open(id){close();venue=id;refresh();if(remaining(id).seconds>0)interval=setInterval(refresh,1000);}
  function close(){if(interval!==null)clearInterval(interval);interval=null;venue=null;busy=false;wasWaiting=false;el('ratingCooldown').hidden=true;submit().disabled=false;}
  function saved(id){const now=Date.now();venues.set(id,now+900000);nextDifferent=now+120000;}
  function blocked(id,error){const same=error.code==='COOLDOWN_SAME_VENUE',different=error.code==='COOLDOWN_DIFFERENT_VENUE';const seconds=error.retryAfterSeconds;if((!same&&!different)||!Number.isFinite(seconds)||seconds<=0||seconds>900)return false;const until=Date.now()+Math.ceil(seconds)*1000;if(same)venues.set(id,until);else nextDifferent=until;open(id);return true;}
  function clear(){venues.clear();nextDifferent=0;close();}
  function init(){document.addEventListener('visibilitychange',refresh);}
  return {init,open,close,saved,blocked,clear,refresh,remaining,setBusy(value){busy=value;refresh();}};
})();
