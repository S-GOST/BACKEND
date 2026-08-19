import { Builder, By, until } from 'selenium-webdriver';

(async function tesLogin() {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        await driver.get('http://localhost:5173/login');

        // 1. Esperar y escribir en el campo de usuario (por name o id)
        let campoUsuario = await driver.wait(until.elementLocated(By.name('usuario')), 5000);
        await campoUsuario.sendKeys("Admi1");

        // 2. Esperar y escribir en el campo de contraseña
        let campoPassword = await driver.wait(until.elementLocated(By.id('contrasena')), 5000);
        await campoPassword.sendKeys('Administrador1');

        // 3. Hacer clic en el botón
        let botonSubmit = await driver.wait(until.elementLocated(By.css('button[type="submit"]')), 5000);
        await botonSubmit.click();

        // 4. Esperar redirección al dashboard
        await driver.wait(until.urlContains('/dashboard'), 8000);
        
        console.log('✅ Login OK');

    } catch (err) {
        console.error('❌ Fallo login:', err.message);
        process.exitCode = 1;
    } finally {
        // Pausa opcional de 2 seg antes de cerrar para que alcances a ver la pantalla
        await new Promise(resolve => setTimeout(resolve, 2000));
        await driver.quit();
    }
})();