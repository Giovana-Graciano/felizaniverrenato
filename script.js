const $=s=>document.querySelector(s);
const intro=$("#intro"),site=$("#site"),startBtn=$("#startBtn"),grid=$("#cardsGrid"),modal=$("#modal"),cardWindow=$("#cardWindow"),cardContent=$("#cardContent"),closeCard=$("#closeCard"),musicBar=$("#musicBar"),musicName=$("#musicName"),musicPause=$("#musicPause"),playlistContent=$("#playlistContent");
let cards=[];
let audio=null;
const fallback = [{"id": "fluminense", "nome": "AMIGO 1", "titulo": "STADIUM MODE", "icon": "⚽", "hint": "MATCH START • TRICOLOR POWER", "tipoDeAnimacao": "stadium", "mensagem": "Aqui vai a mensagem do amigo. O cartão pode receber histórias, fotos e uma trilha sonora escolhida por ele.", "fotos": [], "musica": "", "musicaNome": ""}, {"id": "dino", "nome": "AMIGO 2", "titulo": "JURASSIC MODE", "icon": "🦖", "hint": "FOSSIL FOUND • CHILDHOOD", "tipoDeAnimacao": "dino", "mensagem": "Uma homenagem jurássica para o Renatinho. Aqui entram lembranças da infância e aquela nostalgia boa.", "fotos": [], "musica": "", "musicaNome": ""}, {"id": "onepiece", "nome": "AMIGO 3", "titulo": "PIRATE MODE", "icon": "☠️", "hint": "QUEST START • NEW ADVENTURE", "tipoDeAnimacao": "pirate", "mensagem": "Uma mensagem de aventura para o capitão. Fotos, histórias e memórias podem aparecer neste cartão.", "fotos": [], "musica": "", "musicaNome": ""}, {"id": "music", "nome": "AMIGO 4", "titulo": "MUSIC MODE", "icon": "♫", "hint": "PRESS PLAY • TRACK FOUND", "tipoDeAnimacao": "music", "mensagem": "Este cartão é para uma dedicatória musical. O amigo escolhe a faixa e a música começa quando o cartão é aberto.", "fotos": [], "musica": "", "musicaNome": ""}, {"id": "books", "nome": "AMIGO 5", "titulo": "BOOK MODE", "icon": "📖", "hint": "CHAPTER FOUND • TURN PAGE", "tipoDeAnimacao": "books", "mensagem": "CAPÍTULO ESPECIAL. Uma dedicatória em formato de livro para uma amizade que merece muitas páginas.", "fotos": [], "musica": "", "musicaNome": ""}, {"id": "secret", "nome": "AMIGO 6", "titulo": "SECRET MODE", "icon": "★", "hint": "CLASSIFIED FILE • DO NOT OPEN", "tipoDeAnimacao": "secret", "mensagem": "Arquivo secreto. Esta mensagem será publicada pela administradora quando chegar a hora.", "fotos": [], "musica": "", "musicaNome": ""}];

async function loadCards(){
  try{
    const r=await fetch("cards/cards.json?v=8",{cache:"no-store"});
    if(!r.ok) throw new Error("cards.json");
    cards=await r.json();
  }catch(e){cards=fallback}
  renderCards();
  renderPlaylist();
}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function renderCards(){
  grid.innerHTML=cards.map(c=>`
    <article class="memory-card card-${esc(c.tipoDeAnimacao)}" data-id="${esc(c.id)}">
      <div class="shine"></div><div class="corner">NEW!!!</div>
      <div class="icon">${esc(c.icon||"★")}</div>
      <h4>${esc(c.titulo||"MEMORY CARD")}</h4>
      <p>${esc(c.hint||"CLICK TO OPEN")}</p>
      <div class="open-label">▶ OPEN CARD ◀</div>
    </article>`).join("");
  grid.querySelectorAll(".memory-card").forEach(el=>el.addEventListener("click",()=>openCard(el.dataset.id)));
}
function renderPlaylist(){
  const tracks=cards.filter(c=>c.musica);
  if(!tracks.length)return;
  playlistContent.innerHTML=tracks.map(c=>`<div class="disc">💿</div><div><b>${esc(c.nome)}</b><p>♫ ${esc(c.musicaNome||"TRACK")}</p></div>`).join("");
}
function initAudio(){
  try{
    const C=window.AudioContext||window.webkitAudioContext;
    if(!C)return;
    if(!window._ctx)window._ctx=new C();
    if(window._ctx.state==="suspended")window._ctx.resume();
  }catch(e){}
}
function tone(freq=440,d=.05){
  try{
    initAudio();const ctx=window._ctx;if(!ctx)return;
    const o=ctx.createOscillator(),g=ctx.createGain();o.type="square";o.frequency.value=freq;o.connect(g);g.connect(ctx.destination);
    g.gain.setValueAtTime(.035,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+d);o.start();o.stop(ctx.currentTime+d);
  }catch(e){}
}
function startMusic(c){
  stopMusic();
  const m=c.cardConfig?.musica||{};
  const type=m.type||(/spotify/i.test(c.musicaNome||"")?"spotify":/youtube/i.test(c.musicaNome||"")?"youtube":(c.musica?.startsWith("data:audio/")?"file":"none"));
  const src=c.musica||m.url||"";
  if(!src)return;
  musicName.textContent=`♫ ${c.musicaNome||"NOW PLAYING"}`;
  musicBar.classList.remove("hidden");
  if(type==="file" && src.startsWith("data:audio/")){
    audio=new Audio(src);audio.loop=true;
    audio.play().catch(()=>{});
    musicPause.textContent="❚❚";
    return;
  }
  let embed="";
  try{
    const u=new URL(src);
    if(type==="youtube"){
      const id=u.hostname.includes("youtu.be")?u.pathname.slice(1):u.searchParams.get("v");
      if(id)embed=`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    }
    if(type==="spotify"){
      const m=u.pathname.match(/\/(track|album|playlist|episode|show)\/([^/?]+)/);
      if(m)embed=`https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&autoplay=1`;
    }
  }catch(e){}
  if(embed){
    const iframe=document.createElement("iframe");
    iframe.id="externalMusic";iframe.src=embed;iframe.allow="autoplay; encrypted-media";iframe.style.cssText="position:absolute;width:1px;height:1px;opacity:.01;pointer-events:none";
    cardWindow.appendChild(iframe);
  }
}
function stopMusic(){
  if(audio){audio.pause();audio.currentTime=0;audio=null}
  document.querySelector("#externalMusic")?.remove();
  musicBar.classList.add("hidden");
}
function openCard(id){
  const c=cards.find(x=>x.id===id);if(!c)return;
  initAudio();tone(520,.04);setTimeout(()=>tone(780,.07),35);
  startMusic(c);
  cardWindow.className=`card-window anim-${c.tipoDeAnimacao||"secret"} opening`;
  $("#modalFile").textContent=`${String(c.id).toUpperCase()}.EXE`;
  cardContent.innerHTML=`
    <div class="card-hero">
      <div class="big-icon">${esc(c.icon||"★")}</div>
      <div><div class="tiny">★ CLASSIFIED FRIEND MESSAGE ★</div><h3>${esc(c.titulo||"FELIZ ANIVERSÁRIO")}</h3><div class="from">DE: ${esc(c.nome||"UM AMIGO")}</div></div>
    </div>
    <div class="msg">${esc(c.mensagem||"Feliz aniversário, Renatinho!").replace(/\n/g,"<br>")}</div>
    ${c.fotos?.length?`<div style="margin-top:15px;display:flex;gap:10px;flex-wrap:wrap">${c.fotos.map(f=>`<img src="${f.data||f}" style="max-width:180px;max-height:180px;border:5px ridge #fff;box-shadow:5px 5px #000">`).join("")}</div>`:""}`;
  modal.classList.remove("hidden");modal.setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
}
function close(){
  stopMusic();modal.classList.add("hidden");modal.setAttribute("aria-hidden","true");document.body.style.overflow="";
}
startBtn.addEventListener("click",()=>{tone(320,.05);setTimeout(()=>tone(520,.09),55);intro.classList.add("intro-exit");setTimeout(()=>{intro.classList.add("hidden");site.classList.remove("hidden");window.scrollTo(0,0)},550)});
closeCard.addEventListener("click",close);
modal.addEventListener("click",e=>{if(e.target.classList.contains("modal-backdrop"))close()});
musicPause.addEventListener("click",()=>{if(audio){if(audio.paused){audio.play();musicPause.textContent="❚❚"}else{audio.pause();musicPause.textContent="▶"}}});
document.querySelectorAll(".nav-btn").forEach(b=>b.addEventListener("click",()=>document.getElementById(b.dataset.scroll)?.scrollIntoView({behavior:"smooth"}) ));
document.addEventListener("pointermove",e=>{const s=document.createElement("span");s.textContent=["✦","·","★","✧"][Math.floor(Math.random()*4)];s.style.cssText=`position:fixed;left:${e.clientX}px;top:${e.clientY}px;color:#ffe04a;pointer-events:none;z-index:9998;font-weight:bold;animation:cursorFade .5s forwards`;document.body.appendChild(s);setTimeout(()=>s.remove(),500)});
const style=document.createElement("style");style.textContent="@keyframes cursorFade{to{transform:translateY(-15px) scale(.2);opacity:0}}.intro-exit{animation:introExit .55s forwards}@keyframes introExit{to{transform:scale(1.04);filter:brightness(2);opacity:0}}";document.head.appendChild(style);
loadCards();
