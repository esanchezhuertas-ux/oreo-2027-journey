/* The prototype keeps its session on this device. Accounts retain their own collection between sessions. */
(() => {
  const key = 'oreo-2027-demo-v2';
  const email = 'pablo.garcia@example.com';
  const catalog = window.PLAYERS;
  const seed = window.DEMO_SEED;
  const day = 86400000;
  function makePablo() {
    const cards = [];
    for (const player of seed) {
      for (let i = 0; i < player.copies; i++) {
        cards.push({ player: ({rudiger:'cucurella','le-normand':'pubill',natan:'fran-garcia',fornals:'isco'}[player.id] || player.id), rarity: player.type, used: i >= player.available,
          code: 'DEMO' + String(cards.length + 1).padStart(6, '0'),
          time: Date.now() - (player.daysAgo + i) * day });
      }
    }
    while (cards.length < 18) {
      const p = catalog.find(p => !cards.some(c => c.player === p.id)) || catalog[0];
      cards.push({player:p.id, rarity:'blue', used:false, code:'DEMO'+String(cards.length+1).padStart(6,'0'), time:Date.now()-day});
    }
    return {name:'Pablo', surname:'García', email, cards, orders:[], profileEvents:[], phone:'', address:{}, codes:[...new Set(cards.map(c=>c.code))]};
  }
  const blank = () => ({account:null, lang:'es'});
  let db;
  try { db = JSON.parse(sessionStorage.getItem(key)) || blank(); } catch { db = blank(); }
  const accountsKey='oreo-2027-accounts-v1';
  function accounts(){return JSON.parse(localStorage.getItem(accountsKey)||'{}');}
  function save(){
    if(db.account){
      const all=accounts();
      all[db.account.email]=db.account;
      localStorage.setItem(accountsKey, JSON.stringify(all));
    }
    sessionStorage.setItem(key,JSON.stringify(db));
  }
  async function digest(password){
    const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(password));
    return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
  }
  async function matchesPassword(account,password){
    return !!account && await digest(password)===(account.digest || '9ff0ecba59c7281b77941c7a758979716e8ceb971e205ec9819ba7f305b5eb3f');
  }
  function changeEmail(account,value){
    const id=value.trim().toLowerCase();
    if(!id||!account)return false;
    if(account.email===id)return true;
    const all=accounts();
    if(all[id]||id===email)return false;
    delete all[account.email];
    if(account.email===email)localStorage.setItem(accountsKey+'-seed-retired','1');
    account.email=id;all[id]=account;
    localStorage.setItem(accountsKey,JSON.stringify(all));save();
    return true;
  }
  function seedAccount(id){return id===email && !localStorage.getItem(accountsKey+'-seed-retired')?makePablo():null;}
  async function login(input,password){
    const id=input.trim().toLowerCase();
    const a=accounts()[id] || seedAccount(id);
    if(!await matchesPassword(a,password))return false;
    db.account=a;save();return true;
  }
  async function signup(name,surname,input,password,phone,preferences={}){
    const id=input.trim().toLowerCase();
    if(accounts()[id] || id===email)return false;
    db.account={name,surname,email:id,phone,preferences:{communications:!!preferences.communications,personalization:!!preferences.personalization},digest:await digest(password),cards:[],codes:[],orders:[],profileEvents:[],address:{}};
    save();return true;
  }
  function logout(){db.account=null;save();}
  function locate(value){
    const query=String(value||'').trim().toLowerCase();
    if(!query)return null;
    const number=s=>{
      let digits=String(s||'').replace(/[\s().-]/g,'');
      if(/^\d{9}$/.test(digits))digits='+34'+digits;
      return digits;
    };
    return Object.values(accounts()).find(a=>a.email===query||(!query.includes('@')&&a.phone&&number(a.phone)===number(query)))||seedAccount(query);
  }
  function smsLogin(a){db.account=a;save();}
  async function password(a,value){a.digest=await digest(value);const all=accounts();all[a.email]=a;localStorage.setItem(accountsKey,JSON.stringify(all));if(db.account?.email===a.email){db.account=a;save();}}
  function entries(){
    const groups=new Map();
    const playerById=new Map(catalog.map(player=>[player.id,player]));
    const now=Date.now();
    for(const copy of db.account?.cards||[]){
      const player=playerById.get(copy.player);
      if(!player)continue;
      if(!groups.has(player.id)){
        groups.set(player.id,{...player,playerId:player.id,type:'blue',copies:0,available:0,records:[],daysAgo:Infinity});
      }
      const entry=groups.get(player.id);
      entry.copies++;
      entry.available+=Number(!copy.used);
      entry.records.push(copy);
      entry.latestObtainedAt=Math.max(entry.latestObtainedAt||0,copy.time||0);
      if(copy.rarity==='gold')entry.type='gold';
      entry.daysAgo=Math.min(entry.daysAgo,Math.max(0,Math.floor((now-copy.time)/day)));
      entry.isNew=entry.daysAgo===0;
    }
    return [...groups.values()];
  }
  function register(raw){
    const a=db.account, code=raw.trim().toUpperCase();
    if(!a || !/^(?:ALLCARD080|ALLGOLD080|(?:066|158|GLD)[A-Z0-9]{7})$/.test(code))return {error:'invalid'};
    if(a.codes.includes(code))return {error:'duplicate'};
    const gold=code==='ALLGOLD080'||code.startsWith('GLD');
    const n=code.startsWith('066')?2:code.startsWith('158')?3:1;
    let h=0;
    for(const ch of code)h=(Math.imul(h,31)+ch.charCodeAt(0))>>>0;
    const picks=code.startsWith('ALL')?catalog:Array.from({length:n},(_,i)=>catalog[(h+i)%catalog.length]);
    const time=Date.now();
    a.codes.push(code);
    for(const p of picks)a.cards.push({player:p.id,rarity:gold?'gold':'blue',code,used:false,time});
    save();return {picks,gold};
  }
  window.Demo={get account(){return db.account},get lang(){return db.lang},setLang(lang){db.lang=lang;save()},remove(){const all=accounts();if(db.account.email===email)localStorage.setItem(accountsKey+'-seed-retired','1');delete all[db.account.email];localStorage.setItem(accountsKey,JSON.stringify(all));logout();},matchesPassword,changeEmail,login,signup,logout,locate,smsLogin,password,save,entries,register};
})();
