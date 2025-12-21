import { chromium } from 'playwright';

(async () => {
  const url = process.env.URL || 'http://localhost:5175/admin/articles/new';
  console.log('Iniciando Playwright repro en:', url);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => {
    console.log('[page]', msg.type(), msg.text());
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    console.log('Página cargada');

    // Rellenar campos básicos
    await page.fill('input[placeholder="Título del artículo"], input[type=text]', 'Prueba automatizada');
    await page.fill('textarea', 'Contenido de prueba desde Playwright.');
    // Seleccionar primera categoría si existe
    const hasSelect = await page.$('select');
    if (hasSelect) {
      const firstOption = await page.$('select option:nth-child(2)');
      if (firstOption) {
        const val = await firstOption.getAttribute('value');
        if (val) await page.selectOption('select', val);
      }
    }

    // Esperar un momento
    await page.waitForTimeout(800);

    // Simular cambiar a otra pestaña: disparar visibilitychange hidden
    await page.evaluate(() => {
      try {
        Object.defineProperty(document, 'visibilityState', { get: () => 'hidden', configurable: true });
      } catch (e) {}
      document.dispatchEvent(new Event('visibilitychange'));
    });
    console.log('Simulado visibility hidden');
    await page.waitForTimeout(800);

    // Volver a visible
    await page.evaluate(() => {
      try {
        Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
      } catch (e) {}
      document.dispatchEvent(new Event('visibilitychange'));
    });
    console.log('Simulado visibility visible');
    await page.waitForTimeout(800);

    // Pulsar Forzar sesión y guardar si existe
    const forceBtn = await page.$('button:has-text("Forzar sesión y guardar"), button:has-text("Forzar sesión")');
    if (forceBtn) {
      console.log('Pulsando Forzar sesión y guardar');
      await forceBtn.click();
      await page.waitForTimeout(1200);
    }

    // Pulsar Publicar/Actualizar
    const submitBtn = await page.$('button:has-text("Publicar"), button:has-text("Actualizar"), button:has-text("Guardar borrador")');
    if (submitBtn) {
      console.log('Pulsando botón de publicar/guardar');
      await submitBtn.click();
    } else {
      console.log('No se encontró botón de publicar');
    }

    await page.waitForTimeout(2000);
    console.log('Finalizado flujo de prueba');
  } catch (err) {
    console.error('Error en prueba:', err);
  } finally {
    await browser.close();
  }
})();
