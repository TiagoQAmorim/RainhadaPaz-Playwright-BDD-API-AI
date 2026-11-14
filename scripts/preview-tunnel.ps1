# Expor localhost:3000 na internet (Cloudflare quick tunnel — mais estável que loca.lt).
# Requer: npm run dev em outro terminal. Mantenha ESTE terminal aberto.
$ErrorActionPreference = "Stop"
$port = 3000

try {
  $null = Invoke-WebRequest -Uri "http://127.0.0.1:$port" -UseBasicParsing -TimeoutSec 5
} catch {
  Write-Host ""
  Write-Host "ERRO: Nada respondendo em http://localhost:$port" -ForegroundColor Red
  Write-Host "Abra outro terminal e rode:  npm run dev" -ForegroundColor Yellow
  Write-Host ""
  exit 1
}

Write-Host ""
Write-Host "Subindo tunel Cloudflare (quick tunnel)..." -ForegroundColor Cyan
Write-Host "Copie o link https://....trycloudflare.com que aparecer abaixo." -ForegroundColor Green
Write-Host "Cada vez que reiniciar o tunel, a URL muda (a antiga deixa de existir)." -ForegroundColor Yellow
Write-Host "Deixe este terminal ABERTO. Nao use loca.lt se der 503/408." -ForegroundColor Yellow
Write-Host "Se a pagina abrir sem interacao (rifa sem cotas), reinicie: npm run dev" -ForegroundColor Yellow
Write-Host "(next.config.ts ja permite *.trycloudflare.com em allowedDevOrigins)" -ForegroundColor DarkGray
Write-Host ""

npx --yes cloudflared tunnel --url "http://127.0.0.1:$port"
