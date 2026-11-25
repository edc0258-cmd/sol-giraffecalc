// 기린서버 생활 계산기 — 공통 로그인·권한 처리 (by.진솔)
(()=>{
  if(window.Auth&&window.Auth.__v){const n=()=>window.Auth.nav();document.readyState==='loading'?document.addEventListener('DOMContentLoaded',n,{once:true}):n();return}
  const cfg=window.SB_CONFIG||{};
  const sb=window.__MOCK_SB__||(cfg.url&&cfg.key&&window.supabase?window.supabase.createClient(cfg.url,cfg.key):null);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ROLE_PAGE={'요리사':'요리 계산기','연금술사':'연금술 계산기','운영자':'운영자 페이지'};
  const nameOf=u=>{const m=(u&&u.user_metadata)||{};return (m.custom_claims&&m.custom_claims.global_name)||m.full_name||m.name||'디스코드 사용자'};
  let info={configured:!!sb,user:null,member:false,roles:[],admin:false,discordId:'',name:'',mcName:''};
  const subs=[];

  function can(need,i=info){
    if(!need)return true;
    if(!i.configured)return true;
    if(need==='member')return i.member;
    return i.member&&(i.admin||i.roles.includes(need));
  }
  async function refresh(){
    if(!sb)return info;
    const {data}=await sb.auth.getSession();
    const user=data&&data.session?data.session.user:null;
    const n={configured:true,user,member:false,roles:[],admin:false,discordId:'',name:user?nameOf(user):'',mcName:''};
    if(user){
      const {data:d,error}=await sb.rpc('my_info');
      if(!error&&d){n.member=!!d.member;n.roles=Array.isArray(d.roles)?d.roles:[];n.admin=n.roles.includes('운영자');n.discordId=d.discord_id||'';n.mcName=d.mc_name||''}
    }
    info=n;return info;
  }
  const login=()=>sb&&sb.auth.signInWithOAuth({provider:'discord',options:{redirectTo:location.href.split('#')[0].split('?')[0]}});
  const logout=async()=>{if(sb)await sb.auth.signOut();location.reload()};

  const css=`.sitenav .in>*{flex:none}.sitenav a[data-need]{display:none}.sitenav a[data-need].ok{display:flex}
.sn-auth{margin-left:auto;display:flex;align-items:center;gap:8px;padding-left:12px;white-space:nowrap;color:#c9c4d6;font-size:14px}
.sn-auth b{color:#fff}.sn-auth .rl{font-size:12px;color:#f2c14e}
.sn-auth button{font:700 13px "Noto Sans KR",sans-serif;min-height:32px;padding:0 12px;border-radius:8px;border:0;cursor:pointer;background:#5865F2;color:#fff}
.sn-auth button.out{background:transparent;color:#c9c4d6;border:1px solid #4a4560}
.agate{max-width:560px;margin:clamp(24px,6vw,64px) auto;padding:28px 24px;border-radius:16px;text-align:center;background:light-dark(#f3f1f6,#1c1a22);color:light-dark(#1b1820,#f0edf4);font:16px/1.55 "Noto Sans KR",system-ui,sans-serif}
.agate h2{font:400 30px/1.1 "DHsite","Do Hyeon","Noto Sans KR",sans-serif;margin:0 0 10px}
.agate p{margin:0 0 16px;color:light-dark(#625c6b,#a59fae)}
.agate .id{display:inline-flex;gap:8px;align-items:center;background:light-dark(#fff,#121017);border:1px solid light-dark(#ddd8e2,#302b39);border-radius:10px;padding:6px 6px 6px 12px;font-weight:700;margin-bottom:12px}
.agate button{font:700 15px "Noto Sans KR",sans-serif;min-height:42px;padding:0 16px;border-radius:10px;border:0;cursor:pointer;background:#5865F2;color:#fff}
.agate button.cp{min-height:32px;padding:0 10px;font-size:13px;background:transparent;color:inherit;border:1px solid currentColor}`;
  function injectCss(){if(document.getElementById('auth-css'))return;const s=document.createElement('style');s.id='auth-css';s.textContent=css;document.head.appendChild(s)}

  function nav(){
    injectCss();
    for(const a of document.querySelectorAll('.sitenav a[data-need]'))a.classList.toggle('ok',can(a.dataset.need));
    const box=document.querySelector('.sitenav .in');if(!box||!sb)return;
    let w=box.querySelector('.sn-auth');if(!w){w=document.createElement('span');w.className='sn-auth';box.appendChild(w)}
    if(info.user){
      const r=info.roles.filter(x=>x!=='운영자');
      w.innerHTML=`<b>${esc(info.mcName||info.name)}</b>${info.admin?'<span class="rl">운영자</span>':r.length?`<span class="rl">${esc(r.join('·'))}</span>`:''}<button type="button" class="out">로그아웃</button>`;
      w.querySelector('button').onclick=logout;
    }else{
      w.innerHTML='<button type="button">디스코드 로그인</button>';
      w.querySelector('button').onclick=login;
    }
  }

  // 권한이 없을 때 보여줄 안내. 볼 수 있으면 true.
  function gate(el,need,label){
    if(can(need))return true;
    injectCss();
    if(!info.user){
      el.innerHTML=`<div class="agate"><h2>로그인이 필요해요</h2><p>이 페이지는 마을 명단에 있는 사람만 볼 수 있어요. 디스코드로 로그인해 주세요.</p><button type="button" class="lg">디스코드로 로그인</button></div>`;
      el.querySelector('.lg').onclick=login;
    }else if(!info.member){
      const id=info.discordId;
      el.innerHTML=`<div class="agate"><h2>아직 마을 명단에 없어요</h2><p>아래 디스코드 ID를 운영자에게 보내 명단에 추가해 달라고 해 주세요. 추가된 뒤 새로고침하면 들어올 수 있어요.</p>${id?`<div class="id">${esc(id)}<button type="button" class="cp" data-v="${esc(id)}">복사</button></div>`:''}</div>`;
    }else{
      el.innerHTML=`<div class="agate"><h2>${esc(need)} 권한이 필요해요</h2><p>이 페이지는 ${esc(need)} 권한이 있는 사람만 볼 수 있어요. 필요하면 운영자에게 권한을 요청해 주세요.</p></div>`;
    }
    const cp=el.querySelector('.cp');
    if(cp)cp.onclick=async()=>{try{await navigator.clipboard.writeText(cp.dataset.v);cp.textContent='복사됨'}catch(e){cp.textContent='복사 실패'}setTimeout(()=>cp.textContent='복사',1400)};
    return false;
  }

  const ready=(async()=>{await refresh();if(document.readyState==='loading')await new Promise(r=>document.addEventListener('DOMContentLoaded',r,{once:true}));nav();return info})();
  if(sb)sb.auth.onAuthStateChange((_e,s)=>{const u=s?s.user:null;if((u&&u.id)===(info.user&&info.user.id))return;
    setTimeout(async()=>{await refresh();nav();subs.forEach(f=>{try{f(info)}catch(e){}})},0)});

  window.Auth={__v:1,sb,ready,info:()=>info,can,login,logout,gate,nav,onChange:f=>subs.push(f),esc,nameOf};
})();
