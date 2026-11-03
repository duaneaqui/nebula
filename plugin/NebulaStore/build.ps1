param([switch]$Install)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$server = [IO.Path]::GetFullPath((Join-Path $root "..\..\..\minecraft server"))
$runtime = Join-Path $server "runtime"
$javaHomeFile = Join-Path $runtime "java-home.txt"
if (-not (Test-Path $javaHomeFile)) {
  throw "JDK path not found at $javaHomeFile. Start from the minecraft server setup scripts first."
}
$jdk = (Get-Content $javaHomeFile -Raw).Trim()
$javac = Join-Path $jdk "bin\javac.exe"
$jar = Join-Path $jdk "bin\jar.exe"
$api = Get-ChildItem (Join-Path $runtime "libraries\io\papermc\paper\paper-api") -Recurse -Filter "paper-api-*.jar" |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
if (-not $api) { throw "paper-api jar not found under runtime/libraries" }
$lp = Get-ChildItem (Join-Path $runtime "plugins") -Filter "LuckPerms-Bukkit-*.jar" |
  Select-Object -First 1 -ExpandProperty FullName
if (-not $lp) { throw "LuckPerms-Bukkit jar not found in runtime/plugins" }

$ann = Get-ChildItem (Join-Path $runtime "libraries\org\jetbrains\annotations") -Recurse -Filter "annotations-*.jar" |
  Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
$advApi = Join-Path $runtime "libraries\net\kyori\adventure-api\5.2.0\adventure-api-5.2.0.jar"
$advKey = Join-Path $runtime "libraries\net\kyori\adventure-key\5.2.0\adventure-key-5.2.0.jar"
$exam = Get-ChildItem (Join-Path $runtime "libraries\net\kyori\examination-api") -Recurse -Filter "examination-api-*.jar" |
  Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
$guava = Get-ChildItem (Join-Path $runtime "libraries\com\google\guava\guava") -Recurse -Filter "guava-*.jar" |
  Select-Object -First 1 -ExpandProperty FullName
$fail = Get-ChildItem (Join-Path $runtime "libraries\com\google\guava\failureaccess") -Recurse -Filter "*.jar" -ErrorAction SilentlyContinue |
  Select-Object -First 1 -ExpandProperty FullName
$bungee = Get-ChildItem (Join-Path $runtime "libraries\net\md-5\bungeecord-chat") -Recurse -Filter "*.jar" |
  Select-Object -First 1 -ExpandProperty FullName
$cp = (@($api, $lp, $ann, $advApi, $advKey, $exam, $guava, $fail, $bungee) | Where-Object { $_ -and (Test-Path $_) }) -join ";"

$out = Join-Path $root "out"
$classes = Join-Path $out "classes"
if (Test-Path $classes) { Remove-Item $classes -Recurse -Force }
New-Item -ItemType Directory -Force -Path $classes | Out-Null
$files = Get-ChildItem (Join-Path $root "src") -Recurse -Filter "*.java" | ForEach-Object { $_.FullName }
& $javac -encoding UTF-8 -cp $cp -d $classes @files
if ($LASTEXITCODE -ne 0) { throw "javac failed" }
Copy-Item (Join-Path $root "plugin.yml") $classes -Force
Copy-Item (Join-Path $root "config.yml") $classes -Force
$dist = Join-Path $root "dist"
New-Item -ItemType Directory -Force -Path $dist | Out-Null
$dest = Join-Path $dist "NebulaStore-1.0.0.jar"
if (Test-Path $dest) { Remove-Item $dest -Force }
Push-Location $classes
& $jar cf $dest .
Pop-Location
Write-Host "Built $dest"

if ($Install) {
  $plugins = Join-Path $runtime "plugins\NebulaStore-1.0.0.jar"
  Copy-Item $dest $plugins -Force
  Write-Host "Copied to $plugins"
  Write-Host "Restart the server, then set plugins/NebulaStore/config.yml secret to STORE_PLUGIN_SECRET."
}
