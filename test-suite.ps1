# ==============================================================================
# ÁBICA Muebles Contemporáneos — Suite de Pruebas Automatizadas
# Validación: SEO, AEO, Open Graph, Responsive CSS y Seguridad Multi-Nivel
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$totalTests = 0
$passedTests = 0
$failedTests = 0

function Run-Test {
    param(
        [string]$Category,
        [string]$TestName,
        [scriptblock]$Assertion
    )
    $global:totalTests++
    try {
        $result = & $Assertion
        if ($result -eq $true) {
            $global:passedTests++
            Write-Host "  [PASS] $TestName" -ForegroundColor Green
        } else {
            $global:failedTests++
            Write-Host "  [FAIL] $TestName" -ForegroundColor Red
        }
    } catch {
        $global:failedTests++
        Write-Host "  [ERROR] $TestName - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " INICIANDO SUITE DE PRUEBAS AUTOMATIZADAS - ÁBICA E-COMMERCE" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# 1. PRUEBAS DE ESTRUCTURA Y SINTAXIS DE ARCHIVOS
# ------------------------------------------------------------------------------
Write-Host "`n1. Verificación de Integridad de Archivos y Sintaxis" -ForegroundColor Yellow

Run-Test "Archivos" "Todos los archivos críticos del proyecto existen" {
    $files = @("index.html", "css/styles.css", "js/products.js", "js/cart.js", "js/filters.js", "js/seo-helper.js", "js/security.js", "js/app.js", "robots.txt", "sitemap.xml", ".htaccess", "_headers")
    $missing = $files | Where-Object { -not (Test-Path $_) }
    return ($missing.Count -eq 0)
}

Run-Test "CSS" "Balance perfecto de llaves en css/styles.css" {
    $content = Get-Content "css/styles.css" -Raw
    $openCount = ([regex]::Matches($content, '\{')).Count
    $closeCount = ([regex]::Matches($content, '\}')).Count
    return ($openCount -eq $closeCount -and $openCount -gt 500)
}

Run-Test "HTML" "Balance perfecto de etiquetas críticas en index.html" {
    $html = Get-Content "index.html" -Raw
    $divOpen = ([regex]::Matches($html, '<div[\s>]')).Count
    $divClose = ([regex]::Matches($html, '</div>')).Count
    $sectionOpen = ([regex]::Matches($html, '<section[\s>]')).Count
    $sectionClose = ([regex]::Matches($html, '</section>')).Count
    $mainOpen = ([regex]::Matches($html, '<main[\s>]')).Count
    $mainClose = ([regex]::Matches($html, '</main>')).Count
    $formOpen = ([regex]::Matches($html, '<form[\s>]')).Count
    $formClose = ([regex]::Matches($html, '</form>')).Count
    
    return ($divOpen -eq $divClose -and $sectionOpen -eq $sectionClose -and $mainOpen -eq 1 -and $mainClose -eq 1 -and $formOpen -eq $formClose)
}

# ------------------------------------------------------------------------------
# 2. PRUEBAS DE RESPONSIVE DESIGN (CSS MEDIA QUERIES)
# ------------------------------------------------------------------------------
Write-Host "`n2. Verificación del Sistema 100% Responsive (7 Breakpoints)" -ForegroundColor Yellow

$cssContent = Get-Content "css/styles.css" -Raw

$breakpoints = @("1200px", "1024px", "900px", "768px", "600px", "480px", "360px")
foreach ($bp in $breakpoints) {
    Run-Test "Responsive" "Breakpoint de $bp está definido en css/styles.css" {
        return ($cssContent -match "@media\s*\([^\)]*max-width:\s*$bp\)")
    }
}

Run-Test "Responsive" "Banner de inspiración adaptado a clase semántica .inspiration-banner__inner" {
    return ($cssContent -match '\.inspiration-banner__inner\s*\{' -and -not ($cssContent -match '\.inspiration-banner \.container > div \{'))
}

Run-Test "Responsive" "Micro-optimizaciones móviles: scroll-padding-top y touch-action" {
    return ($cssContent -match 'scroll-padding-top:\s*var\(--header-height\)' -and $cssContent -match 'touch-action:\s*manipulation')
}

# ------------------------------------------------------------------------------
# 3. PRUEBAS DE SEO Y AEO (MOTORES DE BÚSQUEDA Y RESPUESTA IA)
# ------------------------------------------------------------------------------
Write-Host "`n3. Verificación de SEO & AEO (Search & Answer Engine Optimization)" -ForegroundColor Yellow

$htmlContent = Get-Content "index.html" -Raw

Run-Test "SEO" "Metadatos canónicos, robots y geo-tags presentes en <head>" {
    $hasCanonical = $htmlContent -match '<link\s+rel="canonical"\s+href="https://abica\.com\.co/"'
    $hasRobots = $htmlContent -match 'name="robots"\s+content="[^"]*index,\s*follow'
    $hasGeo = $htmlContent -match 'name="geo\.region"\s+content="CO-DC"'
    return ($hasCanonical -and $hasRobots -and $hasGeo)
}

Run-Test "AEO" "Datos Estructurados JSON-LD Schema.org válidos y parseables" {
    $match = [regex]::Match($htmlContent, '<script\s+type="application/ld\+json">([\s\S]*?)</script>')
    if (-not $match.Success) { return $false }
    $jsonText = $match.Groups[1].Value.Trim()
    
    # Validar que es JSON válido
    $parsed = ConvertFrom-Json $jsonText
    $hasGraph = $null -ne $parsed.'@graph'
    
    # Verificar tipos schema críticos para AEO
    $types = $parsed.'@graph' | ForEach-Object { $_.'@type' }
    $hasStore = $types -contains "FurnitureStore"
    $hasWebsite = $types -contains "WebSite"
    $hasFAQ = $types -contains "FAQPage"
    $hasItems = $types -contains "ItemList"
    $hasBreadcrumbs = $types -contains "BreadcrumbList"

    return ($hasGraph -and $hasStore -and $hasWebsite -and $hasFAQ -and $hasItems -and $hasBreadcrumbs)
}

Run-Test "AEO" "FAQ ampliado con preguntas factuales sobre Garantía FSC y Asesoría 100% Gratuita" {
    $hasFscQ = $htmlContent -match 'garantía y certificaciones ecológicas'
    $hasConsultQ = $htmlContent -match 'asesoría y diseño de interiores personalizado'
    return ($hasFscQ -and $hasConsultQ)
}

Run-Test "SEO" "Sitemap XML existe, es XML válido y contiene extensiones de imágenes" {
    if (-not (Test-Path "sitemap.xml")) { return $false }
    $rawContent = Get-Content "sitemap.xml" -Raw
    $xml = [xml]$rawContent
    $urlNodes = $xml.GetElementsByTagName("url")
    $hasUrls = $urlNodes.Count -ge 5
    $hasImages = $rawContent -match '<image:image>'
    return ($hasUrls -and $hasImages)
}

Run-Test "AEO" "Robots.txt contiene directivas explícitas para rastreadores de IA (GPTBot, PerplexityBot, ClaudeBot)" {
    if (-not (Test-Path "robots.txt")) { return $false }
    $robots = Get-Content "robots.txt" -Raw
    $hasGpt = $robots -match 'User-agent:\s*GPTBot'
    $hasPerplexity = $robots -match 'User-agent:\s*PerplexityBot'
    $hasClaude = $robots -match 'User-agent:\s*ClaudeBot'
    $hasSitemapRef = $robots -match 'Sitemap:\s*https://abica\.com\.co/sitemap\.xml'
    return ($hasGpt -and $hasPerplexity -and $hasClaude -and $hasSitemapRef)
}

# ------------------------------------------------------------------------------
# 4. PRUEBAS DE OPEN GRAPH Y SOCIAL SHARING
# ------------------------------------------------------------------------------
Write-Host "`n4. Verificación de Etiquetas Open Graph (OG) y Compartición Dinámica" -ForegroundColor Yellow

Run-Test "OpenGraph" "Metadatos Open Graph completos en index.html (og:image:secure_url, dimensiones, e-commerce)" {
    $hasOgTitle = $htmlContent -match 'property="og:title"'
    $hasOgDesc = $htmlContent -match 'property="og:description"'
    $hasOgImage = $htmlContent -match 'property="og:image"'
    $hasOgSecure = $htmlContent -match 'property="og:image:secure_url"'
    $hasProductPrice = $htmlContent -match 'property="product:price:amount"'
    $hasTwitterCard = $htmlContent -match 'name="twitter:card"\s+content="summary_large_image"'
    return ($hasOgTitle -and $hasOgDesc -and $hasOgImage -and $hasOgSecure -and $hasProductPrice -and $hasTwitterCard)
}

Run-Test "OpenGraph" "Módulo js/seo-helper.js implementa gestión dinámica de OG y Deep Linking" {
    if (-not (Test-Path "js/seo-helper.js")) { return $false }
    $seoHelper = Get-Content "js/seo-helper.js" -Raw
    $hasSetProduct = $seoHelper -match 'setProductOpenGraph'
    $hasReset = $seoHelper -match 'resetOpenGraph'
    $hasApply = $seoHelper -match 'applyOpenGraph'
    $hasShare = $seoHelper -match 'shareProduct'
    $hasDeepLink = $seoHelper -match 'checkUrlForDeepLink'
    return ($hasSetProduct -and $hasReset -and $hasApply -and $hasShare -and $hasDeepLink)
}

Run-Test "OpenGraph" "Modal de producto integra botón de compartir y actualiza OG al abrirse" {
    $appJs = Get-Content "js/app.js" -Raw
    $hasShareBtn = $appJs -match 'shareProduct\(\$\{product\.id\}\)'
    $hasDynamicCall = $appJs -match 'AbicaSEO\.setProductOpenGraph\(product\)'
    $hasResetCall = $appJs -match 'AbicaSEO\.resetOpenGraph\(\)'
    return ($hasShareBtn -and $hasDynamicCall -and $hasResetCall)
}

# ------------------------------------------------------------------------------
# 5. PRUEBAS DE SEGURIDAD EN TODOS LOS NIVELES
# ------------------------------------------------------------------------------
Write-Host "`n5. Verificación de la Arquitectura de Seguridad Multi-Nivel" -ForegroundColor Yellow

Run-Test "Seguridad" "Cabeceras y meta-tags de seguridad en index.html (CSP, X-Frame-Options, X-Content-Type, Permissions)" {
    $hasCsp = $htmlContent -match 'http-equiv="Content-Security-Policy"'
    $hasNosniff = $htmlContent -match 'http-equiv="X-Content-Type-Options"\s+content="nosniff"'
    $hasXfo = $htmlContent -match 'http-equiv="X-Frame-Options"\s+content="DENY"'
    $hasPermissions = $htmlContent -match 'http-equiv="Permissions-Policy"'
    $hasReferrer = $htmlContent -match 'name="referrer"\s+content="strict-origin-when-cross-origin"'
    return ($hasCsp -and $hasNosniff -and $hasXfo -and $hasPermissions -and $hasReferrer)
}

Run-Test "Seguridad" "Módulo js/security.js implementa sanitización XSS, anti-clickjacking, Luhn y RateLimiting" {
    if (-not (Test-Path "js/security.js")) { return $false }
    $secJs = Get-Content "js/security.js" -Raw
    $hasFrameBust = $secJs -match 'window\.top\s*!==\s*window\.self'
    $hasSanitizeHtml = $secJs -match 'function sanitizeHTML'
    $hasSanitizeUrl = $secJs -match 'function sanitizeURL'
    $hasRateLimiter = $secJs -match 'class RateLimiter'
    $hasHoneypot = $secJs -match 'function isHoneypotTriggered'
    $hasLuhn = $secJs -match 'function isValidLuhnCard'
    $hasVerifyCart = $secJs -match 'function sanitizeAndVerifyCartItem'
    return ($hasFrameBust -and $hasSanitizeHtml -and $hasSanitizeUrl -and $hasRateLimiter -and $hasHoneypot -and $hasLuhn -and $hasVerifyCart)
}

Run-Test "Seguridad" "Campos trampa Honeypot presentes en los 4 formularios del sitio" {
    $hpMatches = ([regex]::Matches($htmlContent, 'name="website_hp"')).Count
    return ($hpMatches -eq 4)
}

Run-Test "Seguridad" "Protección anti-tampering de precios en js/cart.js" {
    $cartJs = Get-Content "js/cart.js" -Raw
    $hasVerifyInStorage = $cartJs -match 'sanitizeAndVerifyCartItem'
    $hasCanonicalPrice = $cartJs -match 'price:\s*product\.price'
    $hasBoundQuantity = $cartJs -match 'Math\.min\(99'
    return ($hasVerifyInStorage -and $hasCanonicalPrice -and $hasBoundQuantity)
}

Run-Test "Seguridad" "Protección contra fuerza bruta y rate-limiting en checkout, login y newsletter" {
    $appJs = Get-Content "js/app.js" -Raw
    $hasCheckoutLimit = $appJs -match 'rateLimiter\.check\("checkout"'
    $hasLoginLimit = $appJs -match 'rateLimiter\.check\("auth_login"'
    $hasNewsletterLimit = $appJs -match 'rateLimiter\.check\("newsletter"'
    return ($hasCheckoutLimit -and $hasLoginLimit -and $hasNewsletterLimit)
}

Run-Test "Seguridad" "Configuración de servidor .htaccess con HSTS forzado, bloqueo de .git/.env y Options -Indexes" {
    if (-not (Test-Path ".htaccess")) { return $false }
    $htaccess = Get-Content ".htaccess" -Raw
    $hasHsts = $htaccess -match 'Strict-Transport-Security'
    $hasNoIndex = $htaccess -match 'Options -Indexes'
    $hasBlockFiles = $htaccess -match 'FilesMatch'
    $hasServerSig = $htaccess -match 'ServerSignature Off'
    return ($hasHsts -and $hasNoIndex -and $hasBlockFiles -and $hasServerSig)
}

Run-Test "Seguridad" "Archivo _headers configurado para despliegue en CDN/Edge (Netlify / Cloudflare)" {
    if (-not (Test-Path "_headers")) { return $false }
    $headers = Get-Content "_headers" -Raw
    return ($headers -match 'Strict-Transport-Security' -and $headers -match 'X-Frame-Options: DENY')
}

# ------------------------------------------------------------------------------
# RESUMEN FINAL
# ------------------------------------------------------------------------------
Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host " RESUMEN FINAL DE PRUEBAS" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Total de Pruebas: $totalTests"
Write-Host "  Aprobadas:        $passedTests" -ForegroundColor Green
Write-Host "  Fallidas:         $failedTests" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })

if ($failedTests -eq 0) {
    Write-Host "`n>> TODAS LAS PRUEBAS PASARON EXITOSAMENTE (100% de éxito)." -ForegroundColor Green
} else {
    Write-Host "`n>> ALGUNAS PRUEBAS FALLARON." -ForegroundColor Red
}
