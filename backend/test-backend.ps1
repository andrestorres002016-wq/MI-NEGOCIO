# ==============================================================================
# ÁBICA — Script de Pruebas Automatizadas de Backend, PostgreSQL y Consola Admin
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$baseUrl = "http://localhost:3000"
$totalTests = 0
$passedTests = 0
$failedTests = 0

function Assert-Test {
    param(
        [string]$Name,
        [scriptblock]$Block
    )
    $global:totalTests++
    try {
        $res = & $Block
        if ($res -eq $true) {
            $global:passedTests++
            Write-Host "  [PASS] $Name" -ForegroundColor Green
        } else {
            $global:failedTests++
            Write-Host "  [FAIL] $Name" -ForegroundColor Red
        }
    } catch {
        $global:failedTests++
        Write-Host "  [ERROR] $Name - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " PRUEBAS DE INTEGRACIÓN: BACKEND + POSTGRESQL + CONSOLA" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Comprobación de Health Check
Assert-Test "Servidor y Health Check responden 200 OK" {
    $resp = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get
    return ($resp.status -eq "ok" -and $resp.database -eq "PostgreSQL Dockerized")
}

# 2. Comprobación de ruta /consola
Assert-Test "Ruta /consola devuelve la página de la Consola Administrativa" {
    $resp = Invoke-WebRequest -Uri "$baseUrl/consola" -Method Get
    return ($resp.StatusCode -eq 200 -and $resp.Content -match "ÁBICA Consola")
}

# 3. Comprobación de catálogo inicial de 18 productos
Assert-Test "Catálogo de productos retorna los 18 muebles desde PostgreSQL" {
    $resp = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Get
    return ($resp.success -eq $true -and $resp.count -eq 18 -and $resp.products.Length -eq 18)
}

# 4. Login de Administrador
$global:adminToken = ""
Assert-Test "Login de Administrador exitoso con credenciales admin@abica.com / admin1234" {
    $body = '{"email":"admin@abica.com","password":"admin1234"}'
    $resp = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $body -ContentType "application/json"
    if ($resp.success -eq $true -and $resp.user.role -eq "ADMIN" -and $resp.token) {
        $global:adminToken = $resp.token
        return $true
    }
    return $false
}

# 5. Estadísticas de Admin (Ruta protegida)
Assert-Test "Ruta protegida /api/admin/stats retorna métricas financieras y de inventario" {
    $headers = @{ Authorization = "Bearer $global:adminToken" }
    $resp = Invoke-RestMethod -Uri "$baseUrl/api/admin/stats" -Method Get -Headers $headers
    return ($resp.success -eq $true -and $resp.stats.financial.totalSales -ge 0 -and $resp.stats.inventory.totalProducts -ge 18)
}

# 6. Creación de Pedido (Checkout)
$global:createdOrderNum = ""
Assert-Test "Creación de nuevo pedido desde tienda guarda en orders y order_items" {
    $orderBody = @"
{
  "customerName": "Prueba Automatizada",
  "customerEmail": "test.tester@abica.com",
  "customerPhone": "3001234567",
  "customerAddress": "Carrera 7 # 72-10, Bogotá",
  "paymentMethod": "Transferencia / PSE",
  "subtotal": 3290000,
  "shippingCost": 0,
  "discount": 0,
  "total": 3290000,
  "items": [
    {
      "productId": 1,
      "productName": "Sofá Modular Malmö",
      "price": 3290000,
      "quantity": 1,
      "color": "Beige Marfil",
      "image": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=200&q=80"
    }
  ]
}
"@

    $resp = Invoke-RestMethod -Uri "$baseUrl/api/orders" -Method Post -Body $orderBody -ContentType "application/json"
    if ($resp.success -eq $true -and $resp.order.orderNumber -match "^AB-") {
        $global:createdOrderNum = $resp.order.orderNumber
        return $true
    }
    return $false
}

# 7. Listado de Órdenes y Actualización de Estado (solo ADMIN)
Assert-Test "Admin consulta pedidos y actualiza estado a 'CONFIRMADO'" {
    $headers = @{ Authorization = "Bearer $global:adminToken" }
    $ordersResp = Invoke-RestMethod -Uri "$baseUrl/api/orders" -Method Get -Headers $headers
    $myOrder = $ordersResp.orders | Where-Object { $_.orderNumber -eq $global:createdOrderNum }
    
    if (-not $myOrder) { return $false }

    $patchBody = '{"status":"CONFIRMADO"}'
    $patchResp = Invoke-RestMethod -Uri "$baseUrl/api/orders/$($myOrder.id)/status" -Method Patch -Body $patchBody -ContentType "application/json" -Headers $headers

    return ($patchResp.success -eq $true -and $patchResp.order.status -eq "CONFIRMADO")
}

# 8. Suscriptor de Newsletter
Assert-Test "Suscripción a newsletter guarda en PostgreSQL sin duplicados" {
    $subBody = '{"email":"cliente.nuevo@ejemplo.com"}'
    $subResp = Invoke-RestMethod -Uri "$baseUrl/api/subscribers" -Method Post -Body $subBody -ContentType "application/json"
    return ($subResp.success -eq $true)
}

# 9. Creación, Edición y Eliminación de un Mueble (CRUD Admin)
Assert-Test "Admin crea nuevo mueble, lo consulta y lo elimina limpiamente" {
    $headers = @{ Authorization = "Bearer $global:adminToken" }
    
    # Crear
    $newProd = @"
{
  "name": "Silla Test Edición Especial",
  "price": 750000,
  "category": "Sillas",
  "material": "Madera de roble",
  "color": "Natural",
  "dimensions": "50 x 50 x 80 cm",
  "image": "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=600&q=80",
  "badge": "Nuevo",
  "inStock": true,
  "stockQuantity": 5
}
"@

    $createResp = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Post -Body $newProd -ContentType "application/json" -Headers $headers
    if (-not $createResp.success) { return $false }
    $testId = $createResp.product.id

    # Eliminar
    $delResp = Invoke-RestMethod -Uri "$baseUrl/api/products/$testId" -Method Delete -Headers $headers
    return ($delResp.success -eq $true)
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " RESULTADOS: $passedTests pasadas de $totalTests pruebas ($([Math]::Round(($passedTests/$totalTests)*100))%)" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })
Write-Host "========================================================`n" -ForegroundColor Cyan

if ($failedTests -gt 0) { exit 1 } else { exit 0 }
