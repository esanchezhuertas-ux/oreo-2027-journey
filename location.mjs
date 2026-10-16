export const pages=[
 {id:'home',es:'Inicio',en:'Home',entry:'3:575',group:'public'},
 {id:'access',es:'Acceso',en:'Access',entry:'3:597',group:'public'},
 {id:'code',es:'Registrar código',en:'Enter a code',entry:'3:616',group:'public'},
 {id:'prizes',es:'Premios',en:'Prizes',entry:'3:694',group:'private'},
 {id:'collection',es:'Colección',en:'Collection',entry:'3:691',group:'private'},
 {id:'help',es:'Ayuda',en:'Help',entry:'3:703',group:'private'},
 {id:'profile',es:'Perfil de usuario',en:'User profile',entry:'3:855',group:'private'},
 {id:'myprizes',es:'Mis premios',en:'My prizes',entry:'3:833',group:'profile'},
 {id:'redemptions',es:'Historial de canjes',en:'Redemption history',entry:'3:861',group:'profile'},
 {id:'codes',es:'Códigos activados',en:'Activated codes',entry:'40:1172',group:'profile'},
 {id:'details',es:'Datos de usuario',en:'User details',entry:'3:849',group:'profile'},
 {id:'orders',es:'Pedidos y seguimiento',en:'Orders and tracking',entry:'3:852',group:'profile'}
];
export function locate(node,path,graph,lang='es') {
 const exact={'3:578':'home','3:581':'home','3:584':'home','3:587':'home','3:691':'collection','3:694':'prizes','3:697':'profile','3:703':'help','164:2468':'help','3:706':'code','231:1667':'code','231:1670':'prizes','3:671':'code','3:849':'details','3:852':'orders','3:855':'profile','3:858':'myprizes','3:861':'redemptions','3:867':'access','40:1172':'codes','125:1202':'myprizes','125:1205':'redemptions','125:1208':'codes','125:1211':'details','125:1214':'orders','164:2456':'details','164:2459':'details','164:2462':'details'};
 let page=exact[node.id]||({'3:574':'home','3:596':'home','3:615':'access','3:634':'code','3:674':'code','3:690':'code','3:709':'private','3:749':'collection','3:774':'prizes','3:832':'redeem','3:848':'myprizes','3:870':'profile','3:898':'states'}[node.section])||'home';
 let label=pages.find(p=>p.id===page)?.[lang]||({private:lang==='es'?'Área privada':'Private area',redeem:lang==='es'?'Canje de premio':'Prize redemption',states:lang==='es'?'Estado transversal':'Cross-site state'}[page]);
 let hierarchy=[label];
 if(['prizes','collection','help','profile','myprizes','redemptions','codes','details','orders','redeem','private'].includes(page))hierarchy=[lang==='es'?'Área privada':'Private area',...(page==='private'?[]:[label])];
 if(['myprizes','redemptions','codes','details','orders'].includes(page))hierarchy.splice(1,0,lang==='es'?'Perfil':'Profile');
 if(page==='redeem')hierarchy.splice(1,0,lang==='es'?'Premios':'Prizes');
 if(node.section==='3:674')hierarchy.push(lang==='es'?'Resultado estándar':'Standard result');
 if(node.section==='3:690')hierarchy.push(lang==='es'?'Resultado dorado':'Golden result');
 if(node.id==='3:671')hierarchy.push(lang==='es'?'Modal de resultado':'Result modal');
 if(node.id==='3:740')hierarchy.push(lang==='es'?'Modal de cromo':'Card modal');
 if(['3:578','3:581','3:584','3:587'].includes(node.id))hierarchy.push((lang==='es'?'Módulo: ':'Module: ')+node.text.split('\n')[0]);
 return {page,label,hierarchy};
}
