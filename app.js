const $ = s => document.querySelector(s);
const app = $('#app');
const monthLabels = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const weekdayLabels = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

const medDefaults = [
  {id:'propofol',name:'Propofol',class:'Hypnotique · Anesthésie générale',doc:true,indication:'Induction et entretien de l’anesthésie générale.',mechanism:'Potentialise l’activité GABAergique, entraînant une sédation-hypnose rapide.',contra:'Hypersensibilité connue ; vérifier les contre-indications et protocoles locaux.',dose:'À compléter selon le protocole de l’établissement.'},
  {id:'cefazoline',name:'Cefazoline',class:'Antibiotique · Céphalosporine',indication:'Antibioprophylaxie chirurgicale.',mechanism:'Inhibe la synthèse de la paroi bactérienne.',contra:'Allergie aux bêta-lactamines ; adapter à la fonction rénale.',dose:'À compléter selon le protocole de l’établissement.'},
  {id:'ondansetron',name:'Ondansétron',class:'Antiémétique',indication:'Prévention et traitement des nausées et vomissements.',mechanism:'Antagoniste sélectif des récepteurs 5-HT3.',contra:'Allongement du QT ; interactions et protocole local.',dose:'À compléter selon le protocole de l’établissement.'},
  {id:'paracetamol',name:'Paracétamol',class:'Antalgique · Palier I',indication:'Traitement de la douleur et de la fièvre.',mechanism:'Action antalgique centrale.',contra:'Insuffisance hépatocellulaire sévère ; attention aux cumuls.',dose:'À compléter selon le protocole de l’établissement.'}
];
const establishmentDefaults = [
  {id:'chan-nevers',name:'CHAN Nevers',city:'Nevers',service:'Bloc opératoire',note:'Repères personnels, accès et contacts à compléter.',contacts:[
    {id:'c1',department:'Accueil standard',phone:'À renseigner',note:''},
    {id:'c2',department:'Bloc opératoire',phone:'À renseigner',note:''},
    {id:'c3',department:'Pharmacie',phone:'À renseigner',note:'Horaires et procédures'},
    {id:'c4',department:'Réanimation',phone:'À renseigner',note:''}
  ]},
  {id:'montargis',name:'Centre hospitalier de Montargis',city:'Montargis',service:'Anesthésie',note:'Fiche de repérage à personnaliser.',contacts:[
    {id:'c5',department:'Accueil standard',phone:'À renseigner',note:''},
    {id:'c6',department:'Bloc opératoire',phone:'À renseigner',note:''}
  ]}
];
const planningDefaults = [];
const languageDefaults = [
  {id:'anglais',title:'Anglais',text:'Dossier de phrases et repères à compléter.'},
  {id:'espagnol',title:'Espagnol',text:'Dossier de phrases et repères à compléter.'}
];
const protocolDefaults = [
  {id:'antibioprophylaxie',title:'Antibioprophylaxie',text:'Ajoute ici tes recommandations et repères.'}
];
const noteDefaults = [];
const get = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; } catch { return fallback; } };
const set = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const getMeds = () => get('rp-meds', medDefaults);
const setMeds = value => set('rp-meds', value);
const getEstablishments = () => get('rp-establishments', establishmentDefaults);
const setEstablishments = value => set('rp-establishments', value);
const getPlanning = () => get('rp-planning', planningDefaults);
const setPlanning = value => set('rp-planning', value);
const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const escape = text => String(text || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const logo = () => '<div class="brand"><i class="logo" aria-hidden="true"></i><span>Réperto’Poche</span></div>';
const nav = (active='home') => `<nav class="nav" aria-label="Navigation principale">
  <button class="${active==='home'?'active':''}" data-go="home"><span>⌂</span>Accueil</button>
  <button class="${active==='search'?'active':''}" data-go="search"><span>⌕</span>Recherche</button>
  <button class="nav-add" data-add-menu aria-label="Ajouter">+</button>
  <button class="${active==='planning'?'active':''}" data-go="planning"><span>▣</span>Planning</button>
</nav>`;
const topbar = () => `<header class="top">${logo()}<button class="avatar" aria-label="Profil">AK</button></header>`;
const category = (cls, icon, title, meta, target) => `<button class="folder ${cls}" data-go="${target}"><span class="icon">${icon}</span><h2>${title}</h2><p>${meta}</p></button>`;
const sortedContacts = establishment => [...(establishment.contacts || [])].sort((a,b) => a.department.localeCompare(b.department,'fr'));

function home(){
  const est = getEstablishments(); const events = getPlanning();
  app.innerHTML = `${topbar()}<p class="eyebrow">Bonjour Agnès</p><h1 class="headline">Tout retrouver,<br>même dans l’urgence.</h1><p class="sub">Ton carnet professionnel, toujours dans la poche.</p>
  <label class="search"><span>⌕</span><input id="global-search" placeholder="Rechercher dans Réperto’Poche" autocomplete="off" /></label>
  <section class="grid">${category('est','⌂','Établissements',`${est.length} lieux`,'establishments')}${category('med','●','Médicaments',`${getMeds().length} fiches`,'meds')}${category('lang','文','Langues',`${get('rp-languages', languageDefaults).length} dossiers`,'languages')}${category('docs','▤','Protocoles',`${get('rp-protocols', protocolDefaults).length} document${get('rp-protocols', protocolDefaults).length>1?'s':''}`,'protocols')}${category('notes','✎','Notes rapides',`${get('rp-notes', noteDefaults).length} note${get('rp-notes', noteDefaults).length>1?'s':''}`,'notes')}${category('plan','□','Planning',events.length ? `${events.length} créneau${events.length>1?'x':''}` : 'À organiser','planning')}</section>${nav('home')}`;
  $('#global-search').addEventListener('input', e => globalSearch(e.target.value)); bind();
}

function meds(query=''){
  const list = getMeds().filter(m => `${m.name} ${m.class}`.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')));
  app.innerHTML = `${topbar()}${sectionTitle('Médicaments',`${getMeds().length} fiches`,'home')}<label class="search"><span>⌕</span><input id="med-search" value="${escape(query)}" placeholder="Rechercher un médicament" autocomplete="off" /></label><button class="filter">Toutes les classes</button><section class="list">${list.length ? list.map(m => `<button class="item" data-med="${m.id}" data-hold="med|${m.id}" aria-label="${escape(m.name)}. Maintenir pour modifier ou supprimer."><span class="item-icon med-icon">●</span><span class="item-main"><h2>${escape(m.name)}</h2><p>${escape(m.class)}</p></span>${m.attachment?'<span class="paperclip">⌇ 1 fichier</span>':''}<span class="chev">›</span></button>`).join('') : empty('Aucun médicament trouvé.')}</section><button class="fab" data-add-med aria-label="Ajouter une fiche médicament">+</button>${nav()}`;
  $('#med-search').addEventListener('input', e => meds(e.target.value)); bind();
}
function medDetail(id){
  const med = getMeds().find(item => item.id === id); if(!med) return meds();
  app.innerHTML = `${topbar()}${sectionTitle(escape(med.name),'Fiche médicament','meds')}<span class="tag med-tag">${escape(med.class)}</span>${med.attachment?'<span class="tag soft-tag">⌇ 1 fichier joint</span>':''}<p class="helper">Maintiens une fiche pour la modifier ou la supprimer.</p><section class="holdable" tabindex="0" role="button" data-hold="med|${med.id}">${infoCard('Indication',med.indication)}${infoCard('Mécanisme d’action',med.mechanism)}${infoCard('Contre-indications & vigilance',med.contra)}${infoCard('Posologie',med.dose)}</section>${attachmentLink(med.attachment)}${nav()}`; bind();
}

function establishments(query=''){
  const list = getEstablishments().filter(place => `${place.name} ${place.city} ${place.service}`.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')));
  app.innerHTML = `${topbar()}${sectionTitle('Établissements',`${getEstablishments().length} lieux`,'home')}<label class="search"><span>⌕</span><input id="est-search" value="${escape(query)}" placeholder="Rechercher un établissement" autocomplete="off" /></label><p class="helper">Contacts classés de A à Z dans chaque établissement.</p><section class="list">${list.length ? list.map(place => `<button class="item establishment-item" data-est="${place.id}"><span class="item-icon est-icon">⌂</span><span class="item-main"><h2>${escape(place.name)}</h2><p>${escape(place.city || 'Ville à renseigner')} · ${sortedContacts(place).length} contact${sortedContacts(place).length>1?'s':''}</p></span><span class="chev">›</span></button>`).join('') : empty('Aucun établissement trouvé.')}</section><button class="fab" data-add-est aria-label="Ajouter un établissement">+</button>${nav()}`;
  $('#est-search').addEventListener('input', e => establishments(e.target.value)); bind();
}
function establishmentDetail(id){
  const place = getEstablishments().find(item => item.id === id); if(!place) return establishments();
  const contacts = sortedContacts(place);
  app.innerHTML = `${topbar()}${sectionTitle(escape(place.name),escape(place.city || 'Établissement'),'establishments')}<div class="place-summary holdable" tabindex="0" role="button" data-hold="est|${place.id}"><span class="item-icon est-icon">⌂</span><div><strong>${escape(place.service || 'Service à renseigner')}</strong><p>${escape(place.note || 'Ajoute ici tes repères pratiques.')}</p></div></div><p class="helper">Maintiens un établissement ou un contact pour le modifier ou le supprimer.</p><div class="subsection-head"><div><h2>Annuaire téléphonique</h2><p>${contacts.length} contact${contacts.length>1?'s':''} · ordre alphabétique</p></div><button class="small-add" data-add-contact="${place.id}" aria-label="Ajouter un contact">+</button></div><section class="list contacts">${contacts.length ? contacts.map(c => `<article class="contact-card holdable" tabindex="0" role="button" data-hold="contact|${place.id}|${c.id}"><span class="contact-letter">${escape(c.department.slice(0,1).toUpperCase())}</span><div class="item-main"><h2>${escape(c.department)}</h2><p>${escape(c.phone || 'À renseigner')}${c.note ? ` · ${escape(c.note)}` : ''}</p></div></article>`).join('') : empty('Aucun contact pour le moment.')}</section>${nav()}`; bind();
}

function planning(cursor = new Date().getFullYear()+'-'+String(new Date().getMonth()+1).padStart(2,'0')){
  const [year, month] = cursor.split('-').map(Number); const events = getPlanning();
  const monthStart = new Date(year, month-1, 1); const startDay = (monthStart.getDay()+6)%7; const days = new Date(year,month,0).getDate();
  const previous = new Date(year,month-2,1); const next = new Date(year,month,1);
  const cells = Array.from({length:startDay},() => '<span class="day empty-day"></span>');
  for(let day=1; day<=days; day++){
    const date = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const dayEvents = events.filter(event => event.date===date);
    cells.push(`<button class="day ${dayEvents.length?'has-event':''}" data-day="${date}" aria-label="${day} ${monthLabels[month-1]}"><b>${day}</b>${dayEvents.slice(0,2).map(event => `<i class="dot ${event.type}"></i>`).join('')}</button>`);
  }
  const monthEvents = events.filter(event => event.date.startsWith(`${year}-${String(month).padStart(2,'0')}`)).sort((a,b)=>a.date.localeCompare(b.date)||a.start.localeCompare(b.start));
  app.innerHTML = `${topbar()}${sectionTitle('Planning',`${monthLabels[month-1]} ${year}`,'home')}<p class="helper">Maintiens un créneau pour le modifier ou le supprimer.</p><section class="planning-card"><div class="calendar-head"><button class="month-nav" data-month="${previous.getFullYear()}-${String(previous.getMonth()+1).padStart(2,'0')}">‹</button><h2>${monthLabels[month-1]} ${year}</h2><button class="month-nav" data-month="${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}">›</button></div><div class="weekdays">${weekdayLabels.map(d=>`<span>${d}</span>`).join('')}</div><div class="calendar-grid">${cells.join('')}</div></section><div class="legend"><span><i class="dot work"></i> Travail</span><span><i class="dot leave"></i> Indisponible</span><span><i class="dot personal"></i> Personnel</span></div><div class="subsection-head"><div><h2>Ce mois-ci</h2><p>${monthEvents.length ? `${monthEvents.length} créneau${monthEvents.length>1?'x':''}` : 'Ajoute tes gardes, congés et rendez-vous'}</p></div><button class="small-add" data-add-event aria-label="Ajouter un créneau">+</button></div><section class="list event-list">${monthEvents.length ? monthEvents.map(event => eventRow(event)).join('') : empty('Aucun créneau ce mois-ci.')}</section><button class="fab" data-add-event aria-label="Ajouter au planning">+</button>${nav('planning')}`; bind();
}
function eventRow(event){ const d = new Date(`${event.date}T12:00:00`); return `<button class="item event-item" data-hold="event|${event.id}" aria-label="${escape(event.title)}. Maintenir pour modifier ou supprimer."><span class="event-date"><b>${String(d.getDate()).padStart(2,'0')}</b><small>${['JAN','FÉV','MAR','AVR','MAI','JUN','JUL','AOÛ','SEP','OCT','NOV','DÉC'][d.getMonth()]}</small></span><span class="item-main"><h2>${escape(event.title)}</h2><p>${event.start || 'Heure à préciser'}${event.end ? ` – ${event.end}`:''}${event.place ? ` · ${escape(event.place)}`:''}</p></span><i class="event-type ${event.type}"></i><span class="chev">›</span></button>`; }

const resourceConfig = {
  languages:{title:'Langues étrangères',singular:'dossier de langue',subtitle:'Phrases et repères par langue',key:'rp-languages',fallback:languageDefaults,empty:'Aucun dossier de langue pour le moment.'},
  protocols:{title:'Protocoles',singular:'protocole',subtitle:'Recommandations et documents utiles',key:'rp-protocols',fallback:protocolDefaults,empty:'Aucun protocole pour le moment.'},
  notes:{title:'Notes rapides',singular:'note',subtitle:'Tes repères à retrouver vite',key:'rp-notes',fallback:noteDefaults,empty:'Aucune note pour le moment.'}
};
function resourcePage(kind){
  const config = resourceConfig[kind];
  if(!config) return home();
  const items = get(config.key, config.fallback);
  const cards = items.length ? items.map(item => kind==='languages'
    ? `<button class="detail-card holdable resource-folder" data-language="${item.id}" data-hold="resource|${kind}|${item.id}" aria-label="${escape(item.title)}. Touchez pour ouvrir, maintenez pour modifier ou supprimer."><h2>${escape(item.title)}</h2><p>${escape(item.text || 'À compléter.')}</p><span class="chev">›</span></button>`
    : `<article class="detail-card holdable" tabindex="0" role="button" data-hold="resource|${kind}|${item.id}"><h2>${escape(item.title)}</h2><p>${escape(item.text || 'À compléter.')}</p>${kind==='protocols'&&item.attachment?`<p><strong>⌇ Fichier joint : ${escape(item.attachment.name)}</strong></p>`:''}${kind==='protocols'?attachmentLink(item.attachment):''}</article>`).join('') : empty(config.empty);
  app.innerHTML = `${topbar()}${sectionTitle(config.title,config.subtitle,'home')}<p class="helper">${kind==='languages'?'Touche un dossier pour l’ouvrir. Maintiens-le pour le modifier ou le supprimer.':'Maintiens une entrée pour la modifier ou la supprimer.'}</p><section class="list">${cards}</section><button class="fab" data-add-resource="${kind}" aria-label="Ajouter ${config.singular}">+</button>${nav()}`;
  bind();
}
function languageDetail(id){
  const language = get('rp-languages', languageDefaults).find(item=>item.id===id);
  if(!language) return resourcePage('languages');
  const entries = language.entries || [];
  app.innerHTML = `${topbar()}${sectionTitle(escape(language.title),'Phrases et notes','languages')}<p class="helper">Ajoute ici les phrases utiles pour ce dossier. Maintiens une note pour la modifier ou la supprimer.</p>${language.text ? `<article class="detail-card"><p>${escape(language.text)}</p></article>` : ''}<section class="list">${entries.length ? entries.map(item=>`<article class="detail-card holdable" tabindex="0" role="button" data-hold="language-note|${language.id}|${item.id}"><h2>${escape(item.title)}</h2><p>${escape(item.text || 'À compléter.')}</p></article>`).join('') : empty('Aucune note pour le moment.')}</section><button class="fab" data-add-language-note="${language.id}" aria-label="Ajouter une note dans ${escape(language.title)}">+</button>${nav()}`;
  bind();
}

function searchPage(){
  app.innerHTML = `${topbar()}${sectionTitle('Recherche','Médicaments, établissements, planning','home')}<label class="search"><span>⌕</span><input id="search-page-input" placeholder="Rechercher dans Réperto’Poche" autocomplete="off" autofocus /></label><p class="helper">Retrouve un médicament, un établissement, un service ou un créneau.</p>${nav('search')}`;
  $('#search-page-input').addEventListener('input', event => { if(event.target.value.trim()) globalSearch(event.target.value); }); bind();
}
function globalSearch(query){
  const term = query.trim().toLocaleLowerCase('fr'); if(!term) return searchPage();
  const meds = getMeds().filter(m => `${m.name} ${m.class} ${m.indication}`.toLocaleLowerCase('fr').includes(term));
  const establishmentsFound = getEstablishments().filter(p => `${p.name} ${p.city} ${p.service} ${(p.contacts||[]).map(c=>`${c.department} ${c.phone}`).join(' ')}`.toLocaleLowerCase('fr').includes(term));
  const events = getPlanning().filter(e => `${e.title} ${e.place}`.toLocaleLowerCase('fr').includes(term));
  app.innerHTML = `${topbar()}${sectionTitle('Résultats',`pour « ${escape(query)} »`,'home')}<section class="search-results">${meds.length?`<h2>Médicaments</h2><section class="list">${meds.map(m=>`<button class="item" data-med="${m.id}"><span class="item-icon med-icon">●</span><span class="item-main"><h2>${escape(m.name)}</h2><p>${escape(m.class)}</p></span><span class="chev">›</span></button>`).join('')}</section>`:''}${establishmentsFound.length?`<h2>Établissements</h2><section class="list">${establishmentsFound.map(p=>`<button class="item" data-est="${p.id}"><span class="item-icon est-icon">⌂</span><span class="item-main"><h2>${escape(p.name)}</h2><p>${escape(p.city)}</p></span><span class="chev">›</span></button>`).join('')}</section>`:''}${events.length?`<h2>Planning</h2><section class="list">${events.map(eventRow).join('')}</section>`:''}${!meds.length&&!establishmentsFound.length&&!events.length?empty('Aucun résultat pour le moment.'):''}</section>${nav('search')}`; bind();
}

function sectionTitle(title, subtitle, back){ return `<div class="section-head"><button class="back" data-go="${back}" aria-label="Retour">‹</button><div><h1>${title}</h1><p>${subtitle}</p></div></div>`; }
function infoCard(title,text){ return `<article class="detail-card"><h2>${title}</h2><p>${escape(text || 'À compléter.')}</p></article>`; }
function empty(text){ return `<p class="empty">${text}</p>`; }
function toast(message){ const el=$('#toast'); el.textContent=message; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2600); }
function attachmentLink(attachment){ return attachment ? `<a class="primary attachment-link" href="${attachment.data}" download="${escape(attachment.name)}" target="_blank" rel="noopener">⌇ Ouvrir : ${escape(attachment.name)}</a>` : ''; }
function fileToAttachment(file){ return new Promise((resolve,reject)=>{ if(!file || !file.name) return resolve(null); if(file.size>2*1024*1024) return reject(new Error('Ce fichier dépasse 2 Mo.')); const reader=new FileReader(); reader.onload=()=>resolve({name:file.name,type:file.type||'application/octet-stream',data:reader.result}); reader.onerror=()=>reject(new Error('Lecture du fichier impossible.')); reader.readAsDataURL(file); }); }

function medForm(existing){
  const med = existing || {name:'',class:'',indication:'',mechanism:'',contra:'',dose:'',attachment:null};
  openSheet(`${existing?'Modifier':'Nouvelle'} fiche médicament`, `<div class="field"><label>Nom du médicament</label><input required name="name" value="${escape(med.name)}" placeholder="Ex. Propofol"></div><div class="field"><label>Classe / usage</label><input required name="class" value="${escape(med.class)}" placeholder="Ex. Hypnotique · Anesthésie"></div><div class="field"><label>Indication</label><textarea name="indication">${escape(med.indication)}</textarea></div><div class="field"><label>Mécanisme d’action</label><textarea name="mechanism">${escape(med.mechanism)}</textarea></div><div class="field"><label>Contre-indications & vigilance</label><textarea name="contra">${escape(med.contra)}</textarea></div><div class="field"><label>Posologie</label><textarea name="dose">${escape(med.dose)}</textarea></div><div class="field"><label>Fichier joint ${med.attachment?`actuel : ${escape(med.attachment.name)}`:'(PDF, image ou document, 2 Mo maximum)'}</label><input type="file" name="attachment" accept="application/pdf,image/*,.doc,.docx,.txt"></div>`, async values => { try { const file=values.attachment; delete values.attachment; const attachment=file&&file.name ? await fileToAttachment(file) : (med.attachment||null); let list=getMeds(); if(existing) list=list.map(item=>item.id===existing.id?{...item,...values,attachment}:item); else list.push({id:uid('med'),...values,attachment,doc:!!attachment}); setMeds(list); meds(); toast(attachment?'Fiche et fichier enregistrés':'Fiche enregistrée sur cet iPhone'); } catch(error){toast(error.message); throw error;} });
}
function establishmentForm(existing){
  const place = existing || {name:'',city:'',service:'',note:'',contacts:[]};
  openSheet(`${existing?'Modifier':'Nouvel'} établissement`, `<div class="field"><label>Nom de l’établissement</label><input required name="name" value="${escape(place.name)}" placeholder="Ex. CHAN Nevers"></div><div class="field"><label>Ville</label><input name="city" value="${escape(place.city)}" placeholder="Ex. Nevers"></div><div class="field"><label>Service principal</label><input name="service" value="${escape(place.service)}" placeholder="Ex. Bloc opératoire"></div><div class="field"><label>Repères personnels</label><textarea name="note" placeholder="Accès, vestiaires, habitudes utiles…">${escape(place.note)}</textarea></div>`, values => {let list=getEstablishments();if(existing)list=list.map(item=>item.id===existing.id?{...item,...values}:item);else list.push({id:uid('est'),...values,contacts:[]});setEstablishments(list);establishments();toast('Établissement enregistré');});
}
function contactForm(placeId, existing){
  const contact = existing || {department:'',phone:'',note:''};
  openSheet(`${existing?'Modifier':'Nouveau'} contact`, `<div class="field"><label>Service / interlocuteur</label><input required name="department" value="${escape(contact.department)}" placeholder="Ex. Bloc opératoire"></div><div class="field"><label>Téléphone</label><input name="phone" inputmode="tel" value="${escape(contact.phone)}" placeholder="Ex. 03 00 00 00 00"></div><div class="field"><label>Note utile</label><textarea name="note" placeholder="Ex. poste 1234, horaires…">${escape(contact.note)}</textarea></div>`, values => {const list=getEstablishments().map(place=>{if(place.id!==placeId)return place;const contacts=place.contacts||[];return {...place,contacts:existing?contacts.map(item=>item.id===existing.id?{...item,...values}:item):[...contacts,{id:uid('contact'),...values}]};});setEstablishments(list);establishmentDetail(placeId);toast('Contact enregistré');});
}
function formatTime(value){
  const raw=String(value||'').trim(); if(!raw) return '';
  const colon=raw.match(/^(\d{1,2}):(\d{1,2})$/); const digits=raw.replace(/\D/g,'').slice(0,4);
  let hours, minutes;
  if(colon){hours=Number(colon[1]);minutes=Number(colon[2]);}
  else if(digits.length<=2){hours=Number(digits);minutes=0;}
  else if(digits.length===3){hours=Number(digits.slice(0,1));minutes=Number(digits.slice(1));}
  else {hours=Number(digits.slice(0,2));minutes=Number(digits.slice(2));}
  return `${String(Math.min(hours,23)).padStart(2,'0')}:${String(Math.min(minutes,59)).padStart(2,'0')}`;
}
function eventForm(existing, date=''){
  const today = new Date(); const planned = existing || {date:date||today.toISOString().slice(0,10),title:'',place:'',start:'',end:'',type:'work',note:''};
  openSheet(`${existing?'Modifier':'Nouveau'} créneau`, `<div class="field"><label>Date</label><input required type="date" name="date" value="${escape(planned.date)}"></div><div class="field"><label>Type</label><select name="type"><option value="work" ${planned.type==='work'?'selected':''}>Travail</option><option value="leave" ${planned.type==='leave'?'selected':''}>Indisponible / congé</option><option value="personal" ${planned.type==='personal'?'selected':''}>Personnel</option></select></div><div class="field"><label>Intitulé</label><input required name="title" value="${escape(planned.title)}" placeholder="Ex. Vacation IADE"></div><div class="field"><label>Établissement / lieu</label><input name="place" value="${escape(planned.place)}" placeholder="Ex. CHAN Nevers"></div><div class="time-fields"><div class="field"><label>Début</label><input type="text" name="start" inputmode="numeric" autocomplete="off" maxlength="5" value="${escape(planned.start)}" placeholder="Ex. 07:30" aria-label="Heure de début, au clavier"></div><div class="field"><label>Fin</label><input type="text" name="end" inputmode="numeric" autocomplete="off" maxlength="5" value="${escape(planned.end)}" placeholder="Ex. 18:00" aria-label="Heure de fin, au clavier"></div></div><p class="helper">Saisis l’horaire au clavier : 0730 devient 07:30.</p><div class="field"><label>Note</label><textarea name="note" placeholder="Service, repère, rappel…">${escape(planned.note)}</textarea></div>`, values => {values.start=formatTime(values.start);values.end=formatTime(values.end);let list=getPlanning();if(existing)list=list.map(item=>item.id===existing.id?{...item,...values}:item);else list.push({id:uid('event'),...values});setPlanning(list);planning(values.date.slice(0,7));toast('Créneau enregistré sur cet iPhone');});
}
function openSheet(title, body, onSave){
  const modal=document.createElement('div');modal.className='modal';modal.innerHTML=`<form class="sheet"><div class="sheet-top"><h2>${title}</h2><button type="button" class="close" data-close>×</button></div>${body}<button class="primary">Enregistrer</button></form>`;document.body.append(modal);modal.querySelector('[data-close]').onclick=()=>modal.remove();modal.querySelector('form').onsubmit=async e=>{e.preventDefault();try{await onSave(Object.fromEntries(new FormData(e.target)));modal.remove();}catch(error){console.warn(error);}};
}
function resourceForm(kind, existing){
  const config=resourceConfig[kind]; if(!config)return;
  const item=existing||{title:'',text:'',attachment:null}; const fileField=kind==='protocols'?`<div class="field"><label>Fichier joint ${item.attachment?`actuel : ${escape(item.attachment.name)}`:'(PDF, image ou document, 2 Mo maximum)'}</label><input type="file" name="attachment" accept="application/pdf,image/*,.doc,.docx,.txt"></div>`:'';
  openSheet(`${existing?'Modifier':'Nouveau'} ${config.singular}`,`<div class="field"><label>Titre</label><input required name="title" value="${escape(item.title)}" placeholder="Ex. ${kind==='languages'?'Anglais':kind==='protocols'?'Antibioprophylaxie':'Repère important'}"></div><div class="field"><label>Contenu</label><textarea name="text" placeholder="Écris ici ton repère…">${escape(item.text)}</textarea></div>${fileField}`,async values=>{try{const file=values.attachment;delete values.attachment;const attachment=kind==='protocols'&&file&&file.name?await fileToAttachment(file):(item.attachment||null);let list=get(config.key,config.fallback);if(existing)list=list.map(entry=>entry.id===existing.id?{...entry,...values,attachment}:entry);else list.push({id:uid(kind.slice(0,-1)),...values,attachment});set(config.key,list);resourcePage(kind);toast(attachment?'Entrée et fichier enregistrés':'Entrée enregistrée sur cet iPhone');}catch(error){toast(error.message);throw error;}});
}
function languageNoteForm(languageId, existing){
  const language = get('rp-languages', languageDefaults).find(item=>item.id===languageId);
  if(!language) return resourcePage('languages');
  const note = existing || {title:'',text:''};
  openSheet(`${existing?'Modifier':'Nouvelle'} note — ${escape(language.title)}`,`<div class="field"><label>Titre</label><input required name="title" value="${escape(note.title)}" placeholder="Ex. Accueil du patient"></div><div class="field"><label>Phrase ou note</label><textarea name="text" placeholder="Ex. Bonjour, comment vous sentez-vous ?">${escape(note.text)}</textarea></div>`,values=>{const list=get('rp-languages',languageDefaults).map(item=>{if(item.id!==languageId)return item;const entries=item.entries||[];return {...item,entries:existing?entries.map(entry=>entry.id===existing.id?{...entry,...values}:entry):[...entries,{id:uid('phrase'),...values}]};});set('rp-languages',list);languageDetail(languageId);toast('Note enregistrée dans ce dossier');});
}
function menuSheet(title, choices){
  const modal=document.createElement('div');modal.className='modal menu-modal';modal.innerHTML=`<section class="sheet quick-sheet"><div class="sheet-top"><h2>${title}</h2><button type="button" class="close" data-close>×</button></div>${choices.map(choice=>`<button class="add-choice ${choice.danger?'danger-choice':''}" data-menu-choice="${choice.id}"><span>${choice.icon||'•'}</span><span><strong>${choice.label}</strong>${choice.hint?`<small>${choice.hint}</small>`:''}</span></button>`).join('')}</section>`;document.body.append(modal);modal.querySelector('[data-close]').onclick=()=>modal.remove();modal.querySelectorAll('[data-menu-choice]').forEach(button=>button.onclick=()=>{const choice=choices.find(item=>item.id===button.dataset.menuChoice);modal.remove();choice.action();});
}
function deleteEntry(label,onDelete){
  menuSheet(`Supprimer ${label} ?`,[{id:'confirm',label:'Supprimer définitivement',hint:'Cette action ne peut pas être annulée',icon:'×',danger:true,action:()=>{onDelete();toast('Entrée supprimée de cet iPhone');}},{id:'cancel',label:'Conserver',hint:'Retour sans modification',icon:'‹',action:()=>{}}]);
}
function entryMenu(value){
  const [type,...parts]=value.split('|');
  if(type==='med'){const item=getMeds().find(entry=>entry.id===parts[0]);if(!item)return;return menuSheet(item.name,[{id:'edit',label:'Modifier',hint:'Ouvrir la fiche',icon:'✎',action:()=>medForm(item)},{id:'delete',label:'Supprimer',hint:'Retirer cette fiche',icon:'×',danger:true,action:()=>deleteEntry('cette fiche',()=>{setMeds(getMeds().filter(entry=>entry.id!==item.id));meds();})}]);}
  if(type==='est'){const item=getEstablishments().find(entry=>entry.id===parts[0]);if(!item)return;return menuSheet(item.name,[{id:'edit',label:'Modifier',hint:'Ouvrir l’établissement',icon:'✎',action:()=>establishmentForm(item)},{id:'delete',label:'Supprimer',hint:'Retirer l’établissement et ses contacts',icon:'×',danger:true,action:()=>deleteEntry('cet établissement',()=>{setEstablishments(getEstablishments().filter(entry=>entry.id!==item.id));establishments();})}]);}
  if(type==='contact'){const placeId=parts[0],contactId=parts[1],place=getEstablishments().find(entry=>entry.id===placeId),item=place&&(place.contacts||[]).find(entry=>entry.id===contactId);if(!item)return;return menuSheet(item.department,[{id:'edit',label:'Modifier',hint:'Ouvrir le contact',icon:'✎',action:()=>contactForm(placeId,item)},{id:'delete',label:'Supprimer',hint:'Retirer ce contact',icon:'×',danger:true,action:()=>deleteEntry('ce contact',()=>{setEstablishments(getEstablishments().map(entry=>entry.id===placeId?{...entry,contacts:(entry.contacts||[]).filter(contact=>contact.id!==contactId)}:entry));establishmentDetail(placeId);})}]);}
  if(type==='event'){const item=getPlanning().find(entry=>entry.id===parts[0]);if(!item)return;return menuSheet(item.title,[{id:'edit',label:'Modifier',hint:'Ouvrir le créneau',icon:'✎',action:()=>eventForm(item)},{id:'delete',label:'Supprimer',hint:'Retirer ce créneau',icon:'×',danger:true,action:()=>deleteEntry('ce créneau',()=>{setPlanning(getPlanning().filter(entry=>entry.id!==item.id));planning(item.date.slice(0,7));})}]);}
  if(type==='resource'){const kind=parts[0],id=parts[1],config=resourceConfig[kind],item=config&&get(config.key,config.fallback).find(entry=>entry.id===id);if(!item)return;return menuSheet(item.title,[{id:'edit',label:'Modifier',hint:'Ouvrir l’entrée',icon:'✎',action:()=>resourceForm(kind,item)},{id:'delete',label:'Supprimer',hint:'Retirer cette entrée',icon:'×',danger:true,action:()=>deleteEntry('cette entrée',()=>{set(config.key,get(config.key,config.fallback).filter(entry=>entry.id!==item.id));resourcePage(kind);})}]);}
  if(type==='language-note'){const languageId=parts[0],noteId=parts[1],language=get('rp-languages',languageDefaults).find(entry=>entry.id===languageId),item=language&&(language.entries||[]).find(entry=>entry.id===noteId);if(!item)return;return menuSheet(item.title,[{id:'edit',label:'Modifier',hint:'Ouvrir cette note',icon:'✎',action:()=>languageNoteForm(languageId,item)},{id:'delete',label:'Supprimer',hint:'Retirer cette note',icon:'×',danger:true,action:()=>deleteEntry('cette note',()=>{set('rp-languages',get('rp-languages',languageDefaults).map(entry=>entry.id===languageId?{...entry,entries:(entry.entries||[]).filter(note=>note.id!==noteId)}:entry));languageDetail(languageId);})}]);}
}
function bindHold(){document.querySelectorAll('[data-hold]').forEach(element=>{let timer;let held=false;const stop=()=>{clearTimeout(timer);};element.addEventListener('pointerdown',()=>{held=false;timer=setTimeout(()=>{held=true;entryMenu(element.dataset.hold);},650);});element.addEventListener('pointerup',stop);element.addEventListener('pointerleave',stop);element.addEventListener('pointercancel',stop);element.addEventListener('click',event=>{if(held){event.preventDefault();event.stopImmediatePropagation();held=false;}},true);element.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();entryMenu(element.dataset.hold);}});});}
function addMenu(){
  const modal=document.createElement('div');modal.className='modal menu-modal';modal.innerHTML=`<section class="sheet quick-sheet"><div class="sheet-top"><h2>Ajouter</h2><button type="button" class="close" data-close>×</button></div><button class="add-choice" data-choice="event"><span class="plan-badge">□</span><span><strong>Créneau de planning</strong><small>Travail, congé ou rendez-vous</small></span></button><button class="add-choice" data-choice="est"><span class="est-badge">⌂</span><span><strong>Établissement</strong><small>Avec son annuaire téléphonique</small></span></button><button class="add-choice" data-choice="med"><span class="med-badge">●</span><span><strong>Fiche médicament</strong><small>Indication, vigilance et posologie</small></span></button></section>`;document.body.append(modal);modal.querySelector('[data-close]').onclick=()=>modal.remove();modal.querySelectorAll('[data-choice]').forEach(button=>button.onclick=()=>{const choice=button.dataset.choice;modal.remove();if(choice==='event')eventForm();if(choice==='est')establishmentForm();if(choice==='med')medForm();});
}
function bind(){
  document.querySelectorAll('[data-go]').forEach(button=>button.onclick=()=>{const target=button.dataset.go;if(target==='home')home();else if(target==='meds')meds();else if(target==='establishments')establishments();else if(target==='planning')planning();else if(target==='search')searchPage();else if(['languages','protocols','notes'].includes(target))resourcePage(target);});
  document.querySelectorAll('[data-med]').forEach(button=>button.onclick=()=>medDetail(button.dataset.med));
  document.querySelectorAll('[data-est]').forEach(button=>button.onclick=()=>establishmentDetail(button.dataset.est));
  document.querySelectorAll('[data-add-med]').forEach(button=>button.onclick=()=>medForm());
  document.querySelectorAll('[data-edit-med]').forEach(button=>button.onclick=()=>medForm(getMeds().find(item=>item.id===button.dataset.editMed)));
  document.querySelectorAll('[data-add-est]').forEach(button=>button.onclick=()=>establishmentForm());
  document.querySelectorAll('[data-edit-est]').forEach(button=>button.onclick=()=>establishmentForm(getEstablishments().find(item=>item.id===button.dataset.editEst)));
  document.querySelectorAll('[data-add-contact]').forEach(button=>button.onclick=()=>contactForm(button.dataset.addContact));
  document.querySelectorAll('[data-edit-contact]').forEach(button=>button.onclick=()=>{const [placeId,contactId]=button.dataset.editContact.split('|');const place=getEstablishments().find(item=>item.id===placeId);contactForm(placeId,(place.contacts||[]).find(item=>item.id===contactId));});
  document.querySelectorAll('[data-add-event]').forEach(button=>button.onclick=()=>eventForm());
  document.querySelectorAll('[data-language]').forEach(button=>button.onclick=()=>languageDetail(button.dataset.language));
  document.querySelectorAll('[data-add-resource]').forEach(button=>button.onclick=()=>resourceForm(button.dataset.addResource));
  document.querySelectorAll('[data-add-language-note]').forEach(button=>button.onclick=()=>languageNoteForm(button.dataset.addLanguageNote));
  document.querySelectorAll('[data-day]').forEach(button=>button.onclick=()=>eventForm(null,button.dataset.day));
  document.querySelectorAll('[data-month]').forEach(button=>button.onclick=()=>planning(button.dataset.month));
  document.querySelectorAll('[data-add-menu]').forEach(button=>button.onclick=addMenu);
  bindHold();
}
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
home();
