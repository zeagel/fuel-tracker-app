// login.spec.js

describe('WHEN user opens landing page of the app', function() {

  it('THEN login page is shown', function() {
    cy.visit('/');
    cy.contains('Kirjaudu');
    cy.contains('Ei tunnusta vielä? Rekisteröidy');
  });

  describe('WHEN login is done with valid credentials', function() {

    it('THEN user is logged in', function() {
      cy.visit('/');
      cy.get('#username').type('tepsukka');
      cy.get('#password').type('tepsukka123?');
      cy.contains('Kirjaudu').click();
      cy.get('#loggedUser').contains('Teppo Testaaja');
    });

    it('AND refuelings page is shown', function() {
      cy.contains('Viimeaikaiset tankkaukset');
    });
  });

  describe('WHEN login is done with invalid credentials', function() {

    it('THEN error message is shown', function() {
      cy.visit('/');
      cy.get('#username').type('tepsukka');
      cy.get('#password').type('invalid-pasword');
      cy.contains('Kirjaudu').click();
      cy.get('.note-header').should('exist');
      cy.contains('Kirjautuminen epäonnistui');
      cy.contains('Virheellinen käyttäjätunnus tai salasana');
    });

    it('AND after awhile the error message is closed', function() {
      cy.wait(3500);
      cy.get('.note-header').should('not.exist');
    });
  });

  describe('WHEN login button is clicked without credentials', function() {

    it('THEN error message is shown', function() {
      cy.visit('/');
      cy.contains('Kirjaudu').click();
      cy.get('.note-header').should('exist');
      cy.contains('Kirjautuminen epäonnistui');
      cy.contains('Virheellinen käyttäjätunnus tai salasana');
    });

    it('AND after awhile the error message is closed', function() {
      cy.wait(3500);
      cy.get('.note-header').should('not.exist');
    });
  });

  describe('WHEN register button is clicked', function() {

    it('THEN registration form is shown', function() {
      cy.visit('/');
      cy.contains('Rekisteröidy').click();
      cy.contains('Rekisteröi käyttäjätunnus');
    });
  });
});