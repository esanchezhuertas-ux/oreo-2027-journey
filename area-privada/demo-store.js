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
  async function login(input,password){
    const id=input.trim().toLowerCase();
    const a=accounts()[id] || (id===email?makePablo():null);
    if(!a || (a.digest ? a.digest!==await digest(password) : await digest(password)!=='9ff0ecba59c7281b77941c7a758979716e8ceb971e205ec9819ba7f305b5eb3f'))return false;
    db.account=a;save();return true;
  }
  async function signup(name,surname,input,password,phone){
    const id=input.trim().toLowerCase();
    if(accounts()[id] || id===email)return false;
    db.account={name,surname,email:id,phone,digest:await digest(password),cards:[],codes:[],orders:[],profileEvents:[],address:{}};
    save();return true;
  }
  function logout(){db.account=null;save();}
  function locate(value){return Object.values(accounts()).find(a=>a.email===value||a.phone===value)||(value===email?makePablo():null);}
  function smsLogin(a){db.account=a;save();}
  async function password(a,value){a.digest=await digest(value);const all=accounts();all[a.email]=a;localStorage.setItem(accountsKey,JSON.stringify(all));if(db.account?.email===a.email){db.account=a;save();}}
  function entries(){
    const groups=new Map();
    for(const c of db.account?.cards||[]){
      const id=c.player+'--'+c.rarity;
      if(!groups.has(id)){
        const p=catalog.find(p=>p.id===c.player);
        if(!p)continue;
        groups.set(id,{...p,id,playerId:p.id,type:c.rarity,copies:0,available:0,records:[],daysAgo:Infinity});
      }
      const p=groups.get(id);
      p.copies++;p.available+=Number(!c.used);p.records.push(c);
      p.daysAgo=Math.min(p.daysAgo,Math.max(0,Math.floor((Date.now()-c.time)/day)));
      p.isNew=p.daysAgo===0;
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
  window.Demo={get account(){return db.account},get lang(){return db.lang},setLang(lang){db.lang=lang;save()},remove(){const all=accounts();delete all[db.account.email];localStorage.setItem(accountsKey,JSON.stringify(all));logout();},login,signup,logout,locate,smsLogin,password,save,entries,register};
})();
