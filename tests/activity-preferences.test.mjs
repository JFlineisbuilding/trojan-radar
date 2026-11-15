import test from 'node:test';
import assert from 'node:assert/strict';
import {activityAllowed,preferenceScore} from '../public/discovery.js';
import {personalRecommendations} from '../worker/personal-recommendations.mjs';
import {rank} from '../worker/index.mjs';
const base={host:'USC',eligibility:'Open to the public',start:new Date(Date.now()+86400000).toISOString(),description:'Marketing careers'};
const workshop={...base,id:'workshop',title:'Marketing skills workshop',type:'Workshop'};
const info={...base,id:'info',title:'Marketing information session',type:'Info session'};
test('preferred event types rank alongside topics and avoided workshops never return from AI',async()=>{
 const profile={careerInterests:'marketing',careerPreferredTypes:['Info sessions'],careerAvoidedTypes:['Skills workshops']};
 assert.equal(activityAllowed(workshop,profile),false);assert.ok(preferenceScore(info,profile)>preferenceScore(workshop,profile));
 const r=await personalRecommendations({profile},{},{events:[workshop,info]},async()=>({career:[{id:'workshop',reason:'marketing'},{id:'info',reason:'marketing'}],social:[]}));assert.deepEqual(r.career,['info']);
});
test('banking info session search requires banking and the requested format',()=>{
 const events=[{...base,id:'bank',title:'SMBC Global Banking Information Session',type:'Info session'},{...base,id:'talk',title:'Banking careers panel',type:'Talk'},info];assert.deepEqual(rank(events,'upcoming banking info sessions').map(e=>e.id),['bank']);
});
