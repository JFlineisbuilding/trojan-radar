import {eligibilityDecision} from '../public/eligibility.js';
import {chooseEvents,eventCategory,preferenceScore,preferenceMatches,profileTopics,activityAllowed,activityPreferences,eventPrimaryType,preferenceContext,hasPreferences,selectInterestDiverse} from '../public/discovery.js';
const recommendationCache=new Map();
export async function personalRecommendations(input,env,data,callAI) {
 const profile=input.profile||{};
 const date=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')?s:'';
 const requested=Array.isArray(input.candidateIds)?new Set(input.candidateIds.filter(id=>typeof id==='string').slice(0,1200)):null;
 const eligible=chooseEvents(data.events.filter(e=>(!requested||requested.has(e.id))&&activityAllowed(e,profile)&&eligibilityDecision(e,profile).eligible),{startDate:date(input.startDate),endDate:date(input.endDate),score:e=>preferenceScore(e,profile)});
 const distinct=list=>{const seen=new Set();return list.filter(e=>{const key=e.title.toLowerCase().replace(/[^a-z0-9]/g,'');if(seen.has(key))return false;seen.add(key);return true})};
 const candidates={career:distinct(eligible.filter(e=>eventCategory(e)==='career'&&(!hasPreferences(profile,'career')||preferenceMatches(e,profile).length))).slice(0,45),social:distinct(eligible.filter(e=>eventCategory(e)==='social'&&(!hasPreferences(profile,'social')||preferenceMatches(e,profile).length))).slice(0,45)};
 const careerContext=preferenceContext(profile,'career'),socialContext=preferenceContext(profile,'social');
 const context={careerActivityTypes:activityPreferences(profile,'career'),socialActivityTypes:activityPreferences(profile,'social'),careerGoal:String(careerContext.goal||'').slice(0,1500),careerInterests:String(careerContext.interests||'').slice(0,700),socialGoal:String(socialContext.goal||'').slice(0,1500),socialInterests:String(socialContext.interests||'').slice(0,700),resumeTopics:Object.values(profile.careerDocuments||{}).flatMap(d=>profileTopics(d?.text||''))};
 const key=JSON.stringify([context,date(input.startDate),date(input.endDate),Object.values(candidates).flat().map(e=>e.id)]);
 const cached=recommendationCache.get(key);if(cached&&Date.now()-cached.at<600000)return cached.result;
 const compact=e=>({id:e.id,title:e.title,activityType:eventPrimaryType(e),description:String(e.description||'').slice(0,1400),start:e.start,host:e.host});
 let output=null,error=null;
 try{output=await callAI(env,'recommend',{profile:context,career:candidates.career.map(compact),social:candidates.social.map(compact)})}catch{error='AI is temporarily unavailable. Showing ranked eligible events.'}
 const result={career:[],social:[],reasons:{},matchTypes:{},engine:'rules',counts:{pool:data.events.length,eligibleOnDates:eligible.length,careerCandidates:candidates.career.length,socialCandidates:candidates.social.length},message:error||(output?'AI returned an unsupported result. Showing interest-matched events.':'Showing interest-matched events. AI is not connected.')};
 const validAI=output&&Array.isArray(output.career)&&Array.isArray(output.social);
 if(validAI){result.engine='ai';result.message='AI matched these real events to your saved preferences.'}
 for(const kind of ['career','social']){
  const allowed=new Map(candidates[kind].map(e=>[e.id,e]));const seen=new Set();
  const modelItems=new Map(validAI?output[kind].filter(item=>item&&typeof item.id==='string'&&allowed.has(item.id)).map(item=>[item.id,item]):[]);
  const ordered=selectInterestDiverse(candidates[kind],profile,{limit:5,score:e=>preferenceScore(e,profile)+(modelItems.has(e.id)?3:0)});
  for(const e of ordered){
   result[kind].push(e.id);const matched=preferenceMatches(e,profile);
   result.matchTypes[e.id]=matched.length?'direct':'discovery';
   result.reasons[e.id]=matched.length?'Matches your interest in '+matched.slice(0,3).map(t=>t==='ai'?'AI':t).join(', ')+'.':'An eligible event to explore. Add interests to personalize your recommendations.';
  }
 }
 if(result.engine==='ai'){if(recommendationCache.size>100)recommendationCache.clear();recommendationCache.set(key,{at:Date.now(),result})}
 return result;
}
