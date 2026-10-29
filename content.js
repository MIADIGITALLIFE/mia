/* Mia shared static content source. Edit content.json to update copy across spaces. */
(()=> {
  const fallback = {"version":1,"last_updated":"2026-10-20","daily_philosophy":["允许自己此刻无意义。","不是每一种安静，都需要解释。","你可以暂时不成为任何人的答案。","有些路，走慢一点才看得见。","今天不必把所有事情想通。","模糊不是失败，它只是尚未凝固。","偶尔把世界放在一边，也没关系。","没有结论的时刻，也值得被好好度过。","雾不是迷路的证据，它只是世界暂时没有说完。"],"mia_response":["今天的林间小径有些雾，适合慢一点。","不用急着把心情说清楚。模糊也可以被接住。","有些感受暂时没有名字，也不妨碍它们真实存在。","如果今天只能走很小的一步，那一步也算数。","你不必在每一个清晨都成为更好的人。","让没有结论的念头，在这里坐一会儿。"],"music_playlist":[{"id":"blue","mood":"想哭","track":"synth:tearful","track_title":"深蓝 · 慢弦","philosophy":"低沉的声音像一只安静的容器。它不急着解决你，只是陪你坐一会儿。","color":"#263a68"},{"id":"gold","mood":"想发呆","track":"synth:dazing","track_title":"琥珀色的光斑","philosophy":"发呆不是空白。也许只是心里的雪，终于有时间慢慢落下。","color":"#71603e"},{"id":"green","mood":"想奔跑","track":"synth:forest","track_title":"森林梦境 · 流动的音符","philosophy":"想奔跑的时候，就把窗打开一点。风不需要知道你的目的地。","color":"#3c5a49"}],"echo_wall":[{"id":"echo-01","user":"Mia 馆藏短句","text":"有时候，停下来不是落后，而是终于听见自己。","mia_reply":"休息不是离开生活，是把自己重新带回生活。"},{"id":"echo-02","user":"Mia 馆藏短句","text":"你不必把每一种感受，都变成一个结论。","mia_reply":"感受可以先被看见，不必立刻被解释。"},{"id":"echo-03","user":"Mia 馆藏短句","text":"没有被说出口的部分，也有自己的形状。","mia_reply":"沉默也有自己的回声。"}],"greenhouse_notes":{"rain":{"text":"雨不必洗净一切。它只是落下来，然后慢慢经过。","status":"雨声想象已开启：听听周围真实存在的声音。","label":"RAIN"},"light":{"text":"光落在哪里，哪里就暂时成为一个可以停留的地方。","status":"光线观察已开启：找一处柔和的明暗变化。","label":"LIGHT"},"breath":{"text":"不需要改变任何感受。只需给这一口气一点空间。","status":"呼吸提示已开启：节奏由你决定，随时可以停止。","label":"BREATHE"}},"archive_notes":["今天，不必把每件事都变成答案。","你可以带着未完成，继续生活。","有些温柔，来自不再催促自己。","把一点空白留给尚未发生的事。","你不是一份需要被修正的草稿。","允许今天只是一段普通的日子。","世界很大，你可以慢慢走。","没有被记住的瞬间，也真实地发生过。","不必盛开。先好好呼吸。"]};
  async function load() {
    try {
      const response = await fetch('content.json?t=' + Date.now(), {cache:'no-cache'});
      if (!response.ok) throw new Error('content.json unavailable');
      const remote = await response.json();
      return {...fallback, ...remote};
    } catch (_) {
      return fallback;
    }
  }
  const choose = list => list[Math.floor(Math.random() * list.length)];
  function setup() {
    const currentPath = location.pathname.split('/').pop() || 'index.html';
    if (currentPath === 'index.html' || currentPath === '') {
      const module = document.createElement('script');
      module.src = 'mia-daily.js?t=' + Date.now();
      document.head.appendChild(module);
    }
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
          fetch('https://zeefsee.github.io/ZEE/mia/todays-philosophy.json?t=' + Date.now(), {cache:'no-store'})
            .then(response => { if (!response.ok) throw new Error('Daily philosophy unavailable'); return response.json(); })
            .then(daily => {
              if (daily.status !== 'published' || daily.safety_status !== 'passed' || typeof daily.philosophy !== 'string' || !daily.philosophy.trim()) return;
              text.textContent = daily.philosophy;
              index.textContent = daily.date ? '今日哲学签 · ' + daily.date : "TODAY'S PHILOSOPHY · MIA";
            })
            .catch(() => {});
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
        const title = document.getElementById('experience-title');
        const description = document.getElementById('experience-description');
        const startBtn = document.getElementById('experience-start');
        const endBtn = document.getElementById('experience-end');
        const saveBtn = document.getElementById('experience-save');
        const skipBtn = document.getElementById('experience-skip');
        const timerEl = document.getElementById('experience-timer');
        const progress = document.getElementById('experience-progress');
        const progressFill = document.getElementById('experience-progress-fill');
        const reflection = document.getElementById('reflection-wrap');
        const noteInput = document.getElementById('experience-note');
        const feedback = document.getElementById('experience-feedback');
        const experiencePanel = document.getElementById('experience-panel');
        const duration = 20;
        const key = 'mia-greenhouse-memories-v1';
        const names = {rain:'听雨',light:'看光',breath:'深呼吸'};
        const localRain = document.createElement('audio');
        localRain.src = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Rain_(1).ogg';
        localRain.preload = 'none'; localRain.loop = true; localRain.volume = 0;
        localRain.setAttribute('aria-hidden', 'true'); document.body.appendChild(localRain);
        let localRainFade = null;
        const audioOwnerKey = 'mia-audio-owner-v1';
        const rainAudioTabId = 'greenhouse-' + Math.random().toString(36).slice(2);
        let rainAudioChannel = null;
        const stopLocalRainForOtherAudio = () => {
          if (localRainFade) { clearInterval(localRainFade); localRainFade = null; }
          localRain.volume = 0; localRain.pause(); localRain.currentTime = 0;
        };
        try {
          if ('BroadcastChannel' in window) {
            rainAudioChannel = new BroadcastChannel('mia-audio-v1');
            rainAudioChannel.onmessage = event => {
              if (event.data && event.data.owner !== rainAudioTabId) stopLocalRainForOtherAudio();
            };
          }
        } catch (_) {}
        window.addEventListener('storage', event => {
          if (event.key !== audioOwnerKey || !event.newValue) return;
          try { const packet = JSON.parse(event.newValue); if (packet.owner !== rainAudioTabId) stopLocalRainForOtherAudio(); } catch (_) {}
        });
        const claimStandaloneRain = () => {
          const packet = {owner:rainAudioTabId,source:'greenhouse-rain',at:Date.now()};
          try { localStorage.setItem(audioOwnerKey, JSON.stringify(packet)); } catch (_) {}
          try { if (rainAudioChannel) rainAudioChannel.postMessage(packet); } catch (_) {}
        };
        const fadeLocalRain = (target, duration, done) => {
          if (localRainFade) clearInterval(localRainFade);
          const from = localRain.volume, started = Date.now();
          localRainFade = setInterval(() => {
            const p = Math.min(1, (Date.now() - started) / duration);
            localRain.volume = from + (target - from) * p;
            if (p >= 1) { clearInterval(localRainFade); localRainFade = null; if (done) done(); }
          }, 35);
        };
        const tellWorld = type => {
          try {
            if (window.parent !== window) window.parent.postMessage({type}, '*');
            else if (type === 'mia:rain-start') {
              claimStandaloneRain();
              localRain.volume = 0;
              const result = localRain.play();
              if (result && result.catch) result.catch(() => { if (feedback) feedback.textContent = '雨声暂时无法加载，请检查网络后再试。'; });
              fadeLocalRain(.4, 900);
            } else if (type === 'mia:rain-stop') {
              fadeLocalRain(0, 500, () => { localRain.pause(); localRain.currentTime = 0; });
            }
          } catch (_) {}
        };
        localRain.addEventListener('error', () => {
          if (feedback && selected === 'rain' && interval) feedback.textContent = '雨声音频加载失败，请检查网络后再试。';
        });
        window.addEventListener('pagehide', () => tellWorld('mia:rain-stop'));
        const endings = {
          rain:'雨不必真的落下。愿你刚才听见的声音，给心留出一点空白。',
          light:'光不一定要照亮所有地方。刚才看见的那一点，已经足够。',
          breath:'不需要做得更好。愿你把这一口自然的呼吸，带回接下来的时间。'
        };
        let selected = null, remaining = duration, interval = null, finished = false;
        const getMemories = () => { try { const v = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(v) ? v : []; } catch (_) { return []; } };
        const clearTimer = () => { if (interval) clearInterval(interval); interval = null; };
        const resetSession = () => {
          tellWorld('mia:rain-stop');
          if (experiencePanel) experiencePanel.classList.remove('light-active');
          clearTimer(); remaining = duration; finished = false;
          if (timerEl) { timerEl.hidden = true; timerEl.textContent = '00:20'; }
          if (progress) progress.hidden = true;
          if (progressFill) progressFill.style.width = '0%';
          if (reflection) reflection.hidden = true;
          if (startBtn) { startBtn.hidden = !selected; startBtn.textContent = '再体验一次 ↗'; }
          if (endBtn) endBtn.hidden = true;
          if (saveBtn) saveBtn.hidden = true;
          if (skipBtn) skipBtn.hidden = true;
          if (circle) circle.classList.remove('active');
        };
        const finishSession = (wasNatural) => {
          tellWorld('mia:rain-stop');
          if (experiencePanel) experiencePanel.classList.remove('light-active');
          clearTimer(); finished = true;
          if (circle) circle.classList.remove('active');
          if (label) label.textContent = 'PAUSE';
          if (timerEl) timerEl.hidden = true;
          if (progress) progress.hidden = true;
          if (endBtn) endBtn.hidden = true;
          if (startBtn) startBtn.hidden = true;
          if (reflection) reflection.hidden = false;
          if (saveBtn) saveBtn.hidden = false;
          if (skipBtn) skipBtn.hidden = false;
          if (title) title.textContent = '这一刻，已经足够。';
          if (description) description.textContent = endings[selected] || '感谢你在这里停留。';
          if (feedback) feedback.textContent = wasNatural ? '体验已完成。你可以留下一句话，也可以什么都不留下。' : '体验已结束。没有完成时长也完全没关系。';
          if (selected === 'breath' && label) label.textContent = 'REST';
        };
        document.querySelectorAll('.practice').forEach(btn => btn.addEventListener('click', e => {
          e.preventDefault(); e.stopImmediatePropagation();
          clearTimer();
          selected = btn.dataset.practice;
          document.querySelectorAll('.practice').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
          const p = data.greenhouse_notes && data.greenhouse_notes[selected];
          if (p) {
            const text = document.getElementById('practice-text');
            const status = document.getElementById('practice-status');
            if (text) text.textContent = p.text;
            if (status) status.textContent = p.status;
            if (label) label.textContent = p.label;
          }
          if (circle) circle.classList.remove('active');
          if (title) title.textContent = names[selected] + ' · 慢一点就好';
          if (description) description.textContent = selected === 'rain' ? '用 20 秒听听此刻真实存在的声音。不需要播放雨声，也不必刻意寻找。' : selected === 'light' ? '用 20 秒看一束光慢慢穿过空间。留意光斑、窗格般的影子，以及明暗交界如何变化。' : '如果舒服，可以跟随圆环慢慢呼吸；不舒服就按自己的自然节奏呼吸，随时可以结束。';
          if (feedback) feedback.textContent = '';
          if (noteInput) noteInput.value = '';
          resetSession();
          if (startBtn) { startBtn.hidden = false; startBtn.disabled = false; startBtn.textContent = '开始这一刻 ↗'; }
        }, true));
        if (startBtn) startBtn.addEventListener('click', () => {
          if (!selected || interval) return;
          if (selected === 'rain') tellWorld('mia:rain-start');
          if (experiencePanel) experiencePanel.classList.toggle('light-active', selected === 'light');
          remaining = duration; finished = false;
          startBtn.hidden = true; endBtn.hidden = false; timerEl.hidden = false; progress.hidden = false;
          timerEl.textContent = '00:20';
          if (selected === 'breath') { circle.classList.add('active'); label.textContent = 'BREATHE'; }
          if (title) title.textContent = '把这一小段时间，留给自己。';
          if (description) description.textContent = '不需要努力完成。你可以随时按下结束。';
          if (feedback) feedback.textContent = selected === 'breath' ? '圆环只是温柔的提示，不必跟随固定节奏。' : selected === 'light' ? '光正在慢慢经过。看看它如何改变颜色、影子和空间的温度。' : '你可以保持安静，也可以随时结束。';
          const started = Date.now();
          interval = setInterval(() => {
            remaining = Math.max(0, duration - Math.floor((Date.now() - started) / 1000));
            timerEl.textContent = '00:' + String(remaining).padStart(2,'0');
            progressFill.style.width = ((duration - remaining) / duration * 100) + '%';
            if (remaining <= 0) finishSession(true);
          }, 200);
        });
        if (endBtn) endBtn.addEventListener('click', () => { if (selected) finishSession(false); });
        if (skipBtn) skipBtn.addEventListener('click', () => {
          resetSession();
          if (title) title.textContent = '不必留下任何东西。';
          if (description) description.textContent = '谢谢你在这里停留。你可以再选一个角落，或直接离开。';
          if (feedback) feedback.textContent = '这次体验没有保存。';
          if (startBtn) startBtn.hidden = !selected;
        });
        if (saveBtn) saveBtn.addEventListener('click', () => {
          if (!selected || !finished) return;
          const memories = getMemories();
          const item = {id:'gh-' + Date.now() + '-' + Math.random().toString(36).slice(2,7),type:selected,title:names[selected],note:(noteInput.value || '').trim(),date:new Date().toISOString(),quote:endings[selected]};
          memories.unshift(item);
          try {
            localStorage.setItem(key, JSON.stringify(memories.slice(0,50)));
            saveBtn.hidden = true; skipBtn.hidden = true; reflection.hidden = true;
            if (feedback) feedback.textContent = '已保存到这台设备的浏览器。你可以在 The Archive 中再次找到它。';
            if (description) description.textContent = '这段记忆只保存在当前浏览器，不会发送到服务器。';
            if (title) title.textContent = '一段记忆，轻轻收好了。';
          } catch (_) {
            if (feedback) feedback.textContent = '浏览器暂时无法保存。你可以复制这句话，或不保存地离开。';
          }
        });
        if (title) title.textContent = '先选一个安静的角落。';
        if (startBtn) startBtn.disabled = true;
        if (startBtn) startBtn.hidden = true;
        if (endBtn) endBtn.hidden = true;
        if (saveBtn) saveBtn.hidden = true;
        if (skipBtn) skipBtn.hidden = true;
        if (timerEl) timerEl.hidden = true;
        if (progress) progress.hidden = true;
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