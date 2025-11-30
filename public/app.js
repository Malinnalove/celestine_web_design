// Fonts-ready reveal
// 是否管理员（Next.js layout 会在 <html> 上加 is-admin）
const IS_ADMIN = document.documentElement.classList.contains('is-admin');

    (function(){
      const enable = () => document.documentElement.classList.add('fonts-ready');
      if (document.fonts && document.fonts.ready) { document.fonts.ready.then(enable); setTimeout(enable, 1200); }
      else { (document.readyState === 'loading') ? document.addEventListener('DOMContentLoaded', enable) : enable(); }
      document.getElementById('y').textContent = new Date().getFullYear();
    })();

    // Simple SPA router (hash-based)
    const views = {
      home: document.getElementById('view-home'),
      writing: document.getElementById('view-writing'),
      about: document.getElementById('view-about')
    };
    const navLinks = Array.from(document.querySelectorAll('[data-route]'));
    const composeBtn = document.getElementById('composeBtn');

    function show(view){
      Object.values(views).forEach(v => v.classList.remove('active'));
      views[view].classList.add('active');
      navLinks.forEach(a => a.classList.toggle('is-active', a.dataset.route === view));
      composeBtn.style.display = (view === 'writing' && IS_ADMIN) ? 'inline-flex' : 'none';
      if (view === 'writing') renderList();
      if (view === 'about') applyAbout();
    }

    function routeFromHash(){
      const h = (location.hash.replace('#','') || 'home').toLowerCase();
      show(['home','writing','about'].includes(h) ? h : 'home');
    }

    window.addEventListener('hashchange', routeFromHash);
    routeFromHash();

    // Header avatar → go to About
    const headerAvatar = document.querySelector('.brand .avatar');
    headerAvatar?.addEventListener('click', (e) => { e.preventDefault(); location.hash = '#about'; });

    /* ================= Writing store (localStorage) ================= */
    const KEY = 'aqc_posts';
    const listEl = document.getElementById('list');
    function loadPosts(){ try{ return JSON.parse(localStorage.getItem(KEY) || '[]'); }catch{ return [] }}
    function savePosts(arr){ localStorage.setItem(KEY, JSON.stringify(arr)); }

    function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
    function randomTitle(){
      const a = ["First light","Quiet corner","Soft rush","Dusty pink","Warm cream","Navy hush","Small ritual","Blue hour","Gentle notes","Paper cloud"];
      return a[Math.floor(Math.random()*a.length)] + " " + (Math.floor(Math.random()*90)+10);
    }
    function randomContent(){
      const s1 = ["A small note about a quiet morning.","Sun on the desk, slow music.","Coffee steam and soft air.","Pages turning, a gentle pause.","Light on the wall, breathing easy.","Tiny lists and kinder words."];
      const s2 = ["Keep it simple, keep it kind.","Today I walked a little slower.","Colors felt warmer than yesterday.","I wrote three lines, then smiled.","The room was calm, the world okay."];
      const s3 = ["Save this as a small proof of living.","Nothing urgent, everything present.","Later I might read this again.","It felt enough."];
      return [rand(s1), rand(s2), rand(s3)].join("\n");
    }
    function genPosts(n){ const arr=[]; for(let i=0;i<n;i++){ arr.push({ id: Date.now()+i, title: randomTitle(), content: randomContent(), createdAt: new Date(Date.now()-i*3600*1000).toISOString() }); } return arr; }

    // Seed a sample if empty
    let posts = loadPosts();
    if(posts.length === 0){ posts = genPosts(6); savePosts(posts); }

    function fmtDate(iso){ const d = new Date(iso); return d.toLocaleString(); }
    function escapeHtml(s){ const MAP = {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}; return (s||'').replace(/[&<>"']/g, m => MAP[m]); }

    let editingId = null;

    function renderList(){
      if(!listEl) return; // not on writing view yet
      if(posts.length === 0){ listEl.innerHTML = '<p class="text">No notes yet.</p>'; return; }
      listEl.innerHTML = posts.slice().reverse().map(p => `
        <article class="post">
          <h3>${escapeHtml(p.title || 'Untitled')}</h3>
          <div class="meta">${fmtDate(p.createdAt)}</div>
          <div class="text">${escapeHtml((p.content||'').slice(0,140))}${p.content && p.content.length>140 ? '…' : ''}</div>
          <div class="post-actions">
            <button class="mini-btn" data-open="${p.id}">Open</button>
            ${IS_ADMIN ? `
            <button class="mini-btn admin-only" data-edit="${p.id}">Edit</button>
            <button class="mini-btn admin-only" data-del="${p.id}">Delete</button>
            ` : ``}
          </div>
        </article>
      `).join('');
      listEl.querySelectorAll('[data-open]').forEach(btn => btn.addEventListener('click', () => openReader(btn.getAttribute('data-open'))));
      listEl.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => startEdit(btn.getAttribute('data-edit'))));
      listEl.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', () => delPost(btn.getAttribute('data-del'))));
    }

    renderList();

    // Compose drawer (create / edit)
    const drawer = document.getElementById('drawer');
    const closeCompose = document.getElementById('closeCompose');
    const titleEl = document.getElementById('title');
    const contentEl = document.getElementById('content');
    const saveBtn = document.getElementById('save');
    const clearDraft = document.getElementById('clearDraft');
    const composeTitle = document.getElementById('composeTitle');

    function openCompose(prefill){
      composeTitle.textContent = prefill ? 'Edit note' : 'Write a note';
      if(prefill){ titleEl.value = prefill.title || ''; contentEl.value = prefill.content || ''; editingId = prefill.id; }
      else { titleEl.value=''; contentEl.value=''; editingId = null; }
      drawer.classList.add('open'); titleEl.focus();
    }
    function closeComposeFn(){ drawer.classList.remove('open'); }

    composeBtn.addEventListener('click', () => openCompose());
    closeCompose.addEventListener('click', closeComposeFn);
    drawer.addEventListener('click', e => { if(e.target === drawer) closeComposeFn(); });
    clearDraft.addEventListener('click', () => { titleEl.value=''; contentEl.value=''; titleEl.focus(); });

    function startEdit(id){
      const p = posts.find(x => String(x.id) === String(id)); if(!p) return; openCompose(p);
    }
    function delPost(id){
      const idx = posts.findIndex(x => String(x.id) === String(id)); if(idx<0) return;
      if(confirm('Delete this note?')){ posts.splice(idx,1); savePosts(posts); renderList(); }
    }

    saveBtn.addEventListener('click', () => {
      const t = titleEl.value.trim(); const c = contentEl.value.trim();
      if(!t && !c){ alert('Please write something.'); return }
      if(editingId){
        const idx = posts.findIndex(x => String(x.id) === String(editingId));
        if(idx >= 0){ posts[idx] = { ...posts[idx], title: t || 'Untitled', content: c }; }
        editingId = null;
      } else {
        posts.push({ id: Date.now(), title: t || 'Untitled', content: c, createdAt: new Date().toISOString() });
      }
      savePosts(posts); renderList(); closeComposeFn();
      location.hash = '#writing';
    });

    // Reader overlay
    const overlay = document.getElementById('overlay');
    const closeReaderBtn = document.getElementById('closeReader');
    const readTitle = document.getElementById('readTitle');
    const readMeta = document.getElementById('readMeta');
    const readBody = document.getElementById('readBody');

    function openReader(id){
      const p = posts.find(x => String(x.id) === String(id)); if(!p) return;
      readTitle.textContent = p.title || 'Untitled';
      readMeta.textContent = fmtDate(p.createdAt);
      readBody.textContent = p.content || '';
      overlay.classList.add('open');
    }
    function closeReader(){ overlay.classList.remove('open'); }
    closeReaderBtn.addEventListener('click', closeReader);
    overlay.addEventListener('click', e => { if(e.target === overlay) closeReader(); });

    /* ================= About data (editable) ================= */
    const AKEY = 'aqc_about';
    const AVKEY = 'aqc_avatar';

    const aboutName = document.getElementById('aboutName');
    const aboutLead = document.getElementById('aboutLead');
    const aboutSite = document.getElementById('aboutSite');
    const aboutTimeline = document.getElementById('aboutTimeline');
    const aboutImg = document.getElementById('avatarLgImg');
    const headerImg = document.getElementById('avatarImg');

    function loadAbout(){ try{ return JSON.parse(localStorage.getItem(AKEY) || '{}'); }catch{ return {} } }
    function saveAbout(o){ localStorage.setItem(AKEY, JSON.stringify(o)); }

    function applyAbout(){
      const a = loadAbout();
      aboutName.textContent = a.name || 'Your Name';
      aboutLead.textContent = a.lead || 'This site is a small, gentle space to collect moments — notes, tiny thoughts, and a soft record of days.';
      aboutSite.textContent = a.site || 'Built as a gift: minimal, warm, and private by default. No login, no pressure — just words.';
      const items = Array.isArray(a.timeline) ? a.timeline : [
        '2003 — Born somewhere calm.',
        '2018–2021 — Discovered films, coffee, and morning walks.',
        '2022 — Started writing small notes.',
        '2024–Now — Keeping a quiet diary online.'
      ];
      aboutTimeline.innerHTML = items.map(line => `<li>${escapeHtml(line)}</li>`).join('');
      const dataURL = localStorage.getItem(AVKEY);
      if(dataURL){ aboutImg.src = dataURL; headerImg.src = dataURL; } else { aboutImg.removeAttribute('src'); headerImg.removeAttribute('src'); }
    }

    // Avatar upload
    const changeAvatarBtn = document.getElementById('changeAvatar');
    const avatarInput = document.getElementById('avatarInput');
    changeAvatarBtn?.addEventListener('click', () => avatarInput.click());
    avatarInput?.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0]; if(!file) return;
      const reader = new FileReader();
      reader.onload = () => { try{ localStorage.setItem(AVKEY, reader.result); applyAbout(); }catch(err){ alert('Failed to save avatar (storage may be full).'); } };
      reader.readAsDataURL(file);
      e.target.value = '';
    });

    // About editor
    const aboutDrawer = document.getElementById('aboutDrawer');
    const editAboutBtn = document.getElementById('editAbout');
    const closeAboutBtn = document.getElementById('closeAbout');
    const aboutNameInput = document.getElementById('aboutNameInput');
    const aboutLeadInput = document.getElementById('aboutLeadInput');
    const aboutSiteInput = document.getElementById('aboutSiteInput');
    const aboutTimelineInput = document.getElementById('aboutTimelineInput');
    const saveAboutBtn = document.getElementById('saveAboutBtn');
    const resetAboutBtn = document.getElementById('resetAbout');

    function openAboutEditor(){
      const a = loadAbout();
      aboutNameInput.value = a.name || aboutName.textContent || '';
      aboutLeadInput.value = a.lead || aboutLead.textContent || '';
      aboutSiteInput.value = a.site || aboutSite.textContent || '';
      const items = Array.isArray(a.timeline) ? a.timeline : Array.from(aboutTimeline.querySelectorAll('li')).map(li => li.textContent);
      aboutTimelineInput.value = items.join("\n");
      aboutDrawer.classList.add('open');
    }
    function closeAboutEditor(){ aboutDrawer.classList.remove('open'); }

    editAboutBtn?.addEventListener('click', openAboutEditor);
    closeAboutBtn?.addEventListener('click', closeAboutEditor);
    aboutDrawer?.addEventListener('click', e => { if(e.target === aboutDrawer) closeAboutEditor(); });

    saveAboutBtn?.addEventListener('click', () => {
      const timeline = aboutTimelineInput.value.split(/\n+/).map(s => s.trim()).filter(Boolean);
      const data = { name: aboutNameInput.value.trim() || 'Your Name', lead: aboutLeadInput.value.trim(), site: aboutSiteInput.value.trim(), timeline };
      saveAbout(data); applyAbout(); closeAboutEditor(); location.hash = '#about';
    });

    resetAboutBtn?.addEventListener('click', () => { localStorage.removeItem(AKEY); applyAbout(); });

    // Initial about render
    applyAbout();
    
(function(){
  const els = document.querySelectorAll('canvas, .canvas, #canvas, .backdrop');
  els.forEach(el => {
    el.style.pointerEvents = 'none';
    if (!el.style.position) el.style.position = 'fixed';
    el.style.inset = '0';
    el.style.zIndex = '0';
  });
})();