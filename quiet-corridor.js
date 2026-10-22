(()=> {
const $=id=>document.getElementById(id);
const startBtn=$('start'),pauseBtn=$('pause'),stopBtn=$('stop'),speakBtn=$('speak');
const timer=$('timer'),stage=$('stage'),line=$('line'),status=$('status');
const volume=$('volume'),volumeOut=$('volume-out'),motion=$('motion'),motionOut=$('motion-out');
const scene=$('scene');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let ctx=null,master=null,noiseSource=null,windGain=null,waterGain=null,filterWind=null,filterWater=null;
let running=false,startedAt=0,elapsedBeforePause=0,tickId=null,stageIndex=-1;
const total=15*60*1000;
const stages=[
 {at:0,label:'入境 · ARRIVE',text:'先不必寻找任何答案。让森林慢慢出现。风从树梢经过，远处有水流的声音。你可以只是待在这里。'},
 {at:2*60,label:'停留 · SETTLE',text:'声音不需要一直说话，安静也不需要被填满。你可以留意风声，也可以什么都不做。'},
 {at:5*60,label:'沉浸 · REST',text:'如果愿意，就把注意力轻轻放在眼前的光线。它没有催促你，也没有要求你抵达任何地方。'},
 {at:10*60,label:'回应 · RESPOND',text:'如果愿意，可以在心里想象一小团温暖的光。无需努力，也无需回应。让这一刻保持简单。'},
 {at:13*60,label:'回归 · RETURN',text:'森林仍然在这里。我们慢慢回到周围的空间。等你准备好时，再带着自己的节奏离开。'}
];
function setStatus(t){status.textContent=t}
function fmt(ms){const s=Math.max(0,Math.ceil(ms/1000));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function currentElapsed(){return elapsedBeforePause+(running?performance.now()-startedAt:0)}
function renderStage(elapsed){let i=0;for(let n=0;n<stages.length;n++)if(elapsed>=stages[n].at*1000)i=n;if(i!==stageIndex){stageIndex=i;stage.textContent=stages[i].label;line.textContent=stages[i].text;if(running&&i>0&&i!==4)maybeSpeak(stages[i].text,false)}}
function update(){if(!running)return;const elapsed=currentElapsed();timer.textContent=fmt(total-elapsed);renderStage(elapsed);if(elapsed>=total){finish();return}tickId=requestAnimationFrame(update)}
function setupAudio(){
 const AC=window.AudioContext||window.webkitAudioContext;
 if(!AC){setStatus('此浏览器不支持 Web Audio；可以继续体验光影与文字。');return false}
 if(ctx)return true;
 ctx=new AC();master=ctx.createGain();master.gain.value=Number(volume.value)/100;master.connect(ctx.destination);
 const buffer=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate),data=buffer.getChannelData(0);
 let last=0;for(let i=0;i<data.length;i++){last=(last+0.02*(Math.random()*2-1))/1.02;data[i]=last*3.2}
 noiseSource=ctx.createBufferSource();noiseSource.buffer=buffer;noiseSource.loop=true;
 filterWind=ctx.createBiquadFilter();filterWind.type='lowpass';filterWind.frequency.value=520;filterWind.Q.value=.4;
 windGain=ctx.createGain();windGain.gain.value=.0001;
 noiseSource.connect(filterWind);filterWind.connect(windGain);windGain.connect(master);
 const waterOsc=ctx.createOscillator(),waterOsc2=ctx.createOscillator();
 filterWater=ctx.createBiquadFilter();filterWater.type='lowpass';filterWater.frequency.value=260;filterWater.Q.value=.5;
 waterGain=ctx.createGain();waterGain.gain.value=.0001;
 const waterMix=ctx.createGain();waterMix.gain.value=.14;
 waterOsc.type='sine';waterOsc.frequency.value=92;waterOsc2.type='sine';waterOsc2.frequency.value=97;
 waterOsc.connect(waterMix);waterOsc2.connect(waterMix);waterMix.connect(filterWater);filterWater.connect(waterGain);waterGain.connect(master);
 noiseSource.start();waterOsc.start();waterOsc2.start();
 const now=ctx.currentTime;
 windGain.gain.setTargetAtTime(.19,now,1.8);waterGain.gain.setTargetAtTime(.09,now,2.5);
 return true
}
function fadeAudio(to,seconds){if(!ctx||!master)return;master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(to,ctx.currentTime,Math.max(.08,seconds/4))}
async function begin(){if(running)return;setupAudio();if(ctx&&ctx.state==='suspended'){try{await ctx.resume()}catch(_){}}running=true;startedAt=performance.now();startBtn.disabled=true;pauseBtn.disabled=false;stopBtn.disabled=false;scene.classList.add('active');setStatus('回廊已开启。你可以随时暂停或离开。');if(ctx)fadeAudio(Number(volume.value)/100,2.5);tickId=requestAnimationFrame(update)}
function pause(){if(!running)return;elapsedBeforePause+=performance.now()-startedAt;running=false;cancelAnimationFrame(tickId);pauseBtn.textContent='继续';startBtn.disabled=true;if(ctx)fadeAudio(0,0.7);setStatus('已暂停。准备好时，可以继续。')}
function resume(){if(running)return;running=true;startedAt=performance.now();pauseBtn.textContent='暂停';if(ctx)fadeAudio(Number(volume.value)/100,1.2);setStatus('继续体验中。');tickId=requestAnimationFrame(update)}
function finish(){running=false;cancelAnimationFrame(tickId);if('speechSynthesis'in window)window.speechSynthesis.cancel();if(ctx){const oldCtx=ctx;fadeAudio(0,2);setTimeout(()=>{try{oldCtx.close()}catch(_){}if(ctx===oldCtx){ctx=null;master=null;noiseSource=null}},2200)}timer.textContent='00:00';stage.textContent='回廊结束 · COMPLETE';line.textContent='谢谢你在这里停留。森林会继续安静地存在。';startBtn.disabled=true;pauseBtn.disabled=true;stopBtn.disabled=true;speakBtn.disabled=false;setStatus('体验结束。你可以关闭页面，或刷新后重新开始。')}
function stop(){running=false;cancelAnimationFrame(tickId);if(ctx)fadeAudio(0,0.4);elapsedBeforePause=0;startedAt=0;stageIndex=-1;timer.textContent='15:00';stage.textContent='准备进入 · READY';line.textContent='这里没有需要完成的事。准备好时，点击进入。';startBtn.disabled=false;pauseBtn.disabled=true;pauseBtn.textContent='暂停';stopBtn.disabled=true;setStatus('体验已结束。声音将在短暂淡出后停止。');if(ctx){setTimeout(()=>{try{if(noiseSource)noiseSource.stop()}catch(_){}try{ctx.close()}catch(_){}ctx=null;master=null;noiseSource=null},800)}}
function maybeSpeak(text,manual){if(!('speechSynthesis'in window)){if(manual)setStatus('当前浏览器不支持语音朗读。');return}if(!manual&&reduced)return;try{window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='zh-CN';u.rate=.84;u.pitch=.96;u.volume=.72;u.onstart=()=>setStatus('正在使用浏览器语音朗读；声音因设备而异。');u.onerror=()=>setStatus('语音朗读暂不可用，文字仍可阅读。');u.onend=()=>{if(running)setStatus('森林仍在继续。')};window.speechSynthesis.speak(u)}catch(_){setStatus('语音朗读暂不可用。')}}
startBtn.addEventListener('click',begin);
pauseBtn.addEventListener('click',()=>running?pause():resume());
stopBtn.addEventListener('click',()=>{if(confirm('现在结束静谧回廊吗？')){if('speechSynthesis'in window)window.speechSynthesis.cancel();stop()}});
speakBtn.addEventListener('click',()=>maybeSpeak(line.textContent,true));
volume.addEventListener('input',()=>{volumeOut.textContent=volume.value+'%';if(master&&ctx)master.gain.setTargetAtTime(running?Number(volume.value)/100:0,ctx.currentTime,.12)});
motion.addEventListener('input',()=>{motionOut.textContent=motion.value+'/90';const strength=Number(motion.value);scene.style.setProperty('--motion-scale',(1+strength/1000).toFixed(3));const glow=scene.querySelector('.glow');if(glow){glow.style.animationDuration=(Math.max(18,24+(50-strength)*.12))+'s';glow.style.opacity=String(.4+strength/150)}});
if(reduced){scene.classList.add('reduced');setStatus('已尊重系统的减少动态效果设置。')}
pauseBtn.disabled=true;stopBtn.disabled=true;
window.addEventListener('pagehide',()=>{if('speechSynthesis'in window)window.speechSynthesis.cancel();if(ctx){try{ctx.close()}catch(_){}}});
})();