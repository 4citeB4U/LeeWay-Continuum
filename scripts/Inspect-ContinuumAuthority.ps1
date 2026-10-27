# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.CONTINUUM.SOURCE.INTAKE
# TAG: LEEWAY.CONTINUUM.AUTHORITY_DISCOVERY.READ_ONLY.V1
# WHO: LeeWay Industries / creator-authorized operator
# WHAT: Inventory the exact original Continuum owner-host module candidates.
# WHEN: 2026-10-27
# WHERE: LeeWay-Continuum/scripts/Inspect-ContinuumAuthority.ps1
# WHY: The dedicated repository cannot be called complete until its original service is source-pinned.
# HOW: Operator-provided root, read-only discovery, SHA-256, duplicate detection, JSON evidence.
# AUTHORITY: READ_ONLY_DIAGNOSTIC; discovered filenames never prove canonical authority.
# LICENSE: MIT
<#
.SYNOPSIS
  Inspect owner-local Continuum source files without copying any live records.
.EXAMPLE
  pwsh -File ./scripts/Inspect-ContinuumAuthority.ps1 -LeeWayRoot '<LEEWAY_ROOT>'
.NOTES
  This diagnostic never uploads source, databases, key material, logs, or receipts.
  Output is observation only. No Veritas attestation or Receipt/Learning Ledger mutation.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory=$false)]
  [string]$LeeWayRoot = $env:LEEWAY_ROOT
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$names = @('pc-continuum.mjs','owner-retention.mjs')
if ([string]::IsNullOrWhiteSpace($LeeWayRoot)) {
  [ordered]@{
    schema = 'leeway.continuum.source-inspection.v1'
    status = 'BLOCKED'
    reason = 'LEEWAY_ROOT_NOT_PROVIDED'
    files = @()
    receipt = 'NOT_CREATED'
    learningLedger = 'NOT_UPDATED'
  } | ConvertTo-Json -Depth 6
  exit 2
}
try {
  $resolved = (Resolve-Path -LiteralPath $LeeWayRoot -ErrorAction Stop).ProviderPath
  if (-not (Test-Path -LiteralPath $resolved -PathType Container)) {
    throw 'LEEWAY_ROOT_NOT_DIRECTORY'
  }
  $results = @()
  foreach ($name in $names) {
    $matches = @(Get-ChildItem -LiteralPath $resolved -Recurse -File -Filter $name -ErrorAction Stop)
    foreach ($file in $matches) {
      $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256 -ErrorAction Stop).Hash.ToLowerInvariant()
      $relative = [System.IO.Path]::GetRelativePath($resolved, $file.FullName).Replace('\','/')
      $results += [pscustomobject]@{
        fileName = $name
        relativePath = $relative
        lengthBytes = $file.Length
        sha256 = $hash
        status = 'OBSERVED_SOURCE_CANDIDATE_NOT_CANONICAL_PROOF'
      }
    }
  }
  $counts = @{}
  foreach ($name in $names) {
    $counts[$name] = @($results | Where-Object { $_.fileName -eq $name }).Count
  }
  $status = if ($counts['pc-continuum.mjs'] -eq 1 -and $counts['owner-retention.mjs'] -eq 1) {
    'OBSERVED_CANDIDATES_REQUIRE_LIVE_SERVICE_PROVENANCE'
  } else { 'BLOCKED_INCOMPLETE_OR_AMBIGUOUS_CANDIDATES' }
  [ordered]@{
    schema = 'leeway.continuum.source-inspection.v1'
    status = $status
    root = $resolved
    candidates = $results
    candidateCounts = $counts
    nextGate = 'PIN_SOURCE_SHA256_AND_PROVE_LIVE_HOST_RELATIONSHIP_BEFORE_IMPORT'
    modifiesHost = $false
    filesTransferred = 0
    receipt = 'NOT_CREATED'
    learningLedger = 'NOT_UPDATED'
  } | ConvertTo-Json -Depth 8
  if ($status -ne 'OBSERVED_CANDIDATES_REQUIRE_LIVE_SERVICE_PROVENANCE') { exit 3 }
} catch {
  [ordered]@{
    schema = 'leeway.continuum.source-inspection.v1'
    status = 'BLOCKED'
    reason = $_.Exception.Message
    filesTransferred = 0
    receipt = 'NOT_CREATED'
    learningLedger = 'NOT_UPDATED'
  } | ConvertTo-Json -Depth 6
  exit 4
}
