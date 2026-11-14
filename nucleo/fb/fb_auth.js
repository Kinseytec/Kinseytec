/* ================= KinseyTec · acesso (Firebase Auth) ================= */
const KT_ADMINS = ["ia@kinsey.com.br"];
const KT_ROLES = {admin:"Administrador", editor:"Editor (cliente / Jurídico)", colaborador:"Colaborador (equipe Kinsey)", fornecedor:"Fornecedor (Portal)"};
const KT_AUTH = (() => {
  const hasFb = typeof firebase !== "undefined" && firebase.apps && firebase.apps.length;
  if (!hasFb) return null;
  const auth = firebase.auth(), db = firebase.firestore();
  /* conexão com o banco: detecção automática; em redes que bloqueiam o canal padrão (proxy, antivírus), usa long polling */
  let forceLP = false; try{ forceLP = localStorage.getItem("kt-lp") === "1"; }catch(e){}
  try{ db.settings(forceLP ? {ignoreUndefinedProperties:true, experimentalForceLongPolling:true}
                           : {ignoreUndefinedProperties:true, experimentalAutoDetectLongPolling:true, experimentalLongPollingOptions:{timeoutSeconds:25}}); }catch(e){}
  const TIMEOUT = "kt-timeout";
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(TIMEOUT)), ms))]);
  const roleCache = {
    get(uid){ try{ const c = JSON.parse(localStorage.getItem("kt-role-" + uid) || "null"); return c && c.role ? c : null; }catch(e){ return null; } },
    set(uid, r){ try{ if (r && r.role) localStorage.setItem("kt-role-" + uid, JSON.stringify({role:r.role, email:r.email, nome:r.nome || "", empresa:r.empresa || "", clienteId:r.clienteId || "", clienteNome:r.clienteNome || ""})); else localStorage.removeItem("kt-role-" + uid); }catch(e){} }
  };
  const css = `
  .ktl{position:fixed;inset:0;z-index:100;background:radial-gradient(circle at 60% 30%,#06306a,#011F4B 55%,#000A1C);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Montserrat,Arial,sans-serif;color:#E6E8EC}
  .ktl .card{width:100%;max-width:400px;background:rgba(1,31,75,.85);border:1px solid rgba(79,176,245,.35);border-radius:20px;padding:28px 24px;display:flex;flex-direction:column;gap:14px;box-shadow:0 30px 80px rgba(0,0,0,.5)}
  .ktl .brand{display:flex;align-items:center;gap:12px}.ktl .brand img{width:46px;height:46px}
  .ktl h1{margin:0;font-size:24px;font-weight:800}.ktl h1 span{color:#4FB0F5}.ktl h1 em{font-style:normal;font-weight:600}
  .ktl p{margin:0;font-size:13.5px;color:#a9bbd6;line-height:1.45}
  .ktl input{width:100%;box-sizing:border-box;background:#000A1C;border:1px solid rgba(150,190,240,.3);border-radius:10px;padding:11px 12px;color:#E6E8EC;font:inherit;font-size:15px}
  .ktl button{font:inherit;font-weight:700;font-size:14px;border-radius:10px;padding:11px 14px;cursor:pointer;border:1px solid rgba(150,190,240,.3);background:#0A2D60;color:#E6E8EC}
  .ktl button.pri{background:#0473C3;border-color:#0473C3;color:#fff}
  .ktl button.g{background:#fff;color:#1f2937;border-color:#fff;display:flex;align-items:center;justify-content:center;gap:10px}
  .ktl .row{display:flex;gap:8px;flex-wrap:wrap}.ktl .row button{flex:1}
  .ktl .lnk{background:none;border:0;color:#4FB0F5;padding:2px 0;font-weight:600;font-size:13px;text-align:left}
  .ktl .err{color:#FF8A8A;font-size:13px;min-height:1em}.ktl .ok{color:#36D399;font-size:13px}
  .ktl .sep{display:flex;align-items:center;gap:10px;color:#7f93b2;font-size:12px}.ktl .sep:before,.ktl .sep:after{content:"";flex:1;height:1px;background:rgba(150,190,240,.2)}
  .ktl .lang{align-self:flex-end;display:flex;border:1px solid rgba(150,190,240,.3);border-radius:99px;overflow:hidden}.ktl .lang button{border:0;border-radius:0;padding:5px 10px;font-size:11.5px;background:none}.ktl .lang button.on{background:#0473C3}`;
  const T = {
    pt:{sub:"Acesso restrito a usuários autorizados pela Kinsey BR.", google:"Entrar com Google", or:"ou com e-mail", email:"E-mail", pass:"Senha", enter:"Entrar", first:"Primeiro acesso: criar senha", forgot:"Esqueci a senha", verify:"Enviamos um link de confirmação para o seu e-mail. Confirme e depois entre aqui.", reset:"Enviamos um link para redefinir a senha.", noauth:"Seu e-mail ainda não foi autorizado. Peça acesso ao administrador:", out:"Sair", wait:"Verificando acesso…", needpass:"Informe e-mail e senha (mínimo 6 caracteres).", notver:"Confirme seu e-mail pelo link que enviamos e entre novamente.", resend:"Reenviar confirmação"},
    en:{sub:"Access restricted to users authorized by Kinsey BR.", google:"Sign in with Google", or:"or with email", email:"Email", pass:"Password", enter:"Sign in", first:"First access: create password", forgot:"Forgot password", verify:"We sent a confirmation link to your email. Confirm it, then sign in here.", reset:"We sent you a link to reset your password.", noauth:"Your email is not authorized yet. Ask the administrator for access:", out:"Sign out", wait:"Checking access…", needpass:"Enter email and password (at least 6 characters).", notver:"Confirm your email using the link we sent, then sign in again.", resend:"Resend confirmation"}
  };
  let lang = "pt"; try{ lang = localStorage.getItem("kinseytec-lang") || "pt"; }catch(e){}
  const errMsg = e => ({ "auth/invalid-credential":"E-mail ou senha incorretos.", "auth/wrong-password":"E-mail ou senha incorretos.", "auth/user-not-found":"E-mail não cadastrado. Use \"Primeiro acesso\".", "auth/email-already-in-use":"Este e-mail já tem senha. Use \"Entrar\" ou \"Esqueci a senha\".", "auth/weak-password":"A senha precisa ter pelo menos 6 caracteres.", "auth/popup-closed-by-user":"Login cancelado.", "auth/invalid-email":"E-mail inválido." }[e?.code] || (e?.message || "Não foi possível entrar."));
  let el = null;
  function shell(inner){
    if (!el){ const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st); el = document.createElement("div"); el.className = "ktl"; document.body.appendChild(el); }
    el.hidden = false;
    el.innerHTML = `<div class="card"><div class="lang"><button type="button" data-l="pt" class="${lang==="pt"?"on":""}">PT</button><button type="button" data-l="en" class="${lang==="en"?"on":""}">EN</button></div>
      <div class="brand"><img src="/icons/logo_white.png" alt="Kinsey BR"><div><h1>Kinsey<span>Tec</span> <em>– Cacau</em></h1></div></div>${inner}</div>`;
    el.querySelectorAll("[data-l]").forEach(b => b.onclick = () => { lang = b.dataset.l; try{ localStorage.setItem("kinseytec-lang", lang); }catch(e){} render(); });
  }
  let render = () => {};
  function loginForm(msg, ok){
    const t = T[lang];
    render = () => loginForm();
    shell(`<p>${t.sub}</p>
      <button type="button" class="g" id="kt-g"><svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.8-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.6l-7.5-5.8c-2.1 1.4-4.8 2.3-7.7 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.8 6.1C6.6 42.6 14.6 48 24 48z"/></svg>${t.google}</button>
      <div class="sep">${t.or}</div>
      <input id="kt-e" type="email" autocomplete="email" placeholder="${t.email}"><input id="kt-p" type="password" autocomplete="current-password" placeholder="${t.pass}">
      <div class="row"><button type="button" class="pri" id="kt-in">${t.enter}</button></div>
      <button type="button" class="lnk" id="kt-new">${t.first}</button><button type="button" class="lnk" id="kt-fg">${t.forgot}</button>
      <div class="${ok ? "ok" : "err"}" id="kt-m">${msg || ""}</div>`);
    const m = s => { el.querySelector("#kt-m").className = "err"; el.querySelector("#kt-m").textContent = s; };
    const ep = () => { const e = el.querySelector("#kt-e").value.trim(), p = el.querySelector("#kt-p").value; return {e, p}; };
    el.querySelector("#kt-g").onclick = () => { const pr = new firebase.auth.GoogleAuthProvider(); pr.setCustomParameters({prompt:"select_account"}); auth.signInWithPopup(pr).catch(e => { if (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment") auth.signInWithRedirect(pr); else m(errMsg(e)); }); };
    el.querySelector("#kt-in").onclick = () => { const {e, p} = ep(); if (!e || p.length < 6) return m(t.needpass); auth.signInWithEmailAndPassword(e, p).catch(x => m(errMsg(x))); };
    el.querySelector("#kt-new").onclick = () => { const {e, p} = ep(); if (!e || p.length < 6) return m(t.needpass); auth.createUserWithEmailAndPassword(e, p).then(c => c.user.sendEmailVerification()).then(() => loginForm(t.verify, true)).catch(x => m(errMsg(x))); };
    el.querySelector("#kt-fg").onclick = () => { const {e} = ep(); if (!e) return m(t.needpass); auth.sendPasswordResetEmail(e).then(() => loginForm(t.reset, true)).catch(x => m(errMsg(x))); };
  }
  function blocked(email, notVerified){
    const t = T[lang]; render = () => blocked(email, notVerified);
    shell(`<p>${notVerified ? t.notver : t.noauth} ${notVerified ? "" : `<b style="color:#fff">${KT_ADMINS[0]}</b>`}</p><p style="font-family:monospace">${email || ""}</p>
      <div class="row">${notVerified ? `<button type="button" id="kt-rs">${t.resend}</button>` : ""}<button type="button" class="pri" id="kt-out">${t.out}</button></div>`);
    el.querySelector("#kt-out").onclick = () => auth.signOut();
    const rs = el.querySelector("#kt-rs"); if (rs) rs.onclick = () => auth.currentUser.sendEmailVerification().then(() => { rs.textContent = "✓"; });
  }
  let waitT = null;
  function waiting(){ const t = T[lang]; render = waiting; const t0 = Date.now(); clearInterval(waitT);
    shell(`<p>${t.wait} <span id="kt-wt"></span></p><p id="kt-wh" style="display:none">${lang === "en" ? "This is taking longer than usual. Checking the connection to the database…" : "Está demorando mais que o normal. Verificando a conexão com o banco de dados…"}</p>`);
    waitT = setInterval(() => { const s2 = Math.round((Date.now() - t0) / 1000), w = document.getElementById("kt-wt"), h = document.getElementById("kt-wh"); if (!w){ clearInterval(waitT); return; } if (s2 >= 3) w.textContent = s2 + " s"; if (h && s2 >= 8) h.style.display = ""; }, 1000); }
  function offlineScreen(email){ clearInterval(waitT); render = () => offlineScreen(email);
    shell(`<p class="err">${lang === "en" ? "Could not reach the database." : "Não foi possível conectar ao banco de dados."}</p>
      <p>${lang === "en" ? "Check your internet connection. If it persists, the IT team should confirm that Cloud Firestore was created in the Firebase project (production mode, São Paulo) and that the company network allows firestore.googleapis.com." : "Verifique a internet. Se continuar, a equipe de TI deve confirmar que o Cloud Firestore foi criado no projeto do Firebase (modo de produção, São Paulo) e que a rede da empresa libera firestore.googleapis.com."}</p>
      <div class="row"><button type="button" class="pri" id="kt-retry">${lang === "en" ? "Try again" : "Tentar de novo"}</button><button type="button" id="kt-out2">${T[lang].out}</button></div>`);
    el.querySelector("#kt-retry").onclick = () => location.reload();
    el.querySelector("#kt-out2").onclick = () => auth.signOut().then(() => location.reload()); }
  async function fetchRole(u){
    const email = (u.email || "").toLowerCase();
    const safe = p => withTimeout(p, 9000).catch(e => { if (e.message === TIMEOUT) throw e; return null; });
    const us = await safe(db.collection("users").doc(u.uid).get());
    if (us && us.exists) return {email, ...us.data()};
    if (!u.emailVerified) return {role:null, notVerified:true, email};
    const inv = await safe(db.collection("invites").doc(email).get());
    if (inv && inv.exists){ const d = inv.data(); const body = {email, role:d.role, nome:d.nome || u.displayName || email, empresa:d.empresa || "", clienteId:d.clienteId || "", clienteNome:d.clienteNome || "", criadoEm:new Date().toISOString()};
      try{ await withTimeout(db.collection("users").doc(u.uid).set(body), 9000); return body; }catch(e){ if (e.message === TIMEOUT) throw e; return {role:null, email}; } }
    return {role:null, email};
  }
  async function resolveRole(u){
    const email = (u.email || "").toLowerCase();
    // administrador geral: entra na hora; o cadastro no banco é feito em segundo plano
    if (KT_ADMINS.includes(email) && u.emailVerified){
      const ref = db.collection("users").doc(u.uid);
      ref.get().then(s => { if (!s.exists) return ref.set({email, role:"admin", nome:u.displayName || email, criadoEm:new Date().toISOString()}); }).catch(() => {});
      return {role:"admin", email, nome:u.displayName || email};
    }
    // demais usuários: usa o perfil já confirmado neste aparelho e atualiza em segundo plano
    const cached = roleCache.get(u.uid);
    if (cached && u.emailVerified){
      fetchRole(u).then(r => { const changed = (r.role || null) !== cached.role || (r.clienteId || "") !== (cached.clienteId || ""); roleCache.set(u.uid, r); if (changed) location.reload(); }).catch(() => {});
      return cached;
    }
    try{ const r = await fetchRole(u); roleCache.set(u.uid, r); return r; }
    catch(e){
      if (e.message === TIMEOUT && !forceLP){ try{ localStorage.setItem("kt-lp", "1"); }catch(x){} location.reload(); return new Promise(() => {}); }
      return {role:null, email, offline:true};
    }
  }
  function gate(accept){
    waiting();
    return new Promise(res => {
      auth.getRedirectResult().catch(() => {});
      auth.onAuthStateChanged(async u => {
        if (!u){ loginForm(); return; }
        waiting();
        const r = await resolveRole(u);
        clearInterval(waitT);
        if (r.offline){ offlineScreen(r.email); return; }
        if (!r.role){ blocked(r.email, r.notVerified); return; }
        if (!accept.includes(r.role)){
          if (r.role === "fornecedor" && location.pathname.indexOf("portal") < 0){ location.href = "/portal.html"; return; }
          if (r.role !== "fornecedor" && location.pathname.indexOf("portal") >= 0){ location.href = "/"; return; }
          blocked(r.email); return;
        }
        if (el) el.hidden = true;
        res({user:u, ...r});
      });
    });
  }
  return {auth, db, gate, signOut:() => auth.signOut()};
})();
window.KT_AUTH = KT_AUTH;
