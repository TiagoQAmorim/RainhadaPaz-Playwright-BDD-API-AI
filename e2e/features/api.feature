@api
Feature: Portal HTTP APIs
  Gherkin examples for JSON endpoints (Playwright request).

  @api @login
  Scenario: Admin login API rejects invalid credentials
    When I POST to "/api/admin/login" with JSON:
      """
      {"email":"invalid@e2e.local","password":"wrong"}
      """
    Then the HTTP response status should be 401
    And the JSON body should contain the key "error"

  @api
  Scenario: Bulk-resolve API requires names
    Given an active raffle exists or I use a placeholder slug
    When I POST to the raffle bulk-resolve API with JSON:
      """
      {}
      """
    Then the HTTP response status should be 400 or 404
