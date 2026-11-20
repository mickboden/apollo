// Board page: render a deck, save ratings, keyboard first.
const $ = (sel, el = document) => el.querySelector(sel);
const deckEl = $('#deck');
const statusEl = $('#status');
let deck;
let state = {};
let statusTimer;

const isImage = (src) => /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(src);
const isHtml = (src) => /\.html?(\?|$)/i.test(src);
const isUrl = (src) => /^https?:\/\//i.test(src);
const fileUrl = (src) => (isUrl(src) ? src : `/files/${src.split('/').map(encodeURIComponent).join('/')}`);

function showStatus(text, error = false) {
  clearTimeout(statusTimer);
  statusEl.textContent = text;
  statusEl.classList.toggle('error', error);
  statusEl.classList.add('show');
  if (!error) statusTimer = setTimeout(() => statusEl.classList.remove('show'), 1600);
}

function updateProgress() {
  const rated = deck.cards.filter((c) => {
    const s = state[c.id];
    return s && (s.score || s.love !== null && s.love !== undefined);
  }).length;
  $('#progress').textContent = deck.kind === 'dials' ? '' : `${rated} of ${deck.cards.length} rated`;
}

async function save(cardId, patch) {
  try {
    const res = await fetch('/rate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cardId, ...patch }) });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || res.statusText);
    state[cardId] = body.saved;
    updateProgress();
    showStatus(body.warning ? `Saved here, but not to the profile: ${body.warning}` : 'Saved', !!body.warning);
  } catch (e) {
    showStatus(`Not saved: ${e.message}. Your choice is still shown; try again.`, true);
  }
}

function preview(card, a) {
  a.href = fileUrl(card.src);
  if (card.image || isImage(card.src)) {
    const img = document.createElement('img');
    img.src = fileUrl(card.image || card.src);
    img.alt = '';
    img.loading = 'lazy';
    a.append(img);
  } else if (isHtml(card.src)) {
    const frame = document.createElement('iframe');
    frame.src = fileUrl(card.src);
    frame.loading = 'lazy';
    frame.tabIndex = -1;
    frame.title = card.title || 'Preview';
    frame.setAttribute('sandbox', 'allow-scripts');
    a.append(frame);
    new ResizeObserver(([entry]) => { frame.style.transform = `scale(${entry.contentRect.width / 1440})`; }).observe(a);
  } else {
    const site = document.createElement('div');
    site.className = 'site';
    const host = document.createElement('span');
    host.className = 'site-host';
    try { host.textContent = new URL(card.src).hostname.replace(/^www\./, ''); } catch { host.textContent = card.src; }
    const open = document.createElement('span');
    open.className = 'site-open';
    open.textContent = 'Opens in a new tab';
    site.append(host, open);
    a.append(site);
  }
  a.setAttribute('aria-label', `Open ${card.title || 'preview'}`);
}

function paint(el, s = {}) {
  $('.love', el).setAttribute('aria-pressed', String(s.love === true));
  $('.reject', el).setAttribute('aria-pressed', String(s.love === false));
  el.classList.toggle('rejected', s.love === false);
  el.classList.toggle('chosen', deck.kind === 'dials' && s.love === true);
  for (const b of el.querySelectorAll('.score button')) b.setAttribute('aria-checked', String(Number(b.dataset.v) === s.score));
}

function build(card, index) {
  const el = $('#card').content.firstElementChild.cloneNode(true);
  el.dataset.id = card.id;
  el.dataset.group = card.group || '';
  preview(card, $('.preview', el));
  const inGroup = deck.cards.filter((c) => (c.group || '') === (card.group || ''));
  $('.card-title', el).textContent = deck.kind === 'blind' ? `Option ${String.fromCharCode(65 + inGroup.indexOf(card))}` : card.title || card.id;
  $('.why', el).textContent = deck.kind === 'blind' ? '' : card.why || '';
  const score = $('.score', el);
  for (let v = 1; v <= 5; v++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.v = v;
    b.textContent = v;
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-label', `${v} of 5`);
    b.onclick = () => rate(el, { score: state[card.id]?.score === v ? null : v });
    score.append(b);
  }
  $('.love', el).onclick = () => rate(el, { love: state[card.id]?.love === true ? null : true });
  $('.reject', el).onclick = () => rate(el, { love: state[card.id]?.love === false ? null : false });
  const note = $('.note', el);
  note.value = state[card.id]?.note || '';
  const commitNote = () => { if (note.value !== (state[card.id]?.note || '')) rate(el, { note: note.value }); };
  note.addEventListener('blur', commitNote);
  note.addEventListener('keydown', (e) => { if (e.key === 'Enter') { commitNote(); el.focus(); } });
  if (deck.kind === 'dials') el.addEventListener('click', (e) => { if (!e.target.closest('a')) choose(el); });
  paint(el, state[card.id]);
  return el;
}

function rate(el, patch) {
  const id = el.dataset.id;
  state[id] = { ...(state[id] || {}), ...patch };
  paint(el, state[id]);
  save(id, patch);
}

function choose(el) {
  for (const other of deckEl.querySelectorAll(`.card[data-group="${CSS.escape(el.dataset.group)}"]`)) {
    if (other !== el && state[other.dataset.id]?.love === true) rate(other, { love: null });
  }
  rate(el, { love: true });
}

function columns() {
  return getComputedStyle(deckEl).gridTemplateColumns.split(' ').length;
}

deckEl.addEventListener('keydown', (e) => {
  const el = e.target.closest('.card');
  if (!el || e.target !== el) return;
  const cards = [...deckEl.querySelectorAll('.card')];
  const i = cards.indexOf(el);
  const k = e.key.toLowerCase();
  if (deck.kind !== 'dials' && /^[1-5]$/.test(k)) rate(el, { score: Number(k) });
  else if (deck.kind !== 'dials' && k === 'l') rate(el, { love: state[el.dataset.id]?.love === true ? null : true });
  else if (deck.kind !== 'dials' && k === 'x') rate(el, { love: state[el.dataset.id]?.love === false ? null : false });
  else if (deck.kind === 'dials' && (k === 'enter' || k === ' ')) choose(el);
  else if (k === 'arrowright') cards[Math.min(i + 1, cards.length - 1)].focus();
  else if (k === 'arrowleft') cards[Math.max(i - 1, 0)].focus();
  else if (k === 'arrowdown') cards[Math.min(i + columns(), cards.length - 1)].focus();
  else if (k === 'arrowup') cards[Math.max(i - columns(), 0)].focus();
  else return;
  e.preventDefault();
});

async function init() {
  try {
    [deck, state] = await Promise.all([fetch('/deck').then((r) => r.json()), fetch('/ratings').then((r) => r.json())]);
  } catch (e) {
    showStatus(`Could not load the deck: ${e.message}`, true);
    return;
  }
  document.title = deck.title || 'Board';
  $('#title').textContent = deck.title || 'Board';
  if (deck.kind === 'dials') {
    document.body.classList.add('dials');
    $('#hint').textContent = 'Pick one option per dial. Keys: arrows, Enter.';
  }
  if (!deck.cards?.length) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'This deck has no cards yet.';
    deckEl.append(p);
    return;
  }
  let group = null;
  deck.cards.forEach((card, i) => {
    if ((deck.kind === 'dials' || deck.kind === 'blind') && card.group && card.group !== group) {
      group = card.group;
      const h = document.createElement('h2');
      h.className = 'group-title';
      h.textContent = group;
      deckEl.append(h);
    }
    deckEl.append(build(card, i));
  });
  updateProgress();
}

init();
