
    const users = {
      Administrator:{password:'AdagoApartamenty792.', role:'admin', display:'Administrator'},
      Beata:{password:'AdagoApartamenty531.', role:'room', display:'Beata'}
    };
    const authKey = 'adagoRoomService.auth.v1';
    const authSessionKey = 'adagoRoomService.auth.session.v1';
    const settingsKey = 'adagoRoomService.settings.v1';
    let currentUser = null;
    let settings = loadSettings();
    function loadSettings(){
      try{
        return {beataPhone:'48792607695', ...(JSON.parse(localStorage.getItem(settingsKey)) || {})};
      }catch(e){ return {beataPhone:'48792607695'}; }
    }
    function saveSettings(){
      try{ localStorage.setItem(settingsKey, JSON.stringify(settings)); }catch(e){}
    }
    function normalizeWhatsAppPhone(value){
      let digits = String(value || '').replace(/\D/g,'');
      if(digits.length === 9) digits = '48' + digits;
      return digits;
    }
    function displayWhatsAppPhone(value){
      const digits = normalizeWhatsAppPhone(value);
      if(!digits) return '';
      if(digits.startsWith('48') && digits.length === 11){
        return `+48 ${digits.slice(2,5)} ${digits.slice(5,8)} ${digits.slice(8)}`;
      }
      return '+' + digits;
    }
    function saveBeataPhoneFromInput(){
      const input = document.getElementById('beataPhone');
      if(!input) return '';
      const normalized = normalizeWhatsAppPhone(input.value);
      settings.beataPhone = normalized;
      input.value = displayWhatsAppPhone(normalized);
      saveSettings();
      return normalized;
    }
    function normalizeLogin(value){
      const typed = String(value || '').trim();
      return Object.keys(users).find(name => name.toLowerCase() === typed.toLowerCase()) || typed;
    }
    function getSavedUser(){
      try{
        const name = localStorage.getItem(authKey) || sessionStorage.getItem(authSessionKey);
        return users[name] ? {name, ...users[name]} : null;
      }catch(e){ return null; }
    }
    function isAdmin(){ return currentUser?.role === 'admin'; }
    function allowedView(view){ return (!isAdmin() && view === 'admin') ? 'roomservice' : view; }
    function applyAuthUI(){
      if(!currentUser) return;
      document.body.classList.remove('auth-locked');
      document.getElementById('currentUserPill').textContent = currentUser.display + (isAdmin() ? ' • Admin' : ' • Room Service');
      document.querySelectorAll('[data-view="admin"],[data-open="admin"],#exportData').forEach(el=>{
        el.classList.toggle('hidden-by-role', !isAdmin());
      });
    }
    function showLogin(){
      currentUser = null;
      document.body.classList.add('auth-locked');
      document.getElementById('loginUser').value = '';
      document.getElementById('loginPassword').value = '';
      document.getElementById('rememberLogin').checked = false;
      document.getElementById('loginError').style.display = 'none';
    }
    function setupLogin(){
      currentUser = getSavedUser();
      document.getElementById('loginForm').addEventListener('submit', e => {
        e.preventDefault();
        const name = normalizeLogin(document.getElementById('loginUser').value);
        const pass = document.getElementById('loginPassword').value;
        const remember = document.getElementById('rememberLogin').checked;
        if(users[name]?.password === pass){
          localStorage.removeItem(authKey);
          sessionStorage.removeItem(authSessionKey);
          if(remember){ localStorage.setItem(authKey, name); }
          else{ sessionStorage.setItem(authSessionKey, name); }
          currentUser = {name, ...users[name]};
          document.getElementById('loginError').style.display = 'none';
          applyAuthUI();
          render();
          setView(allowedView(state.activeView || (isAdmin() ? 'dashboard' : 'roomservice')));
          if(pendingIncomingTaskId){
            setView('roomservice');
            const taskIdToOpen = pendingIncomingTaskId;
            pendingIncomingTaskId = null;
            setTimeout(() => openTask(taskIdToOpen), 250);
          }
          toast('Zalogowano');
        }else{
          document.getElementById('loginError').style.display = 'block';
        }
      });
      document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem(authKey);
        sessionStorage.removeItem(authSessionKey);
        showLogin();
      });
    }

    const apartments = [
      {id:'oaza', name:'Oaza', location:'Szczawno-Zdrój', tone:'Spokojny apartament premium', max:4, defaultGuests:4, hasGrinder:false, bedding:'Pościel według liczby gości', towels:'4 duże + 4 małe', individual:'Max 4 osoby. Sprawdzić zapas kawy/herbaty, komplet ręczników oraz przygotowanie sofy przy 3–4 gościach. Młynek WC: nie dotyczy.'},
      {id:'antracyt', name:'Antracyt', location:'Szczawno-Zdrój', tone:'Nowoczesny apartament premium', max:2, defaultGuests:2, hasGrinder:true, bedding:'Pościel według liczby gości', towels:'2 duże + 2 małe', individual:'Max 2 osoby. Stały standard pościeli i ręczników — bez dodatkowej sofy. Koniecznie sprawdzić młynek WC.'},
      {id:'gold', name:'Gold', location:'Wałbrzych', tone:'Elegancki apartament z osobną sypialnią', max:4, defaultGuests:4, hasGrinder:true, bedding:'Pościel według liczby gości', towels:'4 duże + 4 małe', individual:'Max 4 osoby. Kontrola standardu premium, zapachu, przygotowania salonu/sofy przy 3–4 gościach oraz działania młynka WC.'}
    ];
    function beddingByGuests(guests){
      const n = Math.max(1, Math.min(4, Number(guests) || 2));
      if(n === 1) return 'Pościel 2-elementowa dla 1 os.: 1× kołdra + 1× poduszka';
      if(n === 2) return 'Pościel 4-elementowa dla 2 os.: 2× kołdra + 2× poduszka';
      if(n === 3) return 'Pościel 6-elementowa dla 3 os.: 3× kołdra + 3× poduszka';
      return 'Pościel 8-elementowa dla 4 os.: 4× kołdra + 4× poduszka';
    }
    function beddingHelpText(guests){
      return `${beddingByGuests(guests)}. Standard: 2 os. — 4 elementy, 3 os. — 6 elementów, 4 os. — 8 elementów.`;
    }
    const checklistGroups = [
      {section:'Zdjęcia', items:[
        'Zdjęcia przed rozpoczęciem udostępnione',
        'Zdjęcia po zakończeniu udostępnione'
      ]},
      {section:'Pilne przed check-in', items:[
        'Apartament gotowy do wejścia gościa',
        'Kod do wejścia działa',
        'Drzwi, klamka i zamek sprawdzone',
        'Wi‑Fi działa poprawnie',
        'Ogrzewanie / temperatura ustawione',
        'Światła sprawdzone',
        'Brak rzeczy po poprzednim gościu',
        'Apartament pachnie świeżo'
      ]},
      {section:'Kuchnia', items:[
        'Kapsułki do kawy / herbata uzupełnione',
        'Płyn do mycia naczyń uzupełniony',
        'Gąbka kuchenna przygotowana',
        'Ścierka kuchenna przygotowana',
        'Worki na śmieci uzupełnione',
        'Kosz opróżniony',
        'Lodówka pusta i czysta',
        'Blat kuchenny czysty',
        'Płyta indukcyjna dokładnie wyczyszczona',
        'Naczynia czyste i odłożone',
        'Czajnik / ekspres sprawdzony',
        'Zmywarka pusta'
      ]},
      {section:'Łazienka', items:[
        'Papier toaletowy uzupełniony',
        'Młynek WC działa poprawnie',
        'Mydło do rąk uzupełnione',
        'Płyn pod prysznic uzupełniony',
        'Ręczniki uzupełnione zgodnie z liczbą gości',
        'Suszarka sprawdzona',
        'Prysznic / wanna bez zacieków',
        'Odpływ w kabinie prysznicowej wyczyszczony',
        'Lustro czyste',
        'Kosz łazienkowy opróżniony',
        'Zapach / odświeżacz sprawdzony'
      ]},
      {section:'Sypialnia / salon', items:[
        'Pościel wymieniona',
        'Łóżko przygotowane hotelowo',
        'Pilot do TV na miejscu',
        'TV sprawdzone',
        'Kanapa / fotele bez plam',
        'Podłoga odkurzona i umyta',
        'Okna / parapety sprawdzone',
        'Zasłony / rolety ustawione'
      ]},
      {section:'Uzupełnienia i standard premium', items:[
        'Instrukcja dla gościa na miejscu',
        'Komplet ręczników przygotowany zgodnie ze zleceniem',
        'Pościel przygotowana zgodnie ze zleceniem',
        'Zapas papieru, mydła i worków sprawdzony',
        'Zapach / pierwsze wrażenie premium sprawdzone'
      ]},
      {section:'Problemy techniczne', items:[
        'Brak usterek',
        'Brak przepalonych żarówek',
        'Brak przecieków',
        'Brak uszkodzonych mebli',
        'Brak problemu z Wi‑Fi',
        'Brak problemu z zamkiem / drzwiami',
        'Brak problemu z młynkiem WC'
      ]}
    ];
    const checklist = checklistGroups.flatMap(group => group.items);
    const grinderChecklistItems = new Set(['Młynek WC działa poprawnie', 'Brak problemu z młynkiem WC']);
    function taskChecklistGroups(tOrApartment){
      const apartmentId = typeof tOrApartment === 'string' ? tOrApartment : (tOrApartment?.apartmentId || tOrApartment?.id);
      const a = getApartment(apartmentId);
      let index = 0;
      return checklistGroups.map(group => {
        const items = group.items.map(item => ({text:item, index:index++})).filter(entry => a.hasGrinder || !grinderChecklistItems.has(entry.text));
        return {section:group.section, items};
      }).filter(group => group.items.length);
    }
    function taskChecklistIndexes(t){
      return taskChecklistGroups(t).flatMap(group => group.items.map(item => item.index));
    }
    function pruneTaskChecks(t){
      const allowed = new Set(taskChecklistIndexes(t));
      t.done = (Array.isArray(t.done) ? t.done : []).filter(i => allowed.has(i));
    }
    const storeKey = 'adagoRoomService.v2';
    const whatsappPhone = '48786207695';
    const whatsappDisplay = '+48 786 207 695';
    const pad = n => String(n).padStart(2,'0');
    const dateToISO = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    const todayISO = () => dateToISO(new Date());
    const tomorrowISO = () => { const d = new Date(); d.setDate(d.getDate()+1); return dateToISO(d); };
    const uid = () => (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function' ? globalThis.crypto.randomUUID() : `task-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    const fmtDate = iso => new Date(iso + 'T12:00:00').toLocaleDateString('pl-PL',{weekday:'long', day:'2-digit', month:'2-digit', year:'numeric'});
    const autoStamp = () => new Date().toISOString();
    function fmtDateTime(value){
      if(!value) return '—';
      const d = new Date(value);
      if(Number.isNaN(d.getTime())) return '—';
      return d.toLocaleString('pl-PL',{day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'});
    }
    function fmtTimeOnly(value){
      if(!value) return '—';
      const d = new Date(value);
      if(Number.isNaN(d.getTime())) return '—';
      return d.toLocaleTimeString('pl-PL',{hour:'2-digit', minute:'2-digit'});
    }
    const getApartment = id => apartments.find(a => a.id === id) || apartments[0];
    const defaultTasks = () => [];
    let state = load();
    let deferredPrompt;
    let pendingIncomingTaskId = null;

    function load(){
      try{
        const parsed = JSON.parse(localStorage.getItem(storeKey));
        if(parsed?.tasks){
          parsed.tasks = parsed.tasks.map(normalizeTask);
          return parsed;
        }
      }catch(e){}
      return {tasks:[], activeView:'dashboard'};
    }
    function normalizePhotoList(list, prefix){
      return (Array.isArray(list) ? list : []).map((photo, index) => {
        if(typeof photo === 'string') return {src:photo, name:`${prefix}-${index+1}.jpg`, type:dataUrlMime(photo) || 'image/jpeg'};
        return {src:photo.src || '', name:photo.name || `${prefix}-${index+1}.jpg`, type:photo.type || dataUrlMime(photo.src) || 'image/jpeg'};
      }).filter(photo => photo.src);
    }
    function safeTaskId(value){
      const id = String(value || '').slice(0, 90);
      return /^[A-Za-z0-9._-]+$/.test(id) ? id : uid();
    }
    function normalizeTask(t){
      const rawAfter = Array.isArray(t.photosAfter) ? t.photosAfter : (Array.isArray(t.photos) ? t.photos : []);
      const rawBefore = Array.isArray(t.photosBefore) ? t.photosBefore : [];
      const before = normalizePhotoList(rawBefore, 'przed-room-service');
      const after = normalizePhotoList(rawAfter, 'po-room-service');
      const a = getApartment(t.apartmentId);
      const normalized = {...t, id:safeTaskId(t.id), guests:t.guests||a.defaultGuests||1, bedding:t.bedding||a.bedding||'', towels:t.towels||a.towels||'', missingItems:t.missingItems||'', photosBefore:before, photosAfter:after, done:Array.isArray(t.done)?t.done:[], reminders:t.reminders||{}, startedAt:t.startedAt||'', endedAt:t.endedAt||'', technicalIssues:Array.isArray(t.technicalIssues)?t.technicalIssues:[]};
      syncPhotoChecklist(normalized);
      pruneTaskChecks(normalized);
      return normalized;
    }
    function photoBeforeCount(t){ return Number(t.photosBeforeShared || 0) + (t.photosBefore || []).length; }
    function photoAfterCount(t){ return Number(t.photosAfterShared || 0) + (t.photosAfter || []).length; }
    function photoBeforeIndex(){ return checklist.indexOf('Zdjęcia przed rozpoczęciem udostępnione'); }
    function photoAfterIndex(){ return checklist.indexOf('Zdjęcia po zakończeniu udostępnione'); }
    function isPhotoChecklistIndex(i){ return i === photoBeforeIndex() || i === photoAfterIndex(); }
    function photoCountForIndex(t, i){
      if(i === photoBeforeIndex()) return photoBeforeCount(t);
      if(i === photoAfterIndex()) return photoAfterCount(t);
      return 0;
    }
    function requiredPhotoCount(t){
      return photoBeforeCount(t) > 0 && photoAfterCount(t) > 0;
    }
    function syncPhotoChecklist(t){
      t.done = t.done || [];
      const beforeIndex = photoBeforeIndex();
      const afterIndex = photoAfterIndex();
      if(beforeIndex >= 0){
        if(photoBeforeCount(t) > 0 && !t.done.includes(beforeIndex)) t.done.push(beforeIndex);
        if(photoBeforeCount(t) <= 0) t.done = t.done.filter(x => x !== beforeIndex);
      }
      if(afterIndex >= 0){
        if(photoAfterCount(t) > 0 && !t.done.includes(afterIndex)) t.done.push(afterIndex);
        if(photoAfterCount(t) <= 0) t.done = t.done.filter(x => x !== afterIndex);
      }
    }
    function save(){ localStorage.setItem(storeKey, JSON.stringify(state)); }
    function toast(msg){ const el=document.getElementById('toast'); el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2400); }
    function sortTasks(tasks){ return [...tasks].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)); }
    function statusText(status){ return ({todo:'Do wykonania', progress:'W trakcie', done:'Gotowe', problem:'Alert jakości'})[status] || status; }
    function statusClass(status){ return ({todo:'todo', progress:'progress', done:'done', problem:'problem'})[status] || 'todo'; }
    function cardClass(status){ return status === 'done' ? 'done' : status === 'problem' ? 'problem' : status === 'progress' ? 'progress' : ''; }
    function hasMissingItems(t){ return Boolean(String(t.missingItems || '').trim()); }
    function qualitySummary(t){
      syncPhotoChecklist(t);
      const a = getApartment(t.apartmentId);
      const progress = checklistProgress(t);
      const ok = progress.complete && requiredPhotoCount(t) && !hasMissingItems(t) && t.status !== 'problem';
      return ok
        ? {ok:true, title:`${a.name} gotowy na przyjazd gościa ✅`, text:'Pełna checklista odhaczona, zdjęcia przed/po udostępnione, brak zgłoszonych braków.'}
        : {ok:false, title:`${a.name} wymaga sprawdzenia ⚠️`, text:'Są punkty niewykonane, braki do uzupełnienia, brak zdjęć przed/po albo status problem.'};
    }
    function taskDateObj(t){ return new Date(`${t.date}T${t.time || '00:00'}:00`); }
    function isToday(t){ return t.date === todayISO(); }

    function render(){
      document.getElementById('todayPill').textContent = new Date().toLocaleDateString('pl-PL',{weekday:'long', day:'2-digit', month:'long'});
      renderStats(); renderTasks(); renderApartments(); populateForm();
    }
    function renderStats(){
      const todayTasks = state.tasks.filter(isToday);
      document.getElementById('statToday').textContent = todayTasks.length;
      document.getElementById('statDone').textContent = todayTasks.filter(t=>t.status==='done').length;
      document.getElementById('statProblems').textContent = state.tasks.filter(t=>t.status==='problem').length;
    }
    function timeAuditHTML(t){
      return `<div class="time-audit"><div class="stamp"><span>Rozpoczęcie sprzątania</span><strong>${fmtDateTime(t.startedAt)}</strong></div><div class="stamp"><span>Zakończenie sprzątania</span><strong>${fmtDateTime(t.endedAt)}</strong></div></div><p class="inline-room-note">Godziny są zapisywane automatycznie przez aplikację po kliknięciu przycisków Rozpoczęcie/Zakończenie. W aplikacji nie ma pola do ręcznej edycji czasu.</p>`;
    }
    function technicalIssuesHTML(t){
      const issues = Array.isArray(t.technicalIssues) ? t.technicalIssues : [];
      if(!issues.length) return '';
      return `<div class="task-card"><strong>Zgłoszone problemy techniczne</strong><div class="problem-list">${issues.map(issue=>`<div class="problem-chip">${escapeHTML(fmtDateTime(issue.time))}: ${escapeHTML(issue.text)}</div>`).join('')}</div></div>`;
    }
    function roomInlinePanel(t, context='room'){
      const a = getApartment(t.apartmentId);
      const panelId = String(context || 'room').replace(/[^A-Za-z0-9_-]/g, '');
      syncPhotoChecklist(t);
      const progress = checklistProgress(t);
      const summary = qualitySummary(t);
      if(!t.startedAt){
        return `<div class="inline-room-panel">
          <div class="start-gate"><strong>Najpierw rozpocznij sprzątanie</strong><p class="inline-room-note">Po kliknięciu aplikacja sama zapisze aktualną godzinę rozpoczęcia i pokaże pełną checklistę podzieloną na strefy. Godzina rozpoczęcia nie jest edytowalna w aplikacji.</p><div class="hero-actions"><button class="btn blue" onclick="startCleaning('${t.id}')">Rozpoczęcie sprzątania</button><button class="btn danger" onclick="reportTechnicalIssue('${t.id}')">Zgłoś problem techniczny</button><button class="btn small secondary" onclick="openTask('${t.id}')">Szczegóły</button></div></div>
          ${timeAuditHTML(t)}
          ${technicalIssuesHTML(t)}
        </div>`;
      }
      return `<div class="inline-room-panel">
        <div class="quality-banner ${summary.ok ? 'ok' : 'warn'}"><strong>${escapeHTML(summary.title)}</strong><span>${escapeHTML(summary.text)}</span></div>
        ${timeAuditHTML(t)}
        ${technicalIssuesHTML(t)}
        <div class="task-card"><strong>Postęp checklisty: ${progress.doneCount}/${progress.total} — ${progress.percent}%</strong><div class="progress-bar" aria-label="Postęp checklisty"><div class="progress-fill" style="width:${progress.percent}%"></div></div><p class="inline-room-note">Wszystkie czynności są widoczne od razu i podzielone na strefy: zdjęcia, pilne przed check-in, kuchnia, łazienka, sypialnia/salon, uzupełnienia i problemy techniczne.</p></div>
        <div class="task-card"><strong>Standard przygotowania</strong><div class="meta"><span class="tag">Pościel: ${escapeHTML(t.bedding || a.bedding || '—')}</span><span class="tag">Ręczniki: ${escapeHTML(t.towels || a.towels || '—')}</span></div><p class="note">${escapeHTML(a.individual || '')}</p></div>
        <div class="inline-room-tools"><button class="btn small secondary" onclick="markAllChecks('${t.id}', true, 'inline')">Zaznacz wszystko</button><button class="btn small secondary" onclick="markAllChecks('${t.id}', false, 'inline')">Odznacz wszystko</button><button class="btn small danger" onclick="reportTechnicalIssue('${t.id}')">Zgłoś problem techniczny</button><button class="btn small secondary" onclick="openTask('${t.id}')">Szczegóły</button></div>
        <div class="inline-room-checklist"><div class="checklist">${renderChecklist(t)}</div></div>
        <div><label>Uwagi Room Service</label><textarea onchange="updateServiceNotes('${t.id}', this.value)" placeholder="Np. uwagi po serwisie, informacja dla Administratora...">${escapeHTML(t.serviceNotes||'')}</textarea></div>
        <div class="missing-field"><label>Braki / do uzupełnienia</label><textarea onchange="updateMissingItems('${t.id}', this.value)" placeholder="Np. papier, kapsułki, mydło, ręczniki, worki, żarówka, usterka młynka WC...">${escapeHTML(t.missingItems||'')}</textarea><p class="note">Jeśli to pole jest uzupełnione, raport oznaczy apartament jako wymagający sprawdzenia.</p></div>
        <div class="task-card"><strong>Zdjęcia dla Administratora</strong><p class="note">Zdjęcia wyślij osobno przez systemowe udostępnianie telefonu, najlepiej do WhatsAppa Administratora.</p><div class="share-photo-grid"><input class="hidden-file-input" id="shareBeforeInline-${panelId}-${t.id}" type="file" accept="image/*" multiple onchange="shareSelectedPhotos('${t.id}', 'before', this.files, 'inline'); this.value=''"><input class="hidden-file-input" id="shareAfterInline-${panelId}-${t.id}" type="file" accept="image/*" multiple onchange="shareSelectedPhotos('${t.id}', 'after', this.files, 'inline'); this.value=''"><button class="btn secondary" onclick="document.getElementById('shareBeforeInline-${panelId}-${t.id}').click()">Udostępnij zdjęcia przed</button><button class="btn secondary" onclick="document.getElementById('shareAfterInline-${panelId}-${t.id}').click()">Udostępnij zdjęcia po</button></div><div class="meta" style="margin-top:10px"><span class="tag">Przed udostępnione: ${photoBeforeCount(t)}</span><span class="tag">Po udostępnione: ${photoAfterCount(t)}</span></div></div>
        <div class="hero-actions"><button class="btn ok" onclick="finishCleaning('${t.id}')">Zakończenie sprzątania / Gotowe</button><button class="btn danger" onclick="reportTechnicalIssue('${t.id}')">Zgłoś problem techniczny</button><button class="btn gold" onclick="openPremiumReport('${t.id}')">Generuj Raport</button></div>
      </div>`;
    }

    function taskCard(t, mode='admin', context='main'){
      if(!isAdmin() && mode !== 'room') mode = 'room';
      const a = getApartment(t.apartmentId);
      syncPhotoChecklist(t);
      const progressData = checklistProgress(t);
      const progress = progressData.percent;
      const buttons = mode === 'room'
        ? (!t.startedAt ? `<button class="btn small blue" onclick="startCleaning('${t.id}')">Rozpoczęcie sprzątania</button><button class="btn small danger" onclick="reportTechnicalIssue('${t.id}')">Zgłoś problem</button>` : `<button class="btn small ok" onclick="finishCleaning('${t.id}')">Zakończenie sprzątania</button><button class="btn small gold" onclick="openPremiumReport('${t.id}')">Generuj Raport</button><button class="btn small danger" onclick="reportTechnicalIssue('${t.id}')">Zgłoś problem</button>`)
        : `<button class="btn small secondary" onclick="openTask('${t.id}')">Podgląd</button><button class="btn small gold" onclick="sendWhatsAppAssignment('${t.id}')">WhatsApp do Beaty</button><button class="btn small ok" onclick="setStatus('${t.id}','done')">Gotowe</button><button class="btn small ghost" onclick="downloadICS('${t.id}')">Kalendarz</button><button class="btn small danger" onclick="deleteTask('${t.id}')">Usuń</button>`;
      return `<article class="task-card ${cardClass(t.status)}">
        <div class="task-head">
          <div class="timebox"><small>${t.date.slice(5)}</small>${t.time}</div>
          <div class="task-main">
            <h3>${a.name}</h3>
            <div class="meta">
              <span class="tag">${a.location}</span>
              <span class="tag">Goście ${t.guests || a.defaultGuests || '—'}/${a.max}</span>
              <span class="tag">Check-out ${t.checkout || '—'}</span>
              <span class="tag">Check-in ${t.checkin || '—'}</span>
              <span class="tag status ${statusClass(t.status)}">${statusText(t.status)}</span>
              <span class="tag">Checklist ${progressData.doneCount}/${progressData.total}</span>
              <span class="tag">Quality ${progress}%</span>
              <span class="tag">Rozpoczęcie ${fmtTimeOnly(t.startedAt)}</span>
              <span class="tag">Zakończenie ${fmtTimeOnly(t.endedAt)}</span>
              <span class="tag">Przed ${photoBeforeCount(t)}</span>
              <span class="tag">Po ${photoAfterCount(t)}</span>
            </div>
          </div>
        </div>
        ${t.notes ? `<p class="note">${escapeHTML(t.notes)}</p>` : ''}
        <div class="task-actions">${buttons}</div>
        ${mode === 'room' ? roomInlinePanel(t, context) : ''}
      </article>`;
    }
    function renderTasks(){
      const todayTasks = sortTasks(state.tasks.filter(isToday));
      const allTasks = sortTasks(state.tasks);
      const mainMode = isAdmin() ? 'admin' : 'room';
      document.getElementById('todayTasks').innerHTML = todayTasks.length ? todayTasks.map(t=>taskCard(t, mainMode, 'today')).join('') : `<div class="empty">Brak zadań Room Service na dzisiaj.</div>`;
      document.getElementById('allTasks').innerHTML = allTasks.length ? allTasks.map(t=>taskCard(t, mainMode, 'all')).join('') : `<div class="empty">Dodaj pierwsze zadanie.</div>`;
      document.getElementById('adminTasks').innerHTML = isAdmin() ? (allTasks.length ? allTasks.map(t=>taskCard(t,'admin', 'admin')).join('') : `<div class="empty">Plan jest pusty.</div>`) : `<div class="empty">Planowanie jest dostępne tylko dla Administratora.</div>`;
      const roomTasks = sortTasks(state.tasks.filter(t => t.status !== 'done'));
      document.getElementById('roomServiceTasks').innerHTML = roomTasks.length ? roomTasks.map(t=>taskCard(t,'room', 'roomservice')).join('') : `<div class="empty">Brak aktywnych zadań Room Service.</div>`;
      const upcoming = sortTasks(state.tasks.filter(t => taskDateObj(t) >= new Date())).slice(0,4);
      document.getElementById('reminderList').innerHTML = upcoming.length ? upcoming.map(t=>{const a=getApartment(t.apartmentId);return `<div class="task-card"><strong>${t.date} • ${t.time}</strong><span class="note">${a.name} — ${a.location}</span><button class="btn small secondary" onclick="downloadICS('${t.id}')">Dodaj do kalendarza</button></div>`}).join('') : `<div class="empty">Brak nadchodzących przypomnień.</div>`;
    }
    function renderApartments(){
      document.getElementById('apartmentsGrid').innerHTML = apartments.map(a => {
        const count = state.tasks.filter(t=>t.apartmentId===a.id && t.status !== 'done').length;
        return `<div class="card apartment-card span-4"><div><span class="tag">${a.location}</span><h3>${a.name}</h3><p>${a.tone}</p><p class="note">${escapeHTML(a.individual)}</p></div><div class="meta"><span class="tag">max ${a.max} osoby</span><span class="tag">${escapeHTML(a.towels)}</span><span class="tag">aktywnych: ${count}</span></div></div>`;
      }).join('');
    }
    function applyApartmentDefaults(){
      const a = getApartment(document.getElementById('apartment').value);
      const guestsEl = document.getElementById('guests');
      guestsEl.max = a.max;
      if(!guestsEl.value || Number(guestsEl.value) > a.max) guestsEl.value = a.defaultGuests || a.max;
      updateBeddingByGuests(true);
      document.getElementById('towels').value = a.towels || '';
      document.getElementById('apartmentHelp').textContent = `${a.name}: max ${a.max} osoby • ${a.individual}`;
    }
    function updateBeddingByGuests(force=false){
      const guestsEl = document.getElementById('guests');
      const beddingEl = document.getElementById('bedding');
      const helpEl = document.getElementById('beddingHelp');
      if(!guestsEl || !beddingEl) return;
      const value = beddingByGuests(guestsEl.value);
      const current = beddingEl.value.trim();
      const isAuto = !current || current.startsWith('Pościel ') || current === 'Pościel według liczby gości';
      if(force || isAuto) beddingEl.value = value;
      if(helpEl) helpEl.textContent = beddingHelpText(guestsEl.value);
    }
    function populateForm(){
      const select = document.getElementById('apartment');
      if(!select.dataset.ready){
        select.innerHTML = apartments.map(a=>`<option value="${a.id}">${a.name} — ${a.location}</option>`).join('');
        document.getElementById('date').value = todayISO();
        select.addEventListener('change', applyApartmentDefaults);
        document.getElementById('guests').addEventListener('input', () => updateBeddingByGuests(true));
        select.dataset.ready = '1';
        applyApartmentDefaults();
      }
      const beataPhoneInput = document.getElementById('beataPhone');
      if(beataPhoneInput && !beataPhoneInput.dataset.ready){
        if(!settings.beataPhone){ settings.beataPhone = '48792607695'; saveSettings(); }
        beataPhoneInput.value = displayWhatsAppPhone(settings.beataPhone || '48792607695');
        beataPhoneInput.addEventListener('change', saveBeataPhoneFromInput);
        beataPhoneInput.addEventListener('blur', saveBeataPhoneFromInput);
        beataPhoneInput.dataset.ready = '1';
      }
    }
    function setView(view){
      view = allowedView(view);
      document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active', v.id===view));
      document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active', b.dataset.view===view));
      state.activeView = view; save();
    }
    document.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>setView(btn.dataset.view)));
    document.querySelectorAll('[data-open]').forEach(btn=>btn.addEventListener('click',()=>setView(btn.dataset.open)));

    document.getElementById('taskForm').addEventListener('submit', async e => {
      e.preventDefault();
      if(!isAdmin()){ toast('Tylko Administrator może dodawać Room Service'); return; }
      const a = getApartment(apartment.value);
      const beataPhone = saveBeataPhoneFromInput();
      const safeGuests = Math.min(Math.max(Number(guests.value || a.defaultGuests || 1), 1), a.max);
      const task = {id:uid(), apartmentId:apartment.value, assigned:assigned.value.trim() || 'Beata', date:date.value, time:time.value, checkout:checkout.value, checkin:checkin.value, guests:safeGuests, bedding:bedding.value.trim(), towels:towels.value.trim(), notes:notes.value.trim(), status:'todo', done:[], photosBefore:[], photosAfter:[], serviceNotes:'', missingItems:'', startedAt:'', endedAt:'', technicalIssues:[], reminders:{}};
      state.tasks.push(task); save(); render();
      toast(beataPhone ? 'Room Service zapisany — otwieram WhatsApp z pełną checklistą' : 'Room Service zapisany — uzupełnij telefon Beaty, aby wysłać WhatsApp');
      await notifyNow('Nowy Room Service', `${getApartment(task.apartmentId).name} • ${task.date}, godz. ${task.time}`);
      e.target.reset(); document.getElementById('assigned').value = 'Beata'; document.getElementById('beataPhone').value = displayWhatsAppPhone(settings.beataPhone || '48792607695'); document.getElementById('date').value = todayISO(); document.getElementById('time').value = '11:00'; document.getElementById('checkout').value = '10:00'; document.getElementById('checkin').value = '15:00'; applyApartmentDefaults();
      if(beataPhone) setTimeout(() => openWhatsAppAssignment(task), 350);
    });

    function renderChecklist(t){
      return taskChecklistGroups(t).map(group => {
        const items = group.items.map(entry => {
          const current = entry.index;
          const item = entry.text;
          const photoItem = isPhotoChecklistIndex(current);
          const checked = photoItem ? photoCountForIndex(t, current) > 0 : (t.done || []).includes(current);
          const locked = photoItem ? ' data-photo-check="1" title="Ten punkt zaznacza się automatycznie po użyciu przycisku udostępniania zdjęć."' : '';
          return `<label class="check-item ${checked ? 'is-done' : 'is-missing'}"${locked}><input type="checkbox" ${checked ? 'checked' : ''} onchange="toggleCheck('${t.id}',${current},this.checked,this)"><span class="check-symbol" aria-hidden="true">${checked ? '✓' : '✗'}</span><span>${item}${photoItem ? ' <small class="photo-auto-note">— automatycznie po udostępnieniu</small>' : ''}</span></label>`;
        }).join('');
        return `<div class="check-section"><div class="check-section-title">${group.section}</div>${items}</div>`;
      }).join('');
    }

    function checklistProgress(t){
      const allowed = taskChecklistIndexes(t);
      const allowedSet = new Set(allowed);
      const doneCount = (t.done || []).filter(i => allowedSet.has(i)).length;
      const total = allowed.length;
      const percent = total ? Math.round((doneCount / total) * 100) : 0;
      return {doneCount, total, percent, complete: total > 0 && doneCount === total};
    }
    function completeCleaningValidation(t){
      syncPhotoChecklist(t);
      const progress = checklistProgress(t);
      if(!t.startedAt) return {ok:false, message:'Najpierw kliknij „Rozpoczęcie sprzątania”'};
      if(!requiredPhotoCount(t)) return {ok:false, message:'Udostępnij zdjęcia przed i po Room Service'};
      if(!progress.complete) return {ok:false, message:`Checklist nie jest kompletna: ${progress.doneCount}/${progress.total}`};
      if(hasMissingItems(t)) return {ok:false, status:'problem', message:'Wpisane są braki — ustawiam Alert jakości'};
      if(Array.isArray(t.technicalIssues) && t.technicalIssues.length) return {ok:false, status:'problem', message:'Zgłoszono problem techniczny — ustawiam Alert jakości'};
      return {ok:true};
    }
    window.startCleaning = function(id){
      const t = state.tasks.find(x=>x.id===id); if(!t) return;
      if(!t.startedAt) t.startedAt = autoStamp();
      if(t.status === 'todo') t.status = 'progress';
      t.endedAt = '';
      save(); render();
      toast(`Rozpoczęcie sprzątania zapisane automatycznie: ${fmtTimeOnly(t.startedAt)}`);
    }
    window.finishCleaning = function(id){
      const t = state.tasks.find(x=>x.id===id); if(!t) return;
      const validation = completeCleaningValidation(t);
      if(!validation.ok){
        if(validation.status) t.status = validation.status;
        save(); render(); openTask(id);
        toast(validation.message);
        return;
      }
      if(!t.endedAt) t.endedAt = autoStamp();
      t.status = 'done';
      save(); render();
      toast(`Zakończenie sprzątania zapisane automatycznie: ${fmtTimeOnly(t.endedAt)}`);
    }
    window.reportTechnicalIssue = function(id){
      const t = state.tasks.find(x=>x.id===id); if(!t) return;
      const a = getApartment(t.apartmentId);
      const options = [];
      if(a.hasGrinder) options.push('Młynek WC');
      options.push('Zamek / drzwi / kod', 'Wi‑Fi / TV', 'Światło / żarówka', 'Przeciek / łazienka', 'Uszkodzenie mebla', 'Inne');
      const choice = prompt('Opisz problem techniczny albo wpisz numer:' + options.map((label, idx) => `
${idx+1}. ${label}`).join(''), '');
      if(choice === null) return;
      const map = Object.fromEntries(options.map((label, idx) => [String(idx+1), label]));
      const text = map[String(choice).trim()] || String(choice || '').trim() || 'Problem techniczny';
      const issue = {time:autoStamp(), text};
      t.technicalIssues = Array.isArray(t.technicalIssues) ? t.technicalIssues : [];
      t.technicalIssues.push(issue);
      t.status = 'problem';
      save(); render();
      const message = [
        `ZGŁOSZENIE PROBLEMU — ${a.name} ⚠️`,
        '',
        `Problem: ${text}`,
        `Czas zgłoszenia zapisany automatycznie przez aplikację: ${fmtDateTime(issue.time)}`,
        `Apartament: ${a.name}`,
        `Data Room Service: ${fmtDate(t.date)}`,
        `Planowana godzina: ${t.time}`,
        `Rozpoczęcie sprzątania: ${fmtDateTime(t.startedAt)}`,
        '',
        'Wiadomość wygenerowana z AdagoStay Room Service.'
      ].join('\n');
      copyText(message);
      window.location.href = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;
      toast('Otwieram WhatsApp ze zgłoszeniem problemu');
    }
    window.setStatus = function(id,status){
      const t = state.tasks.find(x=>x.id===id); if(!t) return;
      if(status === 'progress'){ startCleaning(id); return; }
      if(status === 'done'){ finishCleaning(id); return; }
      if(status === 'problem'){
        t.status = 'problem';
        save(); render(); toast('Alert jakości');
        return;
      }
      t.status = status;
      save(); render(); toast(statusText(status));
    }
    window.markAllChecks = function(id, checked, context='modal'){
      const t = state.tasks.find(x=>x.id===id); if(!t) return;
      t.done = checked ? taskChecklistIndexes(t) : [];
      syncPhotoChecklist(t);
      save(); render(); if(context !== 'inline') openTask(id);
      toast(checked ? 'Zaznaczono całą checklistę' : 'Odznaczono checklistę');
    }
    window.copyWhatsAppReport = async function(id){
      const t = state.tasks.find(x=>x.id===id); if(!t) return;
      const ok = await copyText(buildReport(t));
      toast(ok ? 'Raport skopiowany' : 'Nie udało się skopiować raportu');
    }
    window.deleteTask = function(id){
      if(!isAdmin()){ toast('Tylko Administrator może usuwać Room Service'); return; }
      if(!confirm('Usunąć ten Room Service?')) return;
      state.tasks = state.tasks.filter(t=>t.id!==id); save(); render(); toast('Usunięto');
    }
    window.openTask = function(id){
      const t = state.tasks.find(x=>x.id===id); if(!t) return; const a=getApartment(t.apartmentId);
      syncPhotoChecklist(t);
      const progress = checklistProgress(t);
      modalTitle.textContent = `${a.name} — ${t.time}`;
      modalSub.textContent = `${fmtDate(t.date)} • ${a.location} • ${statusText(t.status)} • Checklist ${progress.doneCount}/${progress.total}`;
      const summary = qualitySummary(t);
      modalBody.innerHTML = `<div class="quality-banner ${summary.ok ? 'ok' : 'warn'}"><strong>${escapeHTML(summary.title)}</strong><span>${escapeHTML(summary.text)}</span></div>
        <div class="task-card ${cardClass(t.status)}"><div class="meta"><span class="tag">Check-out ${t.checkout || '—'}</span><span class="tag">Check-in ${t.checkin || '—'}</span><span class="tag">${escapeHTML(t.assigned || 'Beata')}</span><span class="tag">Goście ${t.guests || a.defaultGuests}/${a.max}</span><span class="tag status ${statusClass(t.status)}">${statusText(t.status)}</span></div>${t.notes ? `<p class="note">${escapeHTML(t.notes)}</p>`:''}</div>
        ${timeAuditHTML(t)}
        ${technicalIssuesHTML(t)}
        ${!t.startedAt ? `<div class="start-gate"><strong>Najpierw rozpocznij sprzątanie</strong><p class="note">Po kliknięciu aplikacja automatycznie zapisze godzinę rozpoczęcia i pokaże checklistę w strefach.</p><button class="btn blue" onclick="startCleaning('${t.id}')">Rozpoczęcie sprzątania</button></div>` : ''}
        ${t.startedAt ? `<div class="task-card"><strong>Postęp checklisty: ${progress.doneCount}/${progress.total} — ${progress.percent}%</strong><div class="progress-bar" aria-label="Postęp checklisty"><div class="progress-fill" style="width:${progress.percent}%"></div></div><p class="note">Odhacz każdy punkt po wykonaniu. Raport pokaże pełną checklistę: wykonane i niewykonane punkty.</p></div>` : ''}
        <div class="task-card"><strong>Standard przygotowania</strong><div class="meta"><span class="tag">Pościel: ${escapeHTML(t.bedding || a.bedding || '—')}</span><span class="tag">Ręczniki: ${escapeHTML(t.towels || a.towels || '—')}</span></div><p class="note">${escapeHTML(a.individual || '')}</p></div>
        <h3>Checklista jakości</h3>
        <div class="checklist-toolbar"><button class="btn small secondary" onclick="markAllChecks('${t.id}', true)">Zaznacz wszystko</button><button class="btn small secondary" onclick="markAllChecks('${t.id}', false)">Odznacz wszystko</button></div>
        <div class="checklist">${renderChecklist(t)}</div>
        <div style="margin-top:16px"><label>Uwagi Room Service</label><textarea onchange="updateServiceNotes('${t.id}', this.value)" placeholder="Np. uwagi po serwisie, informacja dla Administratora...">${escapeHTML(t.serviceNotes||'')}</textarea></div>
        <div class="missing-field" style="margin-top:12px"><label>Braki / do uzupełnienia</label><textarea onchange="updateMissingItems('${t.id}', this.value)" placeholder="Np. papier, kapsułki, mydło, ręczniki, worki, żarówka, usterka młynka WC...">${escapeHTML(t.missingItems||'')}</textarea><p class="note">Jeśli to pole jest uzupełnione, raport oznaczy apartament jako wymagający sprawdzenia.</p></div>
        <div class="task-card"><strong>Zdjęcia dla Administratora</strong><p class="note">Nie zapisujemy zdjęć w aplikacji. Beata wybiera zdjęcia z telefonu i udostępnia je od razu przez systemowe udostępnianie, najlepiej do WhatsAppa Administratora.</p><div class="share-photo-grid"><input class="hidden-file-input" id="shareBefore-${t.id}" type="file" accept="image/*" multiple onchange="shareSelectedPhotos('${t.id}', 'before', this.files); this.value=''"><input class="hidden-file-input" id="shareAfter-${t.id}" type="file" accept="image/*" multiple onchange="shareSelectedPhotos('${t.id}', 'after', this.files); this.value=''"><button class="btn secondary" onclick="document.getElementById('shareBefore-${t.id}').click()">Udostępnij zdjęcia przed</button><button class="btn secondary" onclick="document.getElementById('shareAfter-${t.id}').click()">Udostępnij zdjęcia po</button></div><div class="meta" style="margin-top:10px"><span class="tag">Przed udostępnione: ${photoBeforeCount(t)}</span><span class="tag">Po udostępnione: ${photoAfterCount(t)}</span></div></div>
        <p class="note">Aby zakończyć jako Gotowe, trzeba użyć przycisków „Udostępnij zdjęcia przed” i „Udostępnij zdjęcia po”, a potem odhaczyć całą checklistę. Punktów zdjęć nie da się zaliczyć samym kliknięciem checkboxa.</p>
        ${isAdmin() ? `<div class="task-card"><strong>Wiadomość dla Beaty</strong><p class="note">Wyślij Beacie gotowe zlecenie WhatsApp z linkiem do aplikacji, datą, godziną, apartamentem i pełną checklistą.</p><button class="btn gold" onclick="sendWhatsAppAssignment('${t.id}')">Wyślij WhatsApp do Beaty</button></div>` : ''}
        <div class="task-card"><strong>Raport dla Administratora</strong><p class="note">Wygeneruj Raport w osobnym widoku. Możesz go wydrukować, zapisać jako PDF albo udostępnić jako plik.</p><div class="hero-actions"><button class="btn gold" onclick="openPremiumReport('${t.id}')">Generuj Raport</button>${isAdmin() ? `<button class="btn secondary" onclick="sendWhatsAppReport('${t.id}')">Wyślij raport WhatsApp</button>` : ''}</div></div>
        <div class="hero-actions"><button class="btn blue" onclick="startCleaning('${t.id}')">Rozpoczęcie sprzątania</button><button class="btn ok" onclick="finishCleaning('${t.id}')">Zakończenie sprzątania / Gotowe</button><button class="btn gold" onclick="openPremiumReport('${t.id}')">Generuj Raport</button><button class="btn danger" onclick="reportTechnicalIssue('${t.id}')">Zgłoś problem techniczny</button><button class="btn secondary" onclick="downloadICS('${t.id}')">Dodaj do kalendarza</button></div>`;
      save();
      taskModal.classList.add('show');
    }
    window.toggleCheck = function(id,i,checked,el){
      const t=state.tasks.find(x=>x.id===id); if(!t) return;
      t.done = t.done || [];
      if(isPhotoChecklistIndex(i)){
        syncPhotoChecklist(t);
        save();
        if(checked && photoCountForIndex(t, i) <= 0){
          if(el) el.checked = false;
          toast(i === photoBeforeIndex() ? 'Użyj przycisku „Udostępnij zdjęcia przed”' : 'Użyj przycisku „Udostępnij zdjęcia po”');
        }else{
          toast('Punkt zdjęć jest oznaczany automatycznie po udostępnieniu');
        }
        openTask(id);
        return;
      }
      if(checked && !t.done.includes(i)) t.done.push(i);
      if(!checked) t.done = t.done.filter(x=>x!==i);
      const item = el ? el.closest('.check-item') : null;
      if(item){
        item.classList.toggle('is-done', checked);
        item.classList.toggle('is-missing', !checked);
        const symbol = item.querySelector('.check-symbol');
        if(symbol) symbol.textContent = checked ? '✓' : '✗';
      }
      save(); render();
    }
    window.updateServiceNotes = function(id,value){ const t=state.tasks.find(x=>x.id===id); if(!t) return; t.serviceNotes=value; save(); }
    window.updateMissingItems = function(id,value){ const t=state.tasks.find(x=>x.id===id); if(!t) return; t.missingItems=value; if(String(value||'').trim() && t.status === 'done') t.status='problem'; save(); }
    function photoSrc(photo){ return typeof photo === 'string' ? photo : (photo?.src || ''); }
    function dataUrlMime(dataUrl){
      const match = String(dataUrl || '').match(/^data:([^;]+);base64,/);
      return match ? match[1] : '';
    }
    function extensionFromMime(mime){
      return ({'image/jpeg':'jpg','image/jpg':'jpg','image/png':'png','image/webp':'webp','image/heic':'heic','image/heif':'heif'})[String(mime || '').toLowerCase()] || 'jpg';
    }
    function dataUrlToFile(dataUrl, filename, fallbackType='image/jpeg'){
      const parts = String(dataUrl || '').split(',');
      const meta = parts[0] || '';
      const base64 = parts[1] || '';
      const type = dataUrlMime(dataUrl) || fallbackType;
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for(let i=0;i<binary.length;i++) bytes[i] = binary.charCodeAt(i);
      return new File([bytes], filename, {type});
    }
    function base64UrlEncodeUnicode(value){
      const utf8 = encodeURIComponent(JSON.stringify(value)).replace(/%([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
      return btoa(utf8).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    }
    function base64UrlDecodeUnicode(value){
      const normalized = String(value || '').replace(/-/g,'+').replace(/_/g,'/');
      const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
      const binary = atob(padded);
      const escaped = Array.from(binary).map(ch => '%' + ch.charCodeAt(0).toString(16).padStart(2,'0')).join('');
      return JSON.parse(decodeURIComponent(escaped));
    }
    function taskForShare(t){
      const a = getApartment(t.apartmentId);
      return {
        id:t.id, apartmentId:t.apartmentId, assigned:t.assigned || 'Beata', date:t.date, time:t.time, checkout:t.checkout || '', checkin:t.checkin || '',
        guests:t.guests || a.defaultGuests || 1, bedding:t.bedding || a.bedding || '', towels:t.towels || a.towels || '', notes:t.notes || '',
        status:t.status === 'done' ? 'todo' : (t.status || 'todo'), done:Array.isArray(t.done) ? t.done : [], photosBefore:[], photosAfter:[], photosBeforeShared:0, photosAfterShared:0, serviceNotes:t.serviceNotes || '', missingItems:t.missingItems || '', startedAt:t.startedAt || '', endedAt:t.endedAt || '', technicalIssues:Array.isArray(t.technicalIssues) ? t.technicalIssues : [], reminders:{}
      };
    }
    function roomServiceTaskLink(t){
      const encoded = base64UrlEncodeUnicode(taskForShare(t));
      return `https://adagostay.pl/room-service/#task=${encoded}`;
    }
    function importTaskFromPayload(payload){
      const incoming = normalizeTask({...payload, importedFromWhatsApp:true});
      if(!incoming.id || !incoming.apartmentId || !incoming.date || !incoming.time) return null;
      const index = state.tasks.findIndex(x => x.id === incoming.id);
      if(index >= 0){
        state.tasks[index] = {...state.tasks[index], ...incoming, photosBefore:state.tasks[index].photosBefore || [], photosAfter:state.tasks[index].photosAfter || [], done:state.tasks[index].done || incoming.done || [], serviceNotes:state.tasks[index].serviceNotes || incoming.serviceNotes || ''};
      }else{
        state.tasks.push(incoming);
      }
      save();
      return incoming.id;
    }
    function handleIncomingTaskLink(){
      try{
        const hashParams = new URLSearchParams(String(window.location.hash || '').replace(/^#/,''));
        const queryParams = new URLSearchParams(window.location.search || '');
        const encoded = hashParams.get('task') || queryParams.get('task');
        if(!encoded) return null;
        const payload = base64UrlDecodeUnicode(encoded);
        const id = importTaskFromPayload(payload);
        if(id){
          pendingIncomingTaskId = id;
          history.replaceState(null, document.title, window.location.pathname);
          toast('Zadanie z WhatsApp zostało dodane do aplikacji');
        }
        return id;
      }catch(e){
        toast('Nie udało się odczytać zadania z linku WhatsApp');
        return null;
      }
    }

    function buildAssignmentChecklist(t){
      return taskChecklistGroups(t).flatMap(group => [
        '',
        group.section.toUpperCase(),
        ...group.items.map(entry => `☐ ${entry.text}`)
      ]).join('\n');
    }
    function buildAssignmentMessage(t){
      const a = getApartment(t.apartmentId);
      const checklistText = buildAssignmentChecklist(t);
      return [
        `SPRZĄTANIE — ${a.name}`,
        '',
        'Cześć Beata,',
        '',
        `Masz zaplanowane sprzątanie apartamentu ${a.name}.`,
        '',
        'SZCZEGÓŁY ZLECENIA',
        `Apartament: ${a.name}`,
        `Lokalizacja: ${a.location}`,
        `Data: ${fmtDate(t.date)}`,
        `Godzina sprzątania: ${t.time}`,
        `Check-out: ${t.checkout || '-'}`,
        `Check-in: ${t.checkin || '-'}`,
        `Goście: ${t.guests || a.defaultGuests}/${a.max}`,
        `Pościel: ${t.bedding || a.bedding || '-'}`,
        `Ręczniki: ${t.towels || a.towels || '-'}`,
        '',
        'STANDARD APARTAMENTU',
        a.individual || '-',
        a.hasGrinder ? 'Młynek WC: TAK — koniecznie sprawdzić działanie i brak cofki/zapachu.' : 'Młynek WC: NIE DOTYCZY.',
        '',
        'STATUS W APLIKACJI',
        'Kliknij „Rozpoczęcie sprzątania” — aplikacja automatycznie zapisze godzinę rozpoczęcia i pokaże checklistę w strefach. Po wszystkim kliknij „Zakończenie sprzątania / Gotowe” — aplikacja automatycznie zapisze godzinę zakończenia. Jeśli są braki, usterka albo punkt ✗ — użyj „Zgłoś problem techniczny” albo ustaw Alert jakości.',
        '',
        'UWAGI OD ADMINISTRATORA',
        t.notes || '-',
        '',
        'LINK DO APLIKACJI DLA BEATY',
        roomServiceTaskLink(t),
        '',
        'Instrukcja: kliknij link, zaloguj się jako Beata, odhacz checklistę w aplikacji i po sprzątaniu kliknij „Generuj Raport”. Raport można zapisać jako PDF albo udostępnić jako plik.',
        '',
        'PEŁNA CHECKLISTA SPRZĄTANIA',
        checklistText,
        '',
        'Po wykonaniu proszę zaznaczyć checklistę w aplikacji Room Service, wpisać ewentualne braki do uzupełnienia, udostępnić zdjęcia przed i po oraz wygenerować Raport.'
      ].join('\n');
    }
    function openWhatsAppAssignment(t){
      const phone = saveBeataPhoneFromInput();
      if(!phone){
        setView('admin');
        toast('Uzupełnij telefon WhatsApp Beaty');
        document.getElementById('beataPhone')?.focus();
        return false;
      }
      const message = buildAssignmentMessage(t);
      copyText(message);
      window.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      toast(`Otwieram WhatsApp do Beaty: ${displayWhatsAppPhone(phone)}`);
      return true;
    }
    window.sendWhatsAppAssignment = function(id){
      if(!isAdmin()){ toast('Tylko Administrator może wysłać zadanie'); return; }
      const t = state.tasks.find(x=>x.id===id);
      if(!t) return;
      openWhatsAppAssignment(t);
    }

    function taskPhotoFiles(t){
      const a = getApartment(t.apartmentId);
      const photos = [
        ...(t.photosBefore || []).map((photo, i) => ({photo, label:`${a.name}-przed-${i+1}`})),
        ...(t.photosAfter || []).map((photo, i) => ({photo, label:`${a.name}-po-${i+1}`}))
      ];
      return photos.map(({photo, label}) => {
        const src = photoSrc(photo);
        const type = (photo && photo.type) || dataUrlMime(src) || 'image/jpeg';
        return dataUrlToFile(src, `${label}.${extensionFromMime(type)}`, type);
      });
    }
    window.shareSelectedPhotos = async function(id,type,files,context='modal'){
      const t = state.tasks.find(x=>x.id===id); if(!t) return;
      const selected = [...files].filter(file => String(file.type || '').startsWith('image/')).slice(0,12);
      if(!selected.length){ toast('Wybierz zdjęcia do udostępnienia'); return; }
      const a = getApartment(t.apartmentId);
      const label = type === 'before' ? 'przed sprzątaniem' : 'po sprzątaniu';
      const shareData = {
        title:`Zdjęcia ${label} — ${a.name}`,
        text:`Zdjęcia ${label} — ${a.name}, ${fmtDate(t.date)}, godz. ${t.time}`,
        files:selected
      };
      try{
        if(navigator.canShare && navigator.canShare({files:selected}) && navigator.share){
          await navigator.share(shareData);
          if(type === 'before') t.photosBeforeShared = Number(t.photosBeforeShared || 0) + selected.length;
          else t.photosAfterShared = Number(t.photosAfterShared || 0) + selected.length;
          syncPhotoChecklist(t);
          save();
          render();
          if(context !== 'inline' && taskModal.classList.contains('show')) openTask(id);
          toast(type === 'before' ? 'Zdjęcia przed udostępnione' : 'Zdjęcia po udostępnione');
        }else{
          toast('Ten telefon/przeglądarka nie obsługuje udostępniania zdjęć z aplikacji. Otwórz WhatsApp i dodaj zdjęcia ręcznie.');
        }
      }catch(e){
        toast('Udostępnianie zdjęć przerwane lub niedostępne');
      }
    }
    window.shareTaskPhotos = async function(id){
      const t = state.tasks.find(x=>x.id===id); if(!t) return;
      const files = taskPhotoFiles(t);
      if(!files.length){ toast('Użyj przycisków „Udostępnij zdjęcia przed” albo „Udostępnij zdjęcia po”.'); return; }
      const a = getApartment(t.apartmentId);
      const shareData = {
        title:`Zdjęcia Room Service — ${a.name}`,
        text:`Zdjęcia Room Service — ${a.name}, ${fmtDate(t.date)}, ${t.time}`,
        files
      };
      try{
        if(navigator.canShare && navigator.canShare({files}) && navigator.share){
          await navigator.share(shareData);
          toast('Zdjęcia przekazane do udostępnienia');
        }else{
          toast('Ten telefon/przeglądarka nie obsługuje automatycznego udostępniania zdjęć. Dodaj zdjęcia ręcznie w WhatsAppie.');
        }
      }catch(e){
        toast('Udostępnianie zdjęć przerwane lub niedostępne');
      }
    }

    function buildChecklistReport(t){
      return taskChecklistGroups(t).map(group => {
        const lines = group.items.map(entry => {
          const checked = (t.done || []).includes(entry.index);
          return `${checked ? '✓' : '✗'} ${entry.text}`;
        });
        return [group.section.toUpperCase(), ...lines].join('\n');
      }).join('\n\n');
    }
    function buildReport(t){
      const a = getApartment(t.apartmentId);
      const progress = checklistProgress(t);
      const missing = taskChecklistIndexes(t).filter(i => !(t.done || []).includes(i)).map(i => checklist[i]);
      const summary = qualitySummary(t);
      return [
        summary.ok ? `${a.name} gotowy na przyjazd gościa ✅` : `${a.name} wymaga sprawdzenia ⚠️`,
        '',
        `RAPORT SPRZĄTANIA — ${a.name}`,
        `Wynik: ${summary.title}`,
        `Opis: ${summary.text}`,
        '',
        `Apartament: ${a.name}`,
        `Lokalizacja: ${a.location}`,
        `Data: ${fmtDate(t.date)}`,
        `Godzina Room Service: ${t.time}`,
        `Check-out: ${t.checkout || '-'}`,
        `Check-in: ${t.checkin || '-'}`,
        `Status: ${statusText(t.status)}`,
        `Rozpoczęcie sprzątania: ${fmtDateTime(t.startedAt)} (zapis automatyczny aplikacji)`,
        `Zakończenie sprzątania: ${fmtDateTime(t.endedAt)} (zapis automatyczny aplikacji)`,
        `Checklist: ${progress.doneCount}/${progress.total} — ${progress.percent}%`,
        `Goście: ${t.guests || a.defaultGuests}/${a.max}`,
        `Pościel: ${t.bedding || a.bedding || '-'}`,
        `Ręczniki: ${t.towels || a.towels || '-'}`,
        '',
        'Instrukcje Administratora:',
        t.notes || '-',
        '',
        'Uwagi Room Service:',
        t.serviceNotes || '-',
        '',
        'Braki / do uzupełnienia:',
        t.missingItems || '-',
        '',
        'Problemy techniczne zgłoszone w aplikacji:',
        (Array.isArray(t.technicalIssues) && t.technicalIssues.length) ? t.technicalIssues.map(issue => `• ${fmtDateTime(issue.time)} — ${issue.text}`).join('\n') : '-',
        '',
        `Młynek WC: ${a.hasGrinder ? 'do sprawdzenia w tym apartamencie' : 'nie dotyczy'}`,
        '',
        `Zdjęcia przed udostępnione: ${photoBeforeCount(t)}`,
        `Zdjęcia po udostępnione: ${photoAfterCount(t)}`,
        '',
        'PEŁNA CHECKLISTA:',
        buildChecklistReport(t),
        '',
        'Niewykonane / do sprawdzenia:',
        missing.length ? missing.map(x => `• ${x}`).join('\n') : 'Brak — wszystko odhaczone.',
        '',
        'Komunikat końcowy:',
        summary.ok ? 'Apartament gotowy na przyjazd gościa.' : 'Apartament wymaga sprawdzenia przed przyjazdem gościa.'
      ].join('\n');
    }
    function reportTextBlock(value){
      return escapeHTML(String(value || '-')).replace(/\n/g,'<br>');
    }
    function premiumChecklistHTML(t){
      return taskChecklistGroups(t).map(group => {
        const rows = group.items.map(entry => {
          const checked = (t.done || []).includes(entry.index);
          return `<tr class="${checked ? 'done' : 'missing'}"><td class="mark">${checked ? '✓' : '✗'}</td><td>${escapeHTML(entry.text)}</td><td>${checked ? 'Wykonane' : 'Do sprawdzenia'}</td></tr>`;
        }).join('');
        return `<section class="report-section"><h2>${escapeHTML(group.section)}</h2><table>${rows}</table></section>`;
      }).join('');
    }
    function buildPremiumReportHTML(t){
      syncPhotoChecklist(t);
      const a = getApartment(t.apartmentId);
      const progress = checklistProgress(t);
      const missing = taskChecklistIndexes(t).filter(i => !(t.done || []).includes(i)).map(i => checklist[i]);
      const summary = qualitySummary(t);
      const issues = Array.isArray(t.technicalIssues) ? t.technicalIssues : [];
      const createdAt = new Date();
      const status = summary.ok ? 'GOTOWE' : 'WYMAGA SPRAWDZENIA';
      const fileTitle = `Raport sprzątania — ${a.name} — ${fmtDate(t.date)}`;
      return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHTML(fileTitle)}</title>
<style>
  :root{--ink:#1d160d;--muted:#6d6255;--paper:#fbf7ef;--card:#fffdfa;--line:#dfd1bd;--gold:#b88946;--green:#1f7d54;--red:#a5372f;--blue:#365f83}
  *{box-sizing:border-box}
  body{margin:0;background:#efe3d1;color:var(--ink);font-family:Georgia,'Times New Roman',serif;line-height:1.45}
  .toolbar{position:sticky;top:0;z-index:10;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;padding:14px;background:rgba(29,22,13,.94);box-shadow:0 10px 30px rgba(0,0,0,.18)}
  .toolbar button{border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:11px 16px;background:#fffdfa;color:#1d160d;font-weight:800;cursor:pointer}
  .toolbar .gold{background:linear-gradient(135deg,#f1d391,#b88946);color:#1d160d}
  .page{max-width:980px;margin:28px auto;padding:42px;background:var(--card);border:1px solid var(--line);box-shadow:0 30px 100px rgba(29,22,13,.18)}
  .header{border-bottom:3px double var(--gold);padding-bottom:24px;margin-bottom:24px;display:grid;grid-template-columns:1fr auto;gap:18px;align-items:start}
  .brand{font-family:Inter,Arial,sans-serif;text-transform:uppercase;letter-spacing:.16em;color:var(--gold);font-weight:900;font-size:12px;margin:0 0 10px}
  h1{font-size:42px;line-height:.96;margin:0 0 12px;letter-spacing:-.04em}
  .subtitle{font-family:Inter,Arial,sans-serif;color:var(--muted);font-size:14px;margin:0}
  .seal{min-width:160px;text-align:center;border:2px solid var(--gold);border-radius:22px;padding:16px;background:#fff8ea;font-family:Inter,Arial,sans-serif}
  .seal strong{display:block;font-size:18px;letter-spacing:.08em;color:${summary.ok ? 'var(--green)' : 'var(--red)'}}
  .seal span{display:block;color:var(--muted);font-size:12px;margin-top:5px}
  .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:22px 0}
  .box{border:1px solid var(--line);border-radius:18px;padding:14px;background:#fffaf1;min-height:78px}
  .box span{display:block;font-family:Inter,Arial,sans-serif;text-transform:uppercase;letter-spacing:.08em;font-size:10px;color:var(--muted);font-weight:900}
  .box strong{display:block;margin-top:6px;font-size:18px}
  .notice{border-left:5px solid ${summary.ok ? 'var(--green)' : 'var(--red)'};background:${summary.ok ? '#f1fbf4' : '#fff4f2'};padding:16px 18px;border-radius:16px;margin:18px 0;font-family:Inter,Arial,sans-serif}
  .notice strong{display:block;color:${summary.ok ? 'var(--green)' : 'var(--red)'};font-size:18px;margin-bottom:4px}
  .report-section{margin-top:24px;break-inside:avoid}
  h2{font-size:24px;margin:0 0 10px;border-bottom:1px solid var(--line);padding-bottom:8px}
  table{width:100%;border-collapse:collapse;font-family:Inter,Arial,sans-serif;font-size:13px;background:#fff}
  td{border-bottom:1px solid #eadfce;padding:10px;vertical-align:top}
  tr.done .mark{color:var(--green)}tr.missing .mark{color:var(--red)}
  .mark{font-size:18px;font-weight:900;width:38px;text-align:center}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .text-card{border:1px solid var(--line);border-radius:16px;padding:14px;background:#fffaf5;min-height:84px;font-family:Inter,Arial,sans-serif;color:var(--muted)}
  .footer{margin-top:30px;padding-top:18px;border-top:1px solid var(--line);font-family:Inter,Arial,sans-serif;color:var(--muted);font-size:12px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
  @media(max-width:760px){.page{margin:0;padding:24px;border:0}.header{grid-template-columns:1fr}.summary{grid-template-columns:1fr 1fr}.two-col{grid-template-columns:1fr}h1{font-size:34px}.toolbar button{flex:1}}
  @media print{body{background:#fff}.toolbar{display:none}.page{margin:0;box-shadow:none;border:0;max-width:none}.report-section{page-break-inside:avoid}}
</style>
</head>
<body>
  <div class="toolbar"><button class="gold" onclick="window.print()">Drukuj / zapisz jako PDF</button><button onclick="shareHTML()">Udostępnij Raport</button><button onclick="downloadHTML()">Pobierz raport HTML</button><button onclick="window.close()">Zamknij</button></div>
  <main class="page" id="premiumReport">
    <header class="header"><div><p class="brand">AdagoStay Room Service</p><h1>Raport sprzątania<br>${escapeHTML(a.name)}</h1><p class="subtitle">Raport wygenerowany przez aplikację. Układ, czcionka i tabela są niezależne od wyglądu WhatsAppa.</p></div><div class="seal"><strong>${status}</strong><span>${progress.doneCount}/${progress.total} punktów • ${progress.percent}%</span></div></header>
    <div class="notice"><strong>${escapeHTML(summary.title)}</strong>${escapeHTML(summary.text)}</div>
    <section class="summary">
      <div class="box"><span>Apartament</span><strong>${escapeHTML(a.name)}</strong></div><div class="box"><span>Data</span><strong>${escapeHTML(fmtDate(t.date))}</strong></div><div class="box"><span>Godzina service</span><strong>${escapeHTML(t.time || '-')}</strong></div><div class="box"><span>Status</span><strong>${escapeHTML(statusText(t.status))}</strong></div>
      <div class="box"><span>Rozpoczęcie</span><strong>${escapeHTML(fmtDateTime(t.startedAt))}</strong></div><div class="box"><span>Zakończenie</span><strong>${escapeHTML(fmtDateTime(t.endedAt))}</strong></div><div class="box"><span>Check-out</span><strong>${escapeHTML(t.checkout || '-')}</strong></div><div class="box"><span>Check-in</span><strong>${escapeHTML(t.checkin || '-')}</strong></div>
      <div class="box"><span>Goście</span><strong>${escapeHTML(String(t.guests || a.defaultGuests || '-'))}/${escapeHTML(String(a.max || '-'))}</strong></div><div class="box"><span>Zdjęcia przed</span><strong>${photoBeforeCount(t)}</strong></div><div class="box"><span>Zdjęcia po</span><strong>${photoAfterCount(t)}</strong></div><div class="box"><span>Młynek WC</span><strong>${a.hasGrinder ? 'Do sprawdzenia' : 'Nie dotyczy'}</strong></div>
    </section>
    <section class="report-section"><h2>Standard przygotowania</h2><div class="two-col"><div class="text-card"><strong>Pościel</strong><br>${reportTextBlock(t.bedding || a.bedding || '-')}</div><div class="text-card"><strong>Ręczniki</strong><br>${reportTextBlock(t.towels || a.towels || '-')}</div></div></section>
    <section class="report-section"><h2>Instrukcje i uwagi</h2><div class="two-col"><div class="text-card"><strong>Instrukcje Administratora</strong><br>${reportTextBlock(t.notes || '-')}</div><div class="text-card"><strong>Uwagi Room Service</strong><br>${reportTextBlock(t.serviceNotes || '-')}</div></div></section>
    <section class="report-section"><h2>Braki i problemy techniczne</h2><div class="two-col"><div class="text-card"><strong>Braki / do uzupełnienia</strong><br>${reportTextBlock(t.missingItems || '-')}</div><div class="text-card"><strong>Problemy techniczne</strong><br>${issues.length ? issues.map(issue => `${escapeHTML(fmtDateTime(issue.time))} — ${escapeHTML(issue.text)}`).join('<br>') : '-'}</div></div></section>
    ${premiumChecklistHTML(t)}
    <section class="report-section"><h2>Niewykonane / do sprawdzenia</h2><div class="text-card">${missing.length ? missing.map(x => `• ${escapeHTML(x)}`).join('<br>') : 'Brak — wszystko odhaczone.'}</div></section>
    <footer class="footer"><span>Wygenerowano: ${escapeHTML(fmtDateTime(createdAt.toISOString()))}</span><span>Godziny rozpoczęcia i zakończenia są zapisem automatycznym aplikacji.</span></footer>
  </main>
<script>
function reportFile(){
  const html = '<!doctype html>\n' + document.documentElement.outerHTML;
  return new File([html], 'raport-adagostay-room-service.html', {type:'text/html'});
}
function downloadHTML(){
  const file = reportFile();
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url; a.download = file.name; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}
async function shareHTML(){
  const file = reportFile();
  if(navigator.canShare && navigator.canShare({files:[file]})){
    try{ await navigator.share({title:'Raport AdagoStay Room Service', text:'Raport sprzątania AdagoStay Room Service', files:[file]}); return; }catch(e){}
  }
  alert('Ten telefon lub przeglądarka nie obsługuje udostępniania raportu jako pliku. Użyj przycisku „Drukuj / zapisz jako PDF” albo „Pobierz raport HTML”.');
}
<\/script>
</body>
</html>`;
    }
    function downloadPremiumReportHTML(t){
      const a = getApartment(t.apartmentId);
      const html = buildPremiumReportHTML(t);
      const safeName = `raport-${a.name}-${t.date || 'room-service'}`.toLowerCase().replace(/[^a-z0-9ąćęłńóśżź-]+/gi,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
      const blob = new Blob([html], {type:'text/html;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeName}.html`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 1000);
    }
    window.openPremiumReport = function(id){
      const t = state.tasks.find(x=>x.id===id); if(!t) return;
      syncPhotoChecklist(t);
      save();
      const html = buildPremiumReportHTML(t);
      const reportWindow = window.open('', '_blank');
      if(reportWindow){
        reportWindow.document.open();
        reportWindow.document.write(html);
        reportWindow.document.close();
        toast('Wygenerowano Raport');
      }else{
        downloadPremiumReportHTML(t);
        toast('Przeglądarka zablokowała nowe okno — pobieram raport HTML');
      }
    }
    async function copyText(text){
      try{ await navigator.clipboard.writeText(text); return true; }catch(e){ return false; }
    }
    function openWhatsAppReport(report){
      const message = report + '\n\nZdjęcia: raport zawiera liczbę udostępnionych zdjęć. Same zdjęcia są wysyłane osobno przyciskami „Udostępnij zdjęcia przed” i „Udostępnij zdjęcia po”.';
      window.location.href = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;
    }
    window.sendWhatsAppReport = async function(id){
      const t = state.tasks.find(x=>x.id===id); if(!t) return;
      syncPhotoChecklist(t);
      save();
      const report = buildReport(t);
      await copyText(report);
      openWhatsAppReport(report);
      toast(`Otwieram WhatsApp: ${whatsappDisplay}`);
    }

    closeModal.addEventListener('click',()=>taskModal.classList.remove('show'));
    taskModal.addEventListener('click',e=>{if(e.target===taskModal) taskModal.classList.remove('show')});
    document.getElementById('exportData').addEventListener('click',()=>{
      if(!isAdmin()){ toast('Tylko Administrator'); return; }
      const blob = new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='adago-room-service-export.json'; a.click(); URL.revokeObjectURL(url);
    });

    async function notifyNow(title, body){
      if(!('Notification' in window)) return false;
      if(Notification.permission === 'default') await Notification.requestPermission();
      if(Notification.permission === 'granted') { new Notification(title,{body, icon:'icon.svg'}); return true; }
      return false;
    }
    document.getElementById('enableNotifications').addEventListener('click', async()=>{ const ok = await notifyNow('Powiadomienia włączone', 'AdagoStay Room Service może pokazywać przypomnienia.'); toast(ok ? 'Powiadomienia włączone' : 'Brak zgody na powiadomienia'); });
    function checkReminders(){
      const now = new Date();
      let changed = false;
      state.tasks.forEach(t=>{
        if(t.status === 'done') return;
        const due = taskDateObj(t); const mins = Math.round((due-now)/60000); const a=getApartment(t.apartmentId);
        [[60,'1h'],[30,'30m'],[0,'now']].forEach(([m,key])=>{
          if(mins <= m && mins > m-2 && !t.reminders?.[key]){
            t.reminders = t.reminders || {}; t.reminders[key] = true; changed=true;
            const text = key==='now' ? `Teraz: ${a.name}` : `Za ${m} min: ${a.name}, godz. ${t.time}`;
            notifyNow('Room Service', text); toast(text);
          }
        });
      });
      if(changed) save();
    }
    setInterval(checkReminders, 60000); setTimeout(checkReminders, 1800);

    window.downloadICS = function(id){
      const t=state.tasks.find(x=>x.id===id); if(!t) return; const a=getApartment(t.apartmentId);
      const start = new Date(`${t.date}T${t.time}:00`); const end = new Date(start.getTime()+90*60000);
      const stamp = d => d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
      const body = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//AdagoStay//AdagoStay Room Service//PL','BEGIN:VEVENT',`UID:${t.id}@adago-room-service`,`DTSTAMP:${stamp(new Date())}`,`DTSTART:${stamp(start)}`,`DTEND:${stamp(end)}`,`SUMMARY:Room Service — ${a.name}`,`DESCRIPTION:${escapeICS(t.notes || 'Service apartamentu')}. Goście: ${t.guests || '-'}/${a.max}. Pościel: ${escapeICS(t.bedding || a.bedding || '-')}. Ręczniki: ${escapeICS(t.towels || a.towels || '-')}. Check-in: ${t.checkin || '-'}. Check-out: ${t.checkout || '-'}.`,`LOCATION:${a.name}, ${a.location}`,'BEGIN:VALARM','TRIGGER:-PT30M','ACTION:DISPLAY',`DESCRIPTION:Za 30 minut Room Service — ${a.name}`,'END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
      const blob = new Blob([body],{type:'text/calendar'}); const url=URL.createObjectURL(blob); const link=document.createElement('a'); link.href=url; link.download=`room-service-${a.name}-${t.date}.ics`; link.click(); URL.revokeObjectURL(url);
    }
    function escapeHTML(s){ return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
    function escapeICS(s){ return String(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n'); }

    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt=e; installBanner.classList.add('show'); });
    installApp.addEventListener('click', async()=>{ if(deferredPrompt){ deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; installBanner.classList.remove('show'); } });
    if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js').catch(()=>{})); }
    handleIncomingTaskLink();
    setupLogin();
    if(currentUser){
      applyAuthUI();
      render();
      setView(pendingIncomingTaskId ? 'roomservice' : allowedView(state.activeView || (isAdmin() ? 'dashboard' : 'roomservice')));
      if(pendingIncomingTaskId){
        const taskIdToOpen = pendingIncomingTaskId;
        pendingIncomingTaskId = null;
        setTimeout(() => openTask(taskIdToOpen), 250);
      }
    }else{
      showLogin();
    }
  