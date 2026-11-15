export const SOURCES = {
 usc:'https://calendar.usc.edu/api/2/events?days=90&pp=100',
 engage:'https://engage.usc.edu/mobile_ws/v17/mobile_events_list?range=0&limit=1000&search_word='
};
export function clean(s=''){return String(s).replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&ndash;|&mdash;/g,'–').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim()}
export function safeURL(s,base){try {const u=new URL(s,base);return u.protocol==='https:'?u.href:''}catch{return ''}}
export function typeOf(s){s=s.toLowerCase();return /hackathon|datathon|competition|case challenge|consulting challenge|business challenge|stock pitch/.test(s)?'Competition':/workshop|mend-it|reading group/.test(s)?'Workshop':/network|mixer|career|recruit/.test(s)?'Networking':/info.*session/.test(s)?'Info session':/talk|panel|lecture|seminar|ai,|digital divide|journalism/.test(s)?'Talk':/free.*(boba|sample)|freesc/.test(s)?'Freebie':/concert|music|\barts?\b|film|screen|exhib|opera|cabaret|strings|wedding|writing/.test(s)?'Arts & culture':'Social'}
// Official audience metadata is evidence of audience scope, not a substitute for restrictions in the announcement.
export function uscAudience(e){
 const text=clean(e.description_text||e.description),audience=(e.filters?.event_audience||[]).map(a=>a.name);
 if(/open to (?:the )?public|open to everyone/i.test(text)||audience.some(a=>/^(?:general )?public$/i.test(a)))return 'Open to the public';
 if(/open to all undergraduate and graduate/i.test(text)||audience.some(a=>/^students$/i.test(a)))return 'Open to USC undergraduate and graduate students';
 return 'Check source for eligibility';
}
export function normalizeUSC(raw){return raw.events.flatMap(({event:e})=>(e.event_instances||[]).map(({event_instance:i})=>({id:'usc-'+e.id+'-'+i.id,title:clean(e.title),description:clean(e.description_text||e.description),start:i.start,end:i.end,allDay:i.all_day,location:e.experience==='virtual'?'Online':clean(e.location_name||e.location)||'Location on source',host:e.departments?.map(d=>d.name).join(', ')||'USC Events Calendar',type:typeOf(e.title),source:'USC Events Calendar',publishedAt:e.created_at,geo:e.geo?.latitude&&e.geo?.longitude?{latitude:e.geo.latitude,longitude:e.geo.longitude}:null,url:safeURL(e.localist_url),register:safeURL(e.ticket_url||e.url||e.localist_url),image:safeURL(e.photo_url),free:e.free===true||/^(free|\$0)/i.test(e.ticket_cost||'')||/free and open|free admission|admission is free|free event/i.test(e.description_text||''),eligibility:uscAudience(e),audienceEvidence:(e.filters?.event_audience||[]).map(a=>a.name),cost:clean(e.ticket_cost),timeNote:'America/Los_Angeles'})))}
export function normalizeEngage(raw){return raw.filter(r=>r.p19==='event').map(r=>{
 const d=clean(r.p4), date=d.match(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/g)||[];
 const times=[...d.matchAll(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/g)];
 const stamp=(ds,t)=>{if(!ds||!t)return null;const x=new Date(ds.replace(/^[A-Za-z]+,?\s+/,''));if(isNaN(x))return null;let h=+t[1]%12+(t[3]==='PM'?12:0);return `${x.getUTCFullYear()}-${String(x.getUTCMonth()+1).padStart(2,'0')}-${String(x.getUTCDate()).padStart(2,'0')}T${String(h).padStart(2,'0')}:${t[2]||'00'}:00${/PDT/.test(r.p28)?'-07:00':'-08:00'}`};
 return {id:'engage-'+r.p1,title:clean(r.p3),description:'Listed by '+clean(r.p9)+'. '+d+'. Check the original event for full details, eligibility and registration.',start:stamp(date[0],times[0]),end:stamp(date[1]||date[0],times[1]),location:clean(r.p6)||'Location on source',host:clean(r.p9),type:typeOf(r.p3+' '+r.p5),source:'EngageSC',url:safeURL(r.p18,'https://engage.usc.edu'),register:safeURL(r.p18,'https://engage.usc.edu'),image:safeURL(r.p11,'https://engage.usc.edu'),free:/FREE/i.test(r.p12),eligibility:/private/i.test(r.p6)?'Sign in to EngageSC for access details':'Check source for eligibility',timeNote:r.p28,dateText:d}
 }).filter(e=>e.start)}
export function dedupe(events){const seen=new Set();return events.sort((a,b)=>a.source.localeCompare(b.source)).filter(e=>{const key=e.title.toLowerCase().replace(/\W/g,'')+e.start?.slice(0,10);if(seen.has(key))return false;seen.add(key);return true})}
export function upcoming(events,now=Date.now()){return events.filter(e=>{const end=e.end?Date.parse(e.end):Date.parse(e.start)+(e.allDay?86400000:7200000);return Number.isFinite(end)&&end>now}).sort((a,b)=>Date.parse(a.start)-Date.parse(b.start))}
