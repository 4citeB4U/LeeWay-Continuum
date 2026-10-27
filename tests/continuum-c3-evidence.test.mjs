// LEEWAY HEADER — DO NOT REMOVE
// REGION: LEEWAY.CONTINUUM.C3.EVIDENCE.SHAPE_TEST
// TAG: LEEWAY.CONTINUUM.C3.ENGINEERING_LOOP_SHAPE_TEST.V1
// WHO: LeeWay Industries / creator-authorized engineering
// WHAT: Check retrospective engineering-loop evidence completeness and deny false promotion.
// WHEN: 2026-10-27
// WHERE: tests/continuum-c3-evidence.test.mjs
// WHY: Fail source CI when phases, failure links, or honest Veritas/receipt states are erased.
// HOW: Validate issue-linked source evidence structure and adverse in-memory test mutations.
// AUTHORITY: SOURCE_CONTRACT_TEST_ONLY; no Veritas admission, receipt creation, or learning promotion.
// LICENSE: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const source=JSON.parse(readFileSync(join(here,'../docs/evidence/continuum-c3-source-loop-20261027.json'),'utf8'));
const phases=['Investigate','Diagnose','Plan','Implement','Test','Validate','Repair','Retest','Verify','Evidence'];
const states=new Set(['VERIFIED','OBSERVED','FAILED','BLOCKED']);
const clone=x=>structuredClone(x);

function verifySourceEvidence(record) {
  assert.equal(record.schema,'leeway.continuum.engineering-source-evidence.v1');
  assert.equal(record.recordType,'RETROSPECTIVE_SOURCE_EVIDENCE_NOT_CANONICAL_RECEIPT');
  assert.equal(record.missionIssue,'https://github.com/4citeB4U/LeeWay-Continuum/issues/1');
  assert.equal(record.fileIdentity.authority,'RETROSPECTIVE_SOURCE_EVIDENCE_ONLY');
  for(const field of ['region','tag','who','what','when','where','why','how','license']) {
    assert.ok(typeof record.fileIdentity[field]==='string' && record.fileIdentity[field].trim(), 'identity '+field);
  }
  assert.equal(record.phases.length,10,'all ten LeeWay phases must be retained');
  const ids=new Set(record.evidence.map(e=>e.id));
  assert.equal(ids.size,record.evidence.length);
  assert.ok(record.evidence.length>0);
  for(const e of record.evidence) {
    assert.match(e.url,/^https:\/\/github\.com\/4citeB4U\/[^/]+\/(?:actions\/runs|blob|commit|issues|pull)\//);
    assert.ok(e.claim && e.kind);
  }
  record.phases.forEach((p,i)=>{
    assert.equal(p.step,i+1,'stage order');
    assert.equal(p.name,phases[i],'stage name');
    assert.ok(states.has(p.status),'stage evidence state');
    assert.ok(typeof p.finding==='string' && p.finding.length>24,'actual finding required');
    assert.ok(Array.isArray(p.evidenceIds)&&p.evidenceIds.length>0);
    p.evidenceIds.forEach(id=>assert.ok(ids.has(id),'unresolved phase evidence '+id));
  });
  assert.ok(record.incidents.length>=2,'preserve material failures');
  for(const incident of record.incidents){
    assert.ok(incident.signature && incident.correction && incident.outcome);
    assert.ok(incident.evidenceIds.length>0);
    incident.evidenceIds.forEach(id=>assert.ok(ids.has(id),'unresolved failure evidence'));
    assert.notEqual(incident.learningEligibility,'ADMITTED_VERIFIED','no unverified learning promotion');
  }
  const failedRunIds=new Set(record.evidence.filter(e=>e.kind==='CI_FAILURE').map(e=>e.id));
  assert.ok(failedRunIds.size>=2,'preserve the two original failed runs');
  assert.ok(record.incidents.some(x=>x.evidenceIds.some(id=>failedRunIds.has(id))));
  assert.equal(record.acceptance.productionQualified,false);
  assert.equal(record.acceptance.missionClosed,false);
  assert.equal(record.acceptance.independentVeritasDecision,'NOT_ISSUED');
  assert.equal(record.acceptance.independentVeritasPre,'NOT_EXECUTED');
  assert.equal(record.acceptance.independentVeritasPost,'NOT_EXECUTED');
  assert.equal(record.acceptance.canonicalReceipt.created,false);
  assert.equal(record.acceptance.canonicalReceipt.id,null);
  assert.equal(record.acceptance.learningLedger.updated,false);
  assert.equal(record.acceptance.learningLedger.admission,'NOT_SUBMITTED');
  assert.equal(record.acceptance.formulaExecutionState,'NOT_EXECUTED');
  assert.equal(record.acceptance.originalOwnerStoreBinding,'BLOCKED');
  return true;
}

test('full existing engineering-loop evidence is structurally complete and non-promoting',()=>{
  assert.equal(verifySourceEvidence(source),true);
});
test('missing engineering stage is rejected',()=>{
  const c=clone(source);c.phases.splice(6,1);
  assert.throws(()=>verifySourceEvidence(c),/all ten LeeWay phases/);
});
test('unknown evidence reference is rejected',()=>{
  const c=clone(source);c.phases[7].evidenceIds.push('FABRICATED_REFERENCE');
  assert.throws(()=>verifySourceEvidence(c),/unresolved phase evidence/);
});
test('deleting source CI failures is rejected',()=>{
  const c=clone(source);c.evidence=c.evidence.filter(e=>e.kind!=='CI_FAILURE');
  assert.throws(()=>verifySourceEvidence(c));
});
test('claiming Veritas admission without independent proof is rejected',()=>{
  const c=clone(source);c.acceptance.independentVeritasDecision='PASS';
  assert.throws(()=>verifySourceEvidence(c),/NOT_ISSUED/);
});
test('claiming an invented receipt or admitted learning is rejected',()=>{
  const c=clone(source);c.acceptance.canonicalReceipt.created=true;
  assert.throws(()=>verifySourceEvidence(c));
  const d=clone(source);d.acceptance.learningLedger.admission='ADMITTED_VERIFIED';
  assert.throws(()=>verifySourceEvidence(d));
});
