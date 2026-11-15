import {eligibilityDecision} from '../public/eligibility.js';
import {chooseEvents,eventCategory,preferenceScore,preferenceMatches,profileTopics,preferenceContext} from '../public/discovery.js';
const recommendationCache=new Map();
export async function personalRecommendations(input,env,data,callAI) {
 const profile=input.profile||{};
 const date=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')?s:'';
 const requested=Array.isArray(input.candidateIds)?new Set(input.candidateIds.filter(id=>typeof id==='string').slice(0,1200)):null;
 const eligible=chooseEvents(data.events.filter(e=>(!requested||requested.has(e.id))&&eligibilityDecision(e,profile).eligible),{startDate:date(input.startDate),endDate:date(input.endDate),score:e=>preferenceScore(e,profile)});
 const distinct=list=>{const seen=new Set();return list.filter(e=>{const key=e.title.toLowerCase().replace(/[^a-z0-9]/g,'');if(seen.has(key))return false;seen.add(key);return true})};
 const candidates={career:distinct(eligible.filter(e=>eventCategory(e)==='career')).slice(0,45),social:distinct(eligible.filter(e=>eventCategory(e)==='social')).slice(0,45)};
 const careerContext=preferenceContext(profile,'career'),socialContext=preferenceContext(profile,'social');
 const context={careerGoal:String(careerContext.goal||'').slice(0,1500),careerInterests:String(careerContext.interests||'').slice(0,700),socialGoal:String(socialContext.goal||'').slice(0,1500),socialInterests:String(socialContext.interests||'').slice(0,700),resumeTopics:Object.values(profile.careerDocuments||{}).flatMap(d=>profileTopics(d?.text||''))};
 const key=JSON.stringify([context,date(input.startDate),date(input.endDate),Object.values(candidates).flat().map(e=>e.id)]);
 const cached=recommendationCache.get(key);if(cached&&Date.now()-cached.at<600000)return cached.result;
 const compact=e=>({id:e.id,title:e.title,description:String(e.description||'').slice(0,1400),start:e.start,host:e.host});
 let output=null,error=null;
 try{output=await callAI(env,'recommend',{profile:context,career:candidates.career.map(compact),social:candidates.social.map(compact)})}catch{error='AI is temporarily unavailable. Showing ranked eligible events.'}
 const result={career:[],social:[],reasons:{},matchTypes:{},engine:'rules',counts:{pool:data.events.length,eligibleOnDates:eligible.length,careerCandidates:candidates.career.length,socialCandidates:candidates.social.length},message:error||'AI is not connected. Showing ranked eligible events.'};
 const validAI=output&&Array.isArray(output.career)&&Array.isArray(output.social);
 if(validAI){result.engine='ai';result.message='AI matched these real events to your saved preferences.'}
 for(const kind of ['career','social']){
  const allowed=new Map(candidates[kind].map(e=>[e.id,e]));const seen=new Set();
  const add=(id,reason,match)=>{if(!allowed.has(id)||seen.has(id)||result[kind].length===5)return;seen.add(id);result[kind].push(id);const exact=preferenceMatches(allowed.get(id),profile).length>0;result.matchTypes[id]=exact?'direct':match==='related'||match==='direct'?'related':'discovery';result.reasons[id]=result.matchTypes[id]==='discovery'?'Another eligible event in your selected dates. Explore a different direction.':String(reason||'Matches your selected interests.').slice(0,280)};
  if(validAI)for(const item of output[kind]){if(item&&typeof item.id==='string')add(item.id,item.reason,item.match)}
  // Fill to five with real eligible listings, transparently labeled as broader discovery.
  // The model is never permitted to invent inventory or waive attendance restrictions.
  for(const e of candidates[kind])add(e.id,preferenceMatches(e,profile).length?'Matches your selected interests.':'','discovery');
 }
 if(result.engine==='ai'){if(recommendationCache.size>100)recommendationCache.clear();recommendationCache.set(key,{at:Date.now(),result})}
 return result;
}
