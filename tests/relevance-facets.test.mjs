import test from 'node:test';
import assert from 'node:assert/strict';
import {personalRecommendations} from '../worker/personal-recommendations.mjs';
import {browseEventModel,preferenceMatches,eventPrimaryType,eventCategory} from '../public/discovery.js';
import {eligibilityDecision} from '../public/eligibility.js';
const start=new Date(Date.now()+86400000).toISOString();
const event=(id,title,description='',extra={})=>({id,title,description,type:'Talk',host:'USC',eligibility:'Open to the public',start,...extra});
test('marketing talks stay relevant and a model cannot restore unrelated AI fillers',async()=>{
 const events=[event('brand-talk','Brand strategy and creator economy talk'),...Array.from({length:6},(_,i)=>event('ai-'+i,'AI research seminar '+i))];
 let candidates;
 const r=await personalRecommendations({profile:{careerInterests:'marketing'}},{},{events},async(_env,_task,input)=>{candidates=input;return {career:events.map(e=>({id:e.id,match:'direct',reason:'Model says so'})),social:[]}});
 assert.deepEqual(candidates.career.map(e=>e.id),['brand-talk']);assert.deepEqual(r.career,['brand-talk']);
});
test('AI workshops are matched while ordinary 3D training is not mislabeled AI',()=>{
 const ai=event('literacy','AI Literacy: Think Smarter, Prompt Better','Microsoft Copilot and ChatGPT prompting skills',{type:'Workshop'});
 assert.ok(preferenceMatches(ai,{careerInterests:'AI'}).includes('ai'));assert.equal(eventPrimaryType(ai),'Skills workshops');
 assert.deepEqual(preferenceMatches(event('3d','Intro to 3D Content Creation with Blender','Basics of Blender and 3D creation',{type:'Workshop'}),{careerInterests:'AI'}),[]);
});
test('unknown access is separate from relevance and never asserted eligible',async()=>{
 const e=event('pending-ai','AI Literacy workshop','ChatGPT skills',{attendance:{scope:'unknown'}});
 assert.ok(preferenceMatches(e,{careerInterests:'AI'}).length);assert.equal(eligibilityDecision(e).status,'unknown');
 const r=await personalRecommendations({profile:{careerInterests:'AI'}},{},{events:[e]},async()=>({career:[{id:e.id}],social:[]}));assert.deepEqual(r.career,[]);
});
test('current facet counts agree with results and identify matches outside dates',()=>{
 const future=new Date(Date.now()+21*86400000).toISOString();
 const pool=[event('fair','Career fair','',{start:future}),event('workshop','Marketing skills workshop','',{type:'Workshop'})];
 const today=new Date().toISOString().slice(0,10),end=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
 const m=browseEventModel(pool,{startDate:today,endDate:end,type:'Career fairs'});
 assert.equal(m.counts['Career fairs'],0);assert.equal(m.activities.length,0);assert.equal(m.outsideDates,1);assert.equal(m.counts['Skills workshops'],1);
 const searched=browseEventModel(pool,{query:'unmatched-search'});assert.equal(searched.counts.All,0);assert.equal(searched.activities.length,0);
});
test('repeated AI series cannot crowd out a matching marketing talk',async()=>{
 const pool=[...Array.from({length:9},(_,i)=>event('ai-many-'+i,'AI research topic '+i)),event('marketing-talk','Marketing and brand strategy talk')];
 const r=await personalRecommendations({profile:{careerInterests:'AI, marketing'}},{},{events:pool},async()=>({career:pool.slice(0,5).map(e=>({id:e.id})),social:[]}));
 assert.ok(r.career.includes('marketing-talk'));assert.equal(r.career.length,5);
});

test('academic AI reading groups are research seminars, distinct from practical AI skills workshops',()=>{
 const reading=event('reading','IETC Reading Group: An Interdisciplinary Reading Group on AI, Philosophy, and Society','',{type:'Workshop'});
 assert.equal(eventPrimaryType(reading),'Research seminars');
 assert.equal(eventPrimaryType(event('practice','AI Literacy: Think Smarter, Prompt Better','',{type:'Workshop'})),'Skills workshops');
});

test('academic history series do not masquerade as social cultural recommendations',()=>{
 const e=event('history','EMSI American Landmarks','A discussion of historical culture',{type:'Social',host:'Early Modern Studies Institute (EMSI)'});
 assert.equal(eventCategory(e),'career');assert.equal(eventPrimaryType(e),'Research seminars');assert.deepEqual(preferenceMatches(e,{careerInterests:'marketing',socialInterests:'culture'}),[]);
});
