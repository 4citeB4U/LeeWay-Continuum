// LEEWAY HEADER — DO NOT REMOVE
// REGION: LEEWAY.CONTINUUM.TEST.PC_HANDOFF
// TAG: LEEWAY.CONTINUUM.PC_HANDOFF_TEST.V1
// WHO: LeeWay Industries / Creator-authorized engineering
// WHAT: Check handoff script executes in Windows PowerShell on a blocked path without modifying owner data.
// WHEN: 2026-10-28
// WHERE: tests/continuum-pc-handoff.test.mjs
// WHY: A handoff command must fail visibly while preserving machine/owner files.
// HOW: Temporary fixture output, nonexistent root and native PowerShell invocation.
// AUTHORITY: SOURCE_CI_ONLY; no original Continuum live host verified.
// LICENSE: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtemp,readFile,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
test('PC script writes blocked private JSON without host changes', {skip:process.platform!=='win32'},async()=>{
 const d=await mkdtemp(join(tmpdir(),'leeway-pc-handoff-test-'));
 try{
  const script=resolve('scripts/Start-ContinuumPCHandoff.ps1');
  const result=spawnSync('pwsh',['-NoProfile','-File',script,'-LeeWayRoot',join(d,'root-does-not-exist'),'-EvidenceDirectory',d],{encoding:'utf8',timeout:30000});
  assert.equal(result.status,0,JSON.stringify(result.stderr));
  assert.match(result.stdout,/LEEWAY_PC_HANDOFF_STATE=BLOCKED/);
  const output=(await readdir(d)).filter(x=>x.endsWith('.json'));
  assert.equal(output.length,1);
  const evidence=JSON.parse(await readFile(join(d,output[0]),'utf8'));
  assert.equal(evidence.state,'BLOCKED');
  assert.equal(evidence.veritas,'NOT_EXECUTED');
  assert.equal(evidence.receipt,'NOT_CREATED');
  assert.equal(evidence.learningLedger,'NOT_UPDATED');
 }finally{await rm(d,{recursive:true,force:true});}
});
