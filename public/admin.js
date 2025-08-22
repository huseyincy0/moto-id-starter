(function(){
  const apiBase = '/api/stickers';
  const qs = id => document.querySelector(id);

  const createBtn = qs('#createBtn');
  const createResult = qs('#createResult');
  const stickerIdInput = qs('#stickerId');
  const isActiveInput = qs('#isActive');
  const autoCreateBtn = qs('#autoCreateBtn');

  const refreshListBtn = qs('#refreshListBtn');
  const stickersList = qs('#stickersList');
  const tabs = Array.from(document.querySelectorAll('.tabbtn'));
  const tabEls = Array.from(document.querySelectorAll('.tab'));

  const editId = qs('#editId');
  const editOwner = qs('#editOwner');
  const editName = qs('#editName');
  const editBike = qs('#editBike');
  const editActive = qs('#editActive');
  const saveEditBtn = qs('#saveEditBtn');
  const editResult = qs('#editResult');

  const claimBtn = qs('#claimBtn');
  const claimResult = qs('#claimResult');
  const claimIdInput = qs('#claimId');
  const ownerIdInput = qs('#ownerId');
  const pubName = qs('#pubName');
  const pubBike = qs('#pubBike');
  const fetchBtn = qs('#fetchBtn');
  const qrLink = qs('#qrLink');

  function jsonResp(r){ return r.json().catch(()=>({})); }

  if (createBtn) createBtn.addEventListener('click', async ()=>{
    createBtn.disabled = true; createResult.textContent = 'Oluşturuluyor...';
    try{
      const body = {};
      const id = stickerIdInput.value.trim();
      if (id) body.stickerId = id;
      body.isActive = isActiveInput.checked;
      const res = await fetch(apiBase, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const data = await jsonResp(res);
      if (!res.ok) throw new Error(data.error || data.message || JSON.stringify(data));
      createResult.textContent = JSON.stringify(data, null, 2);
    }catch(err){ createResult.textContent = 'Hata: '+err.message }
    createBtn.disabled = false;
  });

  if (autoCreateBtn) autoCreateBtn.addEventListener('click', async ()=>{
    autoCreateBtn.disabled = true; createResult.textContent = 'Otomatik oluşturuluyor...';
    try{
      const res = await fetch(apiBase, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({}) });
      const data = await jsonResp(res);
      if (!res.ok) throw new Error(data.error || data.message || JSON.stringify(data));
      createResult.textContent = JSON.stringify(data, null, 2);
      // refresh list
      await loadList();
    }catch(err){ createResult.textContent = 'Hata: '+err.message }
    autoCreateBtn.disabled = false;
  });

  if (claimBtn) claimBtn.addEventListener('click', async ()=>{
    claimBtn.disabled = true; claimResult.textContent = 'Eşleştiriliyor...';
    try{
      const id = claimIdInput.value.trim();
      if (!id) throw new Error('ID girin');
      const body = { ownerId: ownerIdInput.value.trim() };
      const pub = {};
      if (pubName.value.trim()) pub.name = pubName.value.trim();
      if (pubBike.value.trim()) pub.bikeModel = pubBike.value.trim();
      if (Object.keys(pub).length) body.public = pub;
      const res = await fetch(apiBase + '/' + id + '/claim', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const data = await jsonResp(res);
      if (!res.ok) throw new Error(data.error || data.message || JSON.stringify(data));
      claimResult.textContent = JSON.stringify(data, null, 2);
    }catch(err){ claimResult.textContent = 'Hata: '+err.message }
    claimBtn.disabled = false;
  });

  if (fetchBtn) fetchBtn.addEventListener('click', async ()=>{
    const id = claimIdInput.value.trim();
    if (!id) return claimResult.textContent = 'ID girin';
    claimResult.textContent = 'Bekleniyor...';
    try{
      const res = await fetch(apiBase + '/' + id);
      const data = await jsonResp(res);
      if (!res.ok) throw new Error(data.error || data.message || JSON.stringify(data));
      claimResult.textContent = JSON.stringify(data, null, 2);
  qrLink.href = '/api/stickers/' + id + '/qr?inline=1';
    }catch(err){ claimResult.textContent = 'Hata: '+err.message }
  });

  async function loadList(){
    stickersList.textContent = 'Yükleniyor...';
    try{
      const res = await fetch(apiBase);
      const data = await jsonResp(res);
      if (!res.ok) throw new Error(data.error || data.message || JSON.stringify(data));
      renderList(data || []);
    }catch(err){ stickersList.textContent = 'Hata: '+err.message }
  }

  function renderList(items){
    if (!items.length) return stickersList.textContent = 'Liste boş';
    const rows = items.map(it => {
      const active = it.isActive ? 'aktif' : 'pasif';
      const owner = it.ownerId ? ('owner: '+it.ownerId) : '— boş —';
      const claimed = it.ownerId ? '<strong style="color:green">CLAIMED</strong>' : '<em style="color:#888">unclaimed</em>';
    return `
  <div data-row-id="${it.id}" style="padding:8px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
  <div>
    <div><strong>#${it.id}</strong> — ${active} — ${owner}</div>
    <div style="color:#666;font-size:12px;margin-top:4px;">${it.public ? JSON.stringify(it.public) : ''}</div>
  </div>
  <div style="display:flex;gap:8px;align-items:center;">
    <a class="btn" href="/api/stickers/${it.id}/qr?inline=1" target="_blank">QR</a>
    ${it.ownerId ? '' : '<button data-id="'+it.id+'" class="btn claimFromList">Eşleştir</button>'}
  </div>
</div>`;
    }).join('\n');
  stickersList.innerHTML = rows;
    // bind claim buttons
    Array.from(document.querySelectorAll('.claimFromList')).forEach(btn => {
      btn.addEventListener('click', async (e)=>{
        const id = e.target.getAttribute('data-id');
        const owner = prompt('Owner ID girin');
        if (!owner) return;
        try{
          const body = { ownerId: owner };
          const res = await fetch(apiBase + '/' + id + '/claim', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
          const data = await jsonResp(res);
          if (!res.ok) throw new Error(data.error || data.message || JSON.stringify(data));
          alert('Eşleştirildi: '+JSON.stringify(data));
          await loadList();
        }catch(err){ alert('Hata: '+err.message) }
      });
    });
    // bind click on row to open edit
    Array.from(stickersList.querySelectorAll('[data-row-id]')).forEach(el => {
      el.addEventListener('click', ()=>{
        const id = el.getAttribute('data-row-id');
        const item = items.find(x=>x.id===id);
        if (!item) return;
        // populate edit form
        editId.value = item.id;
        editOwner.value = item.ownerId || '';
        editName.value = (item.public && item.public.name) || '';
        editBike.value = (item.public && item.public.bikeModel) || '';
        editActive.checked = !!item.isActive;
        // switch to edit tab
        openTab('edit');
      });
    });
  }

  if (refreshListBtn) refreshListBtn.addEventListener('click', loadList);

  // initial load
  loadList();

  // Tabs
  function openTab(name){
    tabs.forEach(t=>t.classList.toggle('active', t.getAttribute('data-tab')===name));
    tabEls.forEach(t=>t.classList.toggle('active', t.id===name));
  }
  if (tabs && tabs.length) {
    tabs.forEach(t=> t.addEventListener('click', ()=> openTab(t.getAttribute('data-tab'))));
  }
  // default to list: ensure UI visible even if tabs failed
  const defaultBtn = document.querySelector('.tabbtn[data-tab="list"]');
  const defaultTab = document.getElementById('list');
  if (defaultBtn) defaultBtn.classList.add('active');
  if (defaultTab) defaultTab.classList.add('active');

  // Save edit
  if (saveEditBtn) saveEditBtn.addEventListener('click', async ()=>{
    saveEditBtn.disabled = true; editResult.textContent = 'Kaydediliyor...';
    try{
      const id = editId.value.trim(); if (!id) throw new Error('Seçili ID yok');
      const body = {
        ownerId: editOwner.value.trim() || null,
        public: {
          name: editName.value.trim() || null,
          bikeModel: editBike.value.trim() || null
        },
        isActive: editActive.checked
      };
      const res = await fetch(apiBase + '/' + id, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const data = await jsonResp(res);
      if (!res.ok) throw new Error(data.error || data.message || JSON.stringify(data));
      editResult.textContent = JSON.stringify(data, null, 2);
      await loadList();
    }catch(err){ editResult.textContent = 'Hata: '+err.message }
    saveEditBtn.disabled = false;
  });

})();
