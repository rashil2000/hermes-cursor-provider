[CmdletBinding()]
param(
    [switch]$Reviewed
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Package = "cursor-opencode-provider"

function Assert-NativeCommand([string]$Description) {
    if ($LASTEXITCODE -ne 0) {
        throw "$Description failed with exit code $LASTEXITCODE"
    }
}

function Replace-ExactlyOnce(
    [string]$Path,
    [string]$OldText,
    [string]$NewText
) {
    $content = [IO.File]::ReadAllText($Path)
    $count = ([regex]::Matches(
        $content,
        [regex]::Escape($OldText)
    )).Count

    if ($count -ne 1) {
        throw "Expected exactly one occurrence in ${Path}; found $count"
    }

    $utf8WithoutBom = [Text.UTF8Encoding]::new($false)
    [IO.File]::WriteAllText(
        $Path,
        $content.Replace($OldText, $NewText),
        $utf8WithoutBom
    )
}

$Root = (& git rev-parse --show-toplevel).Trim()
Assert-NativeCommand "Locating repository"

Push-Location $Root
try {
    $ManifestPath = "worker/package.json"
    $NoticePath = "THIRD_PARTY_NOTICES.md"
    $ReadmePath = "README.md"

    $Manifest = Get-Content $ManifestPath -Raw | ConvertFrom-Json
    $CurrentVersion = $Manifest.dependencies.'cursor-opencode-provider'

    $Notice = Get-Content $NoticePath -Raw
    $RevisionMatch = [regex]::Match(
        $Notice,
        'Reviewed source revision: `([0-9a-f]{40})`'
    )

    if (-not $RevisionMatch.Success) {
        throw "Could not determine the currently reviewed revision"
    }

    $CurrentRevision = $RevisionMatch.Groups[1].Value

    $MetadataJson = & npm view "$Package@latest" version gitHead --json
    Assert-NativeCommand "Reading npm release metadata"
    $Metadata = $MetadataJson | Out-String | ConvertFrom-Json

    $LatestVersion = $Metadata.version
    $LatestRevision = $Metadata.gitHead

    Write-Host "Current: $CurrentVersion ($CurrentRevision)"
    Write-Host "Latest:  $LatestVersion ($LatestRevision)"
    Write-Host ""
    Write-Host ("Review: https://github.com/oakimov/" +
        "cursor-opencode-provider/compare/" +
        "$CurrentRevision...$LatestRevision")

    if ($CurrentVersion -eq $LatestVersion) {
        Write-Host "Already using the latest published release."
        return
    }

    if (-not $Reviewed) {
        Write-Host ""
        Write-Host "No files changed."
        Write-Host "After reviewing upstream, rerun with -Reviewed."
        return
    }

    $ManagedFiles = @(
        "worker/package.json",
        "worker/package-lock.json",
        "worker/worker.bundle.mjs",
        "worker/worker.bundle.mjs.LEGAL.txt",
        $ReadmePath,
        $NoticePath
    )

    $DirtyFiles = @(& git status --porcelain -- $ManagedFiles)
    Assert-NativeCommand "Checking working tree"

    if ($DirtyFiles.Count -ne 0) {
        throw "Managed files already contain uncommitted changes:`n$($DirtyFiles -join "`n")"
    }

    Push-Location worker
    try {
        & npm install --save-exact "$Package@$LatestVersion"
        Assert-NativeCommand "Updating dependency"

        & npm ci
        Assert-NativeCommand "Installing locked dependencies"

        & npm run bundle
        Assert-NativeCommand "Building worker bundle"
    }
    finally {
        Pop-Location
    }

    Replace-ExactlyOnce `
        $ReadmePath `
        ('The worker bundles `cursor-opencode-provider` ' +
            $CurrentVersion + ' into') `
        ('The worker bundles `cursor-opencode-provider` ' +
            $LatestVersion + ' into')

    Replace-ExactlyOnce `
        $ReadmePath `
        $CurrentRevision `
        $LatestRevision

    Replace-ExactlyOnce `
        $NoticePath `
        ('Adopted package: `cursor-opencode-provider` ' + $CurrentVersion) `
        ('Adopted package: `cursor-opencode-provider` ' + $LatestVersion)

    Replace-ExactlyOnce `
        $NoticePath `
        ('Reviewed source revision: `' + $CurrentRevision + '`') `
        ('Reviewed source revision: `' + $LatestRevision + '`')

    & python3 -m pytest
    Assert-NativeCommand "Python tests"

    & python3 -m ruff check .
    Assert-NativeCommand "Ruff"

    & python3 -m mypy src/hermes_cursor_provider
    Assert-NativeCommand "Mypy"

    & node worker/worker.bundle.mjs --self-test
    Assert-NativeCommand "Worker self-test"

    Write-Host ""
    Write-Host "Dependency bump completed. No commit was created."
    & git diff --stat -- $ManagedFiles

    Write-Warning (
        "Before committing, inspect package-lock.json for added or removed " +
        "transitive dependencies and update THIRD_PARTY_NOTICES.md if needed."
    )
}
finally {
    Pop-Location
}
