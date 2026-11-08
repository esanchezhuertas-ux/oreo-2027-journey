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
 email:['Correo electrónico','Email address','email','tu@correo.com'],
 password:['Contraseña','Password','password','Tu contraseña'],
 name:['Nombre','First name','text',''],surname:['Apellidos','Last name','text',''],
 phone:['Teléfono móvil','Mobile number','tel','+34'],street:['Dirección','Address','text',''],
 postcode:['Código postal','Postcode','text',''],city:['Localidad','Town or city','text',''],province:['Provincia','Province','text',''],
 confirm:['Confirmar contraseña','Confirm password','password',''],
 sms:['Código SMS','SMS code','text','000000']};
function field(key,value=''){
 const [es,en,type,placeholder]=fields[key];
 return '<label class="entry-field"><span>'+t(es,en)+'</span><input name="'+key+'" type="'+type+'" required value="'+html(value)+'" placeholder="'+html(placeholder==='Tu contraseña'?t(placeholder,'Your password'):placeholder)+'" '+(key==='sms'?'inputmode="numeric" maxlength="6"':'')+'>'+ (type==='password'?'<button type="button" data-eye aria-label="'+t('Mostrar contraseña','Show password')+'">'+ui.icon('eye')+'</button>':'')+'</label>';
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
function authPage(title,desc,body){return '<section class="access-panel"><header><h1>'+title+'</h1><p>'+desc+'</p></header>'+body+'</section>';}
function form(id,body){return '<form data-flow="'+id+'">'+body+error()+'</form>';}
function signupFields(){return '<strong>'+t('Datos personales y contacto','Personal and contact details')+'</strong>'+field('name')+field('surname')+field('email')+field('phone')+'<small>'+t('Te enviaremos un SMS para verificar tu cuenta.','We will send you a text to verify your account.')+'</small><strong>'+t('Seguridad de acceso','Account security')+'</strong>'+field('password')+field('confirm')+'<strong>'+t('Condiciones legales','Legal terms')+'</strong>';}
const compactAccess=window.matchMedia('(max-width:700px)');
compactAccess.addEventListener('change',()=>{
 const actions=main.querySelector('.login-actions');
 if(actions)actions.append(actions.querySelector(compactAccess.matches?'.auth-sms':'.auth-alternative'));
});
function auth(page){
 if(page==='signup')return authPage(t('Crear cuenta','Create account'),t('Crea tu cuenta y verifica tu móvil por SMS. Las preferencias de comunicación son opcionales.','Create your account and verify your mobile number by SMS. Communication preferences are optional.'),form('signup',signupFields()+'<label><input required type="checkbox"> '+t('Confirmo que tengo 18 años y he leído y acepto los términos y condiciones de esta promoción.','I confirm that I am 18 or older and accept the promotion terms.')+'</label><details><summary>'+t('Preferencias de comunicación','Communication preferences')+'</summary><label><input type="checkbox" name="optIn"> '+t('Recibir novedades por correo','Receive updates by email')+'</label></details><label class="demo-captcha"><input required type="checkbox"> '+t('No soy un robot','I am not a robot')+'</label>'+submit(t('Crear cuenta','Create account')))+link(t('Ya tengo una cuenta','I already have an account'),'login'));
 if(page==='sms'||page==='recover')return authPage(page==='sms'?t('Entrar con SMS','Sign in with SMS'):t('Recuperar contraseña','Recover password'),page==='sms'?t('Introduce tu móvil verificado.','Enter your verified mobile number.'):t('Introduce el correo electrónico de tu cuenta.','Enter your account email address.'),form(page,field(page==='sms'?'phone':'email')+submit(t('Continuar','Continue')))+link(t('Volver al acceso','Back to sign in'),'login'));
 if(page==='verify'&&pending)return authPage(t('Verificar móvil','Verify mobile number'),t('Usa el código de prueba 123456.','Use the demo code 123456.'),form('verify',field('sms')+submit(t('Verificar código','Verify code')))+link(t('Volver','Back'),'login'));
 if(page==='reset'&&pending)return authPage(t('Restablecer contraseña','Reset password'),t('Define tu nueva contraseña para esta cuenta de prueba.','Set a new password for this demo account.'),form('reset',field('password')+field('confirm')+submit(t('Guardar contraseña','Save password'))));
 const newAccountLink='<p class="auth-alternative">'+t('¿No tienes cuenta?','Don’t have an account?')+' '+link(t('Crea una cuenta','Create an account'),'signup')+'</p>';
 const smsLink='<a href="#sms" class="button auth-sms">'+t('Entrar con SMS','Sign in with SMS')+'</a>';
 const loginFields='<div class="login-fields">'+field('email')+'<div class="password-recovery">'+field('password')+link(t('Recuperar contraseña','Recover password'),'recover')+'</div></div>';
 const loginActions='<div class="login-actions">'+submit(t('Iniciar sesión','Sign in'))+(compactAccess.matches?newAccountLink+smsLink:smsLink+newAccountLink)+'</div>';
 return authPage(t('Iniciar sesión','Sign in'),t('Entra para continuar tu colección y consultar tus premios.','Sign in to continue your collection and check your rewards.'),
 form('login',loginFields+loginActions)+'<aside><strong>'+t('¿No puedes entrar?','Can’t sign in?')+'</strong><small>'+t('Recupera tu contraseña o entra con el móvil verificado de tu cuenta.','Recover your password or sign in with your verified mobile number.')+'</small></aside>');

}
function home(){
 const cards=db.account.cards;
 const unique=new Set(cards.map(c=>c.player)).size;
 const rewards=['shirt','scarf','ball'];
 const hub=$('#hub-progress');
 $('#page-title').textContent=t('Mi zona','My zone');
 $('.collection-stats').innerHTML=`<div class="collected-desktop"><strong>${unique} / ${window.PLAYERS.length}</strong><span>${t('Jugadores conseguidos','Players collected')}</span></div><a class="collected-mobile" href="#card-results">${unique}/${window.PLAYERS.length} ${t('conseguidos','collected')}</a>`;
 $('.collected-mobile').onclick=e=>{e.preventDefault();$('#card-results').scrollIntoView({block:'start'});};
 const widgets=rewards.map(id=>{
  const target=id==='shirt'&&canClaim('gold')?'gold':id;
  const units=balance(id),goal=cost(id),pct=Math.min(100,Math.round(units/goal*100));
  const description=claimed(id)?t('Ya canjeado','Already redeemed'):canClaim(target)?t('Disponible para canjear','Available to redeem'):t('Te faltan ','You need ')+(goal-units)+t(' unidades',' more units');
  return `<button class="reward-progress" data-prize="${target}"><span class="ring"><svg viewBox="0 0 64 64" aria-hidden="true"><circle class="ring-track" cx="32" cy="32" r="25"/><circle class="ring-arc" cx="32" cy="32" r="28" pathLength="100" stroke-dasharray="${pct} 100" opacity="${pct?1:0}"/></svg><b>${Math.min(units,goal)}/${goal}</b></span><span class="reward-text"><strong><span class="prize-art"><img width="24" height="20" src="assets/icons/${id==='scarf'?'scarf':'reward-'+id}.svg" alt=""></span>${titleOf(id)}</strong><small>${description}</small></span></button>`;
 }).join('');
 const dots=rewards.map((id,i)=>`<button type="button" aria-label="${titleOf(id)}" aria-pressed="${i===0}"></button>`).join('');
 hub.innerHTML=`<strong>${t('Saldo','Balance')} · ${balance('shirt')} ${t('unidades','units')}</strong><div class="reward-gallery"><div class="reward-grid">${widgets}</div><div class="reward-pages">${dots}</div></div><p>${t('Los tres canjes por unidades comparten saldo.','All three rewards use the same unit balance.')}</p><p>${t('Encuentra un jugador dorado para conseguir una camiseta.','Find a gold player to get a shirt.')}</p>`;
 const track=hub.querySelector('.reward-grid');
 const controls=[...hub.querySelectorAll('.reward-pages button')];
 const leftOf=card=>Math.min(track.scrollWidth-track.clientWidth,card.offsetLeft-track.firstElementChild.offsetLeft);
 controls.forEach((button,i)=>button.onclick=()=>track.scrollTo({left:leftOf(track.children[i]),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
 track.addEventListener('scroll',()=>{
  const offsets=Array.from(track.children,card=>Math.abs(leftOf(card)-track.scrollLeft));
  const selected=offsets.indexOf(Math.min(...offsets));
  controls.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===selected)));
 },{passive:true});
}
function panel(title,body,{kind='',intro='',tabs='',actions=''}={}){
 return '<section class="journey-panel '+kind+'" role="dialog" aria-modal="true" aria-labelledby="panel-title"><header><div class="panel-title-row"><h1 id="panel-title">'+title+'</h1><button class="icon-button" data-route="home" aria-label="'+t('Cerrar','Close')+'">'+ui.icon('close')+'</button></div>'+(intro?'<p>'+intro+'</p>':'')+tabs+'</header><div class="panel-body">'+body+'</div>'+(actions?'<div class="panel-actions">'+actions+'</div>':'')+'</section>';
}
function accountPanel(content,section){
 const history=section==='history';
 const tab=(label,page,active)=>'<a href="#'+page+'" '+(active?'aria-current="page"':'')+'>'+label+'</a>';
 const tabs='<nav class="account-tabs" aria-label="'+t('Mi cuenta','My account')+'">'+tab(t('Configuración','Settings'),'profile',!history)+tab(t('Historial','History'),'history',history)+'</nav>';
 return panel(t('Mi cuenta','My account'),content,{kind:'account-panel',intro:t('Tu cuenta, tus códigos y tus premios, bajo control.','Manage your account, codes and rewards.'),tabs});
}
function settingsLinks(page){
 const items=[['profile',t('Mis datos','My details'),t('Datos','Details'),'user'],['password',t('Contraseña','Password'),t('Contraseña','Password'),'lock'],['address',t('Direcciones','Addresses'),t('Direcciones','Addresses'),'map-pin']];
 return '<nav class="settings-links" aria-label="'+t('Configuración','Settings')+'">'+items.map(([route,long,short,icon])=>'<a href="#'+route+'" '+(page===route?'aria-current="page"':'')+'><img width="20" height="20" alt="" src="assets/icons/'+icon+'.svg"><span class="settings-desktop-label">'+long+'</span><span class="settings-mobile-label">'+short+'</span></a>').join('')+'</nav>';
}
function addressForm(values){return ['name','surname','phone','street','postcode','city','province'].map(k=>field(k,values[k]||'')).join('');}
function profile(page){
 const a=db.account;
 if(page==='remove')return panel(t('Eliminar cuenta','Delete account'),'<p>'+t('Se eliminarán los datos de esta cuenta de prueba en este dispositivo.','This demo account’s data will be deleted from this device.')+'</p>'+form('remove',submit(t('Eliminar cuenta','Delete account')))+button(t('Cancelar','Cancel'),'profile'));
 const section=['password','address'].includes(page)?page:'profile';
 let title,desc='',content;
 if(section==='address'){
   title=t('Direcciones','Addresses');
   content=form('address',addressForm({...a,...a.address})+submit(t('Guardar dirección','Save address')));
 }else if(section==='password'){
   title=t('Contraseña','Password');
   content=form('password',field('password')+field('confirm')+submit(t('Guardar cambios','Save changes')));
 }else{
   title=t('Datos personales','Personal details');
   desc=t('Mantén tus datos al día para gestionar tu cuenta y tus premios.','Keep your details up to date to manage your account and rewards.');
   const personalField=(key,value,optional=false)=>'<label class="entry-field profile-field"><span>'+t(fields[key][0],fields[key][1])+(optional?' ('+t('opcional','optional')+')':'')+'</span><input type="'+fields[key][2]+'" name="'+key+'" value="'+html(value)+'" '+(key==='email'?'readonly':optional?'':'required')+'>'+(key==='email'?'':'<img src="assets/icons/pencil.svg" width="20" height="20" alt="">')+'</label>';
   content=form('edit',personalField('name',a.name)+personalField('surname',a.surname)+personalField('email',a.email)+personalField('phone',a.phone,true)+submit(t('Guardar cambios','Save changes')))+'<p class="delete-account">'+t('Si quieres eliminar tus datos permanentemente,','To permanently delete your data,')+' '+link(t('cierra la cuenta.','close your account.'),'remove')+'</p>';
 }
 const settings='<div class="settings-layout">'+settingsLinks(section)+'<section class="settings-content"><h2>'+title+'</h2>'+(desc?'<p>'+desc+'</p>':'')+content+'</section></div>';
 return accountPanel(settings,section);
}
function historyPage(ordersOnly=false){
 const account=db.account;
 const labels={all:t('Todo','All'),codes:t('Códigos','Codes'),orders:t('Canjes','Redemptions'),account:t('Cuenta','Account')};
 const active=ordersOnly?'orders':historyFilter;
 const rows=account.codes.map(code=>{
  const cards=account.cards.filter(card=>card.code===code);
  return {id:code,type:'codes',title:t('Código registrado','Code registered'),reference:code,time:cards[0]?.time,
   description:cards.length+(cards.length===1?t(' cromo obtenido',' card collected'):t(' cromos obtenidos',' cards collected')),
   detail:cards.map(card=>html(window.PLAYERS.find(player=>player.id===card.player)?.name||card.player)+' · '+(card.rarity==='gold'?t('Dorada','Gold'):t('Común','Common'))).join('<br>')};
 });
 for(const order of account.orders){
  rows.push({id:order.id,type:'orders',title:t('Solicitud recibida','Request received'),reference:order.id,time:order.time,
   description:titleOf(order.reward),detail:[order.shipping?.size,order.shipping?.street,order.shipping?.city].filter(Boolean).map(html).join(' · ')});
 }
 for(const event of account.profileEvents)rows.push({id:String(event.time),type:'account',time:event.time,title:t(...event.label),description:t('Mi cuenta','My account'),detail:html(account.email)});
 const filters=Object.entries(labels).map(([id,label])=>'<button data-tab="'+id+'" aria-pressed="'+(active===id)+'">'+label+'</button>').join('');
 const formatter=new Intl.DateTimeFormat(db.lang==='en'?'en-GB':'es-ES',{day:'numeric',month:'long',year:'numeric'});
 const list=rows.filter(row=>active==='all'||row.type===active).sort((a,b)=>(b.time||0)-(a.time||0)).map((row,i)=>{
  const read=(account.readActivity||[]).includes(row.id),open=expanded===row.id;
  const refLabel=row.type==='orders'?t('Ref.','Ref.'):t('Código:','Code:');
  const reference=row.reference?'<div class="activity-reference"><img src="assets/history/qr.svg" width="20" height="20" alt="">'+refLabel+' <code>'+html(row.reference)+'</code><button data-copy="'+html(row.reference)+'" aria-label="'+t('Copiar','Copy')+' '+html(row.reference)+'">'+ui.icon('copy')+'</button></div>':'';
  return '<article class="activity-row" data-read="'+read+'"><button class="activity-toggle" data-activity="'+html(row.id)+'" aria-expanded="'+open+'" aria-controls="activity-'+i+'"><span class="activity-heading"><strong>'+html(row.title)+'</strong><small><img src="assets/history/time.svg" width="16" height="16" alt="">'+(row.time?formatter.format(row.time):'')+'</small></span><span class="activity-chevron">'+ui.icon('chevron')+'</span></button>'+reference+'<p>'+html(row.description)+'</p><small class="activity-read">'+(read?t('Leído','Read'):t('Sin leer','Unread'))+'</small><div class="activity-detail" id="activity-'+i+'" '+(open?'':'hidden')+'>'+row.detail+'</div></article>';
 }).join('');
 const title=ordersOnly?t('Mis solicitudes','My requests'):t('Historial de la cuenta','Account history');
 const intro=t('Tus códigos, cromos, canjes y cambios de cuenta, en un mismo lugar.','Your codes, cards, redemptions and account changes, all in one place.');
 return accountPanel('<section class="activity-feed"><h2>'+title+'</h2>'+(ordersOnly?'':'<p>'+intro+'</p><div class="activity-filters">'+filters+'</div>')+'<div class="activity-list">'+(list||'<p class="activity-empty">'+t('Todavía no hay actividad.','No activity yet.')+'</p>')+'</div></section>','history');
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
 return panel(t('Canjear premio','Redeem reward'),'<div class="prize-summary"><img class="prize-illustration" width="64" alt="" src="assets/icons/'+({gold:'reward-shirt',shirt:'reward-shirt',scarf:'scarf',ball:'reward-ball'}[id])+'.svg"><div><strong>'+titleOf(id)+'</strong><small>'+t('Por ','For ')+cost(id)+' '+(id==='gold'?t('cromo dorado','gold card'):t('unidades','units'))+'</small></div></div><form id="prize-request" data-flow="prize">'+(id!=='ball'?optionTeam:'')+(['shirt','gold'].includes(id)?sizePicker:'')+'<strong>'+t('Dirección de entrega','Delivery address')+'</strong>'+addressInput+'<label><input required type="checkbox"> '+t('Soy mayor de edad y acepto las bases de la promoción.','I am of legal age and accept the promotion terms.')+'</label>'+error()+'</form>',{actions:'<button class="button primary" type="submit" form="prize-request">'+t('Revisar solicitud','Review request')+'</button>'});

}
function help(){
 const questions=[
   [t('¿Cómo registro un código?','How do I register a code?'),t('Pulsa «Registrar código» e introduce los 10 caracteres alfanuméricos del envase. Podrás consultar el cromo en Colección y el registro en Mi cuenta > Historial.','Select Register code and enter the 10 letters and numbers from your pack. Find the card in Collection and the entry in My account > History.')],
   [t('¿Qué aporta cada código?','What does each code give me?'),t('El número de cromos depende del código de tu envase.','The number of cards depends on your pack code.')],
   [t('He añadido un código, pero no veo mis cromos. ¿Qué hago?','I added a code but cannot see my cards. What should I do?'),t('Consulta Mi cuenta > Historial y restablece los filtros de Colección.','Check My account > History and clear the Collection filters.')],
   [t('¿Qué hago si mi código no funciona?','What if my code does not work?'),t('Comprueba los 10 caracteres y revisa en Historial si ya lo has registrado.','Check all 10 characters and see if it is already registered in History.')],
   [t('¿Dónde veo los jugadores que he conseguido?','Where can I see my players?'),t('En Colección puedes buscar por jugador o navegar por equipo.','In Collection, search by player or browse by team.')],
   [t('¿Qué consigo con un cromo dorado?','What can I get with a gold card?'),t('Puedes canjear una copia dorada disponible por una camiseta.','You can redeem an available gold copy for a shirt.')],
   [t('¿Cuántas unidades necesito para cada premio?','How many units do I need for each reward?'),t('Consulta en Mi zona las unidades que te faltan para una camiseta, una bufanda o un balón.','Go to My zone to see how many units you still need for a shirt, scarf or ball.')],
   [t('¿Qué debo revisar antes de confirmar un canje?','What should I check before confirming a redemption?'),t('Revisa el premio, tu selección y la dirección de entrega.','Check the reward, your selection and the delivery address.')],
   [t('¿Dónde consulto mi solicitud?','Where can I check my request?'),t('Abre Mi cuenta > Historial y selecciona Canjes.','Open My account > History and select Redemptions.')],
   [t('¿Cómo cambio o recupero mi contraseña?','How can I change or recover my password?'),t('En Mi cuenta selecciona Contraseña. Si necesitas recuperar el acceso, pulsa Recuperar contraseña en la pantalla de inicio de sesión.','Choose Password in My account, or Recover password on the sign-in screen if you need to regain access.')],
   [t('¿Puedo guardar y modificar varias direcciones?','Can I save and edit my addresses?'),t('Puedes consultar y modificar tu dirección guardada desde Mi cuenta > Direcciones.','You can view and edit your saved delivery address in My account > Addresses.')],
   [t('¿Dónde gestiono mis preferencias de privacidad?','Where can I manage my privacy preferences?'),t('Al crear tu cuenta puedes elegir tus preferencias de comunicación.','Choose your communication preferences when you create an account.')],
   [t('¿Qué pasa si elimino mi cuenta?','What happens if I delete my account?'),t('Se eliminan tus datos de prueba guardados en este dispositivo.','Your saved demo account data is removed from this device.')],
   [t('¿Qué hago si no reconozco una acción de mi Historial?','What if I do not recognise an entry in my History?'),t('Revisa los detalles de la acción y cambia tu contraseña desde Mi cuenta.','Review the entry and change your password in My account.')]
 ];
 const faq='<div class="faq-list"><h2>'+t('Preguntas frecuentes','Frequently asked questions')+'</h2>'+questions.map(([q,answer],i)=>'<details '+(i===0?'open':'')+'><summary>'+q+ui.icon('chevron')+'</summary><p>'+answer+'</p></details>').join('')+'</div>';
 const contact='<aside class="help-contact"><strong>'+t('Contacto','Contact')+'</strong><small>900 000 000 · ayuda@oreo.es</small><div class="contact-methods"><a class="button" href="tel:900000000"><img alt="" width="20" height="20" src="assets/icons/phone.svg"><span>900 000 000</span><b>'+t('Llamar','Call')+'</b></a><a class="button" href="mailto:ayuda@oreo.es"><img alt="" width="20" height="20" src="assets/icons/mail.svg"><span>ayuda@oreo.es</span><b>'+t('Escribir','Email')+'</b></a></div></aside>';
 return panel(t('Ayuda','Help'),contact+faq,{kind:'help-panel',intro:t('Resuelve tus dudas sobre tu cuenta, los códigos y los premios.','Find answers about your account, codes and rewards.')});
}
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
  const count = a.cards.filter(card => !card.used).length;
  const balance = count === 1 ? t('1 jugador disponible','1 player available')
    : count + t(' jugadores disponibles',' available players');
  document.querySelectorAll('[data-account-initial]').forEach(el => el.textContent = a.name.slice(0,1));
  document.querySelectorAll('[data-account-name]').forEach(el => el.textContent = t('Hola, ','Hi, ') + a.name);
  document.querySelectorAll('[data-account-balance]').forEach(el => el.textContent = balance);
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
 if(b.dataset.route){document.querySelectorAll('.nav-popover').forEach(el=>el.hidden=true);document.querySelectorAll('.nav-inner [aria-expanded]').forEach(el=>el.setAttribute('aria-expanded','false'));go(b.dataset.route);}
 if(b.hasAttribute('data-eye')){
   const input=b.parentNode.querySelector('input');
   const show=input.type==='password';
   input.type=show?'text':'password';
   b.innerHTML=ui.icon(show?'eye-off':'eye');
   b.setAttribute('aria-label',show?t('Ocultar contraseña','Hide password'):t('Mostrar contraseña','Show password'));
 }
 if(b.dataset.tab){historyFilter=b.dataset.tab;expanded='';draw();main.querySelector('[data-tab="'+historyFilter+'"]')?.focus({preventScroll:true});}
 if(b.hasAttribute('data-activity')){
  const id=b.dataset.activity, open=b.getAttribute('aria-expanded')!=='true';
  expanded=open?id:'';
  for(const toggle of main.querySelectorAll('[data-activity]')){
   const active=open&&toggle===b;
   toggle.setAttribute('aria-expanded',String(active));
   document.getElementById(toggle.getAttribute('aria-controls')).hidden=!active;
  }
  if(open){
   const read=db.account.readActivity ||= [];
   if(!read.includes(id)){read.push(id);db.save();}
   b.closest('.activity-row').dataset.read='true';
   b.closest('.activity-row').querySelector('.activity-read').textContent=t('Leído','Read');
  }
 }
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
