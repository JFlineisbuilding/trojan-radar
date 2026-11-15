import {eligibilityDecision} from './eligibility.js';
import {chooseEvents,eventPrimaryType,eventCategory,hasPreferences,preferenceMatches,activityAllowed,selectInterestDiverse} from './discovery.js';
// Eligibility and calendar availability precede relevance. Re-ranking diversifies
// repeated series, organizers and activity formats without manufacturing matches.
export function recommendEvents(events,profile,options={}){const {limit=5,score=()=>0,...filters}=options;const eligible=events.filter(e=>activityAllowed(e,profile)&&eligibilityDecision(e,profile).eligible&&(!hasPreferences(profile,eventCategory(e))||preferenceMatches(e,profile).length>0));const pool=chooseEvents(eligible,{...filters,score});if(filters.sort&&filters.sort!=='recommended'){const seen=new Set();return pool.filter(e=>{const key=e.title.toLowerCase().replace(/[^a-z0-9]/g,'');if(seen.has(key))return false;seen.add(key);return true}).slice(0,limit)}return selectInterestDiverse(pool,profile,{limit,score})}
