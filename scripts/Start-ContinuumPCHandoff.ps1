# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.CONTINUUM.PC.HANDOFF
# TAG: LEEWAY.CONTINUUM.READ_ONLY_PC_HANDOFF.V1
# WHO: LeeWay Industries / Creator-authorized operator
# WHAT: Inspect original Continuum module identity, optional localhost status and storage candidate names.
# WHEN: 2026-10-28
# WHERE: scripts/Start-ContinuumPCHandoff.ps1
# WHY: Preserve the original service and databases while collecting the first live-host provenance gate.
# HOW: Read-only filesystem and process inventory, SHA-256; private local JSON evidence.
# AUTHORITY: READ_ONLY_DIAGNOSTIC; NOT a production admission or receipt.
# LICENSE: MIT
[CmdletBinding()]
param(
  [string]$LeeWayRoot = 'E:\LeeWay-Work',
  [string]$EvidenceDirectory = '',
  [switch]$ProbeLocalService
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).ProviderPath
if ([string]::IsNullOrWhiteSpace($EvidenceDirectory)) {
  $EvidenceDirectory = Join-Path $env:TEMP 'LeeWay-Continuum-Handoff'
}
New-Item -ItemType Directory -Path $EvidenceDirectory -Force | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$outfile = Join-Path $EvidenceDirectory "continuum-preflight-$stamp.json"
$report = [ordered]@{
 schema = 'leeway.continuum.pc-handoff.v1'
 state = 'READ_ONLY_INSPECTION'
 timestampUtc = (Get-Date).ToUniversalTime().ToString('o')
 originalSource = $null
 nodeSourceClosure = $null
 relevantProcesses = @()
 storageCandidates = @()
 localService = 'NOT_PROBED'
 notes = @()
 veritas = 'NOT_EXECUTED'
 receipt = 'NOT_CREATED'
 learningLedger = 'NOT_UPDATED'
}
try {
 if (-not (Test-Path -LiteralPath $LeeWayRoot -PathType Container)) { throw 'LEEWAY_ROOT_NOT_FOUND' }
 $resolved = (Resolve-Path -LiteralPath $LeeWayRoot).ProviderPath
 $inspector = Join-Path $repoRoot 'scripts/Inspect-ContinuumAuthority.ps1'
 $existing = & $inspector -LeeWayRoot $resolved | Out-String
 $report.originalSource = $existing | ConvertFrom-Json
 $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
 if ($null -ne $nodeCmd) {
   $nodeScript = Join-Path $repoRoot 'scripts/inspect-continuum-source.mjs'
   $json = & $nodeCmd.Source $nodeScript --root $resolved | Out-String
   $report.nodeSourceClosure = $json | ConvertFrom-Json
 } else { $report.notes += 'NODE_UNAVAILABLE: Install Node 22 or newer for dependency closure inspector' }
 # Read process metadata only; no module attachment, process termination or process injection.
 $report.relevantProcesses = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
   Where-Object { $_.Name -match '^(node|pwsh|powershell)(\.exe)?$' -and $_.CommandLine -match '(?i)continuum|machine-consciousness|pc-consciousness-live' } |
   Select-Object ProcessId,Name,CommandLine)
 # Only metadata. Do not open SQLite, WAL, secret vaults, personal content or journal files.
 $report.storageCandidates = @(Get-ChildItem -LiteralPath $resolved -Recurse -File -ErrorAction SilentlyContinue |
   Where-Object { $_.Extension -in @('.db','.sqlite','.sqlite3') -and $_.FullName -notmatch '(?i)[\\/](node_modules|\.git|backups?|secrets?|vault)[\\/]' } |
   Select-Object -First 100 FullName,Length,LastWriteTimeUtc)
 if ($ProbeLocalService) {
   try {
     # Never send credentials. Metadata/status endpoint may not exist; failure remains evidence.
     $result = Invoke-WebRequest -Uri 'http://127.0.0.1:8890/health' -Method Get -TimeoutSec 4 -UseBasicParsing
     $report.localService = [ordered]@{endpoint='127.0.0.1:8890/health'; httpStatus=[int]$result.StatusCode; responseBody='REDACTED_NOT_COLLECTED'}
   } catch {
     $report.localService = [ordered]@{endpoint='127.0.0.1:8890/health'; state='NOT_CONFIRMED'; errorType=$_.Exception.GetType().Name}
   }
 }
 $report.state = 'OBSERVATION_COMPLETE_CANONICAL_AUTHORITY_NOT_PROVEN'
} catch {
 $report.state='BLOCKED'
 $report.notes += $_.Exception.Message
} finally {
 $report | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $outfile -Encoding UTF8
 Write-Output "LEEWAY_PC_HANDOFF_STATE=$($report.state)"
 Write-Output "LEEWAY_PC_EVIDENCE_FILE=$outfile"
 Write-Output 'PRIVATE_EVIDENCE: inspect and redact paths, process command lines and identities before sharing publicly.'
 Write-Output 'NO_DATABASE_WRITES NO_SOURCE_TRANSFER NO_RECEIPT'
}
