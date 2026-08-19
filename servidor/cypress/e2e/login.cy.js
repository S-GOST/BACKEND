describe('Prueba E2E de Autenticación - Sistema de gestión de órdenes', () => {
  it('Debe iniciar sesión correctamente y llegar al dashboard (rol administrador)', () => {
    
    // 1. Visitar la página principal
    cy.visit('http://localhost:5173/');

    // 2. Hacer clic en "Iniciar Sesión" (texto exacto visible en la página)
    cy.contains('Iniciar Sesión').click();

    // 3. Validar que la URL actual incluye la ruta de login
    cy.url().should('include', '/login');

    // 4. Ingresar las credenciales de prueba (correo y contraseña existentes)
    cy.get("input[placeholder='Ingresa tu usuario']").type('Admi1');
    cy.get("input[placeholder='Ingresa tu contraseña']").type('Administrador1');

    // 5. Enviar el formulario haciendo clic en el botón de ingreso
    // Busca botón con texto que contenga "ingresar", "iniciar", "entrar" o "login"
    cy.contains('Ingresar al panel').click();

    // 6. Validar la redirección exitosa al dashboard de administrador
    cy.url().should('include', '/admin/dashboard');

    // 7. Mensaje de éxito en la consola de Cypress
    cy.log('✅ Prueba de E2E ejecutada exitosamente');
  });
});