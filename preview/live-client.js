'use strict';
// Only the public project key is shipped to the browser. Secrets remain in the Edge runtime.
window.VibeBackend = (() => {
  const url = 'https://koirkuoxosuhpvfukdkl.supabase.co';
  const key = 'sb_publishable_pyUsl-vcYGpJspIT71Dn1w_zM4NVV-0';
  let clientPromise;
  async function client() {
    if (!clientPromise) clientPromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.95.0/+esm')
      .then(({ createClient }) => createClient(url, key, { auth: { detectSessionInUrl: false } }))
      .catch(error => { clientPromise = null; throw error; });
    return clientPromise;
  }
  async function request(method, body, token) {
    const response = await fetch(url + '/functions/v1/venue-vibes', {
      method, headers: { apikey: key, ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Connection failed. Please try again.');
    return data;
  }
  let remaining=3;
  function guestToken(){let token;try{token=localStorage.getItem('vibecheck.guest.token');if(!token){token=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(x=>x.toString(16).padStart(2,'0')).join('');localStorage.setItem('vibecheck.guest.token',token);}return token;}catch{throw new Error('Enable browser storage to use guest ratings, or sign in.');}}
  async function guestRequest(action,body={}){const response=await fetch(url+'/functions/v1/guest-vibes',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({...body,action,guest_token:guestToken()}),signal:AbortSignal.timeout(15000)});const data=await response.json();if(data.remaining!==undefined)remaining=data.remaining;if(data.code==='GUEST_LIMIT')remaining=0;if(!response.ok)throw new Error(data.error||'Guest checks unavailable');return data;}
  return {
    get guestRemaining(){return remaining;},
    checkGuest:()=>guestRequest('status'),
    snapshots: () => request('GET'),
    async signedIn() { const c = await client(); const { data, error } = await c.auth.getSession(); if (error) throw error; return !!data.session; },
    async signIn(email, password) { const c = await client(); const { error } = await c.auth.signInWithPassword({ email, password }); if (error) throw error; },
    async signUp(email, password) { const c = await client(); const { data, error } = await c.auth.signUp({ email, password }); if (error) throw error; return !!data.session; },
    async signOut() { const c = await client(); const { error } = await c.auth.signOut(); if (error) throw error; },
    async submit(body) {
      const c = await client(); const { data, error } = await c.auth.getSession();
      if (error) throw error;
      if (!data.session) return guestRequest('submit',body);
      return request('POST', body, data.session.access_token);
    }
  };
})();

