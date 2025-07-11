import {getGreeting, getTitle} from '../support/app.po';

describe('konfi-ui-e2e', () => {
  beforeEach(() => cy.visit('/'));

  it('should display title', () => {
    // Custom command example, see `../support/commands.ts` file
    getTitle().contains("Name des Tisches")
  });
});
