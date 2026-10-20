/* Mia shared static content source. Edit content.json to update copy across spaces. */
(()=> {
  const fallback = {"version":1,"last_updated":"2026-10-20","daily_philosophy":["允许自己此刻无意义。","不是每一种安静，都需要解释。","你可以暂时不成为任何人的答案。","有些路，走慢一点才看得见。","今天不必把所有事情想通。","模糊不是失败，它只是尚未凝固。","偶尔把世界放在一边，也没关系。","没有结论的时刻，也值得被好好度过。","雾不是迷路的证据，它只是世界暂时没有说完。"],"mia_response":["今天的林间小径有些雾，适合慢一点。","不用急着把心情说清楚。模糊也可以被接住。","有些感受暂时没有名字，也不妨碍它们真实存在。","如果今天只能走很小的一步，那一步也算数。","你不必在每一个清晨都成为更好的人。","让没有结论的念头，在这里坐一会儿。"],"music_playlist":[{"id":"blue","mood":"想哭","track":"mia-background.mp3","track_title":"深蓝 · Mia 原声","philosophy":"低沉的声音像一只安静的容器。它不急着解决你，只是陪你坐一会儿。","color":"#263a68"},{"id":"gold","mood":"想发呆","track":"琥珀色的光斑 (1).mp3","track_title":"琥珀色的光斑","philosophy":"发呆不是空白。也许只是心里的雪，终于有时间慢慢落下。","color":"#71603e"},{"id":"green","mood":"想奔跑","track":"The Forest of Dreams.mp3","track_title":"The Forest of Dreams","philosophy":"想奔跑的时候，就把窗打开一点。风不需要知道你的目的地。","color":"#3c5a49"}],"echo_wall":[{"id":"echo-01","user":"Mia 馆藏短句","text":"有时候，停下来不是落后，而是终于听见自己。","mia_reply":"休息不是离开生活，是把自己重新带回生活。"},{"id":"echo-02","user":"Mia 馆藏短句","text":"你不必把每一种感受，都变成一个结论。","mia_reply":"感受可以先被看见，不必立刻被解释。"},{"id":"echo-03","user":"Mia 馆藏短句","text":"没有被说出口的部分，也有自己的形状。","mia_reply":"沉默也有自己的回声。"}],"greenhouse_notes":{"rain":{"text":"雨不必洗净一切。它只是落下来，然后慢慢经过。","status":"雨声想象已开启：听听周围真实存在的声音。","label":"RAIN"},"light":{"text":"光落在哪里，哪里就暂时成为一个可以停留的地方。","status":"光线观察已开启：找一处柔和的明暗变化。","label":"LIGHT"},"breath":{"text":"不需要改变任何感受。只需给这一口气一点空间。","status":"呼吸提示已开启：节奏由你决定，随时可以停止。","label":"BREATHE"}},"archive_notes":["今天，不必把每件事都变成答案。","你可以带着未完成，继续生活。","有些温柔，来自不再催促自己。","把一点空白留给尚未发生的事。","你不是一份需要被修正的草稿。","允许今天只是一段普通的日子。","世界很大，你可以慢慢走。","没有被记住的瞬间，也真实地发生过。","不必盛开。先好好呼吸。"]};
  async function load() {
    try {
      const response = await fetch('content.json?v=' + encodeURIComponent(fallback.last_updated), {cache:'no-cache'});
      if (!response.ok) throw new Error('content.json unavailable');
      const remote = await response.json();
      return {...fallback, ...remote};
    } catch (_) {
      return fallback;
    }
  }
  const choose = list => list[Math.floor(Math.random() * list.length)];
  function setup() {
    load().then(data => {
      const path = location.pathname.split('/').pop() || 'index.html';
      if (path === 'index.html' || path === '') {
        const line = document.getElementById('time-line');
        if (line && Array.isArray(data.mia_response)) line.textContent = choose(data.mia_response);
      }
      if (path === 'bar.html') {
        const text = document.getElementById('fortune-text');
        const index = document.getElementById('fortune-index');
        const button = document.getElementById('next-fortune');
        const fortunes = Array.isArray(data.daily_philosophy) ? data.daily_philosophy : fallback.daily_philosophy;
        let current = -1;
        const next = () => {
          let n = Math.floor(Math.random() * fortunes.length);
          if (fortunes.length > 1) while (n === current) n = Math.floor(Math.random() * fortunes.length);
          current = n;
          text.style.opacity = 0;
          setTimeout(() => { text.textContent = fortunes[n]; text.style.opacity = 1; index.textContent = '今日哲学签 · ' + String(n + 1).padStart(2, '0'); }, 220);
        };
        if (text && index && button) {
          next();
          button.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); next(); }, true);
        }
        const wall = document.querySelector('.resonance .grid-3');
        if (wall && Array.isArray(data.echo_wall)) {
          wall.replaceChildren();
          data.echo_wall.forEach(item => {
            const article = document.createElement('article');
            article.className = 'quote-card';
            article.append(document.createTextNode(item.text || ''));
            const small = document.createElement('small');
            small.textContent = '— ' + (item.user || 'Mia 馆藏短句');
            article.appendChild(small);
            if (item.mia_reply) {
              const reply = document.createElement('p');
              reply.className = 'echo-reply';
              reply.textContent = 'Mia：' + item.mia_reply;
              article.appendChild(reply);
            }
            wall.appendChild(article);
          });
        }
      }
      if (path === 'music.html') {
        const quote = document.getElementById('quote');
        const detail = document.getElementById('track-detail');
        const wave = document.getElementById('wave');
        const cards = [...document.querySelectorAll('.mood-card')];
        cards.forEach(card => card.addEventListener('click', e => {
          const item = (data.music_playlist || []).find(x => x.id === card.dataset.mood);
          if (!item) return;
          e.preventDefault();
          e.stopImmediatePropagation();
          cards.forEach(c => c.setAttribute('aria-pressed', String(c === card)));
          if (quote) quote.textContent = item.philosophy;
          if (detail) detail.textContent = item.track_title || '已切换背景音乐';
          if (wave) wave.classList.add('playing');
          if (item.color) document.body.style.background = 'radial-gradient(ellipse at 50% 0%,' + item.color + '88 0,transparent 48%),linear-gradient(155deg,#080c18,#0b0c13 70%)';
          try { if (window.parent !== window) window.parent.postMessage({type:'mia:track', track:item.track, title:item.track_title || item.mood}, '*'); } catch (_) {}
        }, true));
      }
      if (path === 'greenhouse.html') {
        const circle = document.getElementById('breath-circle');
        const label = document.getElementById('breath-label');
        document.querySelectorAll('.practice').forEach(btn => btn.addEventListener('click', e => {
          const p = data.greenhouse_notes && data.greenhouse_notes[btn.dataset.practice];
          if (!p) return;
          e.preventDefault();
          e.stopImmediatePropagation();
          document.querySelectorAll('.practice').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
          const text = document.getElementById('practice-text');
          const status = document.getElementById('practice-status');
          if (text) text.textContent = p.text;
          if (status) status.textContent = p.status;
          if (label) label.textContent = p.label;
          if (circle) circle.classList.toggle('active', btn.dataset.practice === 'breath');
        }, true));
      }
      if (path === 'archive.html') {
        const note = document.getElementById('daily-note');
        const saved = document.getElementById('saved-card');
        const button = document.getElementById('new-note');
        const notes = Array.isArray(data.archive_notes) ? data.archive_notes : fallback.archive_notes;
        let current = -1;
        const next = () => {
          let n = Math.floor(Math.random() * notes.length);
          if (notes.length > 1) while (n === current) n = Math.floor(Math.random() * notes.length);
          current = n;
          if (note) note.textContent = notes[n];
          if (saved) {
            saved.classList.add('show');
            saved.replaceChildren();
            const t = document.createElement('div'); t.textContent = notes[n];
            const small = document.createElement('small'); small.textContent = 'MIA · A MOMENT OF WHITE SPACE';
            saved.append(t, small);
          }
        };
        if (button) button.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); next(); }, true);
        if (note) note.textContent = choose(notes);
      }
    });
  }
  window.MiaContent = {load};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, {once:true});
  else setup();
})();