export function eventCategory(e){
 const title=(e.title||'').toLowerCase(),host=(e.host||'').toLowerCase();
 if(/christian challenge/i.test(host)||/thursday night challenge/i.test(title))return 'social';
 if(e.type==='Screening'||/screening|film showcase|movie night/i.test(title))return 'social';
 if(/space future|aerospace|career|recruit|internship|employer|network|linkedin|case competition|business|finance|venture|entrepreneur|product design|marketing|hackathon|investment|wealth management|\bai\b|artificial intelligence/.test(title)||/career center|business technology|investment society/.test(host))return 'career';
 if(/film|screening|opera|concert|music|craft|wellness|yoga|meditation|garden|mahjong|bingo|cultural|tea|writing/i.test(title))return 'social';
 if(['Info session','Networking','Workshop','Talk','Competition'].includes(e.type))return 'career';
 return 'social';
}
export function eventEnd(e){return e.end?Date.parse(e.end):Date.parse(e.start)+(e.allDay?86400000:7200000)}
export function eventConflict(e,entries=[]){const start=Date.parse(e.start),end=eventEnd(e);return entries.find(b=>start<Date.parse(b.end)&&end>Date.parse(b.start))||null}
export function isOnline(e){return /\bonline\b|\bvirtual\b|\bzoom\b/i.test(e.location||'')}
export function coordinates(e,places=[]){
 if(isOnline(e)||/private|TBA|location on source/i.test(e.location||''))return null;
 const lat=Number(e.geo?.latitude),lon=Number(e.geo?.longitude);
 if(e.geo?.latitude!=null&&e.geo?.longitude!=null&&Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180)return {lat,lon};
 const normalized=s=>s.toLowerCase().replace(/\([^)]*\)|[^a-z0-9]/g,'');
 const location=normalized(e.location||'');const codes=[...(e.location||'').matchAll(/\b([A-Z]{2,4})\b/g)].map(m=>m[1]).filter(c=>!['USC','TBA','TBD','IMAX'].includes(c));const place=places.find(p=>normalized(p.name)===location)||places.find(p=>codes.some(c=>p.name.includes('('+c+')')))||places.filter(p=>normalized(p.name).length>9&&location.startsWith(normalized(p.name))).sort((a,b)=>b.name.length-a.name.length)[0];return place?{lat:place.lat,lon:place.lon}:null;
}
export function distanceMeters(a,b){if(!a||!b)return Infinity;const rad=d=>d*Math.PI/180,dlat=rad(b.lat-a.lat),dlon=rad(b.lon-a.lon);const v=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlon/2)**2;return 6371000*2*Math.atan2(Math.sqrt(v),Math.sqrt(1-v))}
export function chooseEvents(events,options={}){
 const {category='all',type='All',query='',window='all',startDate='',endDate='',admission='all',format='all',availability='all',timeOfDay='all',sort='recommended',origin=null,maxDistance=0,perk='all',places=[],calendar=[],now=Date.now(),score=()=>0}=options;
 const day=d=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(d));
 return events.filter(e=>eventEnd(e)>now&&(!startDate||day(e.start)>=startDate)&&(!endDate||day(e.start)<=endDate)&&(category==='all'||eventCategory(e)===category)&&eventTypeMatches(e,type)&&(!query||[e.title,e.host,e.description,e.source,e.sourceAccount].filter(Boolean).join(' ').toLowerCase().includes(query.toLowerCase()))&&(window!=='today'||day(e.start)===day(now))&&(window!=='week'||Date.parse(e.start)<now+7*86400000)&&(window!=='weekend'||[0,6].includes(new Date(new Date(e.start).toLocaleString('en-US',{timeZone:'America/Los_Angeles'})).getDay()))&&(admission!=='free'||e.free)&&(format!=='online'||isOnline(e))&&(format!=='inperson'||!isOnline(e))&&(timeOfDay==='all'||((h)=>timeOfDay==='morning'?h<12:timeOfDay==='afternoon'?h>=12&&h<17:h>=17)(Number(new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',hour:'numeric',hourCycle:'h23'}).format(new Date(e.start)))))&&(availability!=='available'||!eventConflict(e,calendar))&&(perk==='all'||(perk==='food'?eventPerks(e).freeFood:eventPerks(e).freeSamples))&&(!maxDistance||distanceMeters(origin,coordinates(e,places))<=maxDistance))
 .sort((a,b)=>sort==='shortest'?((a.end?Date.parse(a.end)-Date.parse(a.start):Infinity)-(b.end?Date.parse(b.end)-Date.parse(b.start):Infinity)||Date.parse(a.start)-Date.parse(b.start)):sort==='newest'?((Date.parse(b.publishedAt||b.importedAt)||0)-(Date.parse(a.publishedAt||a.importedAt)||0)||Date.parse(a.start)-Date.parse(b.start)):sort==='title'?a.title.localeCompare(b.title):sort==='onlinefirst'?(Number(isOnline(b))-Number(isOnline(a))||Date.parse(a.start)-Date.parse(b.start)):sort==='soonest'?Date.parse(a.start)-Date.parse(b.start):sort==='nearest'?(distanceMeters(origin,coordinates(a,places))-distanceMeters(origin,coordinates(b,places))||Date.parse(a.start)-Date.parse(b.start)):sort==='freefirst'?(Number(b.free)-Number(a.free)||score(b)-score(a)):score(b)-score(a)||Date.parse(a.start)-Date.parse(b.start));
}
// One primary format per event. Perks, delivery format and subjects are separate facets.
export const CAREER_TYPES=['Info sessions','Career fairs','Networking & company visits','Applications & resumes','Interview practice','Career advising','Skills workshops','Industry talks & panels','Research seminars','Startup pitches','Hackathons','Case competitions'];
export const SOCIAL_TYPES=['Film screenings','Live music','Theater & dance','Art exhibitions','Creative workshops','Games & hangouts','Cultural celebrations','Sports & fitness','Outdoor adventures','Wellness & reflection','Community service','Food & tastings','Campus gatherings'];
export function eventPrimaryType(e){
 const text=String(e.title||'').toLowerCase(),type=e.type||'';
 if(eventCategory(e)==='career'){
  if(/info(?:rmation)?[ -]sessions?/.test(text)||type==='Info session')return 'Info sessions';
  if(/hackathon|datathon|code.?fest/.test(text))return 'Hackathons';
  if(/case(?: study)? compet|case challenge|business competition|consulting (?:competition|challenge)|strategy competition/.test(text)||e.activityType==='case-competition')return 'Case competitions';
  if(/pitch|demo day|startup competition|venture competition/.test(text))return 'Startup pitches';
  if(/career fair|job fair|recruitment fair|career expo/.test(text))return 'Career fairs';
  if(/career advis|career coach|career navigator|career counseling|office hours/.test(text))return 'Career advising';
  if(/interview|mock assessment/.test(text))return 'Interview practice';
  if(/resume|résumé|cover letter|linkedin|application workshop|job search/.test(text))return 'Applications & resumes';
  if(/network|coffee chat|company visit|company tour|trek|chase tour/.test(text)||type==='Networking')return 'Networking & company visits';
  if(/info(?:rmation)?[ -]session|open house|recruiting session/.test(text)||type==='Info session')return 'Info sessions';
  if(/workshop|training|bootcamp|tutorial/.test(text)||type==='Workshop')return 'Skills workshops';
  if(/seminar|colloquium|dissertation|research presentation/.test(text))return 'Research seminars';
  return 'Industry talks & panels';
 }
 if(/screening|movie|film showcase|imax/.test(text)||type==='Screening')return 'Film screenings';
 if(/concert|opera|recital|music|choir|cabaret|jazz night/.test(text))return 'Live music';
 if(/theat(?:er|re)|dance|ballet|musical|performance|blood wedding/.test(text))return 'Theater & dance';
 if(/exhibit|gallery|museum|art tour|forbidden pages/.test(text))return 'Art exhibitions';
 if(/volunteer|service project|food drive|beach clean|donation drive/.test(text))return 'Community service';
 if(/hike|hiking|camping|outdoor|nature walk/.test(text))return 'Outdoor adventures';
 if(/wellness|meditat|mindful|yoga|gratitude|reflection|sound bath/.test(text))return 'Wellness & reflection';
 if(/sport|football|basketball|volleyball|soccer|fitness|run club|swim/.test(text))return 'Sports & fitness';
 if(/mahjong|bingo|board game|game night|trivia|karaoke/.test(text))return 'Games & hangouts';
 if(/cultural|culture|diwali|lunar new year|heritage|international festival/.test(text))return 'Cultural celebrations';
 if(/craft|painting|pottery|creative workshop|writing workshop|collage|crochet|button pin|mend.?it/.test(text))return 'Creative workshops';
 if(/tasting|food festival|cooking|baking|potluck|tea ceremony/.test(text))return 'Food & tastings';
 return 'Campus gatherings';
}
export function eventTypeMatches(e,type){
 if(type==='All')return true;
 if([...CAREER_TYPES,...SOCIAL_TYPES].includes(type))return eventPrimaryType(e)===type;
 // Retain source-native filters for existing saved links.
 if(type==='Screening')return eventPrimaryType(e)==='Film screenings';
 return e.type===type;
}
export function eventPerks(e){const text=(e.title+' '+e.description).toLowerCase();return {freeFood:!e.perks?.freeFoodRequiresMembership?.length&&(!!e.perks?.freeFood||(!/no free (food|snacks|meals)/.test(text)&&/free (food|pizza|snacks|lunch|dinner|boba|refreshments|drinks)|complimentary (food|snacks|lunch|refreshments)|snacks provided|lunch provided/.test(text))),freeSamples:!!e.perks?.freeSamples||/free samples?|complimentary samples?|brand sampling/.test(text)}}
export function profileTopics(text){const words=['AI','marketing','strategy','business','finance','accounting','consulting','entrepreneurship','design','product','engineering','software','Python','data','research','film','media','communications','writing','music','health','law','sustainability'];return words.filter(w=>new RegExp('\\b'+w+'\\b','i').test(text||''))}
export function preferenceContext(profile,kind){const career=kind==='career',mode=profile[kind+'PreferenceMode'];return {goal:mode==='tags'?'':career?(profile.careerGoal??profile.goal??''):(profile.socialGoal||''),interests:mode==='words'?'':career?(profile.careerInterests??profile.interests??''):(profile.socialInterests||''),documents:career?(profile.careerDocuments||{}):{}}}
const INTEREST_ALIASES={ai:'ai|artificial intelligence|machine learning|generative ai|llms?',marketing:'marketing|brand strategy|branding|brand partnerships?|advertising|consumer insights?|consumer behavio[u]?r|creator economy|digital commerce',strategy:'strategy|strategic',consulting:'consulting|consultants?|case interviews?|mckinsey|bain|boston consulting group|bcg',entrepreneurship:'entrepreneurship|entrepreneurs?|startups?|new ventures?|founders?',finance:'finance|financial|investment|investing|banking',product:'product management|product design|product development',data:'data|analytics|statistical',software:'software|programming|coding|computing',film:'film|cinema|screenings?|movies?',music:'music|concerts?|jazz|orchestra|recitals?',culture:'cultur(?:e|al)|heritage|celebrations?',sports:'sports?|fitness|athletic|workouts?',outdoors:'outdoor|hiking|adventure',volunteering:'volunteering|volunteers?|community service|beach clean',wellness:'wellness|meditation|mindfulness|yoga',food:'food|tasting|cooking',games:'games?|mahjong|bingo',theater:'theat(?:er|re)|dance|opera',art:'art|exhibitions?|galleries',crafts:'crafts?|creative workshop|pin making',community:'community|hangouts?|gatherings?',health:'health|biotech|medicine|medical',law:'law|legal|policy',communications:'communications?|public relations|journalism',education:'education|teaching|learning',sustainability:'sustainability|climate|environmental'};
const PREFERENCE_STOP=new Set('want learn more about events event that combine and the with for would like some any can please this week interested interests activities activity love explore attend join meet people career careers social campus life looking student students usc opportunities opportunity work working field fields'.split(' '));
function interestTokens(s){return [...new Set(String(s).toLowerCase().match(/[a-z]{3,}|\bai\b/g)||[])].filter(t=>!PREFERENCE_STOP.has(t))}
function matchingTerms(e,s){const text=String(e.title||'')+' '+String(e.description||'');return interestTokens(s).filter(t=>new RegExp('\\b(?:'+(INTEREST_ALIASES[t]||t)+')\\b','i').test(text))}
export function hasPreferences(profile,kind){const c=preferenceContext(profile,kind);return interestTokens(c.goal+' '+c.interests).length>0||Object.values(c.documents).some(d=>profileTopics(d?.text||'').length>0)}
export function preferenceMatches(e,profile){const kind=eventCategory(e),c=preferenceContext(profile,kind),documents=kind==='career'?Object.values(c.documents).flatMap(d=>profileTopics(d?.text||'')).join(' '):'';return [...new Set(matchingTerms(e,c.goal+' '+c.interests+' '+documents))]}
export function preferenceScore(e,profile){const kind=eventCategory(e),c=preferenceContext(profile,kind);return matchingTerms(e,c.goal).length*5+matchingTerms(e,c.interests).length*3+(kind==='career'?matchingTerms(e,Object.values(c.documents).flatMap(d=>profileTopics(d?.text||'')).join(' ')).length:0)}

export function seriesKey(e){const normalize=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');return [normalize(e.title),normalize(e.host),normalize(e.location)].join('|')}
export function groupEventSeries(events){const groups=new Map();for(const e of events){const key=seriesKey(e);if(!groups.has(key))groups.set(key,{...e,occurrences:[]});groups.get(key).occurrences.push(e)}return [...groups.values()].map(e=>({...e,occurrences:e.occurrences.sort((a,b)=>Date.parse(a.start)-Date.parse(b.start))}))}
