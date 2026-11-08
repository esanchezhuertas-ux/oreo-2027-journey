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
 name:['Nombre','First name','text','Escribe tu nombre'],surname:['Apellidos','Last name','text','Escribe tus apellidos'],
 phone:['Teléfono móvil','Mobile number','tel','+34'],street:['Dirección','Address','text',''],
 postcode:['Código postal','Postcode','text',''],city:['Localidad','Town or city','text',''],province:['Provincia','Province','text',''],
 confirm:['Confirmar contraseña','Confirm password','password',''],
 sms:['Código de verificación','Verification code','text','000000']};
function field(key,value='',hint){
 if(key==='phone')return phoneField(value);
 const [es,en,type,basePlaceholder]=fields[key];
 const placeholder=hint||({name:t('Escribe tu nombre','Enter your first name'),surname:t('Escribe tus apellidos','Enter your last name')}[key])||basePlaceholder;
 return '<label class="entry-field"><span>'+t(es,en)+'</span><input name="'+key+'" type="'+type+'" required value="'+html(value)+'" placeholder="'+html(placeholder==='Tu contraseña'?t(placeholder,'Your password'):placeholder)+'" '+(key==='sms'?'inputmode="numeric" maxlength="6"':'')+'>'+ (type==='password'?'<button type="button" data-eye aria-label="'+t('Mostrar contraseña','Show password')+'">'+ui.icon('eye')+'</button>':'')+'</label>';
}
const submit = text => '<button class="button primary full-width" type="submit">'+text+'</button>';
const error = () => '<p class="form-error" role="alert"></p>';
let pending=null,historyFilter='all',expanded='',rewardId='shirt',step=1,shipping={},receipt=null,registered=null;
const names={shirt:['Camiseta','Shirt'],gold:['Camiseta con cromo dorado','Gold card shirt'],scarf:['Bufanda','Scarf'],ball:['Balón','Ball']};
const titleOf=id=>t(...names[id]);
const cost=id=>id==='shirt'?50:id==='gold'?1:25;
const claimed=id=>db.account.orders.some(order=>order.reward===id);
const eligible=(card,id)=>!card.used && (id==='gold'?card.rarity==='gold':card.rarity==='blue'||claimed('gold'));
const balance=id=>db.account.cards.filter(card=>eligible(card,id)).length;
const canClaim=id=>!claimed(id)&&balance(id)>=cost(id);
const date=time=>new Intl.DateTimeFormat(db.lang==='es'?'es-ES':'en-GB').format(time);
function authPage(title,desc,body){return '<section class="access-panel"><header><h1>'+title+'</h1><p>'+desc+'</p></header>'+body+'</section>';}
function form(id,body){return '<form data-flow="'+id+'">'+body+error()+'</form>';}
const dialCodes = ['+34','+33','+351','+39','+44','+49','+353','+32','+31','+41','+1','+52','+54','+56','+57','+58','+51','+55'];
let phoneFieldIndex=0;
function formatNationalPhone(number,dialCode){
 const digits=String(number).replace(/[\s().-]/g,'');
 return dialCode==='+34'&&/^\d{9}$/.test(digits)
   ? digits.match(/.{3}/g).join(' ')
   : number;
}
function phoneField(value='', {required=true, label=t('Teléfono móvil','Mobile number'),inline=false}={}) {
 const compact=String(value||'').replace(/[\s().-]/g,'');
 const code=dialCodes.find(prefix=>compact.startsWith(prefix))||'+34';
 const number=compact.startsWith(code)?compact.slice(code.length):compact;
 const id='national-phone-'+(++phoneFieldIndex);
 const options=dialCodes.map(prefix=>'<option value="'+prefix+'" '+(prefix===code?'selected':'')+'>'+prefix+'</option>').join('');
 const edit=inline?'<button type="button" class="edit-phone" aria-controls="'+id+'" aria-label="'+t('Editar teléfono','Edit phone number')+'">'+ui.icon('pencil')+'</button>':'';
 return '<div class="entry-field phone-field'+(inline?' inline-phone':'')+'"><label for="'+id+'">'+label+'</label><div class="phone-entry"><span class="phone-prefix"><select name="dialCode" aria-label="'+t('Prefijo internacional','International calling code')+'">'+options+'</select>'+ui.icon('chevron')+'</span><input id="'+id+'" name="phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="612 345 678" value="'+html(formatNationalPhone(number,code))+'" '+(required?'required':'')+'></div>'+edit+'</div>';
}
main.addEventListener('focusout',event=>{
 const input=event.target;
 if(input.matches('.phone-entry [name="phone"]')){
   input.value=formatNationalPhone(input.value,input.form.elements.dialCode.value);
 }
});
main.addEventListener('click',event=>{
 const edit=event.target.closest('.edit-phone');
 if(!edit)return;
 const input=document.getElementById(edit.getAttribute('aria-controls'));
 input.focus();
 input.select();
});
const privacyUrl='https://privacy.mondelezinternational.com/eu/es-ES/privacy-notice/';
function preferenceControls(values={}) {
 const rows=[
  ['communications',t('Quiero recibir novedades y promociones','I want to receive news and promotions'),t('Leer términos y condiciones de comunicaciones','Read communications terms and conditions'),t('Puedes elegir si quieres recibir comunicaciones sobre novedades y promociones y cambiar esta elección desde Mi cuenta.','Choose whether to receive news and promotional messages. You can change this in My account.')],
  ['personalization',t('Quiero personalizar mi experiencia','I want to personalise my experience'),t('Leer condiciones de personalización','Read personalisation terms'),t('Puedes elegir si quieres personalizar tu experiencia según tus preferencias y cambiar esta elección desde Mi cuenta.','Choose whether to personalise your experience based on your preferences. You can change this in My account.')]
 ];
 return rows.map(([name,label,terms,desc])=>'<div class="pref-row"><label class="consent-check"><input type="checkbox" name="'+name+'" '+(values[name]?'checked':'')+'><span>'+label+'</span></label><details class="pref-terms"><summary>'+terms+'</summary><p>'+desc+' <a href="'+privacyUrl+'" target="_blank" rel="noopener">'+t('Política de privacidad','Privacy policy')+'</a></p></details></div>').join('');
}
function readPrefs(form) {
 return {communications:!!form.elements.namedItem('communications')?.checked,personalization:!!form.elements.namedItem('personalization')?.checked};
}
function signupPage(){
 const draft=pending?.mode==='signup'?pending.v:{},prefs=draft.preferences||{};
 const group=(heading,body)=>'<div class="signup-group"><h2>'+heading+'</h2>'+body+'</div>';
 const note=text=>'<small class="signup-note">'+text+'</small>';
 const identity=group(t('Datos personales y contacto','Personal and contact details'),field('name',draft.name)+field('surname',draft.surname)+field('email',draft.email)+phoneField(draft.phone)+note(t('Te enviaremos un SMS para verificar tu cuenta.','We will send you a text to verify your account.')));
 const security=group(t('Seguridad de acceso','Account security'),field('password',draft.password,t('Crea una contraseña','Create a password'))+field('confirm',draft.confirm,t('Repite la contraseña','Repeat your password'))+note(t('Utiliza una contraseña segura que no uses en otros sitios.','Use a strong password you do not use on other sites.')));
 const disclosure='<details class="signup-preferences" '+(prefs.communications||prefs.personalization?'open':'')+'><summary><span><strong>'+t('Preferencias de comunicación','Communication preferences')+'</strong><small>'+t('Opcional · Configúralas ahora o más adelante','Optional · Set them now or later')+'</small></span>'+ui.icon('chevron')+'</summary><div class="pref-options">'+preferenceControls(prefs)+'</div></details>';
 const terms=group(t('Condiciones legales','Legal terms'),note(t('Las preferencias de comunicación son opcionales.','Communication preferences are optional.'))+'<div class="mandatory-consent"><label class="consent-check"><input required name="terms" type="checkbox" '+(draft.terms?'checked':'')+'><span>'+t('(Obligatorio) Confirmo que tengo 18 años y he leído y acepto los Términos y condiciones de esta promoción.','(Required) I confirm that I am 18 or older and have read and accept the terms of this promotion.')+'</span></label><details class="promotion-terms"><summary>'+t('Leer los Términos y condiciones de la promoción','Read the promotion terms and conditions')+'</summary><p>'+t('Las bases específicas de la promoción están pendientes de incorporar al prototipo.','The promotion terms will be added to this prototype.')+' <a href="https://privacy.mondelezinternational.com/eu/en-gb/terms-of-use/" target="_blank" rel="noopener">'+t('Términos de uso de Mondelēz','Mondelēz terms of use')+'</a></p></details></div>'+disclosure);
 const captcha='<label class="signup-captcha"><input type="checkbox" name="captcha" required><span>'+t('No soy un robot','I am not a robot')+'</span><span class="signup-captcha-brand" aria-hidden="true"><img src="assets/registro/captcha.svg" width="30" height="30" alt=""><strong>reCAPTCHA</strong><small>'+t('Privacidad · Términos','Privacy · Terms')+'</small></span></label>';
 const actions='<div class="signup-actions">'+captcha+submit(t('Crear cuenta','Create account'))+'<p class="auth-alternative">'+t('¿Ya tienes cuenta?','Already have an account?')+' '+link(t('Inicia sesión','Sign in'),'login')+'</p></div>';
 return authPage(t('Crear cuenta','Create account'),t('Crea tu cuenta y verifica tu móvil por SMS. Las preferencias de comunicación son opcionales.','Create your account and verify your mobile number by SMS. Communication preferences are optional.'),form('signup',identity+security+terms+actions));
}
function verifyPage(){
 const signup=pending.mode==='signup',phone=signup?pending.v.phone:pending.acc.phone;
 const prefix=dialCodes.find(code=>phone.startsWith(code))||'+34';
 const resend='<button type="button" class="inline-link" data-resend>'+t('Reenviar SMS','Resend SMS')+'</button>';
 const otherNumber=link(t('Cambiar número','Change number'),signup?'signup':'sms');
 return authPage(signup?t('Verifica tu móvil','Verify your mobile'):t('Entra con un SMS','Sign in with SMS'),t('Introduce el código que te hemos enviado por SMS.','Enter the verification code sent by SMS.'),
 '<p class="sms-target">'+t('Al móvil ','To ')+html(prefix+' ••• ••• '+phone.slice(-3))+'</p>'+form('verify',field('sms')+'<small class="signup-note">'+t('Código de prueba: 123456.','Demo code: 123456.')+'</small>'+submit(signup?t('Verificar y crear cuenta','Verify and create account'):t('Validar código','Verify code')))+'<p class="resend-actions">'+t('¿No has recibido el SMS?','Didn’t receive the SMS?')+' '+resend+' '+otherNumber+'</p><p class="sms-status" aria-live="polite"></p>'+(!signup?link(t('Usar mi contraseña','Use my password'),'login'):''));
}
const compactAccess=window.matchMedia('(max-width:700px)');
compactAccess.addEventListener('change',()=>{
 const actions=main.querySelector('.login-actions');
 if(actions)actions.append(actions.querySelector(compactAccess.matches?'.auth-sms':'.auth-alternative'));
});
function auth(page){
 if(page==='signup')return signupPage();
 if(page==='sms')return authPage(t('Entra con un SMS','Sign in with SMS'),t('Introduce el móvil verificado de tu cuenta. Te enviaremos un código de un solo uso.','Enter your verified mobile number. We will send a single-use code.'),form('sms',phoneField(pending?.mode==='sms'?pending.acc?.phone:'')+'<small class="signup-note">'+t('Usa el número que vinculaste al crear tu cuenta.','Use the number linked when you created your account.')+'</small>'+submit(t('Enviar SMS','Send SMS')))+link(t('Usar mi contraseña','Use my password'),'login'));
 if(page==='recover')return authPage(t('Recuperar contraseña','Recover password'),t('Introduce el correo asociado a tu cuenta.','Enter your account email address.'),form('recover',field('email')+submit(t('Enviar enlace','Send link')))+link(t('Volver a iniciar sesión','Back to sign in'),'login'));
 if(page==='verify'&&pending&&['sms','signup'].includes(pending.mode))return verifyPage();
 if(page==='created')return authPage(t('Cuenta creada correctamente','Account created successfully'),t('Tu cuenta está creada y tu móvil verificado. Ya puedes entrar en Mi zona.','Your account is ready and your mobile is verified. You can now sign in to access My zone.'),button(t('Iniciar sesión','Sign in'),'login',true));
 if(page==='recover-sent')return authPage(t('Revisa tu correo','Check your email'),t('Si existe una cuenta con ese correo, recibirás un enlace para crear una nueva contraseña.','If an account exists for this address, you will receive a password reset link.'),(pending?.acc?button(t('Abrir enlace de prueba','Open demo link'),'reset',true):'')+link(t('Volver a iniciar sesión','Back to sign in'),'login')+link(t('Probar con otro correo','Try another address'),'recover'));
 if(page==='reset'&&pending?.mode==='recover'&&pending.acc)return authPage(t('Restablecer contraseña','Reset password'),t('Define tu nueva contraseña para esta cuenta de prueba.','Set a new password for this demo account.'),form('reset',field('password')+field('confirm')+submit(t('Guardar contraseña','Save password'))));
 const newAccountLink='<p class="auth-alternative">'+t('¿No tienes cuenta?','Don’t have an account?')+' '+link(t('Crea una cuenta','Create an account'),'signup')+'</p>';
 const smsLink='<a href="#sms" class="button auth-sms">'+t('Entrar con SMS','Sign in with SMS')+'</a>';
 const loginFields='<div class="login-fields">'+field('email')+'<div class="password-recovery">'+field('password')+link(t('Recuperar contraseña','Recover password'),'recover')+'</div></div>';
 const loginActions='<div class="login-actions">'+submit(t('Iniciar sesión','Sign in'))+(compactAccess.matches?newAccountLink+smsLink:smsLink+newAccountLink)+'</div>';
 return authPage(t('Iniciar sesión','Sign in'),t('Entra para continuar tu colección y consultar tus premios.','Sign in to continue your collection and check your rewards.'),
 form('login',loginFields+loginActions)+'<aside><strong>'+t('¿No puedes entrar?','Can’t sign in?')+'</strong><small>'+t('Recupera tu contraseña o entra con el móvil verificado de tu cuenta.','Recover your password or sign in with your verified mobile number.')+'</small></aside>');

}
function welcome(){
 const steps=[
  ['ticket',t('Registra','Register'),t('Introduce el código de tu envase.','Enter the code on your pack.')],
  ['stack',t('Colecciona','Collect'),t('Cada código normal suma 1 unidad.','Each normal code adds one unit.')],
  ['gift',t('Canjea','Redeem'),t('Elige un premio y utiliza tu saldo.','Choose a reward and use your balance.')]];
 const prizes=[
  ['shirt',t('Camiseta oficial','Official shirt'),t('Elige equipo y talla al solicitarla.','Choose your team and size when ordering.')],
  ['scarf',t('Bufanda oficial','Official scarf'),t('Elige tu equipo al solicitarla.','Choose your team when ordering.')],
  ['ball',t('Balón oficial','Official ball'),t('El balón de la promoción, para ti.','The promotion football, for you.')]];
 const image=(id,width,height)=>'<img alt="" width="'+width+'" height="'+height+'" src="assets/welcome/'+id+'.svg">';
 return '<section class="first-collection"><header><h2>'+t('Estrena tu colección.','Start your collection.')+'</h2><p>'+t('Tu cuenta ya está lista. Registra el código de tu envase y descubre tus primeros cromos.','Your account is ready. Register your pack code to discover your first cards.')+'</p><button class="button primary" data-register-code>'+t('Registrar mi primer código','Register my first code')+'</button></header><div class="welcome-steps">'+steps.map(([id,label,copy])=>'<div>'+image(id,40,40)+'<strong>'+label+'</strong><p>'+copy+'</p></div>').join('')+'</div><h3>'+t('Premios que puedes conseguir','Rewards you can get')+'</h3><div class="welcome-prizes">'+prizes.map(([id,name,copy])=>'<article><h3>'+name+'</h3><p>'+copy+'</p><b>'+cost(id)+' '+t('unidades','units')+'</b>'+image(id,211,176)+'<small>'+(id==='shirt'?t('Un canje por unidades','One unit redemption'):t('Un canje por persona','One redemption per person'))+'</small></article>').join('')+'</div><p>'+t('Un saldo compartido: cada canje descuenta sus unidades.','One shared balance. Each redemption uses its units.')+'</p><article class="gold-intro"><div><b>'+t('JUGADOR DORADO','GOLD PLAYER')+'</b><p>'+t('En los envases también puedes encontrar jugadores dorados.','You can also find gold players in packs.')+'</p><h3>'+t('Canjea tu primer jugador dorado por una camiseta.','Redeem your first gold player for a shirt.')+'</h3><p>'+t('El primero que canjees te da una camiseta sin gastar unidades.','Your first gold redemption gets you a shirt without spending units.')+'</p><p>'+t('Puedes conseguir otra camiseta con 50 unidades. Tras el primer canje dorado, los demás cuentan como cromos normales.','You can get another shirt with 50 units. After your first gold redemption, other gold cards count as normal cards.')+'</p><strong>'+t('La opción de canje aparecerá aquí cuando consigas uno.','Your redemption option will appear here when you collect one.')+'</strong></div><div class="welcome-exchange"><figure><span class="gold-player">'+image('user',64,64)+'</span><figcaption>'+t('1 jugador dorado','1 gold player')+'</figcaption></figure>'+ui.icon('arrow')+'<figure>'+image('gold-shirt',180,150)+'<figcaption>'+t('1 camiseta','1 shirt')+'</figcaption></figure><small>'+t('Conservas tus unidades','You keep your units')+'</small></div></article></section>';
}
function home(){
 const cards=db.account.cards;
 const unique=new Set(cards.map(c=>c.player)).size;
 const rewards=['shirt','scarf','ball'];
 const hub=$('#hub-progress');
 $('#page-title').textContent=t('Mi zona','My zone');
 $('.collection-stats').innerHTML=`<div class="collected-desktop"><strong>${unique} / ${window.PLAYERS.length}</strong><span>${t('Jugadores conseguidos','Players collected')}</span></div><a class="collected-mobile" href="#card-results">${unique}/${window.PLAYERS.length} ${t('conseguidos','collected')}</a>`;
 $('.collected-mobile').onclick=e=>{e.preventDefault();$('#card-results').scrollIntoView({block:'start'});};
 $('#collection').classList.toggle('new-collection',!unique);
 if(!unique){
  $('.collection-stats').textContent=t('0 de 80 jugadores','0 of 80 players');
  hub.innerHTML=welcome();
  return;
 }
 const widgets=rewards.map(id=>{
  const target=id;
  const units=balance(target),goal=cost(target),pct=Math.min(100,Math.round(units/goal*100));
  const description=claimed(target)?t('Ya canjeado','Already redeemed'):canClaim(target)?t('Disponible para canjear','Available to redeem'):t('Te faltan ','You need ')+(goal-units)+t(' unidades',' more units');
  return `<button class="reward-progress" data-ready="${canClaim(target)}" data-prize="${target}"><span class="ring"><svg viewBox="0 0 64 64" aria-hidden="true"><circle class="ring-track" cx="32" cy="32" r="25"/><circle class="ring-arc" cx="32" cy="32" r="28" pathLength="100" stroke-dasharray="${pct} 100" opacity="${pct?1:0}"/></svg><b>${Math.min(units,goal)}/${goal}</b></span><span class="reward-text"><strong><span class="prize-art"><img width="24" height="20" src="assets/icons/${id==='scarf'?'scarf':'reward-'+id}.svg" alt=""></span>${titleOf(id)}</strong><small>${description}</small></span></button>`;
 }).join('');
 const dots=rewards.map((id,i)=>`<button type="button" aria-label="${titleOf(id)}" aria-pressed="${i===0}"></button>`).join('');
 const goldOffer=canClaim('gold')?`<button class="gold-offer" data-prize="gold"><img src="assets/welcome/gold-shirt.svg" width="64" height="64" alt=""><span><small>${t('Jugador dorado disponible','Gold player available')}</small><strong>${t('Tu primer jugador dorado tiene premio','Your first gold player earns a reward')}</strong><span>${t('Canjéalo por una camiseta sin gastar unidades.','Redeem it for a shirt without spending units.')}</span></span><b>${t('Canjear camiseta','Redeem shirt')}</b></button>`:'';
 hub.innerHTML=`${goldOffer}<strong>${t('Saldo','Balance')} · ${balance('shirt')} ${t('unidades','units')}</strong><div class="reward-gallery"><div class="reward-grid">${widgets}</div><div class="reward-pages">${dots}</div></div><p>${t('Los tres canjes por unidades comparten saldo.','All three rewards use the same unit balance.')}</p><p>${t('Encuentra un jugador dorado para conseguir una camiseta.','Find a gold player to get a shirt.')}</p>`;
 const track=hub.querySelector('.reward-grid');
 const controls=[...hub.querySelectorAll('.reward-pages button')];
 const leftOf=card=>Math.min(track.scrollWidth-track.clientWidth,card.offsetLeft-track.firstElementChild.offsetLeft);
 function mark(i){controls.forEach((b,j)=>b.setAttribute('aria-pressed',String(j===i)));}
 controls.forEach((button,i)=>button.onclick=()=>{
  mark(i);
  if(track.scrollWidth>track.clientWidth)track.scrollTo({left:leftOf(track.children[i]),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  else track.children[i].focus({preventScroll:true});
 });
 track.addEventListener('focusin',e=>{const i=Array.from(track.children).indexOf(e.target.closest('.reward-progress'));if(i>=0)mark(i);});
 track.addEventListener('scroll',()=>{
  const offsets=Array.from(track.children,card=>Math.abs(leftOf(card)-track.scrollLeft));
  const selected=offsets.indexOf(Math.min(...offsets));
  controls.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===selected)));
 },{passive:true});
}
function panel(title,body,{kind='',intro='',tabs='',actions=''}={}){
 return '<section class="journey-panel '+kind+'" role="dialog" aria-modal="true" aria-labelledby="panel-title"><header><div class="panel-title-row"><h1 id="panel-title">'+title+'</h1><button class="icon-button panel-dismiss" data-route="home" aria-label="'+t('Cerrar','Close')+'"></button></div>'+(intro?'<p>'+intro+'</p>':'')+tabs+'</header><div class="panel-body">'+body+'</div>'+(actions?'<div class="panel-actions">'+actions+'</div>':'')+'</section>';
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
const accountField=(key,label,value='',opts={})=>{
 const type=opts.type||'text', action=type==='password'?
   '<button type="button" data-eye aria-label="'+t('Mostrar contraseña','Show password')+'">'+ui.icon('eye')+'</button>':
   opts.editIcon?'<img width="20" height="20" alt="" src="assets/icons/pencil.svg">':'';
 return '<label class="entry-field '+(opts.inline?'profile-field':'')+'"><span>'+label+'</span><input type="'+type+'" name="'+key+'" '+(opts.optional?'':'required')+' value="'+html(value)+'"'+(opts.placeholder?' placeholder="'+html(opts.placeholder)+'"':'')+(opts.auto?' autocomplete="'+opts.auto+'"':'')+'>'+action+'</label>';
};
const profileButton=(label,destination,icon='')=>'<a class="button" href="#'+html(destination)+'">'+(icon?ui.icon(icon):'')+label+'</a>';
const infoBox=(title,desc)=>'<div class="profile-notice"><strong>'+title+'</strong><p>'+desc+'</p></div>';
function settingsView(section,title,desc,body){
 const localNav=settingsLinks(section);
 return accountPanel('<div class="settings-layout">'+localNav+'<section class="settings-content"><h2>'+title+'</h2><p>'+desc+'</p>'+body+'</section></div>',section);
}
function saveProfileEvent(es,en){
 db.account.profileEvents.push({time:Date.now(),label:[es,en]});
 db.save();
}
let profileMessage='', accountClosed=false;
function profileFeedback(){
 const msg=profileMessage;
 profileMessage='';
 return msg?'<p role="status" class="profile-feedback">'+html(msg)+'</p>':'';
}
function personalData(a){
 const hint=t('Si cambias tu correo, te pediremos que verifiques la nueva dirección.','If you change your email, we will ask you to verify the new address.');
 const notice=a.pendingEmail?infoBox(t('Verifica tu nuevo correo','Verify your new email'),html(a.pendingEmail)+' · '+t('Cambio pendiente de verificación.','Verification pending.')):'';
 const status=a.pendingEmail?'<div class="profile-actions">'+profileButton(t('Verificar correo de prueba','Verify demo email'),'profile-email')+'</div>':'';
 const legal=document.querySelector('[data-of-en="Privacy policy"]')?.href||'https://privacy.mondelezinternational.com/eu/es-ES/privacy-notice/';
 const privacy='<div class="profile-privacy"><label><input type="checkbox" role="switch" name="promotionUpdates" data-profile-communications '+(a.preferences?.communications?'checked':'')+'><span>'+t('Quiero recibir novedades y comunicaciones de la promoción','I would like to receive promotion news and communications')+'</span></label> <a href="'+html(legal)+'" target="_blank" rel="noopener">'+t('Ver Política de privacidad','View privacy policy')+' '+ui.icon('external')+'</a> '+link(t('Gestionar preferencias','Manage preferences'),'profile-preferences')+'</div>';
 const rows=accountField('name',t('Nombre','First name'),a.name,{inline:true,editIcon:true,auto:'given-name'})+
   accountField('surname',t('Apellidos','Last name'),a.surname,{inline:true,editIcon:true,auto:'family-name'})+
   accountField('email',t('Correo electrónico','Email address'),a.pendingEmail||a.email,{type:'email',inline:true,editIcon:true,auto:'email'})+
   phoneField(a.phone,{required:false,label:t('Teléfono','Phone'),inline:true});
 const closeLink='<p class="delete-account">'+t('Si quieres eliminar tus datos permanentemente,','To permanently delete your data,')+' <a href="#remove">'+t('cierra la cuenta.','close your account.')+' '+ui.icon('trash')+'</a></p>';
 return settingsView('profile',t('Datos personales','Personal details'),t('Mantén tus datos al día para gestionar tu cuenta y tus premios.','Keep your details up to date to manage your account and rewards.'),
   profileFeedback()+notice+form('edit',rows+'<p class="profile-hint">'+hint+'</p><button type="submit" class="button" disabled>'+t('Guardar cambios','Save changes')+'</button>')+status+privacy+closeLink);
}
function passwordScreen(page){
 const edit=page==='password/edit';
 const body=edit?form('password',accountField('currentPassword',t('Contraseña actual','Current password'),'',{type:'password',inline:true,auto:'current-password'})+
   accountField('password',t('Nueva contraseña','New password'),'',{type:'password',inline:true,auto:'new-password'})+
   accountField('confirm',t('Confirmar contraseña','Confirm password'),'',{type:'password',inline:true,auto:'new-password'})+
   '<p class="profile-hint">'+t('Usa una contraseña diferente de la actual y repítela para confirmar.','Choose a different password and enter it twice to confirm.')+'</p>'+link(t('No recuerdo mi contraseña','I forgot my password'),'password/recover')+'<div class="profile-actions">'+profileButton(t('Cancelar','Cancel'),'password')+submit(t('Guardar contraseña','Save password'))+'</div>'):
   profileFeedback()+infoBox(t('Tu contraseña','Your password'),t('Por seguridad, no mostramos tu contraseña actual.','For security, we hide your current password.'))+profileButton(t('Cambiar contraseña','Change password'),'password/edit');
 return settingsView('password',t('Contraseña','Password'),t('Protege el acceso a tu cuenta.','Protect access to your account.'),body);
}
function savedAddresses(a){
 if(!a.addresses)a.addresses=a.address?.street?[{...a.address,id:'primary',alias:a.address.alias||t('Casa','Home')}]:[];
 return a.addresses;
}
function addressScreen(page){
 const a=db.account,list=savedAddresses(a),[,action,id]=page.split('/');
 const addr=id&&list.find(item=>item.id===id);
 const edit=action==='new'||(action==='edit'&&addr);
 const title=edit?(addr?t('Editar dirección','Edit address'):t('Añadir dirección','Add address')):t('Direcciones de envío','Delivery addresses');
 let body=profileFeedback();
 if(edit){
   const values=addr||{name:a.name,surname:a.surname,phone:a.phone,country:t('España','Spain')};
   const alias=accountField('alias',t('Nombre de la dirección','Address name'),values.alias,{placeholder:t('Casa, trabajo…','Home, work…')});
   const grid=[[accountField('name',t('Nombre','First name'),values.name),accountField('surname',t('Apellidos','Last name'),values.surname)],[phoneField(values.phone||'',{required:true,label:t('Teléfono','Phone')}),accountField('country',t('País','Country'),values.country||t('España','Spain'))],[accountField('province',t('Provincia','Province'),values.province),accountField('postcode',t('Código postal','Postcode'),values.postcode)]];
   const rows=grid.map(cells=>'<div class="address-grid">'+cells.join('')+'</div>').join('');
   body+=form('address','<input type="hidden" name="addressId" value="'+html(addr?.id)+'">'+alias+rows+accountField('city',t('Localidad','Town or city'),values.city)+accountField('street',t('Dirección','Address'),values.street)+accountField('flat',t('Piso y puerta (opcional)','Floor and door (optional)'),values.flat,{optional:true})+'<label class="address-default"><input type="checkbox" name="primary" '+(!list.length||addr===list[0]?'checked':'')+'> '+t('Usar como dirección predeterminada','Use as default address')+'</label><div class="profile-actions">'+profileButton(t('Cancelar','Cancel'),'address')+submit(t('Guardar dirección','Save address'))+'</div>');
 }else{
   body+=list.map((item,i)=>'<article class="address-card"><div class="address-card-title"><strong>'+html(item.alias)+'</strong>'+(i===0?'<small>'+t('Predeterminada','Default')+'</small>':'')+'</div><p>'+html([item.name,item.surname].filter(Boolean).join(' '))+'<br>'+html([item.street,item.flat].filter(Boolean).join(', '))+'<br>'+html([item.postcode,item.city,item.province].filter(Boolean).join(' · '))+'</p><div class="address-tools">'+profileButton(t('Editar','Edit'),'address/edit/'+item.id,'pencil')+profileButton(t('Eliminar','Delete'),'address/delete/'+item.id,'trash')+(i?'<button type="button" class="button" data-primary-address="'+html(item.id)+'">'+t('Usar como predeterminada','Set as default')+'</button>':'')+'</div></article>').join('')||infoBox(t('Aún no tienes direcciones guardadas','You have no saved addresses'),t('Añade una dirección para recibir tus premios.','Add an address to receive your rewards.'));
   body+=profileButton(t('Añadir dirección','Add address'),'address/new','plus')+'<p class="profile-hint">'+t('Modificar una dirección guardada no cambia la de un pedido ya realizado.','Changing a saved address does not update past orders.')+'</p>';
 }
 return settingsView('address',title,t('Guarda tus direcciones y elige cuál utilizar al pedir un premio.','Save your addresses and choose one when requesting a reward.'),body);
}
function contextLayer(base,title,intro,content,back){
 const shell=base.replace('<section class="journey-panel','<section inert aria-hidden="true" class="journey-panel').replace('aria-modal="true"','aria-modal="false"');
 return shell+'<div class="profile-overlay"><section role="dialog" aria-modal="true" aria-labelledby="subpanel-title" class="profile-dialog" data-parent="'+back+'"><div class="profile-dialog-header"><h2 id="subpanel-title">'+title+'</h2><a class="icon-button panel-dismiss" href="#'+back+'" aria-label="'+t('Cerrar','Close')+'"></a></div><p>'+intro+'</p>'+content+'</section></div>';
}
function profile(page){
 const a=db.account;
 if(page.startsWith('password')){
   if(page==='password/recover'||page==='password/recovery-sent'){
     const sent=page.endsWith('sent');
     const title=sent?t('Enlace de recuperación preparado','Recovery link ready'):t('Recuperar contraseña','Recover password');
     const content=sent?infoBox(t('Recuperación de prueba','Demo recovery'),t('Utiliza este enlace de prueba para crear una contraseña nueva.','Use this demo link to set a new password.'))+profileButton(t('Abrir enlace de prueba','Open demo link'),'password/reset'):
        form('profile-recover',accountField('email',t('Correo electrónico','Email address'),a.email,{type:'email'})+'<div class="profile-actions">'+profileButton(t('Volver','Back'),'password/edit')+submit(t('Enviar enlace','Send link'))+'</div>');
     return contextLayer(passwordScreen('password/edit'),title,t('Protege el acceso a tu cuenta.','Protect access to your account.'),content,'password/edit');
   }
   if(page==='password/reset')return contextLayer(passwordScreen('password'),t('Restablecer contraseña','Reset password'),t('Crea una contraseña nueva para tu cuenta.','Set a new password for your account.'),form('profile-reset',field('password')+field('confirm')+submit(t('Guardar contraseña','Save password'))),'password');
   return passwordScreen(page);
 }
 if(page.startsWith('address')){
   const [,action,id]=page.split('/'),addr=savedAddresses(a).find(x=>x.id===id);
   if(action==='delete'&&addr)return contextLayer(addressScreen('address'),t('¿Eliminar esta dirección?','Delete this address?'),html(addr.alias),form('delete-address','<input type="hidden" name="addressId" value="'+html(id)+'"><div class="profile-actions">'+profileButton(t('Cancelar','Cancel'),'address')+submit(t('Eliminar dirección','Delete address'))+'</div>'),'address');
   return addressScreen(page);
 }
 if(page==='remove'||page==='remove/identity'){
   const identity=page.endsWith('identity');
   const title=identity?t('Confirma el cierre de tu cuenta','Confirm account closure'):t('¿Seguro que quieres cerrar tu cuenta?','Are you sure you want to close your account?');
   const warning=infoBox(identity?t('El cierre es definitivo','Closure is permanent'):t('Qué pasa al cerrar tu cuenta','What happens when you close your account'),t('Cuando se complete el cierre, perderás el acceso a tu cuenta, tus cromos y tu historial.','Once closed, you will lose access to your account, cards and history.'));
   const contents=identity?warning+form('remove',accountField('currentPassword',t('Contraseña actual','Current password'),'',{type:'password',auto:'current-password'})+link(t('No recuerdo mi contraseña','I forgot my password'),'password/recover')+'<div class="profile-actions">'+profileButton(t('Volver','Back'),'remove')+submit(t('Solicitar eliminación','Request deletion'))+'</div>'):
     warning+'<div class="profile-actions">'+profileButton(t('Cancelar','Cancel'),'profile')+profileButton(t('Sí, continuar','Yes, continue'),'remove/identity')+'</div>'+link(t('¿Qué pasa si cierro mi cuenta?','What happens if I close my account?'),'help');
   return contextLayer(personalData(a),title,identity?t('Introduce tu contraseña actual para solicitar el cierre.','Enter your current password to request closure.'):t('Revisa las consecuencias antes de continuar. Después te pediremos tu contraseña.','Review the consequences before continuing. Then we will ask for your password.'),contents,'profile');
 }
 if(page==='profile-preferences'){
   return contextLayer(personalData(a),t('Preferencias de comunicación','Communication preferences'),t('Opcional · Configúralas ahora o más adelante','Optional · Set them now or later'),form('profile-prefs',preferenceControls(a.preferences||{})+'<div class="profile-actions">'+profileButton(t('Cancelar','Cancel'),'profile')+submit(t('Guardar preferencias','Save preferences'))+'</div>'),'profile');
 }
 if(page==='profile-email'&&a.pendingEmail){
   return contextLayer(personalData(a),t('Verifica tu nuevo correo','Verify your new email'),html(a.pendingEmail),form('profile-email',submit(t('Confirmar nuevo correo','Confirm new email'))),'profile');
 }
 return personalData(a);
}
function markProfileEdited(event){
 const f=event.target.closest('.account-panel form[data-flow]');
 if(!f||f.closest('[inert]'))return;
 f.dataset.editRoute=route();
 if(f.dataset.flow==='edit')f.querySelector('[type="submit"]').disabled=false;
}
main.addEventListener('input',markProfileEdited);
main.addEventListener('change',markProfileEdited);
function confirmLeavingProfile(dirty,destination){
 if(main.querySelector('.discard-profile'))return;
 const dialog=document.createElement('dialog');
 dialog.className='discard-profile';
 dialog.setAttribute('aria-labelledby','discard-heading');
 dialog.innerHTML='<h2 id="discard-heading">'+t('¿Salir sin guardar?','Leave without saving?')+'</h2><p>'+t('Si sales ahora, perderás los cambios que has hecho.','If you leave now, your changes will be lost.')+'</p><div class="profile-actions"><button type="button" class="button" data-stay>'+t('Seguir editando','Keep editing')+'</button><button type="button" class="button" data-leave>'+t('Salir sin guardar','Leave without saving')+'</button></div>';
 main.append(dialog);
 dialog.addEventListener('close',()=>dialog.remove(),{once:true});
 dialog.querySelector('[data-stay]').onclick=()=>dialog.close();
 dialog.querySelector('[data-leave]').onclick=()=>{delete dirty.dataset.editRoute;dialog.close();go(destination);};
 dialog.showModal();
}
window.addEventListener('hashchange',event=>{
 const dirty=main.querySelector('form[data-edit-route]');
 if(!dirty||!db.account||dirty.dataset.editRoute===route())return;
 const destination=route();
 event.stopImmediatePropagation();
 history.replaceState(null,'','#'+dirty.dataset.editRoute);
 confirmLeavingProfile(dirty,destination);
},true);
main.addEventListener('change',event=>{
 if(!event.target.matches('[data-profile-communications]'))return;
 const a=db.account;
 a.preferences={...a.preferences,communications:event.target.checked};
 saveProfileEvent('Preferencias actualizadas','Preferences updated');
});
main.addEventListener('click',event=>{
 const trigger=event.target.closest('[data-primary-address]');
 if(!trigger)return;
 const a=db.account,list=savedAddresses(a),item=list.find(x=>x.id===trigger.dataset.primaryAddress);
 if(!item)return;
 a.addresses=[item,...list.filter(x=>x!==item)];a.address={...item};
 saveProfileEvent('Dirección predeterminada actualizada','Default address updated');draw();
});
document.addEventListener('keydown',event=>{
 if(event.key!=='Escape')return;
 if(main.querySelector('.discard-profile[open]')){event.stopImmediatePropagation();return;}
 const layer=main.querySelector('.profile-dialog');
 if(layer){event.preventDefault();event.stopImmediatePropagation();go(layer.dataset.parent);}
},true);
async function submitProfile(mode,v,fail){
 const a=db.account;
 if(mode==='password'||mode==='profile-reset'){
   if(mode==='password'&&!await db.matchesPassword(a,v.currentPassword))return fail('Contraseña actual incorrecta.','Incorrect current password.');
   if(await db.matchesPassword(a,v.password))return fail('La contraseña nueva debe ser diferente.','Choose a different password.');
   if(mode==='profile-reset'&&!a.recoveryRequested)return fail('Solicita un enlace de recuperación.','Request a recovery link.');
   delete a.recoveryRequested;await db.password(a,v.password);saveProfileEvent('Contraseña actualizada','Password updated');
   profileMessage=t('Contraseña actualizada.','Password updated.');go('password');
 }else if(mode==='profile-recover'){
   if(v.email.toLowerCase().trim()!==a.email)return fail('Revisa el correo de tu cuenta.','Check your account email.');
   a.recoveryRequested=true;db.save();go('password/recovery-sent');
 }else if(mode==='edit'){
   const email=v.email.toLowerCase().trim(),existing=db.locate(email);
   if(email!==a.email&&existing)return fail('El correo ya está registrado.','This email is already registered.');
   a.name=v.name.trim();a.surname=v.surname.trim();a.phone=v.phone;
   a.pendingEmail=email!==a.email?email:'';
   saveProfileEvent('Datos personales actualizados','Personal details updated');
   profileMessage=t('Cambios guardados.','Changes saved.');go('profile');
 }else if(mode==='profile-prefs'){
   a.preferences={communications:v.communications==='on',personalization:v.personalization==='on'};
   saveProfileEvent('Preferencias actualizadas','Preferences updated');
   profileMessage=t('Preferencias guardadas.','Preferences saved.');go('profile');
 }else if(mode==='profile-email'&&a.pendingEmail){
   if(!db.changeEmail(a,a.pendingEmail))return fail('El correo ya está registrado.','This email is already registered.');
   delete a.pendingEmail;saveProfileEvent('Correo verificado','Email verified');go('profile');
 }else if(mode==='address'||mode==='delete-address'){
   const list=savedAddresses(a),idx=list.findIndex(x=>x.id===v.addressId);
   if(mode==='delete-address'){if(idx!==-1)list.splice(idx,1);}
   else{
     const {addressId,primary,...data}=v;
     const item={...data,id:addressId||(crypto.randomUUID?.() || Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join(''))};
     if(idx>=0)list[idx]=item;else list.push(item);
     if(primary){list.splice(list.indexOf(item),1);list.unshift(item);}
   }
   a.address={...list[0]};saveProfileEvent('Direcciones actualizadas','Addresses updated');
   profileMessage=mode==='address'?t('Dirección guardada.','Address saved.'):t('Dirección eliminada.','Address deleted.');go('address');
 }else if(mode==='remove'){
   if(!await db.matchesPassword(a,v.currentPassword))return fail('Contraseña incorrecta.','Incorrect password.');
   db.remove();accountClosed=true;go('account-closed');
 }
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
   description:[titleOf(order.reward),order.shipping?.club,order.shipping?.size].filter(Boolean).join(' · '),
   detail:'<strong>'+t('Referencia y entrega','Reference and delivery')+'</strong><p><code>'+html(order.id)+'</code><br>'+delivery(order.shipping||{})+'</p><strong>'+t('Siguiente paso','Next step')+'</strong><p>'+t('Nos pondremos en contacto contigo a la menor brevedad posible para gestionar tu premio.','We will contact you as soon as possible about your reward.')+'</p>'});
 }
 const eventIds=new Set();
 account.profileEvents.forEach((event,i)=>{
  const key=String(event.time);
  const id=eventIds.has(key)?'account-'+i+'-'+key:key;
  eventIds.add(key);
  rows.push({id,type:'account',time:event.time,title:t(...event.label),description:t('Mi cuenta','My account'),detail:html(account.email)});
 });
 const filters=Object.entries(labels).map(([id,label])=>'<button data-tab="'+id+'" aria-pressed="'+(active===id)+'">'+label+'</button>').join('');
 const formatter=new Intl.DateTimeFormat(db.lang==='en'?'en-GB':'es-ES',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
 const list=rows.reverse().filter(row=>active==='all'||row.type===active).sort((a,b)=>(b.time||0)-(a.time||0)).map((row,i)=>{
  const read=(account.readActivity||[]).includes(row.id),open=expanded===row.id;
  const refLabel=row.type==='orders'?t('Ref.','Ref.'):t('Código:','Code:');
  const reference=row.reference?'<div class="activity-reference"><img src="assets/history/qr.svg" width="20" height="20" alt="">'+refLabel+' <code>'+html(row.reference)+'</code><button data-copy="'+html(row.reference)+'" aria-label="'+t('Copiar','Copy')+' '+html(row.reference)+'">'+ui.icon('copy')+'</button></div>':'';
  return '<article class="activity-row" data-read="'+read+'"><button class="activity-toggle" data-activity="'+html(row.id)+'" aria-expanded="'+open+'" aria-controls="activity-'+i+'"><span class="activity-heading"><strong>'+html(row.title)+'</strong><small><img src="assets/history/time.svg" width="16" height="16" alt="">'+(row.time?formatter.format(row.time):'')+'</small></span><span class="activity-chevron">'+ui.icon('chevron')+'</span></button>'+reference+'<p>'+html(row.description)+'</p><small class="activity-read">'+(read?t('Leído','Read'):t('Sin leer','Unread'))+'</small><div class="activity-detail" id="activity-'+i+'" '+(open?'':'hidden')+'>'+row.detail+'</div></article>';
 }).join('');
 const title=ordersOnly?t('Mis solicitudes','My requests'):t('Historial de la cuenta','Account history');
 const intro=t('Tus códigos, cromos, canjes y cambios de cuenta, en un mismo lugar.','Your codes, cards, redemptions and account changes, all in one place.');
 return accountPanel('<section class="activity-feed"><h2>'+title+'</h2>'+(ordersOnly?'':'<p>'+intro+'</p><div class="activity-filters">'+filters+'</div>')+'<div class="activity-list">'+(list||'<p class="activity-empty">'+t('Todavía no hay actividad.','No activity yet.')+'</p>')+'</div></section>','history');
}
function prizeSummary(id,choice){
 const art={gold:'reward-shirt',shirt:'reward-shirt',scarf:'scarf',ball:'reward-ball'}[id];
 const variant=[choice.club,choice.size?t('Talla ','Size ')+choice.size:''].filter(Boolean).map(html).join(' · ');
 return '<div class="prize-summary"><img class="prize-illustration" width="64" alt="" src="assets/icons/'+art+'.svg"><div><strong>'+titleOf(id)+'</strong><small>'+t('Por ','For ')+cost(id)+' '+(id==='gold'?t('cromo dorado','gold card'):t('unidades','units'))+'</small>'+(variant?'<small>'+variant+'</small>':'')+'</div></div>';
}
function delivery(data){return [[data.name,data.surname].filter(Boolean).join(' '),data.street,[data.postcode,data.city,data.province].filter(Boolean).join(' · ')].map(html).join('<br>');}
function reward(){
 const id=rewardId,a=db.account;
 if(step===3&&receipt){
  const info=prizeSummary(id,receipt.shipping)+'<h2>'+t('Siguiente paso','Next step')+'</h2><p>'+t('Nos pondremos en contacto contigo a la menor brevedad posible para gestionar tu premio.','We will contact you as soon as possible about your reward.')+'</p><h2>'+t('Referencia y entrega','Reference and delivery')+'</h2><p><code>'+html(receipt.id)+'</code></p><p>'+delivery(receipt.shipping)+'</p>';
  return panel(t('Solicitud recibida','Request received'),info,{kind:'claim-review',actions:'<p>'+t('Puedes consultar esta solicitud en tu historial.','You can find this request in your history.')+'</p>'+button(t('Volver a Mi zona','Back to My zone'),'home',true)});
 }
 if(!canClaim(id))return panel(titleOf(id),'<h2>'+(claimed(id)?t('Ya canjeado','Already redeemed'):t('Progreso','Progress'))+'</h2><p>'+balance(id)+' / '+cost(id)+' '+(id==='gold'?t('cromos dorados','gold cards'):t('unidades disponibles','available units'))+'</p>'+button(t('Volver a Mi zona','Back to My zone'),'home'));
 if(step===2){
  const remaining=balance(id)-cost(id);
  const review=prizeSummary(id,shipping)+'<h2>'+t('Antes de confirmar','Before confirming')+'</h2><p>'+t('Usarás ','You will use ')+cost(id)+' '+(id==='gold'?t('cromo dorado.','gold card.'):t('unidades.','units.'))+'</p><p>'+(id==='gold'?t('Conservas tus unidades.','You keep your units.'):t('Te quedarán ','You will have ')+remaining+t(' unidades disponibles.',' units left.'))+'</p><small>'+t('Se usan primero tus copias más antiguas. Tu colección se conserva.','Your oldest copies are used first. You keep your collection.')+'</small><h2>'+t('Entrega','Delivery')+'</h2><p>'+delivery(shipping)+'</p><p>'+t('Después de confirmar, no podrás editar esta solicitud.','After confirmation, you cannot edit this request.')+'</p>';
  const actions=form('confirm-prize',submit(t('Confirmar canje','Confirm redemption')))+'<button class="button" data-back-step>'+t('Volver a editar','Back to edit')+'</button>';
  return panel(t('Revisa tu solicitud','Review your request'),review,{kind:'claim-review',actions});
 }
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
   [t('¿Dónde gestiono mis preferencias de privacidad?','Where can I manage my privacy preferences?'),t('Al crear la cuenta puedes elegir tus preferencias. Puedes revisarlas después en Mi cuenta, en Datos personales.','Choose your preferences at registration, then review them in My account under Personal details.')],
   [t('¿Qué pasa si elimino mi cuenta?','What happens if I delete my account?'),t('Se eliminan tus datos de prueba guardados en este dispositivo.','Your saved demo account data is removed from this device.')],
   [t('¿Qué hago si no reconozco una acción de mi Historial?','What if I do not recognise an entry in my History?'),t('Revisa los detalles de la acción y cambia tu contraseña desde Mi cuenta.','Review the entry and change your password in My account.')]
 ];
 const faq='<div class="faq-list"><h2>'+t('Preguntas frecuentes','Frequently asked questions')+'</h2>'+questions.map(([q,answer],i)=>'<details '+(i===0?'open':'')+'><summary>'+q+ui.icon('chevron')+'</summary><p>'+answer+'</p></details>').join('')+'</div>';
 const contact='<aside class="help-contact"><strong>'+t('Contacto','Contact')+'</strong><small>900 000 000 · ayuda@oreo.es</small><div class="contact-methods"><a class="button" href="tel:900000000"><img alt="" width="20" height="20" src="assets/icons/phone.svg"><span>900 000 000</span><b>'+t('Llamar','Call')+'</b></a><a class="button" href="mailto:ayuda@oreo.es"><img alt="" width="20" height="20" src="assets/icons/mail.svg"><span>ayuda@oreo.es</span><b>'+t('Escribir','Email')+'</b></a></div></aside>';
 return panel(t('Ayuda','Help'),contact+faq,{kind:'help-panel',intro:t('Resuelve tus dudas sobre tu cuenta, los códigos y los premios.','Find answers about your account, codes and rewards.')});
}
function receiptPreview() {
 const {picks, gold, index} = registered;
 const player = picks[index];
 const name = html(player.name);
 const rarity = gold ? t('Dorada','Gold') : t('Común','Common');
 return `<figure class="receipt-tile" aria-label="${name}, ${rarity}">
   ${gold ? '<span class="receipt-sparkle">'+ui.icon('sparkles')+'</span>' : ''}
   <div class="receipt-card">${ui.receivedCard(player,gold)}</div>
   <figcaption>${ui.icon('check')}${t('Disponible','Available')}</figcaption>
 </figure>`;
}
function registrationResult() {
 const {picks, gold, first, firstGold, index} = registered;
 const count = picks.length;
 const quantity = n => n+' '+(n===1?t('unidad','unit'):t('unidades','units'));
 const balanceText = t('Saldo: ','Balance: ')+quantity(balance('shirt'))+'.';
 const name = html(picks[0].label || picks[0].name);
 const isClaimable = gold && canClaim('gold');
 let title = first ? t('Tu primer cromo ya está aquí','Your first card is here') : t('Código registrado','Code registered');
 let message = count===1 ? t('Has conseguido una copia común de ','You collected a common copy of ')+name+'.'
   : t('Has conseguido ','You collected ')+count+t(' cromos comunes.',' common cards.');
 message += '<br>+'+quantity(count)+' · '+balanceText;
 if (isClaimable) {
   title = first && count===1 ? t('¡Tu primer cromo es dorado!','Your first card is gold!')
     : firstGold && count===1 ? t('¡Tu primer cromo dorado!','Your first gold card!')
     : count===1 ? t('Cromo dorado obtenido','Gold card collected') : t('Cromos dorados obtenidos','Gold cards collected');
   message = t('Puedes canjearlo por una camiseta sin gastar unidades. Este canje es independiente del de 50 unidades: puedes conseguir una camiseta por cada vía.','You can redeem a gold card for a shirt without spending any units. This is separate from the 50-unit shirt: you can get a shirt through each route.');
 } else if (gold) {
   title = count===1?t('Otra copia dorada','Another gold card'):t('Nuevas copias doradas','New gold cards');
   message = (count===1 ? t('Has conseguido un dorado de ','You collected a gold copy of ')+name+'.'
     : t('Has conseguido ','You collected ')+count+t(' cromos dorados.',' gold cards.'))
     +' '+t('Ya canjeaste tu primer dorado por la camiseta.','You have already redeemed your first gold card for a shirt.')
     +'<br>+'+quantity(count)+' · '+balanceText;
 }
 const label = i=>html(picks[i].name)+' · '+(i+1)+' / '+count;
 const carousel = count>1 ? `<div class="receipt-paging"><button type="button" data-receipt-step="-1" aria-label="${t('Cromo anterior','Previous card')}">${ui.icon('back')}</button><span aria-live="polite">${label(index)}</span><button type="button" data-receipt-step="1" aria-label="${t('Cromo siguiente','Next card')}">${ui.icon('forward')}</button></div>` : '';
 return `<section class="registration-receipt" role="dialog" aria-modal="true" aria-labelledby="receipt-title">
   <button class="receipt-handle" type="button" aria-label="${t('Cerrar','Close')}"><span></span></button>
   <button class="icon-button panel-dismiss receipt-close" data-route="home" aria-label="${t('Cerrar registro','Close code registration')}"></button>
   <div class="receipt-body">
     <div class="receipt-stage">${receiptPreview()}</div>${carousel}
     <div class="receipt-feedback">
       <picture aria-hidden="true"><source media="(max-width:760px)" srcset="assets/registro/success-mobile.svg"><img alt="" src="assets/registro/success.svg"></picture>
       <h1 id="receipt-title">${title}</h1><p>${message}</p>
     </div>
     ${isClaimable ? '<button class="button receipt-action" data-prize="gold">'+t('Ver mi premio','View my reward')+'</button>' : '<button class="button receipt-action" data-route="home">'+t('Ver mi colección','View my collection')+'</button>'}
   </div>
 </section>`;
}
function draw(){
 let page=route();
 const a=db.account;
 if(page==='received'&&!registered){page=a?'home':'login';history.replaceState(null,'','#'+page);}
 const collection=!!a&&['home','collection','login'].includes(page);
 document.body.classList.toggle('public-mode',!a);
 const overlay=!!a&&!collection;
 const openingPanel=overlay&&!document.body.classList.contains('has-panel');
 main.classList.toggle('opening-panel',openingPanel);
 document.body.classList.toggle('has-panel',overlay);
 $('#collection').hidden=!a;main.hidden=collection;
 for(const bg of document.querySelectorAll('.site-header,#collection,[data-oreo-footer],.mobile-register'))bg.inert=overlay;
 if(overlay){ui.refresh();home();}
 if(a){
  const count = new Set(a.cards.filter(card => !card.used).map(card => card.player)).size;
  const balance = count === 1 ? t('1 jugador disponible','1 player available')
    : count + t(' jugadores disponibles',' available players');
  document.querySelectorAll('[data-account-initial]').forEach(el => el.textContent = a.name.slice(0,1));
  document.querySelectorAll('[data-account-name]').forEach(el => el.textContent = t('Hola, ','Hi, ') + a.name);
  document.querySelectorAll('[data-account-balance]').forEach(el => el.textContent = balance);
 }
 if(collection){ui.refresh();home();}
 else if(!a&&page==='account-closed'&&accountClosed){main.innerHTML=authPage(t('Solicitud de cierre recibida','Account closure request received'),t('Se ha cerrado tu cuenta de prueba en este dispositivo.','Your demo account has been closed on this device.'),profileButton(t('Entendido','Done'),'login'));}
 else if(!a){main.innerHTML=auth(page);}
 else if(page==='reward')main.innerHTML=reward();
 else if(['history','orders'].includes(page))main.innerHTML=historyPage(page==='orders');
 else if(page==='help')main.innerHTML=help();
 else if(page==='received'&&registered)main.innerHTML=registrationResult();
 else if(page==='logout')main.innerHTML=panel(t('Cerrar sesión','Log out'),'<p>'+t('Tu colección seguirá guardada. Podrás continuar cuando vuelvas a entrar.','Your collection will be saved. You can continue when you sign in again.')+'</p>'+form('logout',submit(t('Cerrar sesión','Log out')))+button(t('Cancelar','Cancel'),'home'));
 else main.innerHTML=profile(page);
 document.title=(collection?t('Mi zona','My zone'):main.querySelector('h1')?.textContent||'OREO')+' · OREO × LALIGA';
}
function launchPrize(id){rewardId=id;step=1;shipping={};receipt=null;go('reward');}
window.Rewards={
 available:()=>['gold','shirt','scarf','ball'].filter(canClaim).map(id=>({id,label:titleOf(id)})),
 open:id=>{if(['gold','shirt','scarf','ball'].includes(id)&&canClaim(id))launchPrize(id);}
};

document.addEventListener('keydown',e=>{if(!document.body.classList.contains('has-panel'))return;if(e.key==='Escape'){go('home');return;}if(e.key==='Tab'){const list=[...main.querySelectorAll('button:not(:disabled),input,select,a,summary')].filter(el=>el.getClientRects().length);if(!list.length)return;const first=list[0],last=list.at(-1),focus=document.activeElement;if(e.shiftKey&&(focus===first||!main.contains(focus))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(focus===last||!main.contains(focus))){e.preventDefault();first.focus();}}});
main.addEventListener('click',e=>{if(e.target===main&&document.body.classList.contains('has-panel'))go('home');});
document.addEventListener('click',event=>{
 const b=event.target.closest('button,a');if(!b)return;
 if(b.hasAttribute('data-receipt-step') && registered) {
   const count = registered.picks.length;
   registered.index = (registered.index + Number(b.dataset.receiptStep) + count) % count;
   const player = registered.picks[registered.index];
   main.querySelector('.receipt-stage').innerHTML = receiptPreview();
   main.querySelector('.receipt-paging [aria-live]').textContent = player.name+' · '+(registered.index+1)+' / '+count;
   return;
 }
 if(b.id==='brand'){event.preventDefault();go(db.account?'home':'login');}
 if(b.dataset.route){document.querySelectorAll('.nav-popover').forEach(el=>el.hidden=true);document.querySelectorAll('.nav-inner [aria-expanded]').forEach(el=>el.setAttribute('aria-expanded','false'));go(b.dataset.route);}
 if(b.hasAttribute('data-eye')){
   const input=b.parentNode.querySelector('input');
   const show=input.type==='password';
   input.type=show?'text':'password';
   b.innerHTML=ui.icon(show?'eye-off':'eye');
   b.setAttribute('aria-label',show?t('Ocultar contraseña','Hide password'):t('Mostrar contraseña','Show password'));
 }
 if(b.hasAttribute('data-resend')&&pending){pending.sent=Date.now();main.querySelector('.sms-status').textContent=t('SMS de prueba reenviado. Código: 123456.','Demo SMS resent. Code: 123456.');}
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
 if(v.dialCode){
   const national=String(v.phone||'').replace(/[\s().-]/g,'');
   if(national&&(!/^\d{4,14}$/.test(national)||national.length+v.dialCode.length-1>15||(v.dialCode==='+34'&&national.length!==9)))return fail('Introduce un número válido para el prefijo seleccionado.','Enter a valid number for the selected calling code.');
   v.phone=national?v.dialCode+national:''; delete v.dialCode;
 }
 if(v.confirm!==undefined&&v.confirm!==v.password)return fail('Las contraseñas no coinciden.','The passwords do not match.');
 if(v.confirm!==undefined&&v.password.length<8)return fail('Introduce al menos 8 caracteres.','Enter at least 8 characters.');
 if(mode==='login'){if(!await db.login(v.email,v.password))return fail('Correo o contraseña incorrectos.','Incorrect email or password.');go('home');}
 if(mode==='signup'){
   if(db.locate(v.email.trim().toLowerCase()))return fail('El correo ya está registrado.','This email is already registered.');
   if(db.locate(v.phone))return fail('El teléfono ya está registrado.','This phone number is already registered.');
   pending={mode,v:{...v,preferences:readPrefs(f)},sent:Date.now()};go('verify');
 }
 if(mode==='sms'){
   const acc=db.locate(v.phone);if(!acc)return fail('No se encontró una cuenta con este móvil.','No account found for this mobile number.');
   pending={mode,acc,sent:Date.now()};go('verify');
 }
 if(mode==='recover'){pending={mode,acc:db.locate(v.email.trim().toLowerCase())};go('recover-sent');}
 if(mode==='verify'){
   if(!pending||Date.now()-pending.sent>600000)return fail('El código ha caducado. Pulsa Reenviar SMS.','The code has expired. Select Resend SMS.');
   if(v.sms!=='123456')return fail('Código incorrecto.','Incorrect code.');
   if(pending.mode==='signup'){
     const u=pending.v;
     if(!await db.signup(u.name,u.surname,u.email,u.password,u.phone,u.preferences))return fail('No se ha podido crear la cuenta con estos datos.','This account could not be created.');
     db.logout();pending=null;go('created');
   }else if(pending.mode==='sms'){db.smsLogin(pending.acc);pending=null;go('home');}
 }
 if(mode==='reset'){await db.password(pending.acc,v.password);pending=null;go('login');}
 if(mode==='logout'){db.logout();pending=null;registered=null;shipping={};historyFilter='all';go('login');}
 if(a&&['password','edit','address','remove','profile-email','profile-recover','profile-reset','delete-address','profile-prefs'].includes(mode)){
   const keepDraft=f.dataset.editRoute;delete f.dataset.editRoute;
   return submitProfile(mode,v,(es,en)=>{if(keepDraft)f.dataset.editRoute=keepDraft;fail(es,en);});
 }
 if(mode==='prize'){shipping=v;step=2;draw();}
 if(mode==='confirm-prize'&&canClaim(rewardId)){
 const selected=a.cards.filter(c=>eligible(c,rewardId)).sort((x,y)=>x.time-y.time).slice(0,cost(rewardId));selected.forEach(c=>c.used=true);
 receipt={id:'ORE-'+new Date().getFullYear()+'-'+String(a.orders.length+1).padStart(6,'0'),reward:rewardId,shipping,time:Date.now()};
 a.orders.push(receipt);a.address={...shipping};db.save();step=3;draw();}
});
window.addEventListener('oreo:registered',e=>{
 const {picks,gold}=e.detail, cards=db.account.cards;
 registered={picks,gold,index:0,first:cards.length===picks.length,
   firstGold:gold && cards.filter(card=>card.rarity==='gold').length===picks.length};
 go('received');
});
let receiptDrag=null, receiptHandleMoved=false;
main.addEventListener('click',e=>{
 if(e.target.closest('.receipt-handle') && (e.detail===0 || !receiptHandleMoved))go('home');
});
main.addEventListener('pointerdown',e=>{
 const handle=e.target.closest('.receipt-handle');
 if(!handle)return;
 receiptHandleMoved=false;
 handle.setPointerCapture(e.pointerId);
 receiptDrag={y:e.clientY, panel:handle.closest('.registration-receipt')};
});
main.addEventListener('pointermove',e=>{
 if(!receiptDrag)return;
 const distance=Math.max(0,e.clientY-receiptDrag.y);
 if(distance>5)receiptHandleMoved=true;
 receiptDrag.panel.style.transform='translateY('+distance+'px)';
});
function finishReceiptDrag(e){
 if(!receiptDrag)return;
 const {panel,y}=receiptDrag;receiptDrag=null;panel.style.transform='';
 if(e.type==='pointerup' && e.clientY-y>64)go('home');
}
main.addEventListener('pointerup',finishReceiptDrag);
main.addEventListener('pointercancel',finishReceiptDrag);
let collectionScroll=0;
window.addEventListener('hashchange',e=>{
 const previous=new URL(e.oldURL).hash.slice(1);
 const fromCollection=['home','collection'].includes(previous);
 const toCollection=['home','collection'].includes(route());
 if(fromCollection&&!toCollection)collectionScroll=window.scrollY;
 draw();
 if(toCollection)scrollTo(0,['login','verify','received'].includes(previous)?0:collectionScroll);
 else if(!document.body.classList.contains('has-panel'))scrollTo(0,0);
});
document.addEventListener('oreo:language',e=>{db.setLang(e.detail);const saved=[...main.querySelectorAll('input,select')].map(el=>[el.name,el.value,el.checked]);draw();for(const [name,value,checked] of saved){const el=[...main.querySelectorAll('input,select')].find(e=>e.name===name);if(el){el.value=value;el.checked=checked;}}});
document.documentElement.lang=db.lang;
draw();
})();
