// LEEWAY HEADER — DO NOT REMOVE
// REGION: LEEWAY.CONTINUUM.TEST.PROVENANCE
// TAG: LEEWAY.CONTINUUM.TEST.OWNER_SOURCE_PREFLIGHT.V1
// WHO: LeeWay Industries / Creator-authorized engineering
// WHAT: Test original source candidate inventory, SHA-256, negative import closure cases.
// WHY: Prevent false canonical source admission and silently missing dependencies.
// WHERE: tests/continuum-owner-preflight.test.mjs
// WHEN: 2026-10-27
// HOW: Ephemeral fictional fixtures; no owner data or original runtime side effects.
// AUTHORITY: SOURCE TEST ONLY; not live service Veritas qualification.
// LICENSE: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {inspect} from '../scripts/inspect-continuum-source.mjs';
async function fixture(fn){const d=await mkdtemp(join(tmpdir(),'continuum-preflight-'));try{return await fn(d);}finally{await rm(d,{recursive:true,force:true});}}
test('source candidate hashes and relative imports without production claims',async()=>fixture(async d=>{
 await writeFile(join(d,'pc-continuum.mjs'),"import {x} from './local.mjs';\nexport const a=x;\n");
 await writeFile(join(d,'owner-retention.mjs'),'export const retention=true;\n');
 await writeFile(join(d,'local.mjs'),'export const x=7;\n');
 const r=await inspect(d);
 assert.equal(r.status,'SOURCE_CANDIDATES_OBSERVED_RUNTIME_UNVERIFIED');
 assert.equal(r.files.length,3);
 assert.equal(r.files.find(x=>x.path==='local.mjs').sha256,createHash('sha256').update('export const x=7;\n').digest('hex'));
 assert.equal(r.originalRuntimeBinding,'NOT_OBSERVED');assert.equal(r.productionAdmission,false);assert.equal(r.receipt,'NOT_CREATED');
}));
test('missing relative dependency rejects source closure',async()=>fixture(async d=>{
 await writeFile(join(d,'pc-continuum.mjs'),"import './missing.mjs';");
 await writeFile(join(d,'owner-retention.mjs'),'export const x=1;');
 const r=await inspect(d);assert.match(r.status,/BLOCKED/);assert.equal(r.unresolvedRelativeImports[0].reason,'UNRESOLVED_RELATIVE_IMPORT');
}));
test('duplicate original modules reject provenance',async()=>fixture(async d=>{
 await mkdir(join(d,'copy'));await writeFile(join(d,'pc-continuum.mjs'),'');await writeFile(join(d,'owner-retention.mjs'),'');await writeFile(join(d,'copy','pc-continuum.mjs'),'');
 const r=await inspect(d);assert.equal(r.sourceCandidates['pc-continuum.mjs'],2);assert.match(r.status,/BLOCKED/);
}));
test('nonliteral imports require independent inspection',async()=>fixture(async d=>{
 await writeFile(join(d,'pc-continuum.mjs'),'const x=await import(variable);');await writeFile(join(d,'owner-retention.mjs'),'');
 const r=await inspect(d);assert.equal(r.dynamicLoads.length,1);assert.match(r.status,/BLOCKED/);
}));
