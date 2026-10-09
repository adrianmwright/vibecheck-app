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
  return {
    snapshots: () => request('GET'),
    async signedIn() { const c = await client(); const { data, error } = await c.auth.getSession(); if (error) throw error; return !!data.session; },
    async signIn(email, password) { const c = await client(); const { error } = await c.auth.signInWithPassword({ email, password }); if (error) throw error; },
    async signUp(email, password) { const c = await client(); const { data, error } = await c.auth.signUp({ email, password }); if (error) throw error; return !!data.session; },
    async signOut() { const c = await client(); const { error } = await c.auth.signOut(); if (error) throw error; },
    async submit(body) {
      const c = await client(); const { data, error } = await c.auth.getSession();
      if (error) throw error;
      if (!data.session) throw new Error('Sign in before sharing a vibe check.');
      return request('POST', body, data.session.access_token);
    }
  };
})();
