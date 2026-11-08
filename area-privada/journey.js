(() => {
'use strict';
const $ = s => document.querySelector(s);
const ui = window.CollectionUI;
const db = window.Demo;
const main = $('#journey');
const translate = (es,en) => db.lang === 'en' ? en : es;
const html = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const route = () => location.hash.slice(1) || (db.account?'home':'login');
const go = next => {if(route()===next)draw();else location.hash=next;};
const button = (text,target,primary=false) => '<button class="button '+(primary?'primary':'')+'" data-route="'+target+'">'+text+'</button>';
const link = (text,target) => '<a href="#'+target+'">'+text+'</a>';
const t=translate;
const fields={
 email:['Correo electrónico','Email address','email','nombre@ejemplo.com'],
 password:['Contraseña','Password','password','Tu contraseña'],
 name:['Nombre','First name','text',''],surname:['Apellidos','Last name','text',''],
 phone:['Teléfono móvil','Mobile number','tel','+34'],street:['Dirección','Address','text',''],
 postcode:['Código postal','Postcode','text',''],city:['Localidad','Town or city','text',''],province:['Provincia','Province','text',''],
 confirm:['Confirmar contraseña','Confirm password','password',''],
 sms:['Código SMS','SMS code','text','000000']};
function field(key,value=''){
 const [es,en,type,placeholder]=fields[key];
 return '<label class="entry-field"><span>'+t(es,en)+'</span><input name="'+key+'" type="'+type+'" required value="'+html(value)+'" placeholder="'+html(placeholder==='Tu contraseña'?t(placeholder,'Your password'):placeholder)+'" '+(key==='sms'?'inputmode="numeric" maxlength="6"':'')+'>'+ (type==='password'?'<button type="button" data-eye aria-label="'+t('Mostrar contraseña','Show password')+'">◉</button>':'')+'</label>';
}
const submit = text => '<button class="button primary full-width" type="submit">'+text+'</button>';
const error = () => '<p class="form-error" role="alert"></p>';
let pending=null,historyFilter='all',expanded='',rewardId='shirt',step=1,shipping={},receipt=null,registered=null;
const names={shirt:['Camiseta','Shirt'],gold:['Camiseta con cromo dorado','Gold card shirt'],scarf:['Bufanda','Scarf'],ball:['Balón','Ball']};
const titleOf=id=>t(...names[id]);
const cost=id=>id==='shirt'?50:id==='gold'?1:25;
const balance=id=>db.account.cards.filter(c=>!c.used && c.rarity===(id==='gold'?'gold':'blue')).length;
const claimed=id=>db.account.orders.some(o=>o.reward===id || (['gold','shirt'].includes(id)&&['gold','shirt'].includes(o.reward)));
const canClaim=id=>!claimed(id)&&balance(id)>=cost(id);
const date=time=>new Intl.DateTimeFormat(db.lang==='es'?'es-ES':'en-GB').format(time);
function authPage(title,desc,body){return '<section class="access-panel"><h1>'+title+'</h1><p>'+desc+'</p>'+body+'</section>';}
function form(id,body){return '<form data-flow="'+id+'">'+body+error()+'</form>';}
function signupFields(){return '<strong>'+t('Datos personales y contacto','Personal and contact details')+'</strong>'+field('name')+field('surname')+field('email')+field('phone')+'<small>'+t('Te enviaremos un SMS para verificar tu cuenta.','We will send you a text to verify your account.')+'</small><strong>'+t('Seguridad de acceso','Account security')+'</strong>'+field('password')+field('confirm')+'<strong>'+t('Condiciones legales','Legal terms')+'</strong>';}
function auth(page){
 if(page==='signup')return authPage(t('Crear cuenta','Create account'),t('Crea tu cuenta y verifica tu móvil por SMS. Las preferencias de comunicación son opcionales.','Create your account and verify your mobile number by SMS. Communication preferences are optional.'),form('signup',signupFields()+'<label><input required type="checkbox"> '+t('Confirmo que tengo 18 años y he leído y acepto los términos y condiciones de esta promoción.','I confirm that I am 18 or older and accept the promotion terms.')+'</label><details><summary>'+t('Preferencias de comunicación','Communication preferences')+'</summary><label><input type="checkbox" name="optIn"> '+t('Recibir novedades por correo','Receive updates by email')+'</label></details><label class="demo-captcha"><input required type="checkbox"> '+t('No soy un robot','I am not a robot')+'</label>'+submit(t('Crear cuenta','Create account')))+link(t('Ya tengo una cuenta','I already have an account'),'login'));
 if(page==='sms'||page==='recover')return authPage(page==='sms'?t('Entrar con SMS','Sign in with SMS'):t('Recuperar contraseña','Recover password'),page==='sms'?t('Introduce tu móvil verificado.','Enter your verified mobile number.'):t('Introduce el correo electrónico de tu cuenta.','Enter your account email address.'),form(page,field(page==='sms'?'phone':'email')+submit(t('Continuar','Continue')))+link(t('Volver al acceso','Back to sign in'),'login'));
 if(page==='verify'&&pending)return authPage(t('Verificar móvil','Verify mobile number'),t('Usa el código de prueba 123456.','Use the demo code 123456.'),form('verify',field('sms')+submit(t('Verificar código','Verify code')))+link(t('Volver','Back'),'login'));
 if(page==='reset'&&pending)return authPage(t('Restablecer contraseña','Reset password'),t('Define tu nueva contraseña para esta cuenta de prueba.','Set a new password for this demo account.'),form('reset',field('password')+field('confirm')+submit(t('Guardar contraseña','Save password'))));
 return authPage(t('Iniciar sesión','Sign in'),t('Entra para continuar tu colección y consultar tus premios.','Sign in to continue your collection and check your rewards.'),
 form('login',field('email')+field('password')+link(t('Recuperar contraseña','Recover password'),'recover')+submit(t('Iniciar sesión','Sign in')))+button(t('Entrar con SMS','Sign in with SMS'),'sms')+'<p class="center">'+t('¿No tienes cuenta?','Don’t have an account?')+' '+link(t('Crea una cuenta','Create an account'),'signup')+'</p><aside><strong>'+t('¿No puedes entrar?','Can’t sign in?')+'</strong><small>'+t('Recupera tu contraseña o entra con el móvil verificado de tu cuenta.','Recover your password or sign in with your verified mobile number.')+'</small></aside>');
}
function home(){
 const a=db.account;
 $('#page-title').textContent=t('Mi zona','My zone');
 const unique=new Set(a.cards.map(c=>c.player)).size;
 $('.collection-stats').innerHTML='<div><strong>'+unique+' / '+window.PLAYERS.length+'</strong><span>'+t('Jugadores conseguidos','Players collected')+'</span></div>';
 $('#hub-progress').innerHTML='<strong>'+t('Saldo','Balance')+' · '+balance('shirt')+' '+t('unidades','units')+'</strong><div class="reward-grid">'+['shirt','scarf','ball'].map(id=>{
 const showId=id==='shirt'&&canClaim('gold')?'gold':id, n=balance(showId),total=cost(showId),percent=Math.min(100,Math.round(n/total*100));
 return '<button class="reward-progress" data-prize="'+showId+'"><span class="ring" style="--pct:'+percent+'%"><b>'+percent+'%</b></span><span><strong>'+ui.icon(id==='gold'?'shirt':id)+' '+titleOf(id)+'</strong><small>'+(claimed(id)?t('Ya canjeado','Already redeemed'):canClaim(showId)?t('Disponible para canjear','Available to redeem'):t('Te faltan ','You need ')+(total-n)+t(' unidades',' more units'))+'</small></span></button>';
 }).join('')+'</div><p>'+t('Los tres canjes por unidades comparten saldo.','All three rewards use the same unit balance.')+'</p><p>'+t('Encuentra un cromo dorado para conseguir una camiseta.','Find a gold card to get a shirt.')+'</p>';
}
function panel(title,body){return '<section class="journey-panel" role="dialog" aria-modal="true" aria-labelledby="panel-title"><header><h1 id="panel-title">'+title+'</h1><button class="icon-button" data-route="home" aria-label="'+t('Cerrar','Close')+'">'+ui.icon('close')+'</button></header><div class="panel-body">'+body+'</div></section>';}
function addressForm(values){return ['name','surname','phone','street','postcode','city','province'].map(k=>field(k,values[k]||'')).join('');}
function profile(page){
 const a=db.account;
 if(page==='address')return panel(t('Dirección de envío','Shipping address'),form('address',addressForm({...a,...a.address})+submit(t('Guardar dirección','Save address'))));
 if(page==='password')return panel(t('Cambiar contraseña','Change password'),form('password',field('password')+field('confirm')+submit(t('Guardar cambios','Save changes'))));
 if(page==='edit')return panel(t('Datos personales','Personal details'),form('edit',field('name',a.name)+field('surname',a.surname)+field('phone',a.phone)+submit(t('Guardar cambios','Save changes'))));
 if(page==='remove')return panel(t('Eliminar cuenta','Delete account'),'<p>'+t('Se eliminarán los datos de esta cuenta de prueba en este dispositivo.','This demo account’s data will be deleted from this device.')+'</p>'+form('remove',submit(t('Eliminar cuenta','Delete account')))+button(t('Cancelar','Cancel'),'profile'));
 return panel(t('Mi cuenta','My account'),'<h2>'+html(a.name)+' '+html(a.surname)+'</h2><p>'+html(a.email)+'</p><div class="row-list">'+[[t('Datos personales','Personal details'),'edit'],[t('Dirección de envío','Shipping address'),'address'],[t('Cambiar contraseña','Change password'),'password'],[t('Historial','History'),'history'],[t('Eliminar cuenta','Delete account'),'remove']].map(([label,id])=>button(label+' ›',id)).join('')+'</div>');
}
function historyPage(ordersOnly=false){
 const a=db.account,h=a.codes.map(code=>{const list=a.cards.filter(c=>c.code===code);return {id:code,type:'codes',time:list[0]?.time||0,title:code,detail:list.map(c=>html(window.PLAYERS.find(p=>p.id===c.player)?.name||c.player)+' · '+(c.rarity==='gold'?t('Dorada','Gold'):t('Común','Common'))).join('<br>')};});
 for(const o of a.orders)h.push({id:o.id,type:'orders',time:o.time,title:titleOf(o.reward),detail:html(o.id)+' · '+t('Solicitud recibida','Request received')+'<br>'+html(o.shipping.street)+', '+html(o.shipping.city)});
 for(const e of a.profileEvents)h.push({id:String(e.time),type:'account',time:e.time,title:t(...e.label),detail:html(a.email)});
 const tabs={all:t('Todos','All'),codes:t('Códigos','Codes'),orders:t('Canjes','Redemptions'),account:t('Cuenta','Account')},f=ordersOnly?'orders':historyFilter;
 return panel(ordersOnly?t('Mis solicitudes','My requests'):t('Historial','History'),(ordersOnly?'':'<div class="tabs">'+Object.entries(tabs).map(([k,v])=>'<button data-tab="'+k+'" aria-pressed="'+(k===f)+'">'+v+'</button>').join('')+'</div>')+'<div class="row-list">'+(h.sort((a,b)=>b.time-a.time).filter(row=>f==='all'||row.type===f).map(row=>'<details '+(expanded===row.id?'open':'')+'><summary><span><strong>'+row.title+'</strong><small>'+tabs[row.type]+' · '+date(row.time)+'</small></span>⌄</summary><div>'+row.detail+'</div></details>').join('')||'<p>'+t('Todavía no hay actividad.','No activity yet.')+'</p>')+'</div>');
}
function reward(){
 const id=rewardId,a=db.account;
 if(step===3&&receipt)return panel(t('Solicitud recibida','Request received'),'<h2>'+titleOf(id)+'</h2><p>'+html(receipt.id)+'</p><p>'+html(receipt.shipping.street)+', '+html(receipt.shipping.city)+'</p>'+button(t('Ver mi solicitud','View my request'),'orders',true));
 if(!canClaim(id))return panel(titleOf(id),'<h2>'+(claimed(id)?t('Ya canjeado','Already redeemed'):t('Progreso','Progress'))+'</h2><p>'+balance(id)+' / '+cost(id)+' '+(id==='gold'?t('cromos dorados','gold cards'):t('unidades disponibles','available units'))+'</p>'+button(t('Volver a Mi zona','Back to My zone'),'home'));
 if(step===2)return panel(t('Revisar solicitud','Review request'),'<h2>'+titleOf(id)+'</h2><p>'+html(shipping.size||shipping.club||'')+'</p><p>'+html(shipping.name)+' '+html(shipping.surname)+'<br>'+html(shipping.street)+'<br>'+html(shipping.postcode)+' '+html(shipping.city)+'</p><p>'+t('Se utilizarán ','This will use ')+cost(id)+' '+(id==='gold'?t('cromo dorado','gold card'):t('unidades','units'))+'.</p>'+form('confirm-prize',submit(t('Confirmar canje','Confirm redemption')))+'<button data-back-step>'+t('Modificar datos','Edit details')+'</button>');
 const clubs=[...new Set(window.PLAYERS.map(p=>p.club))];
 const optionTeam='<label class="entry-field">'+t('Equipo','Team')+'<select required name="club"><option value="">'+t('Selecciona un equipo','Select a team')+'</option>'+clubs.map(c=>'<option '+(shipping.club===c?'selected':'')+'>'+html(c)+'</option>').join('')+'</select></label>';
 const sizePicker='<fieldset class="size-picker"><legend>'+t('Selecciona tu talla','Select your size')+'</legend>'+['XS','S','M','L','XL'].map(v=>'<label><input type="radio" required name="size" value="'+v+'" '+(shipping.size===v?'checked':'')+'><span>'+v+'</span></label>').join('')+'</fieldset>';
 const currentAddress={...a,...a.address,...shipping};
 const addressInput=currentAddress.street?'<details class="address-choice"><summary><strong>'+t('Casa','Home')+'</strong><p>'+html(currentAddress.name)+' '+html(currentAddress.surname)+'<br>'+html(currentAddress.street)+'<br>'+html(currentAddress.postcode)+' '+html(currentAddress.city)+'</p>'+t('Cambiar dirección','Change address')+'</summary>'+addressForm(currentAddress)+'</details>':addressForm(currentAddress);
 return panel(t('Canjear premio','Redeem reward'),'<div class="prize-summary">'+ui.icon(id==='gold'?'shirt':id)+'<div><strong>'+titleOf(id)+'</strong><small>'+t('Por ','For ')+cost(id)+' '+(id==='gold'?t('cromo dorado','gold card'):t('unidades','units'))+'</small></div></div>'+form('prize',(id!=='ball'?optionTeam:'')+(['shirt','gold'].includes(id)?sizePicker:'')+'<strong>'+t('Dirección de entrega','Delivery address')+'</strong>'+addressInput+'<label><input required type="checkbox"> '+t('Soy mayor de edad y acepto las bases de la promoción.','I am of legal age and accept the promotion terms.')+'</label>'+submit(t('Revisar solicitud','Review request'))));

}
function help(){return panel(t('Preguntas frecuentes','Frequently asked questions'),'<div class="row-list">'+[
 [t('¿Dónde encuentro mi código?','Where can I find my code?'),t('Busca el código promocional en tu pack OREO participante.','Look for the promotional code on your participating OREO pack.')],
 [t('¿Cómo registro un código?','How do I register a code?'),t('Pulsa Registrar código e introduce los diez caracteres.','Select Register code and enter the ten characters.')],
 [t('¿Cómo consigo un premio?','How do I get a reward?'),t('En Mi zona puedes ver tu saldo y los premios que puedes canjear.','My zone shows your balance and the rewards you can redeem.')],
 [t('¿Dónde veo mis solicitudes?','Where do I see my requests?'),t('Abre Historial y selecciona Canjes.','Open History and select Redemptions.')]
 ].map(([q,r])=>'<details><summary>'+q+'</summary><p>'+r+'</p></details>').join('')+'</div>');}
function draw(){
 const page=route(), a=db.account;
 const collection=!!a&&['home','collection','login'].includes(page);
 document.body.classList.toggle('public-mode',!a);
 const overlay=!!a&&!collection;
 document.body.classList.toggle('has-panel',overlay);
 $('#collection').hidden=!a;main.hidden=collection;
 for(const bg of document.querySelectorAll('.site-header,#collection,[data-oreo-footer],.mobile-register'))bg.inert=overlay;
 if(overlay){ui.refresh();home();}
 if(a){
  $('.avatar').textContent=a.name.slice(0,1);$('#account-button .desktop-only').textContent=t('Hola, ','Hi, ')+a.name;
  $('#account-menu p').textContent=t('Hola, ','Hi, ')+a.name+' · '+a.codes.length+' '+t('participaciones','entries');
 }
 if(collection){ui.refresh();home();}
 else if(!a){main.innerHTML=auth(page);}
 else if(page==='reward')main.innerHTML=reward();
 else if(['history','orders'].includes(page))main.innerHTML=historyPage(page==='orders');
 else if(page==='help')main.innerHTML=help();
 else if(page==='received'&&registered)main.innerHTML=panel(t('Código registrado','Code registered'),'<h2>'+registered.picks.length+' '+t('cromos obtenidos','cards collected')+'</h2><div class="received">'+registered.picks.map(p=>'<div><img src="'+html(p.image)+'" alt=""><strong>'+html(p.name)+'</strong><small>'+html(p.club)+' · '+(registered.gold?t('Dorada','Gold'):t('Común','Common'))+'</small></div>').join('')+'</div>'+button(t('Ver mi colección','View my collection'),'home',true));
 else if(page==='logout')main.innerHTML=panel(t('Cerrar sesión','Log out'),'<p>'+t('Tu colección seguirá guardada. Podrás continuar cuando vuelvas a entrar.','Your collection will be saved. You can continue when you sign in again.')+'</p>'+form('logout',submit(t('Cerrar sesión','Log out')))+button(t('Cancelar','Cancel'),'home'));
 else main.innerHTML=profile(page);
 document.title=(collection?t('Mi zona','My zone'):main.querySelector('h1')?.textContent||'OREO')+' · OREO × LALIGA';
}
function launchPrize(id){rewardId=id;step=1;shipping={};receipt=null;go('reward');}
document.addEventListener('keydown',e=>{if(!document.body.classList.contains('has-panel'))return;if(e.key==='Escape'){go('home');return;}if(e.key==='Tab'){const list=[...main.querySelectorAll('button:not(:disabled),input,select,a,summary')].filter(el=>el.getClientRects().length);if(!list.length)return;const first=list[0],last=list.at(-1),focus=document.activeElement;if(e.shiftKey&&(focus===first||!main.contains(focus))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(focus===last||!main.contains(focus))){e.preventDefault();first.focus();}}});
main.addEventListener('click',e=>{if(e.target===main&&document.body.classList.contains('has-panel'))go('home');});
document.addEventListener('click',event=>{
 const b=event.target.closest('button,a');if(!b)return;
 if(b.id==='brand'){event.preventDefault();go(db.account?'home':'login');}
 if(b.dataset.route){$('#account-menu').hidden=true;$('#mobile-menu').hidden=true;go(b.dataset.route);}
 if(b.hasAttribute('data-eye')){const input=b.parentNode.querySelector('input');input.type=input.type==='password'?'text':'password';}
 if(b.dataset.tab){historyFilter=b.dataset.tab;draw();}
 if(b.dataset.prize)launchPrize(b.dataset.prize);
 if(b.hasAttribute('data-back-step')){step=1;draw();}
 if(b.dataset.redeem){const id=b.dataset.redeem==='camiseta'?'gold':'scarf';const dialog=$('#card-dialog');dialog.addEventListener('close',()=>launchPrize(id),{once:true});dialog.querySelector('[data-close]').click();}
},false);
main.addEventListener('submit',async e=>{
 e.preventDefault();const f=e.target, v=Object.fromEntries(new FormData(f)),mode=f.dataset.flow,a=db.account;
 const fail=(es,en)=>{f.querySelector('.form-error').textContent=t(es,en);};
 if(v.confirm!==undefined&&v.confirm!==v.password)return fail('Las contraseñas no coinciden.','The passwords do not match.');
 if(v.confirm!==undefined&&v.password.length<8)return fail('Introduce al menos 8 caracteres.','Enter at least 8 characters.');
 if(mode==='login'){if(!await db.login(v.email,v.password))return fail('Correo o contraseña incorrectos.','Incorrect email or password.');go('home');}
 if(mode==='signup'){if(db.locate(v.email.toLowerCase()))return fail('El correo ya está registrado.','This email is already registered.');pending={mode,v};go('verify');}
 if(mode==='sms'||mode==='recover'){const acc=db.locate(mode==='sms'?v.phone:v.email.toLowerCase());if(!acc)return fail('Cuenta no encontrada.','Account not found.');pending={mode,acc};go(mode==='sms'?'verify':'reset');}
 if(mode==='verify'){if(v.sms!=='123456')return fail('Código incorrecto.','Incorrect code.');if(pending.mode==='signup'){const u=pending.v;if(!await db.signup(u.name,u.surname,u.email,u.password,u.phone))return fail('El correo ya está registrado.','This email is already registered.');}else db.smsLogin(pending.acc);pending=null;go('home');}
 if(mode==='reset'){await db.password(pending.acc,v.password);pending=null;go('login');}
 if(mode==='logout'){db.logout();pending=null;registered=null;shipping={};historyFilter='all';go('login');}
 if(['password','edit','address'].includes(mode)){if(mode==='password')await db.password(a,v.password);if(mode==='edit')Object.assign(a,v);if(mode==='address')a.address=v;a.profileEvents.push({label:{password:['Contraseña actualizada','Password updated'],edit:['Datos personales actualizados','Personal details updated'],address:['Dirección actualizada','Address updated']}[mode],time:Date.now()});db.save();go('profile');}
 if(mode==='remove'){db.remove();go('login');}
 if(mode==='prize'){shipping=v;step=2;draw();}
 if(mode==='confirm-prize'&&canClaim(rewardId)){
 const selected=a.cards.filter(c=>!c.used&&c.rarity===(rewardId==='gold'?'gold':'blue')).sort((x,y)=>x.time-y.time).slice(0,cost(rewardId));selected.forEach(c=>c.used=true);
 receipt={id:'ORE-'+new Date().getFullYear()+'-'+String(a.orders.length+1).padStart(6,'0'),reward:rewardId,shipping,time:Date.now()};
 a.orders.push(receipt);a.address={...shipping};db.save();step=3;draw();}
});
window.addEventListener('oreo:registered',e=>{registered=e.detail;go('received');});
window.addEventListener('hashchange',()=>{draw();scrollTo(0,0);});
document.addEventListener('oreo:language',e=>{db.setLang(e.detail);const saved=[...main.querySelectorAll('input,select')].map(el=>[el.name,el.value,el.checked]);draw();for(const [name,value,checked] of saved){const el=[...main.querySelectorAll('input,select')].find(e=>e.name===name);if(el){el.value=value;el.checked=checked;}}});
document.documentElement.lang=db.lang;
draw();
})();
