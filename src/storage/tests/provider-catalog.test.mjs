import test from 'node:test';
import assert from 'node:assert/strict';
import {assertProviderDescriptor,createStorageProviderDescriptor,listStorageProviderDefinitions} from '../provider-catalog.mjs';

const scope={ownerId:'creator-scope',bodyId:'body-fold6'};

test('provider catalog separates subordinate stores from Continuum authority',()=>{
  const ids=listStorageProviderDefinitions().map(item=>item.providerId);
  assert.deepEqual(ids,['local-continuum','cloudflare-r2','oracle-oci-object','google-drive','mega','pcloud','box','icedrive','internxt','github-release']);
  const descriptor=createStorageProviderDescriptor({...scope,providerId:'google-drive'});
  assert.equal(descriptor.authorityRef,'leeway.continuum');
  assert.equal(descriptor.auth,'OAUTH2_USER_CONSENT');
  assert.equal(descriptor.grantsContinuumAuthority,false);
  assert.equal(descriptor.createsDatabase,false);
  assertProviderDescriptor(descriptor);
});

test('GitHub is release infrastructure, never a live user object store',()=>{
  const descriptor=createStorageProviderDescriptor({...scope,providerId:'github-release',resourceId:'4citeB4U/LeeWay-Continuum',status:'BOUND_SOURCE_ONLY'});
  assert.equal(descriptor.role,'VERSIONED_RELEASE_ARTIFACT_OR_ENCRYPTED_EVIDENCE');
  assert.equal(descriptor.writeMode,'RELEASE_ONLY');
  assertProviderDescriptor(descriptor);
});

test('provider descriptors reject secrets and invalid authority',()=>{
  assert.throws(()=>createStorageProviderDescriptor({...scope,providerId:'mega',accessToken:'never'}),/SECRET_INPUT_FORBIDDEN/);
  assert.throws(()=>createStorageProviderDescriptor({...scope,providerId:'google-drive',authorityRef:'pc-primary'}),/AUTHORITY_INVALID/);
  assert.throws(()=>createStorageProviderDescriptor({...scope,providerId:'google-drive',status:'RUNTIME_OBSERVED'}),/RESOURCE_REQUIRED/);
});
