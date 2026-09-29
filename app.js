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
// Rubriques d’accueil personnelles : elles restent vierges pour que chaque repère suive les protocoles locaux.
const surgeryDefaults = [];
// Les anciens repères de chirurgie restent dans rp-surgery. Les nouvelles fiches sont rangées à part, par spécialité.
const surgerySpecialtyDefaults = [];
const pediatricsDefaults = [];
// Nouvelle rubrique isolée : aucune donnée existante n’est modifiée.
const emergencyDefaults = [];
const get = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; } catch { return fallback; } };
const set = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const getMeds = () => get('rp-meds', medDefaults);
const setMeds = value => set('rp-meds', value);
const getEstablishments = () => get('rp-establishments', establishmentDefaults);
const setEstablishments = value => set('rp-establishments', value);
const getPlanning = () => get('rp-planning', planningDefaults);
const setPlanning = value => set('rp-planning', value);
const getSurgerySpecialties = () => get('rp-surgery-specialties', surgerySpecialtyDefaults);
const setSurgerySpecialties = value => set('rp-surgery-specialties', value);
const backupCollections = {
  'rp-meds': medDefaults,
  'rp-establishments': establishmentDefaults,
  'rp-planning': planningDefaults,
  'rp-languages': languageDefaults,
  'rp-protocols': protocolDefaults,
  'rp-notes': noteDefaults,
  'rp-surgery': surgeryDefaults,
  'rp-surgery-specialties': surgerySpecialtyDefaults,
  'rp-pediatrics': pediatricsDefaults,
  'rp-emergencies': emergencyDefaults
};
const backupCollectionKeys = Object.keys(backupCollections);
// Les sauvegardes antérieures aux nouvelles rubriques restent restaurables :
// les collections absentes sont créées vides, sans toucher aux données existantes.
const requiredBackupKeys = backupCollectionKeys.filter(key=>!['rp-surgery','rp-surgery-specialties','rp-pediatrics','rp-emergencies'].includes(key));
function backupData(){
  const data=Object.fromEntries(backupCollectionKeys.map(key=>[key,get(key,backupCollections[key])]));
  for(let index=0;index<localStorage.length;index++){const key=localStorage.key(index);if(!key||!key.startsWith('rp-')||key in data)continue;try{data[key]=JSON.parse(localStorage.getItem(key));}catch{}}
  return data;
}
function makeBackup(){
  return {app:'Réperto’Poche',format:'backup',version:2,exportedAt:new Date().toISOString(),data:backupData()};
}
function validBackup(backup){
  return !!(backup&&backup.app==='Réperto’Poche'&&backup.format==='backup'&&backup.data&&typeof backup.data==='object'&&!Array.isArray(backup.data)&&requiredBackupKeys.every(key=>Array.isArray(backup.data[key]))&&backupCollectionKeys.every(key=>!(key in backup.data)||Array.isArray(backup.data[key])));
}
function downloadBackup(){
  const backup=makeBackup(),stamp=new Date().toISOString().slice(0,10),blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=`Reperto-Poche-sauvegarde-${stamp}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Sauvegarde téléchargée : garde-la dans Fichiers ou iCloud Drive');
}
function restoreBackup(backup){
  const keys=Object.keys(backup.data).filter(key=>key.startsWith('rp-')),before=Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)]));
  try{keys.forEach(key=>localStorage.setItem(key,JSON.stringify(backup.data[key])));}
  catch(error){keys.forEach(key=>before[key]===null?localStorage.removeItem(key):localStorage.setItem(key,before[key]));throw new Error('Espace insuffisant : la restauration n’a pas été appliquée.');}
}
function chooseBackup(){
  const input=document.createElement('input');input.type='file';input.accept='application/json,.json';
  input.onchange=()=>{const file=input.files&&input.files[0];if(!file)return;if(file.size>25*1024*1024)return toast('Cette sauvegarde dépasse 25 Mo.');const reader=new FileReader();reader.onload=()=>{try{const backup=JSON.parse(reader.result);if(!validBackup(backup))throw new Error();const date=backup.exportedAt?new Date(backup.exportedAt).toLocaleDateString('fr-FR'):'date inconnue';menuSheet('Restaurer cette sauvegarde ?',[{id:'restore',label:'Restaurer mes données',hint:`Sauvegarde du ${date} · remplace les données présentes dans le fichier`,icon:'↻',danger:true,action:()=>{try{restoreBackup(backup);profile();toast('Sauvegarde restaurée sur cet iPhone');}catch(error){toast(error.message);}}},{id:'cancel',label:'Annuler',hint:'Conserver les données actuelles',icon:'‹',action:()=>{}}]);}catch{toast('Ce fichier n’est pas une sauvegarde Réperto’Poche valide.');}};reader.onerror=()=>toast('Lecture du fichier impossible.');reader.readAsText(file);};input.click();
}
const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const escape = text => String(text || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const logo = () => '<div class="brand"><i class="logo" aria-hidden="true"></i><span>Réperto’Poche</span></div>';
const nav = (active='home') => `<nav class="nav" aria-label="Navigation principale">
  <button class="${active==='home'?'active':''}" data-go="home"><span>⌂</span>Accueil</button>
  <button class="${active==='search'?'active':''}" data-go="search"><span>⌕</span>Recherche</button>
  <button class="nav-add" data-add-menu aria-label="Ajouter">+</button>
  <button class="${active==='planning'?'active':''}" data-go="planning"><span>▣</span>Planning</button>
</nav>`;
const topbar = () => `<header class="top">${logo()}<button class="avatar" data-go="profile" aria-label="Profil">AK</button></header>`;
const category = (cls, icon, title, meta, target) => `<button class="folder ${cls}" data-go="${target}"><span class="icon">${icon}</span><h2>${title}</h2><p>${meta}</p></button>`;
const searchText = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr');
const sortByName = (a,b) => searchText(a.name || a.title).localeCompare(searchText(b.name || b.title),'fr',{numeric:true});
const sortedContacts = establishment => [...(establishment.contacts || [])].sort((a,b) => a.department.localeCompare(b.department,'fr'));
const resourceTags=['Accueil','Protocoles','Plans / accès','Administratif','Urgence','À vérifier'];
const contactRoles=['Anesthésiste','Chirurgien','Encadrement'];
const contactGrades=['Praticien hospitalier','Interne','Intérimaire'];
// Compatibilité : les anciens fichiers uniques deviennent une ressource, sans perdre de donnée.
const placeResources = place => Array.isArray(place.resources) ? place.resources : (place.attachment ? [{id:'legacy-resource',title:place.attachment.name,attachment:place.attachment,tags:[]}] : []);
const resourceMatchesTag = (resource,tag) => !tag || (resource.tags||[]).includes(tag);
const resourceTypeLabel = attachment => isPhotoAttachment(attachment) ? 'Photo' : 'Fichier';
const isPhotoAttachment = attachment => /^image\//i.test((attachment||{}).type||'') || /\.(jpe?g|png|gif|webp|heic|heif)$/i.test((attachment||{}).name||'');
const contactRoleLabel = contact => [contact.role,contact.grade].filter(Boolean).join(' · ');

function home(){
  const est = getEstablishments(); const events = getPlanning();
  app.innerHTML = `${topbar()}<p class="eyebrow">Bonjour Agnès</p><h1 class="headline">Tout retrouver,<br>même dans l’urgence.</h1><p class="sub">Ton carnet professionnel, toujours dans la poche.</p>
  <label class="search"><span>⌕</span><input id="global-search" placeholder="Rechercher dans Réperto’Poche" autocomplete="off" /></label>
  <section id="home-folders" class="grid">${category('emergencies','!','Urgences',`${get('rp-emergencies', emergencyDefaults).length} repère${get('rp-emergencies', emergencyDefaults).length>1?'s':''}`,'emergencies')}${category('est','⌂','Établissements',`${est.length} lieux`,'establishments')}${category('med','●','Médicaments',`${getMeds().length} fiches`,'meds')}${category('surgery','✚','Chirurgie',`${getSurgerySpecialties().length} spécialité${getSurgerySpecialties().length>1?'s':''}`,'surgery')}${category('pediatrics','♧','Pédiatrie',`${get('rp-pediatrics', pediatricsDefaults).length} repère${get('rp-pediatrics', pediatricsDefaults).length>1?'s':''}`,'pediatrics')}${category('lang','文','Langues',`${get('rp-languages', languageDefaults).length} dossiers`,'languages')}${category('docs','▤','Protocoles',`${get('rp-protocols', protocolDefaults).length} document${get('rp-protocols', protocolDefaults).length>1?'s':''}`,'protocols')}${category('notes','✎','Notes rapides',`${get('rp-notes', noteDefaults).length} note${get('rp-notes', noteDefaults).length>1?'s':''}`,'notes')}${category('plan','□','Planning',events.length ? `${events.length} créneau${events.length>1?'x':''}` : 'À organiser','planning')}</section><section id="home-search-results" class="search-results" hidden></section>${nav('home')}`;
  $('#global-search').addEventListener('input', e => globalSearch(e.target.value)); bind();
}

function profile(){
  app.innerHTML=`${topbar()}${sectionTitle('Mes données','Sauvegarde privée sur cet iPhone','home')}<section class="detail-card backup-card"><span class="backup-icon">◈</span><div><h2>Garde une copie de tes repères</h2><p>Tes fiches, établissements, langues, notes et planning restent sur cet iPhone. Une sauvegarde te permet de les retrouver après un changement d’iPhone ou un effacement de Safari.</p></div></section><section class="backup-actions"><button class="backup-action" data-backup-export><span class="backup-action-icon">↓</span><span><strong>Sauvegarder mes données</strong><small>Fichier privé à placer dans Fichiers ou iCloud Drive</small></span></button><button class="backup-action restore" data-backup-import><span class="backup-action-icon">↑</span><span><strong>Restaurer une sauvegarde</strong><small>Remettre une copie Réperto’Poche sur cet iPhone</small></span></button></section><p class="helper backup-note">Conseil : fais une sauvegarde avant une grande mise à jour et conserve-la dans iCloud Drive.</p>${nav()}`;
  bind();
}

function medMatches(med,query){ return searchText(`${med.name} ${med.class} ${med.indication} ${med.mechanism} ${med.contra} ${med.dose}`).includes(searchText(query)); }
function medListMarkup(query=''){
  const list=[...getMeds()].filter(med=>medMatches(med,query)).sort(sortByName);
  return list.length ? list.map(m => `<button class="item" data-med="${m.id}" data-hold="med|${m.id}" aria-label="${escape(m.name)}. Maintenir pour modifier ou supprimer."><span class="item-icon med-icon">●</span><span class="item-main"><h2>${escape(m.name)}</h2><p>${escape(m.class)}</p></span>${m.attachment?'<span class="paperclip">⌇ 1 fichier</span>':''}<span class="chev">›</span></button>`).join('') : empty('Aucun médicament trouvé.');
}
function refreshMedList(query=''){
  const list=$('#med-list');if(!list)return;
  list.innerHTML=medListMarkup(query);bind();
}
function meds(){
  app.innerHTML = `${topbar()}${sectionTitle('Médicaments',`${getMeds().length} fiches`,'home')}<label class="search"><span>⌕</span><input id="med-search" placeholder="Rechercher un médicament" autocomplete="off" /></label><button class="filter">Toutes les classes</button><section id="med-list" class="list">${medListMarkup()}</section><button class="fab" data-add-med aria-label="Ajouter une fiche médicament">+</button>${nav()}`;
  $('#med-search').addEventListener('input', event=>refreshMedList(event.target.value)); bind();
}
function medDetail(id){
  const med = getMeds().find(item => item.id === id); if(!med) return meds();
  app.innerHTML = `${topbar()}${sectionTitle(escape(med.name),'Fiche médicament','meds')}<span class="tag med-tag">${escape(med.class)}</span>${med.attachment?'<span class="tag soft-tag">⌇ 1 fichier joint</span>':''}<p class="helper">Maintiens une fiche pour la modifier ou la supprimer.</p><section class="holdable" tabindex="0" role="button" data-hold="med|${med.id}">${infoCard('Indication',med.indication)}${infoCard('Mécanisme d’action',med.mechanism)}${infoCard('Contre-indications & vigilance',med.contra)}${infoCard('Posologie',med.dose)}</section>${attachmentLink(med.attachment)}${nav()}`; bind();
}

function establishments(query=''){
  const list = getEstablishments().filter(place => `${place.name} ${place.city} ${place.service}`.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')));
  app.innerHTML = `${topbar()}${sectionTitle('Établissements',`${getEstablishments().length} lieux`,'home')}<label class="search"><span>⌕</span><input id="est-search" value="${escape(query)}" placeholder="Rechercher un établissement" autocomplete="off" /></label><p class="helper">Touche un établissement pour l’ouvrir. Maintiens sa fiche pour la modifier ou la supprimer.</p><section class="list">${list.length ? list.map(place => `<button class="item establishment-item holdable" data-est="${place.id}" data-hold="est|${place.id}" aria-label="${escape(place.name)}. Maintenir pour modifier ou supprimer."><span class="item-icon est-icon">⌂</span><span class="item-main"><h2>${escape(place.name)}</h2><p>${escape(place.city || 'Ville à renseigner')} · ${sortedContacts(place).length} contact${sortedContacts(place).length>1?'s':''}</p></span><span class="chev">›</span></button>`).join('') : empty('Aucun établissement trouvé.')}</section><button class="fab" data-add-est aria-label="Ajouter un établissement">+</button>${nav()}`;
  $('#est-search').addEventListener('input', e => establishments(e.target.value)); bind();
}
function resourceCard(placeId, resource){
  const attachment=resource.attachment;
  if(!attachment||!attachment.data)return '';
  const tags=(resource.tags||[]).map(tag=>`<span class="resource-tag">${escape(tag)}</span>`).join('');
  return `<a class="place-resource-card holdable" href="${attachment.data}" target="_blank" rel="noopener" data-attachment-open data-hold="place-resource|${placeId}|${resource.id}" aria-label="Ouvrir ${escape(resource.title || attachment.name)}. Maintenir pour modifier ou supprimer."><span class="resource-preview ${isPhotoAttachment(attachment)?'photo-preview':''}">${isPhotoAttachment(attachment)?'▧':'⌇'}</span><span class="resource-main"><strong>${escape(resource.title || attachment.name)}</strong><small>${resourceTypeLabel(attachment)}${tags?` · ${tags.replace(/<[^>]+>/g,' ')}`:''}</small>${tags?`<span class="resource-tags">${tags}</span>`:''}</span><span class="chev">›</span></a>`;
}
function establishmentDetail(id, activeTag=''){
  const place = getEstablishments().find(item => item.id === id); if(!place) return establishments();
  const contacts = sortedContacts(place), resources=placeResources(place), visibleResources=resources.filter(resource=>resourceMatchesTag(resource,activeTag));
  const chips=['Tous',...resourceTags].map(tag=>`<button class="tag-filter ${(!activeTag&&tag==='Tous')||activeTag===tag?'selected':''}" data-place-tag="${escape(tag==='Tous'?'':tag)}">${escape(tag)}</button>`).join('');
  app.innerHTML = `${topbar()}${sectionTitle(escape(place.name),escape(place.city || 'Établissement'),'establishments')}<div class="place-summary holdable" tabindex="0" role="button" data-hold="est|${place.id}"><span class="item-icon est-icon">⌂</span><div><strong>${escape(place.service || 'Service à renseigner')}</strong><p class="multiline">${escape(place.note || 'Ajoute ici tes repères pratiques.')}</p></div></div><p class="helper">Maintiens un établissement, une ressource ou un contact pour le modifier ou le supprimer.</p><div class="subsection-head"><div><h2>Ressources</h2><p>${resources.length} fichier${resources.length>1?'s':''} ou photo${resources.length>1?'s':''}</p></div><button class="small-add" data-add-place-resource="${place.id}" aria-label="Ajouter un fichier ou une photo">+</button></div><div class="tag-filters" data-current-place="${place.id}" aria-label="Filtrer les ressources">${chips}</div><section class="list place-resources">${visibleResources.length?visibleResources.map(resource=>resourceCard(place.id,resource)).join(''):empty(activeTag?`Aucune ressource avec le tag « ${activeTag} ».`:'Ajoute un PDF, un document ou une photo.')}</section><div class="subsection-head"><div><h2>Annuaire téléphonique</h2><p>${contacts.length} contact${contacts.length>1?'s':''} · ordre alphabétique</p></div><button class="small-add" data-add-contact="${place.id}" aria-label="Ajouter un contact">+</button></div><section class="list contacts">${contacts.length ? contacts.map(c => `<article class="contact-card holdable" tabindex="0" role="button" data-hold="contact|${place.id}|${c.id}"><span class="contact-letter">${escape(c.department.slice(0,1).toUpperCase())}</span><div class="item-main"><h2>${escape(c.department)}</h2><p>${escape(c.phone || 'À renseigner')}</p>${contactRoleLabel(c)?`<span class="contact-role">${escape(contactRoleLabel(c))}</span>`:''}${c.note ? `<p class="contact-note">${escape(c.note)}</p>` : ''}</div></article>`).join('') : empty('Aucun contact pour le moment.')}</section>${nav()}`; bind();
}

function eventStart(event){ return event.startDate || event.date || ''; }
function eventEnd(event){ return event.endDate || eventStart(event); }
function eventOccursOn(event, date){ return eventStart(event) <= date && eventEnd(event) >= date; }
function eventDays(event){ const a=new Date(`${eventStart(event)}T12:00:00`), b=new Date(`${eventEnd(event)}T12:00:00`); return Math.max(1,Math.round((b-a)/86400000)+1); }
function eventDurationMinutes(event){ if(!event.start||!event.end)return 0; const [sh,sm]=event.start.split(':').map(Number),[eh,em]=event.end.split(':').map(Number);let n=(eh*60+em)-(sh*60+sm);if(n<0)n+=1440;return n; }
function durationLabel(minutes){if(!minutes)return '';const h=Math.floor(minutes/60),m=minutes%60;return `${h?h+' h':''}${m?(h?' ':'')+m+' min':''}`;}
function displayDate(date){const d=new Date(`${date}T12:00:00`);return `${d.getDate()} ${monthLabels[d.getMonth()]}`;}
function dateRangeLabel(event){return eventStart(event)===eventEnd(event)?displayDate(eventStart(event)):`Du ${displayDate(eventStart(event))} au ${displayDate(eventEnd(event))}`;}
function planning(cursor = new Date().getFullYear()+'-'+String(new Date().getMonth()+1).padStart(2,'0'), selectedDate=''){
 const [year,month]=cursor.split('-').map(Number),events=getPlanning(),today=new Date().toISOString().slice(0,10),days=new Date(year,month,0).getDate();
 const activeDate=selectedDate&&selectedDate.startsWith(cursor)?selectedDate:`${cursor}-${String(today.startsWith(cursor)?Math.min(Number(today.slice(-2)),days):1).padStart(2,'0')}`;
 const startDay=(new Date(year,month-1,1).getDay()+6)%7,previous=new Date(year,month-2,1),next=new Date(year,month,1);
 const cells=Array.from({length:startDay},()=>'<span class="day empty-day"></span>');
 for(let day=1;day<=days;day++){const date=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,dayEvents=events.filter(e=>eventOccursOn(e,date)),classes=['day'];if(dayEvents.length)classes.push('has-event');if(date===today)classes.push('today');if(date===activeDate)classes.push('selected');cells.push(`<button class="${classes.join(' ')}" data-day="${date}" aria-label="${day} ${monthLabels[month-1]}"><b>${day}</b><span class="day-dots">${dayEvents.slice(0,3).map(e=>`<i class="dot ${e.type}"></i>`).join('')}</span></button>`);}
 const monthEvents=events.filter(e=>eventStart(e).slice(0,7)<=cursor&&eventEnd(e).slice(0,7)>=cursor).sort((a,b)=>eventStart(a).localeCompare(eventStart(b))||(a.start||'').localeCompare(b.start||''));
 const dayEvents=events.filter(e=>eventOccursOn(e,activeDate)).sort((a,b)=>(a.start||'99:99').localeCompare(b.start||'99:99'));
 const plannedMinutes=monthEvents.reduce((sum,e)=>sum+eventDurationMinutes(e)*Math.min(eventDays(e),31),0);
 app.innerHTML=`${topbar()}${sectionTitle('Planning',`${monthLabels[month-1]} ${year}`,'home')}<p class="helper">Touche une date pour voir la journée. Maintiens un créneau pour le modifier ou le supprimer.</p><section class="planning-card"><div class="calendar-head"><button class="month-nav" data-month="${previous.getFullYear()}-${String(previous.getMonth()+1).padStart(2,'0')}" aria-label="Mois précédent">‹</button><h2>${monthLabels[month-1]} ${year}</h2><button class="month-nav" data-month="${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}" aria-label="Mois suivant">›</button></div><div class="weekdays">${weekdayLabels.map(d=>`<span>${d}</span>`).join('')}</div><div class="calendar-grid">${cells.join('')}</div><button class="today-button" data-today>Aujourd’hui</button></section><div class="legend"><span><i class="dot work"></i> Travail</span><span><i class="dot leave"></i> Indisponible</span><span><i class="dot personal"></i> Personnel</span></div><section class="day-agenda"><div class="subsection-head"><div><h2>${activeDate===today?'Aujourd’hui':displayDate(activeDate)}</h2><p>${dayEvents.length?`${dayEvents.length} créneau${dayEvents.length>1?'x':''} prévu${dayEvents.length>1?'s':''}`:'Rien de prévu pour le moment'}</p></div><button class="small-add" data-add-event-date="${activeDate}" aria-label="Ajouter ce jour">+</button></div><section class="list event-list">${dayEvents.length?dayEvents.map(e=>eventRow(e,activeDate)).join(''):empty('Ajoute une garde, un congé ou un rendez-vous.')}</section></section><section class="planning-summary"><span class="summary-icon">◷</span><div><strong>${monthEvents.length} créneau${monthEvents.length>1?'x':''} ce mois-ci</strong><p>${plannedMinutes?`${durationLabel(plannedMinutes)} planifiées (estimation)`:'Ajoute les horaires pour voir le temps planifié.'}</p></div></section><div class="subsection-head"><div><h2>À venir</h2><p>Gardes, congés et rendez-vous du mois</p></div></div><section class="list event-list">${monthEvents.length?monthEvents.map(e=>eventRow(e)).join(''):empty('Aucun créneau ce mois-ci.')}</section><button class="fab" data-add-event aria-label="Ajouter au planning">+</button>${nav('planning')}`;bind();
}
function eventRow(event,activeDate=''){const d=new Date(`${(activeDate||eventStart(event))}T12:00:00`),duration=durationLabel(eventDurationMinutes(event)),range=eventStart(event)!==eventEnd(event)?`<small class="event-range">${dateRangeLabel(event)}</small>`:'';return `<button class="item event-item" data-hold="event|${event.id}" aria-label="${escape(event.title)}. Maintenir pour modifier ou supprimer."><span class="event-date"><b>${String(d.getDate()).padStart(2,'0')}</b><small>${['JAN','FÉV','MAR','AVR','MAI','JUN','JUL','AOÛ','SEP','OCT','NOV','DÉC'][d.getMonth()]}</small></span><span class="item-main"><h2>${escape(event.title)}</h2><p>${event.start||'Heure à préciser'}${event.end?` – ${event.end}`:''}${duration?` · ${duration}`:''}${event.place?` · ${escape(event.place)}`:''}</p>${range}</span><i class="event-type ${event.type}"></i><span class="chev">›</span></button>${attachmentLink(event.attachment)}`;}

function generalitiesOf(specialty){
  if(Array.isArray(specialty.generalities))return specialty.generalities;
  return specialty.note?[{id:'legacy-generalities',title:'Généralités',text:specialty.note}]:[];
}
function surgery(){
  const specialties=[...getSurgerySpecialties()].sort(sortByName), legacy=get('rp-surgery', surgeryDefaults);
  const cards=specialties.length?specialties.map(item=>{const count=(item.interventions||[]).length;return `<button class="item" data-surgery-specialty="${item.id}" data-hold="surgery-specialty|${item.id}" aria-label="${escape(item.name)}. Toucher pour ouvrir, maintenir pour modifier ou supprimer."><span class="item-icon surgery-icon">✚</span><span class="item-main"><h2>${escape(item.name)}</h2><p>${count} intervention${count>1?'s':''}</p></span><span class="chev">›</span></button>`;}).join(''):empty('Ajoute une spécialité pour classer tes interventions.');
  const legacyCard=legacy.length?`<button class="legacy-surgery" data-surgery-legacy><span>↗</span><span><strong>Repères de chirurgie précédents</strong><small>${legacy.length} repère${legacy.length>1?'s':''} conservé${legacy.length>1?'s':''}</small></span><span class="chev">›</span></button>`:'';
  app.innerHTML=`${topbar()}${sectionTitle('Chirurgies',`${specialties.length} spécialité${specialties.length>1?'s':''}`,'home')}<p class="helper">Touche une spécialité pour consulter ses fiches. Maintiens une spécialité ou une intervention pour la modifier ou la supprimer.</p><section class="list surgery-list">${cards}</section>${legacyCard}<button class="fab" data-add-surgery-specialty aria-label="Ajouter une spécialité">+</button>${nav()}`;
  bind();
}
function surgerySpecialty(id){
  const specialty=getSurgerySpecialties().find(item=>item.id===id);if(!specialty)return surgery();
  const generalities=generalitiesOf(specialty), interventions=[...(specialty.interventions||[])].sort((a,b)=>sortByName({name:a.name},{name:b.name}));
  const generalCards=generalities.length?generalities.map(item=>`<article class="detail-card holdable surgery-general" tabindex="0" role="button" data-hold="surgery-general|${specialty.id}|${item.id}"><h2>${escape(item.title)}</h2><p class="multiline">${escape(item.text||'À compléter.')}</p></article>`).join(''):empty('Ajoute tes propres notes de généralités si tu en as besoin.');
  const cards=interventions.length?interventions.map(item=>`<button class="item surgery-intervention-item" data-surgery-intervention="${specialty.id}|${item.id}" data-hold="surgery-intervention|${specialty.id}|${item.id}" aria-label="${escape(item.name)}. Toucher pour consulter, maintenir pour modifier ou supprimer."><span class="item-main"><h2>${escape(item.name)}</h2></span><span class="chev">›</span></button>`).join(''):empty('Ajoute une intervention dans cette spécialité.');
  app.innerHTML=`${topbar()}${sectionTitle(escape(specialty.name),'Chirurgies','surgery')}<p class="helper">Repères personnels — à vérifier selon le protocole local, la prescription, le patient et l’établissement.</p><div class="subsection-head"><div><h2>Généralités</h2><p>${generalities.length} note${generalities.length>1?'s':''}</p></div><button class="small-add" data-add-surgery-general="${specialty.id}" aria-label="Ajouter une note de généralités">+</button></div><section class="list surgery-general-list">${generalCards}</section><div class="subsection-head surgery-interventions-head"><div><h2>Interventions</h2><p>${interventions.length} fiche${interventions.length>1?'s':''}</p></div></div><section class="list surgery-list">${cards}</section><button class="fab" data-add-surgery-intervention="${specialty.id}" aria-label="Ajouter une intervention">+</button>${nav()}`;
  bind();
}
function surgeryInterventionDetail(specialtyId, interventionId){
  const specialty=getSurgerySpecialties().find(item=>item.id===specialtyId), intervention=specialty&&(specialty.interventions||[]).find(item=>item.id===interventionId);if(!intervention)return surgerySpecialty(specialtyId);
  const antibiotic=intervention.antibioprophylaxis==='yes'?`Oui${intervention.antibiotic?` · ${escape(intervention.antibiotic)}`:''}`:'Non';
  app.innerHTML=`${topbar()}${sectionTitle(escape(intervention.name),escape(specialty.name),'surgery-specialty')}<p class="helper">Repère personnel — à vérifier selon le protocole local, la prescription et le patient.</p><section class="holdable" tabindex="0" role="button" data-hold="surgery-intervention|${specialty.id}|${intervention.id}">${infoCard('Durée habituelle',intervention.duration)}${infoCard('Position sur table',intervention.position)}${infoCard('Équipements',intervention.equipment)}${infoCard('Drogues / produits',intervention.products)}${infoCard('Antibioprophylaxie',antibiotic)}${infoCard('Remarques et repères importants',intervention.notes)}</section>${nav()}`;
  bind();
}
function surgerySpecialtyForm(existing){
  const specialty=existing||{name:'',generalities:[],interventions:[]};
  openSheet(`${existing?'Modifier':'Nouvelle'} spécialité`, `<div class="field"><label>Nom de la spécialité</label><input required name="name" value="${escape(specialty.name)}" placeholder="Ex. Orthopédie"></div>`, values=>{const list=getSurgerySpecialties();if(existing)setSurgerySpecialties(list.map(item=>item.id===existing.id?{...item,...values}:item));else setSurgerySpecialties([...list,{id:uid('surgery-specialty'),...values,generalities:[],interventions:[]}]);surgery();toast('Spécialité enregistrée sur cet iPhone');});
}
function surgeryGeneralForm(specialtyId, existing){
  const specialty=getSurgerySpecialties().find(item=>item.id===specialtyId);if(!specialty)return surgery();
  const note=existing||{title:'',text:''};
  openSheet(`${existing?'Modifier':'Nouvelle'} note — Généralités`, `<div class="field"><label>Titre</label><input required name="title" value="${escape(note.title)}" placeholder="Ex. Installation"></div><div class="field"><label>Texte libre</label><textarea name="text">${escape(note.text)}</textarea></div>`, values=>{setSurgerySpecialties(getSurgerySpecialties().map(item=>{if(item.id!==specialtyId)return item;const generalities=generalitiesOf(item);return {...item,note:'',generalities:existing?generalities.map(entry=>entry.id===existing.id?{...entry,...values}:entry):[...generalities,{id:uid('surgery-general'),...values}]};}));surgerySpecialty(specialtyId);toast('Note enregistrée dans Généralités');});
}
function surgeryInterventionForm(specialtyId, existing){
  const specialty=getSurgerySpecialties().find(item=>item.id===specialtyId);if(!specialty)return surgery();
  const intervention=existing||{name:'',duration:'',position:'',equipment:'',products:'',antibioprophylaxis:'no',antibiotic:'',notes:''};
  openSheet(`${existing?'Modifier':'Nouvelle'} intervention — ${escape(specialty.name)}`, `<div class="field"><label>Nom de l’intervention</label><input required name="name" value="${escape(intervention.name)}" placeholder="Ex. Prothèse totale de hanche"></div><div class="field"><label>Durée habituelle</label><input name="duration" value="${escape(intervention.duration)}" placeholder="Ex. 1 h 30"></div><div class="field"><label>Position sur table</label><textarea name="position" placeholder="Ex. Décubitus dorsal, bras…">${escape(intervention.position)}</textarea></div><div class="field"><label>Équipements</label><textarea name="equipment" placeholder="Installation, matériel, monitorage…">${escape(intervention.equipment)}</textarea></div><div class="field"><label>Drogues / produits</label><textarea name="products" placeholder="À vérifier selon protocole local et prescription.">${escape(intervention.products)}</textarea></div><div class="field"><label>Antibioprophylaxie</label><select name="antibioprophylaxis"><option value="no" ${intervention.antibioprophylaxis!=='yes'?'selected':''}>Non</option><option value="yes" ${intervention.antibioprophylaxis==='yes'?'selected':''}>Oui</option></select></div><div class="field"><label>Antibiotique si oui</label><input name="antibiotic" value="${escape(intervention.antibiotic)}" placeholder="À vérifier selon protocole local"></div><div class="field"><label>Remarques et repères importants</label><textarea name="notes" placeholder="Points de vigilance, transmissions, repères…">${escape(intervention.notes)}</textarea></div><p class="sheet-intro">Cette fiche personnelle ne remplace pas le protocole local, la prescription ni l’évaluation du patient.</p>`, values=>{if(values.antibioprophylaxis!=='yes')values.antibiotic='';const list=getSurgerySpecialties().map(item=>{if(item.id!==specialtyId)return item;const interventions=item.interventions||[];return {...item,interventions:existing?interventions.map(entry=>entry.id===existing.id?{...entry,...values}:entry):[...interventions,{id:uid('intervention'),...values}]};});setSurgerySpecialties(list);surgerySpecialty(specialtyId);toast('Intervention enregistrée sur cet iPhone');});
}
function surgeryLegacy(){resourcePage('surgery');}
function surgerySearchSection(query){
  const contains=value=>searchText(value).includes(searchText(query));
  const found=getSurgerySpecialties().flatMap(specialty=>(specialty.interventions||[]).filter(item=>contains(`${specialty.name} ${(generalitiesOf(specialty)||[]).map(note=>`${note.title} ${note.text}`).join(' ')} ${item.name} ${item.duration} ${item.position} ${item.equipment} ${item.products} ${item.antibiotic} ${item.notes}`)).map(item=>({specialty,item})));
  return found.length?`<h2>Chirurgies</h2><section class="list">${found.map(({specialty,item})=>`<button class="item" data-surgery-intervention="${specialty.id}|${item.id}"><span class="item-icon surgery-icon">✚</span><span class="item-main"><h2>${escape(item.name)}</h2><p>${escape(specialty.name)}${item.duration?` · ${escape(item.duration)}`:''}</p></span><span class="chev">›</span></button>`).join('')}</section>`:'';
}

const resourceConfig = {
  languages:{title:'Langues étrangères',singular:'dossier de langue',subtitle:'Phrases et repères par langue',key:'rp-languages',fallback:languageDefaults,empty:'Aucun dossier de langue pour le moment.'},
  protocols:{title:'Protocoles',singular:'protocole',subtitle:'Recommandations et documents utiles',key:'rp-protocols',fallback:protocolDefaults,empty:'Aucun protocole pour le moment.'},
  notes:{title:'Notes rapides',singular:'note',subtitle:'Tes repères à retrouver vite',key:'rp-notes',fallback:noteDefaults,empty:'Aucune note pour le moment.'},
  surgery:{title:'Chirurgie',singular:'repère de chirurgie',subtitle:'Tes fiches, documents et repères de bloc',key:'rp-surgery',fallback:surgeryDefaults,empty:'Aucun repère de chirurgie pour le moment.'},
  pediatrics:{title:'Pédiatrie',singular:'repère de pédiatrie',subtitle:'Tes fiches, documents et repères pédiatriques',key:'rp-pediatrics',fallback:pediatricsDefaults,empty:'Aucun repère de pédiatrie pour le moment.'},
  emergencies:{title:'Urgences',singular:'repère d’urgence',subtitle:'Les informations à retrouver immédiatement',key:'rp-emergencies',fallback:emergencyDefaults,empty:'Aucun repère d’urgence pour le moment.'}
};
function resourcePage(kind){
  const config = resourceConfig[kind];
  if(!config) return home();
  const items = get(config.key, config.fallback);
  const cards = items.length ? items.map(item => kind==='languages'
    ? `<article class="detail-card resource-folder">${attachmentLink(item.attachment)}<button class="holdable" data-language="${item.id}" data-hold="resource|${kind}|${item.id}" aria-label="${escape(item.title)}. Touchez pour ouvrir, maintenez pour modifier ou supprimer."><h2>${escape(item.title)}</h2><p class="multiline">${escape(item.text || 'À compléter.')}</p><span class="chev">›</span></button></article>`
    : `<article class="detail-card holdable" tabindex="0" role="button" data-hold="resource|${kind}|${item.id}"><h2>${escape(item.title)}</h2><p class="multiline">${escape(item.text || 'À compléter.')}</p>${item.attachment?`<p><strong>⌇ Fichier joint : ${escape(item.attachment.name)}</strong></p>`:''}${attachmentLink(item.attachment)}</article>`).join('') : empty(config.empty);
  app.innerHTML = `${topbar()}${sectionTitle(config.title,config.subtitle,'home')}<p class="helper">${kind==='languages'?'Touche un dossier pour l’ouvrir. Maintiens-le pour le modifier ou le supprimer.':'Maintiens une entrée pour la modifier ou la supprimer.'}</p><section class="list">${cards}</section><button class="fab" data-add-resource="${kind}" aria-label="Ajouter ${config.singular}">+</button>${nav()}`;
  bind();
}
function languageDetail(id){
  const language = get('rp-languages', languageDefaults).find(item=>item.id===id);
  if(!language) return resourcePage('languages');
  const entries = language.entries || [];
  app.innerHTML = `${topbar()}${sectionTitle(escape(language.title),'Phrases et notes','languages')}<p class="helper">Ajoute ici les phrases utiles pour ce dossier. Maintiens une note pour la modifier ou la supprimer.</p>${language.text ? `<article class="detail-card"><p class="multiline">${escape(language.text)}</p></article>` : ''}${attachmentLink(language.attachment)}<section class="list">${entries.length ? entries.map(item=>`<article class="detail-card holdable" tabindex="0" role="button" data-hold="language-note|${language.id}|${item.id}"><h2>${escape(item.title)}</h2><p class="multiline">${escape(item.text || 'À compléter.')}</p></article>${attachmentLink(item.attachment)}`).join('') : empty('Aucune note pour le moment.')}</section><button class="fab" data-add-language-note="${language.id}" aria-label="Ajouter une note dans ${escape(language.title)}">+</button>${nav()}`;
  bind();
}

function searchPage(initialQuery=''){
  app.innerHTML = `${topbar()}${sectionTitle('Recherche','Dans tous tes dossiers','home')}<label class="search"><span>⌕</span><input id="search-page-input" value="${escape(initialQuery)}" placeholder="Rechercher dans Réperto’Poche" autocomplete="off" autofocus /></label><p class="helper">Médicaments, établissements, planning, urgences, langues, protocoles, notes, chirurgie et pédiatrie.</p><section id="search-results" class="search-results"></section>${nav('search')}`;
  const input=$('#search-page-input');
  input.addEventListener('input', event=>renderSearchResults(event.target.value));
  if(initialQuery.trim()) renderSearchResults(initialQuery);
  if(initialQuery){input.focus();input.setSelectionRange(initialQuery.length,initialQuery.length);}
  bind();
}
function resourceSearchSection(title,items){
  return items.length?`<h2>${title}</h2><section class="list">${items.map(item=>`<article class="detail-card"><h2>${escape(item.title)}</h2><p class="multiline">${escape(item.text || 'À compléter.')}</p></article>`).join('')}</section>`:'';
}
function renderSearchResults(query){
  const target=$('#search-results');if(!target)return;
  const term=query.trim().toLocaleLowerCase('fr');
  if(!term){target.innerHTML=empty('Saisis un mot pour rechercher dans tes repères.');return;}
  const contains=value=>String(value||'').toLocaleLowerCase('fr').includes(term);
  const meds=[...getMeds()].filter(m=>contains(`${m.name} ${m.class} ${m.indication} ${m.mechanism} ${m.contra} ${m.dose}`)).sort(sortByName);
  const establishmentsFound=getEstablishments().filter(p=>contains(`${p.name} ${p.city} ${p.service} ${p.note} ${(p.contacts||[]).map(c=>`${c.department} ${c.phone} ${c.role} ${c.grade} ${c.note}`).join(' ')} ${(placeResources(p)||[]).map(r=>`${r.title} ${(r.tags||[]).join(' ')}`).join(' ')}`));
  const events=getPlanning().filter(e=>contains(`${e.title} ${e.place} ${e.note}`));
  const resources=[['Langues étrangères',get('rp-languages',languageDefaults)],['Protocoles',get('rp-protocols',protocolDefaults)],['Notes rapides',get('rp-notes',noteDefaults)],['Chirurgie',get('rp-surgery',surgeryDefaults)],['Pédiatrie',get('rp-pediatrics',pediatricsDefaults)],['Urgences',get('rp-emergencies',emergencyDefaults)]].map(([title,items])=>[title,items.filter(item=>contains(`${item.title} ${item.text} ${(item.entries||[]).map(entry=>`${entry.title} ${entry.text}`).join(' ')}`))]);
  const resourceMarkup=resources.map(([title,items])=>resourceSearchSection(title,items)).join('');
  const surgeriesMarkup=surgerySearchSection(query);
  target.innerHTML=`<p class="helper">Résultats pour « ${escape(query)} »</p>${meds.length?`<h2>Médicaments</h2><section class="list">${meds.map(m=>`<button class="item" data-med="${m.id}"><span class="item-icon med-icon">●</span><span class="item-main"><h2>${escape(m.name)}</h2><p>${escape(m.class)}</p></span><span class="chev">›</span></button>`).join('')}</section>`:''}${establishmentsFound.length?`<h2>Établissements</h2><section class="list">${establishmentsFound.map(p=>`<button class="item" data-est="${p.id}"><span class="item-icon est-icon">⌂</span><span class="item-main"><h2>${escape(p.name)}</h2><p>${escape(p.city)}</p></span><span class="chev">›</span></button>`).join('')}</section>`:''}${events.length?`<h2>Planning</h2><section class="list">${events.map(eventRow).join('')}</section>`:''}${(resourceMarkup||surgeriesMarkup)?`${resourceMarkup}${surgeriesMarkup}`:(!meds.length&&!establishmentsFound.length&&!events.length?empty('Aucun résultat pour le moment.'): '')}`;
  bind();
}
function globalSearch(query){
  const folders=$('#home-folders'),results=$('#home-search-results');
  if(!folders||!results)return searchPage(query);
  const term=query.trim();
  folders.hidden=!!term;results.hidden=!term;
  if(!term){results.innerHTML='';return;}
  const contains=value=>searchText(value).includes(searchText(term));
  const meds=[...getMeds()].filter(m=>contains(`${m.name} ${m.class} ${m.indication} ${m.mechanism} ${m.contra} ${m.dose}`)).sort(sortByName);
  const establishmentsFound=getEstablishments().filter(p=>contains(`${p.name} ${p.city} ${p.service} ${p.note} ${(p.contacts||[]).map(c=>`${c.department} ${c.phone} ${c.role} ${c.grade} ${c.note}`).join(' ')} ${(placeResources(p)||[]).map(r=>`${r.title} ${(r.tags||[]).join(' ')}`).join(' ')}`));
  const events=getPlanning().filter(e=>contains(`${e.title} ${e.place} ${e.note}`));
  const resources=[['Langues étrangères',get('rp-languages',languageDefaults)],['Protocoles',get('rp-protocols',protocolDefaults)],['Notes rapides',get('rp-notes',noteDefaults)],['Chirurgie',get('rp-surgery',surgeryDefaults)],['Pédiatrie',get('rp-pediatrics',pediatricsDefaults)],['Urgences',get('rp-emergencies',emergencyDefaults)]].map(([title,items])=>[title,items.filter(item=>contains(`${item.title} ${item.text} ${(item.entries||[]).map(entry=>`${entry.title} ${entry.text}`).join(' ')}`))]);
  const resourceMarkup=resources.map(([title,items])=>resourceSearchSection(title,items)).join('');
  const surgeriesMarkup=surgerySearchSection(query);
  results.innerHTML=`<p class="helper">Résultats pour « ${escape(term)} »</p>${meds.length?`<h2>Médicaments</h2><section class="list">${meds.map(m=>`<button class="item" data-med="${m.id}"><span class="item-icon med-icon">●</span><span class="item-main"><h2>${escape(m.name)}</h2><p>${escape(m.class)}</p></span><span class="chev">›</span></button>`).join('')}</section>`:''}${establishmentsFound.length?`<h2>Établissements</h2><section class="list">${establishmentsFound.map(p=>`<button class="item" data-est="${p.id}"><span class="item-icon est-icon">⌂</span><span class="item-main"><h2>${escape(p.name)}</h2><p>${escape(p.city)}</p></span><span class="chev">›</span></button>`).join('')}</section>`:''}${events.length?`<h2>Planning</h2><section class="list">${events.map(eventRow).join('')}</section>`:''}${(resourceMarkup||surgeriesMarkup)?`${resourceMarkup}${surgeriesMarkup}`:(!meds.length&&!establishmentsFound.length&&!events.length?empty('Aucun résultat pour le moment.'): '')}`;
  bind();
}

function sectionTitle(title, subtitle, back){ return `<div class="section-head"><button class="back" data-go="${back}" aria-label="Retour">‹</button><div><h1>${title}</h1><p>${subtitle}</p></div></div>`; }
function infoCard(title,text){ return `<article class="detail-card"><h2>${title}</h2><p class="multiline">${escape(text || 'À compléter.')}</p></article>`; }
function empty(text){ return `<p class="empty">${text}</p>`; }
function toast(message){ const el=$('#toast'); el.textContent=message; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2600); }
const MAX_DOCUMENT_BYTES=2*1024*1024,MAX_PHOTO_SOURCE_BYTES=20*1024*1024,MAX_PHOTO_BYTES=500*1024,MAX_PHOTO_SIDE=1600;
function isPhoto(file){return /^image\//i.test(file.type||'')||/\.(jpe?g|png|gif|webp|heic|heif)$/i.test(file.name||'');}
function attachmentInput(attachment){ return `<div class="field"><label>Fichier joint ${attachment?`actuel : ${escape(attachment.name)}`:'(photo jusqu’à 20 Mo, autres fichiers 2 Mo)'}</label><input type="file" name="attachment" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"></div>`; }
function attachmentsInput(){ return `<div class="field"><label>Fichiers ou photos (plusieurs possibles)</label><input type="file" name="attachments" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"><small class="field-help">Photos réduites automatiquement ; aucun fichier ne doit contenir de donnée patient identifiable.</small></div>`; }
async function filesToResources(files, tags=[]){ const list=[]; for(const file of Array.from(files||[])){ const attachment=await fileToAttachment(file); if(attachment)list.push({id:uid('resource'),title:attachment.name,attachment,tags}); } return list; }
function withAttachment(existing,onSave){ return async values=>{const file=values.attachment;delete values.attachment;const attachment=file&&file.name?await fileToAttachment(file):((existing&&existing.attachment)||null);return onSave({...values,attachment});}; }
function attachmentLink(attachment){ return attachment&&attachment.data ? `<a class="primary attachment-link" href="${attachment.data}" data-attachment-open target="_blank" rel="noopener" aria-label="Ouvrir le fichier ${escape(attachment.name)}">⌇ Ouvrir le fichier</a><p class="attachment-name">${escape(attachment.name)}</p>` : ''; }
function openAttachment(event){
  event.preventDefault();event.stopPropagation();
  const data=event.currentTarget.getAttribute('href');if(!data)return;
  try{
    const [header,payload]=data.split(',');const mime=(header.match(/^data:([^;]+)/)||[])[1]||'application/octet-stream';
    const raw=header.includes(';base64')?atob(payload):decodeURIComponent(payload);const bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
    const url=URL.createObjectURL(new Blob([bytes],{type:mime}));const viewer=window.open(url,'_blank');
    if(!viewer)window.location.href=url;setTimeout(()=>URL.revokeObjectURL(url),60000);
  }catch{window.open(data,'_blank');}
}
function readAttachment(blob,name,type){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve({name,type,data:reader.result});reader.onerror=()=>reject(new Error('Lecture du fichier impossible.'));reader.readAsDataURL(blob);});}
function photoToAttachment(file){return new Promise((resolve,reject)=>{const source=URL.createObjectURL(file),image=new Image();image.onload=()=>{let scale=Math.min(1,MAX_PHOTO_SIDE/Math.max(image.naturalWidth||1,image.naturalHeight||1)),width=Math.max(1,Math.round(image.naturalWidth*scale)),height=Math.max(1,Math.round(image.naturalHeight*scale)),attempt=0;const encode=()=>{const canvas=document.createElement('canvas'),context=canvas.getContext('2d');canvas.width=width;canvas.height=height;context.drawImage(image,0,0,width,height);const quality=Math.max(.55,.86-attempt*.06);canvas.toBlob(blob=>{if(!blob){URL.revokeObjectURL(source);return reject(new Error('La photo ne peut pas être convertie.'));}if(blob.size>MAX_PHOTO_BYTES&&attempt<6){attempt++;width=Math.max(1,Math.round(width*.82));height=Math.max(1,Math.round(height*.82));return encode();}URL.revokeObjectURL(source);if(blob.size>MAX_PHOTO_BYTES)return reject(new Error('Cette photo reste trop lourde après compression. Choisis une photo plus petite.'));const name=(file.name||'photo').replace(/\.[^.]+$/,'')+'.jpg';readAttachment(blob,name,'image/jpeg').then(resolve,reject);},'image/jpeg',quality);};encode();};image.onerror=()=>{URL.revokeObjectURL(source);reject(new Error('Cette photo ne peut pas être lue. Essaie depuis Photos ou choisis une image JPEG.'));};image.src=source;});}
function fileToAttachment(file){if(!file||!file.name)return Promise.resolve(null);if(isPhoto(file)){if(file.size>MAX_PHOTO_SOURCE_BYTES)return Promise.reject(new Error('Cette photo dépasse 20 Mo. Choisis une photo plus légère.'));return photoToAttachment(file);}if(file.size>MAX_DOCUMENT_BYTES)return Promise.reject(new Error('Ce fichier dépasse 2 Mo. Les photos sont acceptées jusqu’à 20 Mo et sont réduites automatiquement.'));return readAttachment(file,file.name,file.type||'application/octet-stream');}

function medForm(existing){
  const med = existing || {name:'',class:'',indication:'',mechanism:'',contra:'',dose:'',attachment:null};
  openSheet(`${existing?'Modifier':'Nouvelle'} fiche médicament`, `<div class="field"><label>Nom du médicament</label><input required name="name" value="${escape(med.name)}" placeholder="Ex. Propofol"></div><div class="field"><label>Classe / usage</label><input required name="class" value="${escape(med.class)}" placeholder="Ex. Hypnotique · Anesthésie"></div><div class="field"><label>Indication</label><textarea name="indication">${escape(med.indication)}</textarea></div><div class="field"><label>Mécanisme d’action</label><textarea name="mechanism">${escape(med.mechanism)}</textarea></div><div class="field"><label>Contre-indications & vigilance</label><textarea name="contra">${escape(med.contra)}</textarea></div><div class="field"><label>Posologie</label><textarea name="dose">${escape(med.dose)}</textarea></div>${attachmentInput(med.attachment)}`, async values => { try { const file=values.attachment; delete values.attachment; const attachment=file&&file.name ? await fileToAttachment(file) : (med.attachment||null); let list=getMeds(); if(existing) list=list.map(item=>item.id===existing.id?{...item,...values,attachment}:item); else list.push({id:uid('med'),...values,attachment,doc:!!attachment}); setMeds(list); meds(); toast(attachment?'Fiche et fichier enregistrés':'Fiche enregistrée sur cet iPhone'); } catch(error){toast(error.message); throw error;} });
}
function tagOptions(selected=[]){return resourceTags.map(tag=>`<label class="tag-choice"><input type="checkbox" name="tags" value="${escape(tag)}" ${selected.includes(tag)?'checked':''}><span>${escape(tag)}</span></label>`).join('');}
function establishmentForm(existing){
  const place = existing || {name:'',city:'',service:'',note:'',contacts:[],resources:[]};
  openSheet(`${existing?'Modifier':'Nouvel'} établissement`, `<div class="field"><label>Nom de l’établissement</label><input required name="name" value="${escape(place.name)}" placeholder="Ex. CHAN Nevers"></div><div class="field"><label>Ville</label><input name="city" value="${escape(place.city)}" placeholder="Ex. Nevers"></div><div class="field"><label>Service principal</label><input name="service" value="${escape(place.service)}" placeholder="Ex. Bloc opératoire"></div><div class="field"><label>Repères personnels</label><textarea name="note" placeholder="Accès, vestiaires, habitudes utiles…">${escape(place.note)}</textarea></div>${attachmentsInput()}<div class="field"><label>Tags pour les fichiers ajoutés (facultatif)</label><div class="tag-picker">${tagOptions()}</div></div>`, async values => {try{const files=values.attachments||[];const tags=Array.isArray(values.tags)?values.tags:(values.tags?[values.tags]:[]);delete values.attachments;delete values.tags;const added=await filesToResources(files,tags),list=getEstablishments();if(existing){setEstablishments(list.map(item=>item.id===existing.id?{...item,...values,resources:[...placeResources(item),...added],attachment:null}:item));}else setEstablishments([...list,{id:uid('est'),...values,contacts:[],resources:added}]);establishments();toast(added.length?`Établissement et ${added.length} ressource${added.length>1?'s':''} enregistrés`:'Établissement enregistré');}catch(error){toast(error.message);throw error;}});
}
function placeResourceForm(placeId, existing){
  const place=getEstablishments().find(item=>item.id===placeId);if(!place)return establishments();
  const resource=existing||{title:'',tags:[],attachment:null};
  openSheet(`${existing?'Modifier':'Ajouter'} une ressource`, `<div class="field"><label>Titre</label><input name="title" value="${escape(resource.title)}" placeholder="Ex. Livret d’accueil CHAM"></div>${attachmentInput(resource.attachment)}<div class="field"><label>Tags (facultatif)</label><div class="tag-picker">${tagOptions(resource.tags||[])}</div></div>`, async values=>{try{const file=values.attachment;const tags=Array.isArray(values.tags)?values.tags:(values.tags?[values.tags]:[]);delete values.attachment;delete values.tags;const attachment=file&&file.name?await fileToAttachment(file):resource.attachment;if(!attachment)throw new Error('Choisis un fichier ou une photo.');const item={...resource,...values,title:values.title||attachment.name,tags,attachment};setEstablishments(getEstablishments().map(entry=>entry.id===placeId?{...entry,resources:existing?placeResources(entry).map(r=>r.id===existing.id?item:r):[...placeResources(entry),{...item,id:uid('resource')}],attachment:null}:entry));establishmentDetail(placeId);toast('Ressource enregistrée');}catch(error){toast(error.message);throw error;}});
}
function contactForm(placeId, existing){
  const contact = existing || {department:'',phone:'',role:'',grade:'',note:''};
  const roles=contactRoles.map(role=>`<option value="${role}" ${contact.role===role?'selected':''}>${role}</option>`).join('');const grades=contactGrades.map(grade=>`<option value="${grade}" ${contact.grade===grade?'selected':''}>${grade}</option>`).join('');
  openSheet(`${existing?'Modifier':'Nouveau'} contact`, `<div class="field"><label>Service / interlocuteur</label><input required name="department" value="${escape(contact.department)}" placeholder="Ex. Dr Martin ou Bloc opératoire"></div><div class="field"><label>Téléphone</label><input name="phone" inputmode="tel" value="${escape(contact.phone)}" placeholder="Ex. 03 00 00 00 00"></div><div class="field"><label>Fonction (si interlocuteur)</label><select name="role"><option value="" ${!contact.role?'selected':''}>Service / autre</option>${roles}</select></div><div class="field"><label>Statut — Anesthésiste ou Chirurgien</label><select name="grade"><option value="" ${!contact.grade?'selected':''}>À préciser</option>${grades}</select></div><div class="field"><label>Note utile</label><textarea name="note" placeholder="Ex. poste 1234, horaires…">${escape(contact.note)}</textarea></div>`, values => {if(['Anesthésiste','Chirurgien'].includes(values.role)&&!values.grade){toast('Choisis un statut.');throw new Error('Statut requis');}if(!['Anesthésiste','Chirurgien'].includes(values.role))values.grade='';const list=getEstablishments().map(place=>{if(place.id!==placeId)return place;const contacts=place.contacts||[];return {...place,contacts:existing?contacts.map(item=>item.id===existing.id?{...item,...values}:item):[...contacts,{id:uid('contact'),...values}]};});setEstablishments(list);establishmentDetail(placeId);toast('Contact enregistré');});
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
function eventForm(existing,date=''){
 const today=new Date().toISOString().slice(0,10),planned=existing||{startDate:date||today,endDate:date||today,title:'',place:'',start:'',end:'',type:'work',note:'',attachment:null},first=eventStart(planned)||today,last=eventEnd(planned)||first;
 openSheet(`${existing?'Modifier':'Nouveau'} créneau`, `<p class="sheet-intro">Une garde peut couvrir une ou plusieurs dates. Les horaires seront appliqués à chaque journée de la plage.</p><div class="date-fields"><div class="field"><label>Du</label><input required type="date" name="startDate" value="${escape(first)}"></div><div class="field"><label>Au</label><input required type="date" name="endDate" value="${escape(last)}"></div></div><div class="field"><label>Type</label><select name="type"><option value="work" ${planned.type==='work'?'selected':''}>Travail</option><option value="leave" ${planned.type==='leave'?'selected':''}>Indisponible / congé</option><option value="personal" ${planned.type==='personal'?'selected':''}>Personnel</option></select></div><div class="field"><label>Intitulé</label><input required name="title" value="${escape(planned.title)}" placeholder="Ex. Vacation IADE"></div><div class="field"><label>Établissement / lieu</label><input name="place" value="${escape(planned.place)}" placeholder="Ex. CHAN Nevers"></div><div class="time-fields"><div class="field"><label>Début</label><input type="text" name="start" inputmode="numeric" autocomplete="off" maxlength="5" value="${escape(planned.start)}" placeholder="Ex. 07:30"></div><div class="field"><label>Fin</label><input type="text" name="end" inputmode="numeric" autocomplete="off" maxlength="5" value="${escape(planned.end)}" placeholder="Ex. 18:00"></div></div><p class="helper">Saisis l’horaire au clavier : 0730 devient 07:30. Une fin après minuit est acceptée.</p><div class="field"><label>Note</label><textarea name="note" placeholder="Service, repère, rappel…">${escape(planned.note)}</textarea></div>${attachmentInput(planned.attachment)}`,withAttachment(planned,values=>{values.start=formatTime(values.start);values.end=formatTime(values.end);if(values.endDate<values.startDate)values.endDate=values.startDate;let list=getPlanning();if(existing)list=list.map(item=>item.id===existing.id?{...item,...values}:item);else list.push({id:uid('event'),...values});setPlanning(list);planning(values.startDate.slice(0,7),values.startDate);toast(values.attachment?'Créneau et fichier enregistrés':'Créneau enregistré sur cet iPhone');}));
}
function openSheet(title, body, onSave){
  const modal=document.createElement('div');modal.className='modal';modal.innerHTML=`<form class="sheet"><div class="sheet-top"><h2>${title}</h2><button type="button" class="close" data-close>×</button></div>${body}<button class="primary">Enregistrer</button></form>`;document.body.append(modal);modal.querySelector('[data-close]').onclick=()=>modal.remove();modal.querySelector('form').onsubmit=async e=>{e.preventDefault();try{const form=e.target,data=new FormData(form),values=Object.fromEntries(data);if(form.querySelector('[name="tags"]'))values.tags=data.getAll('tags');form.querySelectorAll('input[type="file"][multiple]').forEach(input=>values[input.name]=input.files);await onSave(values);modal.remove();}catch(error){console.warn(error);}};
}
function resourceForm(kind, existing){
  const config=resourceConfig[kind]; if(!config)return;
  const item=existing||{title:'',text:'',attachment:null}; const fileField=attachmentInput(item.attachment);
  openSheet(`${existing?'Modifier':'Nouveau'} ${config.singular}`,`<div class="field"><label>Titre</label><input required name="title" value="${escape(item.title)}" placeholder="Ex. ${kind==='languages'?'Anglais':kind==='protocols'?'Antibioprophylaxie':kind==='surgery'?'Chirurgie orthopédique':kind==='pediatrics'?'Accueil de l’enfant':kind==='emergencies'?'Conduite à tenir':'Repère important'}"></div><div class="field"><label>Contenu</label><textarea name="text" placeholder="Écris ici ton repère…">${escape(item.text)}</textarea></div>${fileField}`,async values=>{try{const file=values.attachment;delete values.attachment;const attachment=file&&file.name?await fileToAttachment(file):(item.attachment||null);let list=get(config.key,config.fallback);if(existing)list=list.map(entry=>entry.id===existing.id?{...entry,...values,attachment}:entry);else list.push({id:uid(kind.slice(0,-1)),...values,attachment});set(config.key,list);resourcePage(kind);toast(attachment?'Entrée et fichier enregistrés':'Entrée enregistrée sur cet iPhone');}catch(error){toast(error.message);throw error;}});
}
function languageNoteForm(languageId, existing){
  const language = get('rp-languages', languageDefaults).find(item=>item.id===languageId);
  if(!language) return resourcePage('languages');
  const note = existing || {title:'',text:'',attachment:null};
  openSheet(`${existing?'Modifier':'Nouvelle'} note — ${escape(language.title)}`,`<div class="field"><label>Titre</label><input required name="title" value="${escape(note.title)}" placeholder="Ex. Accueil du patient"></div><div class="field"><label>Phrase ou note</label><textarea name="text" placeholder="Ex. Bonjour, comment vous sentez-vous ?">${escape(note.text)}</textarea></div>${attachmentInput(note.attachment)}`,withAttachment(note,values=>{const list=get('rp-languages',languageDefaults).map(item=>{if(item.id!==languageId)return item;const entries=item.entries||[];return {...item,entries:existing?entries.map(entry=>entry.id===existing.id?{...entry,...values}:entry):[...entries,{id:uid('phrase'),...values}]};});set('rp-languages',list);languageDetail(languageId);toast(values.attachment?'Note et fichier enregistrés':'Note enregistrée dans ce dossier');}));
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
  if(type==='place-resource'){const placeId=parts[0],resourceId=parts[1],place=getEstablishments().find(entry=>entry.id===placeId),item=place&&placeResources(place).find(entry=>entry.id===resourceId);if(!item)return;return menuSheet(item.title||item.attachment.name,[{id:'edit',label:'Modifier',hint:'Renommer ou modifier les tags',icon:'✎',action:()=>placeResourceForm(placeId,item)},{id:'delete',label:'Supprimer',hint:'Retirer ce fichier ou cette photo',icon:'×',danger:true,action:()=>deleteEntry('cette ressource',()=>{setEstablishments(getEstablishments().map(entry=>entry.id===placeId?{...entry,resources:placeResources(entry).filter(resource=>resource.id!==resourceId),attachment:null}:entry));establishmentDetail(placeId);})}]);}
  if(type==='event'){const item=getPlanning().find(entry=>entry.id===parts[0]);if(!item)return;return menuSheet(item.title,[{id:'edit',label:'Modifier',hint:'Ouvrir le créneau',icon:'✎',action:()=>eventForm(item)},{id:'delete',label:'Supprimer',hint:'Retirer ce créneau',icon:'×',danger:true,action:()=>deleteEntry('ce créneau',()=>{setPlanning(getPlanning().filter(entry=>entry.id!==item.id));planning(eventStart(item).slice(0,7),eventStart(item));})}]);}
  if(type==='surgery-general'){const specialtyId=parts[0],noteId=parts[1],specialty=getSurgerySpecialties().find(entry=>entry.id===specialtyId),item=specialty&&generalitiesOf(specialty).find(entry=>entry.id===noteId);if(!item)return;return menuSheet(item.title,[{id:'edit',label:'Modifier',hint:'Ouvrir cette note',icon:'✎',action:()=>surgeryGeneralForm(specialtyId,item)},{id:'delete',label:'Supprimer',hint:'Retirer cette note',icon:'×',danger:true,action:()=>deleteEntry('cette note',()=>{setSurgerySpecialties(getSurgerySpecialties().map(entry=>entry.id===specialtyId?{...entry,note:'',generalities:generalitiesOf(entry).filter(row=>row.id!==noteId)}:entry));surgerySpecialty(specialtyId);})}]);}
  if(type==='surgery-specialty'){const item=getSurgerySpecialties().find(entry=>entry.id===parts[0]);if(!item)return;return menuSheet(item.name,[{id:'edit',label:'Modifier',hint:'Ouvrir la spécialité',icon:'✎',action:()=>surgerySpecialtyForm(item)},{id:'delete',label:'Supprimer',hint:'Retirer la spécialité et ses interventions',icon:'×',danger:true,action:()=>deleteEntry('cette spécialité',()=>{setSurgerySpecialties(getSurgerySpecialties().filter(entry=>entry.id!==item.id));surgery();})}]);}
  if(type==='surgery-intervention'){const specialtyId=parts[0],interventionId=parts[1],specialty=getSurgerySpecialties().find(entry=>entry.id===specialtyId),item=specialty&&(specialty.interventions||[]).find(entry=>entry.id===interventionId);if(!item)return;return menuSheet(item.name,[{id:'edit',label:'Modifier',hint:'Ouvrir la fiche',icon:'✎',action:()=>surgeryInterventionForm(specialtyId,item)},{id:'delete',label:'Supprimer',hint:'Retirer cette intervention',icon:'×',danger:true,action:()=>deleteEntry('cette intervention',()=>{setSurgerySpecialties(getSurgerySpecialties().map(entry=>entry.id===specialtyId?{...entry,interventions:(entry.interventions||[]).filter(row=>row.id!==interventionId)}:entry));surgerySpecialty(specialtyId);})}]);}
  if(type==='resource'){const kind=parts[0],id=parts[1],config=resourceConfig[kind],item=config&&get(config.key,config.fallback).find(entry=>entry.id===id);if(!item)return;return menuSheet(item.title,[{id:'edit',label:'Modifier',hint:'Ouvrir l’entrée',icon:'✎',action:()=>resourceForm(kind,item)},{id:'delete',label:'Supprimer',hint:'Retirer cette entrée',icon:'×',danger:true,action:()=>deleteEntry('cette entrée',()=>{set(config.key,get(config.key,config.fallback).filter(entry=>entry.id!==item.id));resourcePage(kind);})}]);}
  if(type==='language-note'){const languageId=parts[0],noteId=parts[1],language=get('rp-languages',languageDefaults).find(entry=>entry.id===languageId),item=language&&(language.entries||[]).find(entry=>entry.id===noteId);if(!item)return;return menuSheet(item.title,[{id:'edit',label:'Modifier',hint:'Ouvrir cette note',icon:'✎',action:()=>languageNoteForm(languageId,item)},{id:'delete',label:'Supprimer',hint:'Retirer cette note',icon:'×',danger:true,action:()=>deleteEntry('cette note',()=>{set('rp-languages',get('rp-languages',languageDefaults).map(entry=>entry.id===languageId?{...entry,entries:(entry.entries||[]).filter(note=>note.id!==noteId)}:entry));languageDetail(languageId);})}]);}
}
function bindHold(){document.querySelectorAll('[data-hold]').forEach(element=>{let timer;let held=false;const stop=()=>{clearTimeout(timer);};element.addEventListener('pointerdown',()=>{held=false;timer=setTimeout(()=>{held=true;entryMenu(element.dataset.hold);},650);});element.addEventListener('pointerup',stop);element.addEventListener('pointerleave',stop);element.addEventListener('pointercancel',stop);element.addEventListener('click',event=>{if(held){event.preventDefault();event.stopImmediatePropagation();held=false;}},true);element.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();entryMenu(element.dataset.hold);}});});}
function addMenu(){
  const modal=document.createElement('div');modal.className='modal menu-modal';modal.innerHTML=`<section class="sheet quick-sheet"><div class="sheet-top"><h2>Ajouter</h2><button type="button" class="close" data-close>×</button></div><button class="add-choice" data-choice="event"><span class="plan-badge">□</span><span><strong>Créneau de planning</strong><small>Travail, congé ou rendez-vous</small></span></button><button class="add-choice" data-choice="est"><span class="est-badge">⌂</span><span><strong>Établissement</strong><small>Avec son annuaire téléphonique</small></span></button><button class="add-choice" data-choice="med"><span class="med-badge">●</span><span><strong>Fiche médicament</strong><small>Indication, vigilance et posologie</small></span></button></section>`;document.body.append(modal);modal.querySelector('[data-close]').onclick=()=>modal.remove();modal.querySelectorAll('[data-choice]').forEach(button=>button.onclick=()=>{const choice=button.dataset.choice;modal.remove();if(choice==='event')eventForm();if(choice==='est')establishmentForm();if(choice==='med')medForm();});
}
function bind(){
  document.querySelectorAll('[data-go]').forEach(button=>button.onclick=()=>{const target=button.dataset.go;if(target==='home')home();else if(target==='meds')meds();else if(target==='establishments')establishments();else if(target==='planning')planning();else if(target==='search')searchPage();else if(target==='profile')profile();else if(target==='surgery')surgery();else if(target==='surgery-specialty')surgery();else if(['languages','protocols','notes','pediatrics','emergencies'].includes(target))resourcePage(target);});
  document.querySelectorAll('[data-med]').forEach(button=>button.onclick=()=>medDetail(button.dataset.med));
  document.querySelectorAll('[data-est]').forEach(button=>button.onclick=()=>establishmentDetail(button.dataset.est));
  document.querySelectorAll('[data-add-med]').forEach(button=>button.onclick=()=>medForm());
  document.querySelectorAll('[data-edit-med]').forEach(button=>button.onclick=()=>medForm(getMeds().find(item=>item.id===button.dataset.editMed)));
  document.querySelectorAll('[data-add-est]').forEach(button=>button.onclick=()=>establishmentForm());
  document.querySelectorAll('[data-edit-est]').forEach(button=>button.onclick=()=>establishmentForm(getEstablishments().find(item=>item.id===button.dataset.editEst)));
  document.querySelectorAll('[data-add-contact]').forEach(button=>button.onclick=()=>contactForm(button.dataset.addContact));
  document.querySelectorAll('[data-add-place-resource]').forEach(button=>button.onclick=()=>placeResourceForm(button.dataset.addPlaceResource));
  document.querySelectorAll('[data-place-tag]').forEach(button=>button.onclick=()=>{const placeId=button.closest('[data-current-place]')?.dataset.currentPlace;if(placeId)establishmentDetail(placeId,button.dataset.placeTag);});
  document.querySelectorAll('[data-edit-contact]').forEach(button=>button.onclick=()=>{const [placeId,contactId]=button.dataset.editContact.split('|');const place=getEstablishments().find(item=>item.id===placeId);contactForm(placeId,(place.contacts||[]).find(item=>item.id===contactId));});
  document.querySelectorAll('[data-add-event]').forEach(button=>button.onclick=()=>eventForm());
  document.querySelectorAll('[data-add-event-date]').forEach(button=>button.onclick=()=>eventForm(null,button.dataset.addEventDate));
  document.querySelectorAll('[data-language]').forEach(button=>button.onclick=()=>languageDetail(button.dataset.language));
  document.querySelectorAll('[data-surgery-specialty]').forEach(button=>button.onclick=()=>surgerySpecialty(button.dataset.surgerySpecialty));
  document.querySelectorAll('[data-surgery-intervention]').forEach(button=>button.onclick=()=>{const [specialtyId,interventionId]=button.dataset.surgeryIntervention.split('|');surgeryInterventionDetail(specialtyId,interventionId);});
  document.querySelectorAll('[data-add-surgery-specialty]').forEach(button=>button.onclick=()=>surgerySpecialtyForm());
  document.querySelectorAll('[data-add-surgery-general]').forEach(button=>button.onclick=()=>surgeryGeneralForm(button.dataset.addSurgeryGeneral));
  document.querySelectorAll('[data-add-surgery-intervention]').forEach(button=>button.onclick=()=>surgeryInterventionForm(button.dataset.addSurgeryIntervention));
  document.querySelectorAll('[data-surgery-legacy]').forEach(button=>button.onclick=surgeryLegacy);
  document.querySelectorAll('[data-add-resource]').forEach(button=>button.onclick=()=>resourceForm(button.dataset.addResource));
  document.querySelectorAll('[data-add-language-note]').forEach(button=>button.onclick=()=>languageNoteForm(button.dataset.addLanguageNote));
  document.querySelectorAll('[data-day]').forEach(button=>button.onclick=()=>planning(button.dataset.day.slice(0,7),button.dataset.day));
  document.querySelectorAll('[data-today]').forEach(button=>button.onclick=()=>{const today=new Date().toISOString().slice(0,10);planning(today.slice(0,7),today);});
  document.querySelectorAll('[data-month]').forEach(button=>button.onclick=()=>planning(button.dataset.month));
  document.querySelectorAll('[data-add-menu]').forEach(button=>button.onclick=addMenu);
  document.querySelectorAll('[data-backup-export]').forEach(button=>button.onclick=downloadBackup);
  document.querySelectorAll('[data-backup-import]').forEach(button=>button.onclick=chooseBackup);
  document.querySelectorAll('[data-attachment-open]').forEach(link=>link.addEventListener('click',openAttachment));
  bindHold();
}
// Empêche le menu iPhone Copier/Rechercher sur les fiches ; les champs restent éditables.
document.addEventListener('contextmenu',event=>{
  if(!event.target.closest('input, textarea, select, [contenteditable="true"]')) event.preventDefault();
});
if('serviceWorker' in navigator){
  let refreshing=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!refreshing){refreshing=true;window.location.reload();}});
  navigator.serviceWorker.register('sw.js?v=26',{updateViaCache:'none'}).then(registration=>registration.update()).catch(()=>{});
}
home();
