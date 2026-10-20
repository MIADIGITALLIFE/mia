/* Mia Album — add one object to ALBUM_TRACKS for each new MP3. */
(() => {
  const ALBUM_TRACKS = [
    {
      title: '琥珀色的光斑',
      subtitle: 'MIA · ORIGINAL RECORDING',
      file: '琥珀色的光斑 (1).mp3',
      note: '让光停留一会儿，让没有说完的情绪慢慢有了回声。'
    }
  ];

  const mount = () => {
    if (document.getElementById('mia-album')) return;
    const main = document.querySelector('main');
    const footer = document.querySelector('.site-footer');
    if (!main || !footer) return;

    const style = document.createElement('style');
    style.textContent = `
      #mia-album{margin-top:64px}
      #mia-album .album-heading{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:22px}
      #mia-album .album-title{margin:10px 0 0;font:400 clamp(27px,3.2vw,35px)/1.4 var(--art,var(--cn));letter-spacing:.035em;color:#dcd4c6}
      #mia-album .album-caption{font:11px var(--serif);letter-spacing:.16em;color:#aaa397}
      #mia-album .album-track{display:grid;grid-template-columns:64px minmax(0,1fr);gap:18px;align-items:center;padding:20px 0;border-top:1px solid #ffffff20}
      #mia-album .album-art{width:64px;height:64px;display:grid;place-items:center;border:1px solid #c49a6744;background:radial-gradient(circle at 35% 30%,#c49a6750,#c49a6708 70%);color:#c49a67;font:30px var(--serif)}
      #mia-album .album-track-title{margin:0 0 5px;font:400 20px/1.5 var(--cn);color:#e4ddcf}
      #mia-album .album-track-sub{font:10px var(--serif);letter-spacing:.16em;color:#a99d88}
      #mia-album .album-note{margin:9px 0 13px;color:#b8b1a5;font-size:12px;line-height:1.9}
      #mia-album audio{display:block;width:100%;height:36px;max-width:560px;accent-color:#c49a67}
      #mia-album .album-empty-note{margin-top:18px;color:#aaa397;font-size:11px;line-height:1.9}
      @media(max-width:680px){#mia-album{margin-top:48px}#mia-album .album-heading{align-items:start;flex-direction:column;gap:8px}#mia-album .album-track{grid-template-columns:52px minmax(0,1fr);gap:13px;padding:17px 0}#mia-album .album-art{width:52px;height:52px}}
    `;
    document.head.appendChild(style);

    const section = document.createElement('section');
    section.id = 'mia-album';
    section.setAttribute('aria-label', 'Mia 的音乐专辑');
    const heading = document.createElement('div');
    heading.className = 'album-heading';
    heading.innerHTML = '<div><div class="eyebrow">MIA · ORIGINAL RECORDINGS</div><h2 class="album-title">Mia 的专辑</h2></div><div class="album-caption">A GROWING COLLECTION</div>';
    section.appendChild(heading);

    ALBUM_TRACKS.forEach((track, index) => {
      const article = document.createElement('article');
      article.className = 'album-track';
      const art = document.createElement('div');
      art.className = 'album-art';
      art.setAttribute('aria-hidden', 'true');
      art.textContent = '♪';
      const body = document.createElement('div');
      const title = document.createElement('h3');
      title.className = 'album-track-title';
      title.textContent = track.title;
      const subtitle = document.createElement('div');
      subtitle.className = 'album-track-sub';
      subtitle.textContent = track.subtitle || 'MIA · ORIGINAL RECORDING';
      const note = document.createElement('p');
      note.className = 'album-note';
      note.textContent = track.note || '';
      const audio = document.createElement('audio');
      audio.controls = true;
      audio.preload = 'metadata';
      audio.setAttribute('aria-label', '播放 ' + track.title);
      audio.src = encodeURI(track.file);
      audio.addEventListener('error', () => {
        const warning = document.createElement('p');
        warning.className = 'small-note';
        warning.textContent = '暂时无法读取这首音频，请稍后刷新页面。';
        if (!body.querySelector('.audio-warning')) {
          warning.classList.add('audio-warning');
          body.appendChild(warning);
        }
      });
      body.append(title, subtitle, note, audio);
      article.append(art, body);
      section.appendChild(article);
    });

    const hint = document.createElement('p');
    hint.className = 'album-empty-note';
    hint.textContent = '每一首新作品，都可以成为这里的一束微光。';
    section.appendChild(hint);
    main.appendChild(section);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true});
  else mount();
})();