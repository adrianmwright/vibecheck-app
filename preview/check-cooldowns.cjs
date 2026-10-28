const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
for(const file of ['guest-vibes.ts','venue-vibes.ts']){
 const source=fs.readFileSync(__dirname+'/../supabase/functions/'+file.replace('.ts','')+'/index.ts','utf8');
 const helper=source.slice(source.indexOf('function cooldownResponse('),source.indexOf('Deno.serve(')).replace('error:{message:string;details?:string}','error');
 const ctx=vm.createContext({});vm.runInContext(helper,ctx);
 let result=ctx.cooldownResponse({message:'COOLDOWN_SAME_VENUE',details:'841'});assert.match(result.error,/same venue once every 15 minutes/);assert.match(result.error,/14m 1s/);assert.equal(result.retry_after_seconds,841);
 result=ctx.cooldownResponse({message:'COOLDOWN_DIFFERENT_VENUE',details:'59'});assert.match(result.error,/2 minutes/);assert.match(result.error,/59s/);assert.equal(result.retry_after_seconds,59);
 result=ctx.cooldownResponse({message:'COOLDOWN_DIFFERENT_VENUE',details:'invalid'});assert.equal(result.retry_after_seconds,120);
}
const html=fs.readFileSync(__dirname+'/index.html','utf8'),script=html.split('<script>')[1].split('</script>')[0];new vm.Script(script);
const nodes={};const get=id=>nodes[id]||(nodes[id]={value:5,checked:true,textContent:'',focus(){}});
const form={};const ctx=vm.createContext({document:{getElementById:id=>id==='ratingform'?form:get(id)},liveMode:false,selected:'V001',crowd:'Lively',reports:[],votes:{},WINDOW_MS:3600000,validReport:()=>true,persist(){},closeRating(){},renderList(){},renderDetail(){},toast(){},storageAvailable:true,VibeBackend:{submit(){throw Error('Test mode must not submit live ratings');}}});
vm.runInContext(script.slice(script.indexOf("document.getElementById('ratingform').onsubmit="),script.indexOf("document.getElementById('reset').onclick=")),ctx);
(async()=>{for(let i=0;i<5;i++)await form.onsubmit({preventDefault(){}});assert.equal(ctx.reports.length,5);assert.equal(get('error').textContent,'');assert.doesNotMatch(script,/now-votes\[selected\]<COOLDOWN_MS/);assert.match(html,/TEST MODE · Unlimited checks/);console.log('PASS: precise cooldown messages and five rapid sample ratings without live API calls');})().catch(e=>{console.error(e);process.exit(1)});
