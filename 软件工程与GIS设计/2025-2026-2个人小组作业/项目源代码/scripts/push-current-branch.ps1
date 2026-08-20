param(
  [string]$Remote = "origin",
  [string[]]$GithubIps = @(
    "140.82.116.3",
    "140.82.116.4",
    "140.82.114.4",
    "140.82.113.4",
    "140.82.112.4"
  )
)

$ErrorActionPreference = "Continue"
$env:GIT_TERMINAL_PROMPT = "0"

$branch = (& git branch --show-current).Trim()
if (-not $branch) {
  throw "Cannot determine current branch."
}

$aheadOutput = & git rev-list --count "$Remote/$branch..HEAD" 2>$null
if ($LASTEXITCODE -ne 0 -or -not $aheadOutput) {
  $ahead = "new-branch"
} else {
  $ahead = "$aheadOutput".Trim()
}

Write-Host "Pushing branch: $branch"
Write-Host "Commits ahead: $ahead"

foreach ($ip in $GithubIps) {
  Write-Host "Trying github.com:443 via $ip ..."

  $output = & git `
    -c "http.version=HTTP/1.1" `
    -c "http.lowSpeedLimit=1" `
    -c "http.lowSpeedTime=15" `
    -c "http.curloptResolve=github.com:443:$ip" `
    push --porcelain $Remote "HEAD:refs/heads/$branch" 2>&1
  $exitCode = $LASTEXITCODE

  if ($exitCode -eq 0) {
    if ($output) {
      $output | ForEach-Object { Write-Host $_ }
    }
    Write-Host "Push succeeded via $ip"
    exit 0
  }

  if ($output) {
    $summary = ($output | Select-Object -Last 2) -join " | "
    Write-Host "Last error: $summary"
  }
  Write-Host "Push failed via $ip; trying next endpoint."
}

throw "Push failed for all configured GitHub endpoints."
