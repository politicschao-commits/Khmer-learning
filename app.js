(() => {
  'use strict';
  const lessons = window.KHMER_LESSONS;
  const $ = id => document.getElementById(id);
  if (!Array.isArray(lessons) || !lessons.length) {
    $('lesson-title').textContent = '課程暫時無法載入，請重新整理頁面。';
    return;
  }
  let selected = 0;
  let hideTranslations = false;
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  $('lesson-count').textContent = lessons.length;
  $('sentence-count').textContent = lessons.reduce((sum, lesson) => sum + lesson.sentences.length, 0);
  $('vocab-count').textContent = new Set(lessons.flatMap(lesson => lesson.sentences.flatMap(sentence => sentence.vocab.map(word => word.kh.normalize('NFC'))))).size;
  lessons.forEach((lesson, index) => {
    const button = node('button', 'lesson-choice');
    button.type = 'button';
    button.append(node('span', '', `DAY ${String(lesson.day).padStart(2, '0')}`), node('strong', '', lesson.title));
    button.addEventListener('click', () => select(index));
    $('lesson-list').append(button);
  });
  function render() {
    const lesson = lessons[selected];
    document.title = `Day ${lesson.day} · ${lesson.title} | Khmer Learning`;
    $('day-label').textContent = `DAILY PRACTICE / DAY ${String(lesson.day).padStart(2, '0')}`;
    $('lesson-title').textContent = lesson.title;
    $('lesson-description').textContent = lesson.description;
    $('song-title').textContent = lesson.song;
    $('song-link').href = `https://www.youtube.com/results?search_query=${encodeURIComponent(lesson.search)}`;
    $('lesson').replaceChildren();
    lesson.sentences.forEach((sentence, index) => {
      const card = node('article', 'sentence-card');
      const kh = node('h3', 'kh', sentence.kh);
      kh.lang = 'km';
      card.append(node('span', 'sentence-number', `SENTENCE ${String(index + 1).padStart(2, '0')}`), kh, node('div', 'roman', sentence.roman), node('p', 'translation', sentence.zh));
      const vocab = node('div', 'vocab');
      sentence.vocab.forEach(word => {
        const row = node('div', 'vocab-row');
        const term = node('span', '', word.kh);
        term.lang = 'km';
        row.append(term, node('span', 'vocab-roman', word.roman), node('span', 'vocab-meaning', word.zh));
        vocab.append(row);
      });
      card.append(vocab);
      $('lesson').append(card);
    });
    [...$('lesson-list').children].forEach((button, index) => button.setAttribute('aria-current', String(index === selected)));
    $('previous').disabled = selected === 0;
    $('next').disabled = selected === lessons.length - 1;
    $('position').textContent = `第 ${selected + 1} 課 ／ 共 ${lessons.length} 課`;
    applyVisibility();
  }
  function applyVisibility() {
    $('lesson').classList.toggle('hide-translations', hideTranslations);
    $('translation-toggle').textContent = hideTranslations ? '顯示中文' : '隱藏中文';
    $('translation-toggle').setAttribute('aria-pressed', String(hideTranslations));
    $('lesson').querySelectorAll('.translation, .vocab-meaning').forEach(element => element.setAttribute('aria-hidden', String(hideTranslations)));
  }
  function select(index) {
    if (index < 0 || index >= lessons.length) return;
    selected = index;
    history.replaceState(null, '', `#${lessons[index].id}`);
    render();
  }
  function readHash() {
    const index = lessons.findIndex(lesson => `#${lesson.id}` === location.hash);
    selected = index >= 0 ? index : 0;
    render();
  }
  $('previous').addEventListener('click', () => select(selected - 1));
  $('next').addEventListener('click', () => select(selected + 1));
  $('translation-toggle').addEventListener('click', () => { hideTranslations = !hideTranslations; applyVisibility(); });
  window.addEventListener('hashchange', readHash);
  readHash();
})();
