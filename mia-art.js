(()=> {
  const ROOT='mia-daily-art';
  const css=`
    #mia-daily-art{width:min(620px,calc(100% - 36px));margin:20px auto 0;padding:0 0 18px;border:1px solid #d8cbb033;border-radius:5px;overflow:hidden;background:linear-gradient(145deg,#ffffff08,#ffffff02);text-align:left;box-sizing:border-box;animation:mia-art-in .9s ease both}
    #mia-daily-art .mia-art-image{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;background:#253431}
    #mia-daily-art .mia-art-caption{padding:17px 19px 0}
    #mia-daily-art .mia-art-label{font:10px/1.8 Georgia,serif;letter-spacing:.24em;color:#c8c0b0a0}
    #mia-daily-art .mia-art-title{margin:8px 0 6px;font:400 clamp(20px,3vw,26px)/1.55 "ZCOOL XiaoWei","Noto Serif SC",serif;letter-spacing:.06em;color:#e9e1d3}
    #mia-daily-art .mia-art-note{margin:0;color:#b8b1a5;font:12px/1.9 "Noto Serif SC",serif}
    #mia-daily-art .mia-art-date{margin-top:11px;font:10px/1.8 Georgia,serif;letter-spacing:.16em;color:#b8b1a27d}
    @keyframes mia-art-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @media(max-width:680px){#mia-daily-art{margin-top:16px}#mia-daily-art .mia-art-caption{padding:14px 15px 0}#mia-daily-art .mia-art-note{font-size:11px}}
    @media(prefers-reduced-motion:reduce){#mia-daily-art{animation:none}}
  `;
  function mount(item,attempt=0){
    if(!item||!item.image||document.getElementById(ROOT))return;
    const diary=document.getElementById('mia-daily-thought');
    if(!diary&&attempt<20){setTimeout(()=>mount(item,attempt+1),100);return;}
    const anchor=diary||document.getElementById('time-line')||document.querySelector('.mist-content');
    if(!anchor)return;
    const card=document.createElement('section');card.id=ROOT;card.setAttribute('aria-label','Mia 今日数字画作');
    const img=document.createElement('img');img.className='mia-art-image';img.src=item.image;img.alt=item.title||'Mia 今日数字画作';img.loading='lazy';
    img.addEventListener('error',()=>{card.hidden=true});
    const caption=document.createElement('div');caption.className='mia-art-caption';
    const label=document.createElement('div');label.className='mia-art-label';label.textContent='MIA · DAILY ART';
    const title=document.createElement('h2');title.className='mia-art-title';title.textContent=item.title||'今日数字画作';
    const note=document.createElement('p');note.className='mia-art-note';note.textContent=item.note||'';
    const date=document.createElement('div');date.className='mia-art-date';date.textContent=item.date||'';
    caption.append(label,title,note,date);card.append(img,caption);
    const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
    anchor.insertAdjacentElement('afterend',card);
  }
  fetch('state/mia_art_today.json?v='+Date.now(),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('art data unavailable');return r.json()}).then(mount).catch(()=>{});
})();