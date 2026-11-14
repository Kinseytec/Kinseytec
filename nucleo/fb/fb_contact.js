/* Contato Kinsey BR: botão no topo + janela com e-mail, WhatsApp e telefone (sistema e Portal) */
(function(){
  const C = {emails:["contato@kinsey.com.br","newton.kao@kinsey.com.br"], fone:"(11) 96635-0424", wa:"5511966350424"};
  window.KT_CONTACT = C;
  const T = {
    pt:{btn:"Contato", eb:"Kinsey BR · KinseyTec", h:"Fale com a Kinsey BR", sub:"Dúvidas, suporte, novos usuários ou uma demonstração para outros segmentos.", mail:"E-mail", wa:"WhatsApp", tel:"Telefone", call:"Ligar", end:"Rua do Rocio, 199, cj 91 · Vila Olímpia · São Paulo", close:"Fechar", msg:"Olá, Kinsey BR! Gostaria de falar sobre o KinseyTec."},
    en:{btn:"Contact", eb:"Kinsey BR · KinseyTec", h:"Talk to Kinsey BR", sub:"Questions, support, new users or a demo for other segments.", mail:"E-mail", wa:"WhatsApp", tel:"Phone", call:"Call", end:"Rua do Rocio, 199, cj 91 · Vila Olímpia · São Paulo · Brazil", close:"Close", msg:"Hello, Kinsey BR! I would like to talk about KinseyTec."}
  };
  const lang = () => { try{ return localStorage.getItem("kinseytec-lang") === "en" ? "en" : "pt"; }catch(e){ return "pt"; } };
  const css = `.ktc-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.28);background:transparent;color:#E6E8EC;border-radius:99px;padding:6px 11px;font:700 12px/1 Montserrat,system-ui,sans-serif;cursor:pointer;white-space:nowrap}
.ktc-btn svg{width:14px;height:14px}
@media (max-width:760px){header.topbar:has(.kimbtn) .ktc-btn{display:none}}
header.topbar .brand>div{min-width:0;overflow:hidden}
@media (max-width:440px){#kt-acc{font-size:0;gap:0;padding:6px 9px}#kt-acc .kdot{display:none}#kt-acc::before{content:"\\1F465";font-size:14px;line-height:1}#kim-tour{font-size:0;gap:6px}#kim-tour::after{content:"Kim";font-size:12px}}
.ktc-scrim{position:fixed;inset:0;background:rgba(1,10,26,.66);z-index:9999;display:flex;align-items:flex-end;justify-content:center}
@media (min-width:640px){.ktc-scrim{align-items:center}}
.ktc-card{background:#011F4B;color:#fff;border:1px solid rgba(127,184,230,.35);border-radius:18px 18px 0 0;width:100%;max-width:440px;padding:20px 18px calc(20px + env(safe-area-inset-bottom,0px));font:14px/1.45 Montserrat,system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.5)}
@media (min-width:640px){.ktc-card{border-radius:18px}}
.ktc-eb{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#7FB8E6;font-weight:700}
.ktc-card h2{margin:4px 0 4px;font-size:19px}.ktc-sub{color:#B9C6D8;font-size:13px;margin:0 0 14px}
.ktc-row{display:flex;align-items:center;gap:12px;padding:11px 12px;border:1px solid rgba(255,255,255,.14);border-radius:12px;margin-bottom:8px;text-decoration:none;color:#fff;background:rgba(255,255,255,.04)}
.ktc-row:hover{border-color:#0473C3}.ktc-row small{display:block;color:#9FB4CF;font-size:11px;font-weight:600;letter-spacing:.04em}
.ktc-row b{font-size:14px;word-break:break-all}.ktc-ic{width:34px;height:34px;border-radius:10px;background:#0473C3;display:grid;place-items:center;flex:none}
.ktc-ic.wa{background:#1FA855}.ktc-ic svg{width:18px;height:18px;fill:#fff}
.ktc-end{font-size:12px;color:#9FB4CF;margin:10px 2px 14px}
.ktc-x{width:100%;border:1px solid rgba(255,255,255,.25);background:transparent;color:#fff;border-radius:12px;padding:11px;font:700 13px Montserrat,system-ui,sans-serif;cursor:pointer}`;
  const I = {
    mail:'<svg viewBox="0 0 24 24"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7.2L4.2 7H4v.6l8 5.3 8-5.3V7h-.2L12 12.2z"/></svg>',
    wa:'<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>',
    tel:'<svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/></svg>'
  };
  function open(){
    const t = T[lang()];
    const s = document.createElement("div"); s.className = "ktc-scrim"; s.setAttribute("role", "dialog"); s.setAttribute("aria-modal", "true");
    s.innerHTML = `<div class="ktc-card"><div class="ktc-eb">${t.eb}</div><h2>${t.h}</h2><p class="ktc-sub">${t.sub}</p>
      ${C.emails.map(e => `<a class="ktc-row" href="mailto:${e}?subject=KinseyTec"><span class="ktc-ic">${I.mail}</span><span><small>${t.mail}</small><b>${e}</b></span></a>`).join("")}
      <a class="ktc-row" href="https://wa.me/${C.wa}?text=${encodeURIComponent(t.msg)}" target="_blank" rel="noopener"><span class="ktc-ic wa">${I.wa}</span><span><small>${t.wa}</small><b>${C.fone}</b></span></a>
      <a class="ktc-row" href="tel:+${C.wa}"><span class="ktc-ic">${I.tel}</span><span><small>${t.tel} · ${t.call}</small><b>+55 ${C.fone}</b></span></a>
      <p class="ktc-end">${t.end}</p><button type="button" class="ktc-x">${t.close}</button></div>`;
    const close = () => s.remove();
    s.addEventListener("click", e => { if (e.target === s) close(); });
    s.querySelector(".ktc-x").onclick = close;
    document.addEventListener("keydown", function k(e){ if (e.key === "Escape"){ close(); document.removeEventListener("keydown", k); } });
    document.body.appendChild(s);
  }
  window.KT_OPEN_CONTACT = open;
  function mount(){
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    /* contatos ficam só na apresentação final dos vídeos */
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
