'use strict';
window.VibeSharing = (() => {
  function build({venue,stats,invite=false,demo=false,origin,pathname='/',now=new Date()}) {
    const link=new URL(pathname,origin);
    if(demo)link.searchParams.set('demo','1');
    link.hash='venue='+encodeURIComponent(venue.id);
    const opening=invite?`I'm at ${venue.name} — come join me! 🙌`:`Check the vibe at ${venue.name} ✨`;
    const rated=stats.crowd!==null&&Number.isFinite(stats.social)&&Number.isFinite(stats.energy);
    const scores=rated?`Crowd: ${stats.crowd} · Social Vibe: ${stats.social.toFixed(1)}/10 · Energy: ${stats.energy.toFixed(1)}/10`:'Not enough recent ratings yet — check the venue for updates.';
    const time=now.toLocaleString('en-AU',{timeZone:'Australia/Brisbane',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});
    const text=[opening,venue.suburb,(demo?'DEMO — sample scores, not live venue information.\n':'')+scores,`Snapshot: ${time} AEST. The vibe can change.`,`See the latest on VibeCheck:`].join('\n');
    return {title:`${venue.name} · VibeCheck`,text,url:link.href};
  }
  let trigger;
  function fallback(payload,button){trigger=button;const dlg=document.getElementById('shareDialog');document.getElementById('shareDraft').value=payload.text+'\n'+payload.url;document.getElementById('shareStatus').textContent='Copy this draft into your chat or social app.';dlg.showModal();}
  async function send(options,button){const payload=build(options);if(navigator.share){try{await navigator.share(payload);return;}catch(error){if(error.name==='AbortError')return;}}fallback(payload,button);}
  function init(){const dlg=document.getElementById('shareDialog');document.getElementById('shareClose').onclick=()=>dlg.close();dlg.addEventListener('close',()=>trigger?.focus());document.getElementById('shareCopy').onclick=async()=>{const draft=document.getElementById('shareDraft');try{await navigator.clipboard.writeText(draft.value);document.getElementById('shareStatus').textContent='Copied — paste it into your chat.';}catch{draft.focus();draft.select();document.getElementById('shareStatus').textContent='Select and copy the draft, then paste it into your chat.';}};}
  return {build,send,init};
})();
