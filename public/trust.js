// Provenance is different from organization type, officer authority and eligibility.
// Never accept a client-provided `verified` flag as proof of organization control.
export function sourceEvidence(event={}){
 let url;try{url=new URL(event.url)}catch{return null}
 if(url.protocol!=='https:'||url.username||url.password)return null;
 const host=url.hostname.toLowerCase();
 if(event.source==='USC SCA screenings'&&host==='cinema.usc.edu')return {label:'Official SCA listing',url:url.href,detail:'Published on the School of Cinematic Arts website. This identifies the source, not a verified uploader account.'};
 if(event.source==='USC Events Calendar'&&host==='calendar.usc.edu')return {label:'Listed on USC Calendar',url:url.href,detail:'An original university calendar listing is linked. Organizer authority is a separate check.'};
 if(event.source==='EngageSC'&&host==='engage.usc.edu')return {label:'Listed on EngageSC',url:url.href,detail:'An original EngageSC listing is linked. This does not certify an uploader as a current club officer.'};
 if(event.source==='Handshake'&&(host==='app.joinhandshake.com'||host==='joinhandshake.com'))return {label:'Listed on Handshake',url:url.href,detail:'An original Handshake listing is linked. Check the source for registration and current requirements.'};
 if((event.source==='USC Annenberg'&&host==='annenberg.usc.edu')||(event.source==='USC Annenberg Digital Lounge'&&host==='annenbergdl.org'))return {label:'Official department listing',url:url.href,detail:'Original university department page. Attendance and registration requirements remain with the organizer.'};
 if(event.source==='USC email'&&['interstride.com','www.interstride.com'].includes(host))return {label:'Cross-checked organizer listing',url:url.href,detail:'An email event lead cross-checked against the public organizer schedule. Private portal access may still be required.'};
 return null;
}
export const ORGANIZER_TYPES=[['student','Student club / organization'],['department','USC school / department'],['brand','External brand / company'],['community','Community organization']];
