$ErrorActionPreference = "Stop"

$paths = @(
  "packages/api/src",
  "apps/admin/src"
)

$existingPaths = @()

foreach ($path in $paths) {
  if (Test-Path $path) {
    $existingPaths += $path
  }
}

if ($existingPaths.Count -eq 0) {
  Write-Host "No scan paths found." -ForegroundColor Red
  exit 1
}

$checks = @(
  @{
    Name = "P0 - Explicit any annotations"
    Severity = "P0"
    Pattern = ':\s*any\b'
    Description = "Explicit any can pass locally but break stricter CI/build assumptions."
  },
  @{
    Name = "P0 - as any casts"
    Severity = "P0"
    Pattern = '\bas\s+any\b'
    Description = "as any hides type errors and can mask Vercel build failures."
  },
  @{
    Name = "P0 - unknown as casts"
    Severity = "P0"
    Pattern = '\bunknown\s+as\s+[A-Za-z_$][\w$.<>\[\]]+'
    Description = "unknown as X is often a forced cast; review carefully."
  },
  @{
    Name = "P0 - Prisma raw queries without generic"
    Severity = "P0"
    Pattern = '\$queryRaw(Unsafe)?(?!\s*<)'
    Description = "Prefer prisma.$queryRaw<RowType[]> so map/reduce callbacks are typed."
  },
  @{
    Name = "P0 - Prisma.Sql namespace usage"
    Severity = "P0"
    Pattern = 'Prisma\.Sql'
    Description = "Prisma.Sql may not be exported by the generated Prisma namespace on Vercel. Prefer TemplateStringsArray for tagged raw-query helper shapes, or avoid exposing Prisma.Sql in custom types."
  },
  @{
    Name = "P1 - Prisma transactions with untyped tx callback"
    Severity = "P1"
    Pattern = '\$transaction\s*\(\s*(?:async\s*)?\(\s*(?![^)]*:)[A-Za-z_$][\w$]*\s*\)\s*=>'
    Description = "Usually inferred by Prisma. Type explicitly only if Vercel/typecheck reports tx as implicit any."
  },
  @{
    Name = "P1 - Promise catch callbacks with untyped error variable"
    Severity = "P1"
    Pattern = '\.catch\s*\(\s*\(\s*(?![^):]+:)[A-Za-z_$][\w$]*\s*\)\s*=>'
    Description = "Use err: unknown for predictable strict builds."
  },
  @{
    Name = "P1 - catch blocks with untyped error variable"
    Severity = "P1"
    Pattern = 'catch\s*\(\s*(?![^):]+:)[A-Za-z_$][\w$]*\s*\)'
    Description = "Use catch (err: unknown) where project config allows it, or narrow safely."
  },
  @{
    Name = "P1 - Prisma InputJsonValue usage"
    Severity = "P1"
    Pattern = 'Prisma\.InputJsonValue'
    Description = "Can be version-sensitive. Review if Vercel Prisma version differs."
  },
  @{
    Name = "P1 - Prisma NullableJsonNullValueInput usage"
    Severity = "P1"
    Pattern = 'Prisma\.NullableJsonNullValueInput'
    Description = "Can be version-sensitive. Review if generated Prisma client differs."
  },
  @{
    Name = "P1 - Prisma namespace imported from @fixpro/db"
    Severity = "P1"
    Pattern = 'import\s*\{\s*Prisma\s*\}\s*from\s*[''"]@fixpro/db[''"]'
    Description = "Review Prisma namespace imports from @fixpro/db. Some generated namespace members can differ in CI/Vercel."
  },
  @{
  Name = "P1 - Generated DB enum/type imports from @fixpro/db"
  Severity = "P1"
  Pattern = 'import\s+type\s*\{\s*[A-Za-z_$][\w$]*(Tier|Status|Role|Type|Enum)[A-Za-z_$\w$]*\s*\}\s*from\s*[''"]@fixpro/db[''"]'
  Description = "Review generated enum/type imports from @fixpro/db. Vercel may fail if the wrapper package does not export the generated member."
},
  @{
    Name = "P1 - Prisma.sql helper usage"
    Severity = "P1"
    Pattern = 'Prisma\.sql'
    Description = "Prisma.sql can be valid, but avoid coupling custom helper signatures to Prisma.Sql."
  },
  @{
    Name = "P1 - Prisma raw unsafe usage"
    Severity = "P1"
    Pattern = '\$(queryRawUnsafe|executeRawUnsafe)\b'
    Description = "Unsafe raw SQL should be reviewed carefully before production deploy."
  },
  @{
    Name = "P1 - unknown as number/string/boolean"
    Severity = "P1"
    Pattern = 'unknown\s+as\s+(number|string|boolean)'
    Description = "Primitive forced casts are risky in runtime data mapping."
  },
  @{
    Name = "P2 - Array callbacks with explicit any param"
    Severity = "P2"
    Pattern = '\.(map|find|filter|some|every)\s*\(\s*\(\s*[A-Za-z_$][\w$]*\s*:\s*any\b'
    Description = "Only flags real explicit-any callbacks, not every normal map/filter."
  },
  @{
    Name = "P2 - Reduce callbacks with explicit any param"
    Severity = "P2"
    Pattern = '\.reduce\s*\(\s*\(\s*[A-Za-z_$][\w$]*\s*:\s*any\b'
    Description = "Only flags reduce callbacks that are actually typed as any."
  }
)

Write-Host ""
Write-Host "=== FixPro Vercel Risk Audit ===" -ForegroundColor Cyan
Write-Host "Scanning: $($existingPaths -join ', ')" -ForegroundColor DarkGray
Write-Host ""

$total = 0
$p0Total = 0
$p1Total = 0
$p2Total = 0

foreach ($check in $checks) {
  $color = "Yellow"

  if ($check.Severity -eq "P0") {
    $color = "Red"
  } elseif ($check.Severity -eq "P1") {
    $color = "Yellow"
  } else {
    $color = "DarkYellow"
  }

  Write-Host "## $($check.Name)" -ForegroundColor $color
  Write-Host $check.Description -ForegroundColor DarkGray

  $found = $false

  foreach ($path in $existingPaths) {
    $result = pnpm exec rg -n --pcre2 --glob '!**/*.test.ts' --glob '!**/*.spec.ts' --glob '!**/tests/**' $check.Pattern $path
    $exitCode = $LASTEXITCODE

    if ($exitCode -eq 0 -and $result) {
      $found = $true

      $count = ($result | Measure-Object).Count
      $total += $count

      if ($check.Severity -eq "P0") {
        $p0Total += $count
      } elseif ($check.Severity -eq "P1") {
        $p1Total += $count
      } else {
        $p2Total += $count
      }

      $result
    } elseif ($exitCode -gt 1) {
      Write-Host "Search failed for pattern:" -ForegroundColor Red
      Write-Host $check.Pattern -ForegroundColor DarkGray
      exit 2
    }
  }

  if (-not $found) {
    Write-Host "OK - no matches" -ForegroundColor Green
  }

  Write-Host ""
}

Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "P0 critical matches: $p0Total"
Write-Host "P1 review matches:   $p1Total"
Write-Host "P2 info matches:     $p2Total"
Write-Host "Total matches:       $total"

Write-Host ""

if ($p0Total -gt 0) {
  Write-Host "P0 matches found. Review before pushing to Vercel." -ForegroundColor Red
  exit 1
}

if ($p1Total -gt 0) {
  Write-Host "Only P1/P2 matches found. Review recommended, but not automatically blocking." -ForegroundColor Yellow
  exit 0
}

Write-Host "No blocking Vercel risk patterns found." -ForegroundColor Green
exit 0