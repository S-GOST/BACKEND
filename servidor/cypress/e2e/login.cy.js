describe('Prueba E2E de Autenticación - SGOST', () => {
  it('Debe iniciar sesión correctamente con el usuario Administrador y redirigir al panel', () => {
    // 1. Visitar la página de login
    cy.visit('http://localhost:5173/login');

    // 2. Verificar que estamos en la URL de login
    cy.url().should('include', '/login');

    // 3. Ingresar las credenciales de prueba solicitadas
    cy.get("input[placeholder='EMAIL']").type('Admi1');
    cy.get("input[placeholder='CONTRASEÑA']").type('Administrador1');

    // 4. Enviar el formulario
    cy.get('button').contains('INGRESAR').click();

    // 5. Validar la redirección exitosa al panel
    cy.url().should('include', '/home');

    // 6. Mensaje de confirmación en la consola de Cypress
    cy.log('Prueba E2E ejecutada exitosamente');
  });
});