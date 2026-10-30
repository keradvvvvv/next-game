'use strict';
// Каталог работает без сервера. Избранное хранится только в этом браузере.
const games = window.GAMES || [];
const storageKey = 'nextgame-favorites-v1';
let saved = new Set();
try { const data = JSON.parse(localStorage.getItem(storageKey) || '[]'); if (Array.isArray(data)) saved = new Set(data.filter(id => games.some(g => g.id === id))); } catch (_) {}
const $ = id => document.getElementById(id);
const icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>';
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function saveButton(g) { return `<button class="save-button" data-save="${g.id}" aria-pressed="${saved.has(g.id)}" aria-label="${saved.has(g.id) ? 'Убрать из избранного' : 'В избранное'}: ${escapeHTML(g.name)}">${icon}</button>`; }
function card(g) { return `<article class="game-card"><div class="card-image"><button class="open-image" data-open="${g.id}" aria-label="Подробнее: ${escapeHTML(g.name)}"><img src="${g.image}" alt="Обложка ${escapeHTML(g.name)}" width="460" height="215" loading="lazy"></button>${saveButton(g)}</div><div class="card-meta"><span>${g.genre}</span><span class="year">${g.year}</span></div><h3><button class="card-title" data-open="${g.id}">${escapeHTML(g.name)}</button></h3><p>${g.description}</p><div class="card-bottom"><span>${g.coop ? 'Есть кооператив' : 'Один игрок'}</span><button class="text-link" data-open="${g.id}">Подробнее ↗</button></div></article>`; }
function updateCount() { $('saved-count').textContent = saved.size; }
let toastTimer;
function notify(message) { $('toast').textContent = message; $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 2600); }
function toggleSaved(id) {
 const g = games.find(g => g.id === id); if (!g) return;
 saved.has(id) ? saved.delete(id) : saved.add(id);
 let persisted = true; try { localStorage.setItem(storageKey, JSON.stringify([...saved])); } catch (_) { persisted = false; }
 updateCount(); document.querySelectorAll(`[data-save="${id}"]`).forEach(b => { b.setAttribute('aria-pressed', String(saved.has(id))); b.setAttribute('aria-label', `${saved.has(id) ? 'Убрать из избранного' : 'В избранное'}: ${g.name}`); if (b.classList.contains('detail-save')) b.textContent = saved.has(id) ? 'Убрать из избранного' : 'В избранное'; });
 if ($('only-saved')?.checked) renderCatalog();
 notify(persisted ? (saved.has(id) ? 'Игра добавлена в избранное' : 'Игра убрана из избранного') : 'Браузер запретил сохранение. Список доступен до закрытия страницы.');
}
const dialog = $('game-dialog'); let previousFocus;
function openGame(id) {
 const g = games.find(g => g.id === id); if (!g) return; previousFocus = document.activeElement;
 const modes = g.categories.filter(c => c === 'Для одного игрока' || c.startsWith('Кооператив ('));
 $('dialog-body').innerHTML = `<img class="dialog-image" src="${g.sceneImage}" alt="Игровой процесс ${escapeHTML(g.name)}"><div class="dialog-content"><p class="eyebrow">${g.genre} / ${g.mood}</p><h2 id="dialog-title">${escapeHTML(g.name)}</h2><p>${g.description}</p><p>${g.note}</p><dl class="detail-list"><div><dt>Разработчик</dt><dd>${escapeHTML(g.developer)}</dd></div><div><dt>Выход в Steam</dt><dd>${g.date}</dd></div><div><dt>Игровые режимы</dt><dd>${modes.map(escapeHTML).join(', ') || 'См. страницу игры'}</dd></div><div><dt>Платформа подборки</dt><dd>ПК · Windows</dd></div></dl><div class="dialog-actions"><a class="button primary" href="${g.source}" target="_blank" rel="noopener noreferrer">Страница в Steam ↗</a><button class="button secondary detail-save" data-save="${g.id}" aria-pressed="${saved.has(g.id)}">${saved.has(g.id) ? 'Убрать из избранного' : 'В избранное'}</button></div></div>`;
 dialog.showModal(); document.body.style.overflow = 'hidden'; dialog.querySelector('.dialog-close').focus();
}
function closeDialog() { dialog.close(); }
dialog.addEventListener('close', () => { document.body.style.overflow = ''; if (previousFocus?.isConnected) previousFocus.focus(); });
dialog.querySelector('.dialog-close').addEventListener('click', closeDialog);
dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeDialog(); } });
document.addEventListener('click', e => { const open = e.target.closest('[data-open]'); const save = e.target.closest('[data-save]'); if (open) openGame(Number(open.dataset.open)); if (save) toggleSaved(Number(save.dataset.save)); });
const menu = document.querySelector('.menu-toggle'), nav = $('nav');
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); }
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
window.matchMedia('(min-width:761px)').addEventListener('change', closeMenu);
nav.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
if ($('featured-games')) $('featured-games').innerHTML = [1145360,620,264710].map(id => card(games.find(g => g.id === id))).join('');
function renderCatalog() {
 const query = $('search').value.trim().toLocaleLowerCase('ru');
 let result = games.filter(g => (!query || `${g.name} ${g.developer}`.toLocaleLowerCase('ru').includes(query)) && (!$('genre').value || g.genre === $('genre').value) && (!$('mood').value || g.mood === $('mood').value) && ($('mode').value !== 'coop' || g.coop) && ($('mode').value !== 'solo' || g.categories.includes('Для одного игрока')) && (!$('only-saved').checked || saved.has(g.id)));
 if ($('sort').value === 'name') result.sort((a,b) => a.name.localeCompare(b.name)); if ($('sort').value === 'year') result.sort((a,b) => b.year-a.year);
 $('catalog-grid').innerHTML = result.map(card).join(''); $('results-count').textContent = `Найдено: ${result.length} из ${games.length}`; $('empty-state').hidden = result.length > 0;
 const params = new URLSearchParams(); for (const id of ['search','genre','mode','mood','sort']) { const value = $(id).value; if(value && value !== 'curated') params.set(id,value); } if ($('only-saved').checked) params.set('saved','1');
 try { history.replaceState(null,'',location.pathname+(params.size ? '?'+params : '')+location.hash); } catch (_) {}
}
if ($('filters')) {
 for (const id of ['genre','mood']) for (const value of [...new Set(games.map(g => g[id]))]) { const option = document.createElement('option'); option.value = value; option.textContent = value; $(id).append(option); }
 const params = new URLSearchParams(location.search); for (const id of ['search','genre','mode','mood','sort']) { if (params.has(id)) $(id).value = params.get(id); } if (!$('sort').value) $('sort').value = 'curated'; $('only-saved').checked = params.get('saved') === '1';
 $('filters').addEventListener('submit', e => e.preventDefault()); $('search').addEventListener('input',renderCatalog); $('filters').addEventListener('change',e => { if(e.target.id !== 'search') renderCatalog(); });
 function reset() { HTMLFormElement.prototype.reset.call($('filters')); renderCatalog(); } $('reset').addEventListener('click',reset); $('empty-reset').addEventListener('click',reset); renderCatalog();
}
window.addEventListener('storage', e => { if(e.key !== storageKey) return; try { const data=JSON.parse(e.newValue || '[]'); saved=new Set(Array.isArray(data) ? data.filter(id=>games.some(g=>g.id===id)) : []); updateCount(); if($('filters')) renderCatalog(); } catch(_){} });
updateCount();

