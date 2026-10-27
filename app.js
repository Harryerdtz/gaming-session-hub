const STORAGE_KEY = 'gaming-session-hub-v1';
const starterGames = [
  { id: crypto.randomUUID(), name: 'Catan', platform: 'Brettspiel', players: 4 },
  { id: crypto.randomUUID(), name: 'Mario Kart 8', platform: 'Switch', players: 4 },
  { id: crypto.randomUUID(), name: 'Deep Rock Galactic', platform: 'PC / Xbox', players: 4 }
];
let state = loadState();
let editingId = null;
const $ = (id) => document.getElementById(id);
function loadState(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));return saved||{games:starterGames,session:[],votes:{}}}catch{return {games:starterGames,session:[],votes:{}}}}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function esc(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function playersText(n){return `${n} ${n===1?'Spieler':'Spieler'}`}
function render(){
  const platform=$('platform-filter').value, players=$('players-filter').value;
  const filtered=state.games.filter(g=>(platform==='all'||g.platform===platform)&&(players==='all'||(players==='2'?g.players===2:players==='3-4'?g.players>=3&&g.players<=4:g.players>=5)));
  $('library-count').textContent=state.games.length; $('session-count').textContent=`${state.session.length} ${state.session.length===1?'Spiel':'Spiele'}`;
  $('game-grid').innerHTML=filtered.map(g=>`<article class="game-card"><div><div class="game-top"><span class="platform-tag">${esc(g.platform)}</span><span class="players">${playersText(g.players)}</span></div><h3>${esc(g.name)}</h3></div><div class="card-actions"><button class="card-action suggest" data-action="suggest" data-id="${g.id}">${state.session.includes(g.id)?'In Session ✓':'Vorschlagen'}</button><div><button class="card-action" data-action="edit" data-id="${g.id}">Bearbeiten</button><button class="card-action" data-action="delete" data-id="${g.id}">Löschen</button></div></div></article>`).join('');
  $('game-grid').hidden=filtered.length===0; $('library-empty').hidden=state.games.length!==0;
  $('session-empty').hidden=state.session.length!==0; $('pick-random').disabled=state.session.length===0; $('clear-session').disabled=state.session.length===0;
  $('session-list').innerHTML=state.session.map(id=>{const g=state.games.find(x=>x.id===id);if(!g)return '';return `<div class="session-item"><span class="session-name">${esc(g.name)}</span><span class="session-meta">${esc(g.platform)}</span><button class="vote-button ${state.votes[id]?'voted':''}" data-action="vote" data-id="${id}" aria-label="Für ${esc(g.name)} stimmen">${state.votes[id]||0} ♥</button><button class="remove-session" data-action="remove-session" data-id="${id}" aria-label="${esc(g.name)} aus Session entfernen">×</button></div>`}).join('');
  const platforms=[...new Set(state.games.map(g=>g.platform))].sort(); const current=platform; $('platform-filter').innerHTML='<option value="all">Alle Plattformen</option>'+platforms.map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join(''); $('platform-filter').value=platforms.includes(current)?current:'all';
}
function openDialog(game){editingId=game?.id||null;$('dialog-title').textContent=editingId?'Spiel bearbeiten':'Spiel hinzufügen';$('game-id').value=editingId||'';$('game-name').value=game?.name||'';$('game-platform').value=game?.platform||'';$('game-players').value=game?.players||'';$('form-error').textContent='';$('game-dialog').showModal();setTimeout(()=>$('game-name').focus(),50)}
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
document.addEventListener('click',e=>{const btn=e.target.closest('[data-action],#open-add,#open-add-mobile,#cancel-dialog,#pick-random,#clear-session');if(!btn)return;const action=btn.dataset.action||btn.id;const id=btn.dataset.id;const game=state.games.find(g=>g.id===id);
  if(action==='add'||action==='open-add'||action==='open-add-mobile'){openDialog();return} if(action==='cancel-dialog'){$('game-dialog').close();return}
  if(action==='edit')openDialog(game);
  if(action==='delete'&&game){if(confirm(`„${game.name}“ wirklich löschen?`)){state.games=state.games.filter(g=>g.id!==id);state.session=state.session.filter(x=>x!==id);delete state.votes[id];saveState();render();toast('Spiel gelöscht')}}
  if(action==='suggest'&&game){if(state.session.includes(id)){state.session=state.session.filter(x=>x!==id);delete state.votes[id];toast('Aus der Session entfernt')}else{state.session.push(id);toast('Zur Session vorgeschlagen')}saveState();render()}
  if(action==='vote'&&state.session.includes(id)){state.votes[id]=(state.votes[id]||0)+1;saveState();render()}
  if(action==='remove-session'){state.session=state.session.filter(x=>x!==id);delete state.votes[id];saveState();render()}
  if(action==='clear-session'){state.session=[];state.votes={};saveState();render();toast('Session geleert')}
  if(action==='pick-random'){const winner=state.session.map(id=>state.games.find(g=>g.id===id)).filter(Boolean).sort((a,b)=>(state.votes[b.id]||0)-(state.votes[a.id]||0));const pick=winner[Math.floor(Math.random()*Math.max(1,winner.length))];$('winner').hidden=false;$('winner').innerHTML=`✦ Heute wird gespielt: <strong>${esc(pick.name)}</strong> <span>(${esc(pick.platform)})</span>`;toast('Die Würfel sind gefallen')}
});
$('game-form').addEventListener('submit',e=>{e.preventDefault();const name=$('game-name').value.trim(),platform=$('game-platform').value.trim(),players=Number($('game-players').value);if(!name||!platform||!players||players<1){$('form-error').textContent='Bitte fülle alle Felder korrekt aus.';return}if(editingId){Object.assign(state.games.find(g=>g.id===editingId),{name,platform,players});toast('Spiel aktualisiert')}else{state.games.push({id:crypto.randomUUID(),name,platform,players});toast('Spiel hinzugefügt')}saveState();$('game-dialog').close();render()});
['platform-filter','players-filter'].forEach(id=>$(id).addEventListener('change',render));
render();
$('open-steam').addEventListener('click',()=>{$('steam-error').textContent='';$('steam-dialog').showModal();setTimeout(()=>$('steam-profile').focus(),50)});
$('cancel-steam').addEventListener('click',()=>$('steam-dialog').close());
$('steam-form').addEventListener('submit',async e=>{e.preventDefault();const profile=$('steam-profile').value.trim();$('steam-error').textContent='';const button=e.submitter;button.disabled=true;button.textContent='Import läuft …';try{const response=await fetch(`/api/steam/library?profile=${encodeURIComponent(profile)}`);if(!response.ok)throw new Error();const payload=await response.json();const imported=Array.isArray(payload.games)?payload.games:[];imported.forEach(item=>{if(!item.name)return;const exists=state.games.some(g=>g.name.toLowerCase()===item.name.toLowerCase());if(!exists)state.games.push({id:crypto.randomUUID(),name:item.name,platform:item.platform||'Steam',players:Number(item.players)||1,source:'steam'})});saveState();$('steam-dialog').close();render();toast(`${imported.length} Steam-Spiele importiert`)}catch(error){$('steam-error').textContent='Steam ist noch nicht mit einem Server verbunden. Dafür muss der sichere Backend-Endpunkt /api/steam/library eingerichtet werden.'}finally{button.disabled=false;button.textContent='Bibliothek importieren'}});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
