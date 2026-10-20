(() => {
  const ROOT = 'mia-daily-thought';
  const styles = `
    #mia-daily-thought{width:min(520px,calc(100% - 36px));margin:24px auto 0;padding:18px 20px 16px;border:1px solid #d8cbb033;border-radius:4px;background:linear-gradient(135deg,#ffffff05,var(--mia-diary-tint,#e0f7fa12));text-align:center;box-sizing:border-box;animation:mia-diary-in .8s ease both}
    #mia-daily-thought .mia-daily-label{font:10px/1.8 Georgia,serif;letter-spacing:.24em;color:#c8c0b0a0}
    #mia-daily-thought .mia-daily-copy{margin:10px 0 8px;font:400 14px/1.95 "KaiTi","STKaiti","Kaiti SC",serif;letter-spacing:.035em;color:#eee8d9d9}
    #mia-daily-thought .mia-daily-meta{font:10px/1.8 Georgia,serif;letter-spacing:.13em;color:#b8b1a27d}
    @keyframes mia-diary-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    @media(max-width:680px){#mia-daily-thought{margin-top:18px;padding:15px 16px}#mia-daily-thought .mia-daily-copy{font-size:13px}}
  `;
  function singaporeDate() {
    const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return values.year + '-' + values.month + '-' + values.day;
  }
  function mount(entry, date) {
    if (!entry || document.getElementById(ROOT)) return;
    const anchor = document.getElementById('time-line') || document.querySelector('.mist-content');
    if (!anchor) return;
    const card = document.createElement('section');
    card.id = ROOT;
    card.setAttribute('aria-label', 'Mia 的每日手记');
    card.innerHTML = '<div class="mia-daily-label">MIA · DAILY NOTE</div><p class="mia-daily-copy"></p><div class="mia-daily-meta"></div>';
    card.querySelector('.mia-daily-copy').textContent = entry.thought || '今天，留一点空白给尚未发生的事。';
    card.querySelector('.mia-daily-meta').textContent = (date || 'A QUIET MOMENT') + (entry.sound_hint ? '  ·  SOUND ' + String(entry.sound_hint).toUpperCase() : '');
    if (entry.color && /^#[0-9a-f]{6}$/i.test(entry.color)) card.style.setProperty('--mia-diary-tint', entry.color + '18');
    const style = document.createElement('style');
    style.textContent = styles;
    document.head.appendChild(style);
    anchor.insertAdjacentElement('afterend', card);
  }
  fetch('mia_diary.json?v=' + encodeURIComponent(singaporeDate()), {cache:'no-cache'})
    .then(response => {if (!response.ok) throw new Error('Diary unavailable'); return response.json();})
    .then(diary => {
      const today = singaporeDate();
      if (diary[today]) return mount(diary[today], today);
      const previous = Object.keys(diary).filter(date => /^d{4}-d{2}-d{2}$/.test(date) && date <= today).sort().pop();
      if (previous) mount(diary[previous], previous);
    })
    .catch(() => {});
})();