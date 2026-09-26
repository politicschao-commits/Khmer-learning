(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const defaultId = 'dm99g_RCH6s';
  let videoId = defaultId;
  let lines = [];
  let selectedLine = null;
  const drafts = new Map();
  let loaded = false;
  const songs = window.KHMER_SONGS || {};
  const songOrder = [...new Set([...(window.KHMER_SONG_ORDER || []), ...Object.keys(songs)])]
    .filter(id => Object.hasOwn(songs, id));
  songOrder.forEach((id, index) => {
    const song = songs[id];
    const option = document.createElement('option');
    option.value = id;
    option.textContent = `${String(index + 1).padStart(2, '0')} · ${song.title}${song.lines.length ? '' : '（待加入歌詞）'}`;
    $('song-select').append(option);
  });
  const storageKey = id => `khmer-singing-v1:${id}`;
  const element = (tag, className, text) => {
    const el = document.createElement(tag);
    el.className = className;
    el.textContent = text;
    return el;
  };
  function parseVideo(value) {
    try {
      const url = new URL(value);
      if (!['https:', 'http:'].includes(url.protocol)) return null;
      let id;
      if (['youtu.be', 'www.youtu.be'].includes(url.hostname)) id = url.pathname.slice(1);
      else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(url.hostname)) {
        if (url.pathname === '/watch') id = url.searchParams.get('v');
        else id = url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)\/?$/)?.[1];
      }
      return /^[\w-]{11}$/.test(id || '') ? id : null;
    } catch { return null; }
  }
  function loadVideo(id) {
    if (loaded) drafts.set(videoId, $('lyrics-input').value);
    loaded = true;
    videoId = id;
    if (![...$('song-select').options].some(option => option.value === id)) {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = `自訂歌曲 · ${id}`;
      $('song-select').append(option);
    }
    $('song-select').value = id;
    $('video-error').textContent = '';
    $('youtube-original').href = `https://www.youtube.com/watch?v=${id}`;
    $('video-url').value = $('youtube-original').href;
    lines = window.KHMER_SONGS?.[id]?.lines || [];
    $('sing-title').textContent = window.KHMER_SONGS?.[id]?.title || '我的跟唱歌曲';
    document.querySelector('.song-subtitle').textContent = window.KHMER_SONGS?.[id]?.note || '聽原唱，讀歌詞，把每一句的意思唱進心裡。';
    $('word-search').value = '';
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey(id)) || 'null');
      if (Array.isArray(saved) && saved.every(row => Array.isArray(row) && row.length === 3 && row.every(v => typeof v === 'string'))) lines = saved;
    } catch { /* Browsers may disable local storage. The editor still works. */ }
    $('lyrics-input').value = drafts.get(id) ?? lines.map(row => row.join('\n')).join('\n\n');
    $('lyrics-status').textContent = '';
    renderLyrics();
    $('lyrics-list').scrollTop = 0;
    $('word-list').scrollTop = 0;
  }
  function chooseSong(id) {
    loadVideo(id);
    const url = new URL(location.href);
    url.searchParams.set('song', id);
    history.replaceState(null, '', url);
  }
  $('song-select').addEventListener('change', () => chooseSong($('song-select').value));
  function renderLyrics() {
    selectedLine = null;
    renderDictionary();
    $('lyrics-list').replaceChildren();
    $('line-count').textContent = lines.length ? `${lines.length} 段` : '等待歌詞';
    if (!lines.length) {
      const empty = element('div', 'lyrics-empty', '');
      empty.append(element('span', 'empty-symbol', '♪'), element('h3', '', '影片已就位，放入歌詞就能開始'), element('p', '', '把這首歌的柬文歌詞貼到對話中，我會協助整理拼音與中文。也可展開下方編輯區，貼入已整理的三行內容。'), element('small', '', '原有的每日四句保留在「每日四句」模式。'));
      $('lyrics-list').append(empty);
      return;
    }
    lines.forEach(([kh, roman, zh], index) => {
      const row = element('button', 'lyric-row', '');
      row.type = 'button';
      row.setAttribute('aria-pressed', 'false');
      const khmer = element('span', 'lyric-kh', kh);
      khmer.lang = 'km';
      row.append(element('span', 'lyric-number', String(index + 1).padStart(2, '0')), khmer, element('span', 'lyric-roman', roman), element('span', 'lyric-zh', zh));
      row.addEventListener('click', () => {
        $('lyrics-list').querySelectorAll('.lyric-row').forEach(item => item.setAttribute('aria-pressed', String(item === row)));
        selectedLine = index;
        $('word-search').value = '';
        renderDictionary();
      });
      $('lyrics-list').append(row);
    });
  }
  function renderDictionary() {
    const query = $('word-search').value.trim().normalize('NFC').toLowerCase();
    const words = window.KHMER_SONGS?.[videoId]?.words || [];
    const text = selectedLine === null ? null : lines[selectedLine]?.[0].normalize('NFC');
    const matches = words.filter(word => (!text || text.includes(word[0].normalize('NFC'))) && word.join(' ').normalize('NFC').toLowerCase().includes(query));
    $('dictionary-context').textContent = `${selectedLine === null ? '全部詞彙' : `第 ${selectedLine + 1} 段詞彙`} · ${matches.length}`;
    $('all-words').disabled = selectedLine === null && !query;
    $('word-list').replaceChildren();
    matches.forEach(([kh, roman, zh, note]) => {
      const card = element('article', 'word-card', '');
      const term = element('h3', 'word-kh', kh);
      term.lang = 'km';
      card.append(term, element('p', 'word-roman', roman), element('p', 'word-zh', zh));
      if (note) card.append(element('p', 'word-note', note));
      $('word-list').append(card);
    });
    if (!matches.length) $('word-list').append(element('p', 'word-empty', words.length ? '目前沒有相符詞彙。可換個關鍵字，或按「顯示全部」。' : '這首歌還沒有詞彙表。'));
  }
  $('word-search').addEventListener('input', renderDictionary);
  $('all-words').addEventListener('click', () => {
    selectedLine = null;
    $('word-search').value = '';
    $('lyrics-list').querySelectorAll('.lyric-row').forEach(row => row.setAttribute('aria-pressed', 'false'));
    renderDictionary();
  });
  $('video-form').addEventListener('submit', event => {
    event.preventDefault();
    const id = parseVideo($('video-url').value.trim());
    $('video-error').textContent = id ? '' : '請貼上有效的 YouTube 單支影片連結。';
    if (id && id !== videoId) chooseSong(id);
  });
  $('lyrics-form').addEventListener('submit', event => {
    event.preventDefault();
    const raw = $('lyrics-input').value.trim();
    const parsed = raw ? raw.split(/\n\s*\n/).map(block => block.split('\n').map(line => line.trim())) : [];
    if (parsed.some(row => row.length !== 3 || row.some(line => !line))) {
      $('lyrics-status').textContent = '每段需要三行：柬文、拼音、中文；段落間請空一行。';
      return;
    }
    lines = parsed;
    renderLyrics();
    try {
      localStorage.setItem(storageKey(videoId), JSON.stringify(lines));
      $('lyrics-status').textContent = '已儲存在這個瀏覽器，僅對應目前這支影片。';
    } catch { $('lyrics-status').textContent = '已套用；瀏覽器無法儲存，重新整理後需再次貼入。'; }
  });
  [['roman-toggle', 'hide-roman', '拼音'], ['lyrics-translation-toggle', 'hide-zh', '中文']].forEach(([id, cls, label]) => {
    $(id).addEventListener('click', () => {
      const hidden = $('lyrics-list').classList.toggle(cls);
      $(id).setAttribute('aria-pressed', String(hidden));
      $(id).textContent = `${hidden ? '顯示' : '隱藏'}${label}`;
    });
  });
  function setMode(singing) {
    $('sing-room').hidden = !singing;
    $('study-room').hidden = singing;
    $('sing-mode').setAttribute('aria-pressed', String(singing));
    $('study-mode').setAttribute('aria-pressed', String(!singing));
    document.title = singing ? '跟唱練習室 | Khmer Learning' : '每日四句 | Khmer Learning';
  }
  $('sing-mode').addEventListener('click', () => setMode(true));
  $('study-mode').addEventListener('click', () => setMode(false));
  const requestedSong = new URL(location.href).searchParams.get('song');
  loadVideo(Object.hasOwn(songs, requestedSong) ? requestedSong : defaultId);
  setMode(!/^#day-/.test(location.hash));
})();

