import {eligibilityDecision} from '../public/eligibility.js';
import {chooseEvents,eventCategory,preferenceScore,hasPreferences,preferenceMatches,profileTopics} from '../public/discovery.js';
const recommendationCache=new Map();
export async function personalRecommendations(input,env,data,callAI) {
 const profile=input.profile||{};
 const date=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')?s:'';
 const eligible=chooseEvents(data.events.filter(e=>eligibilityDecision(e,profile).eligible),{startDate:date(input.startDate),endDate:date(input.endDate),score:e=>preferenceScore(e,profile)});
 const candidates={career:eligible.filter(e=>eventCategory(e)==='career').slice(0,45),social:eligible.filter(e=>eventCategory(e)==='social').slice(0,45)};
 const context={careerGoal:String(profile.careerGoal||'').slice(0,1500),careerInterests:String(profile.careerInterests||'').slice(0,700),socialGoal:String(profile.socialGoal||'').slice(0,1500),socialInterests:String(profile.socialInterests||'').slice(0,700),resumeTopics:Object.values(profile.careerDocuments||{}).flatMap(d=>profileTopics(d?.text||''))};
 const key=JSON.stringify([context,date(input.startDate),date(input.endDate),Object.values(candidates).flat().map(e=>e.id)]);
 const cached=recommendationCache.get(key);if(cached&&Date.now()-cached.at<600000)return cached.result;
 const compact=e=>({id:e.id,title:e.title,description:String(e.description||'').slice(0,650),start:e.start,host:e.host});
 let output=null,error=null;
 try{output=await callAI(env,'recommend',{profile:context,career:candidates.career.map(compact),social:candidates.social.map(compact)})}catch{error='AI is temporarily unavailable. Showing interest-matched results.'}
 const result={career:[],social:[],reasons:{},engine:'rules',message:error||'AI is not connected. Showing interest-matched results.'};
 if(output&&Array.isArray(output.career)&&Array.isArray(output.social)){
  result.engine='ai';result.message='AI matched these real events to your saved preferences.';
  for(const kind of ['career','social']){const allowed=new Set(candidates[kind].map(e=>e.id));const seen=new Set();for(const item of output[kind]){if(!item||!allowed.has(item.id)||seen.has(item.id))continue;seen.add(item.id);result[kind].push(item.id);result.reasons[item.id]=String(item.reason||'Matches your saved interests.').slice(0,280);if(result[kind].length===5)break}}
 }else for(const kind of ['career','social'])result[kind]=candidates[kind].filter(e=>!hasPreferences(profile,kind)||preferenceMatches(e,profile).length).slice(0,5).map(e=>e.id);
 if(result.engine==='ai'){if(recommendationCache.size>100)recommendationCache.clear();recommendationCache.set(key,{at:Date.now(),result})}
 return result;
}
