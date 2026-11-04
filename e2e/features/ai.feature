@ai
Feature: Portal quality (AI judge)
  Non-deterministic LLM evaluation — run with npm run test:e2e:ai

  @ai @llm
  Scenario: Home looks like a valid parish site
    Given OPENAI_API_KEY is configured
    When I open the home page for analysis
    And I request an AI judgment of the main content with parish criteria
    Then the AI judge should approve the page

  @ai @contract @simulated
  Scenario: Simulated AI output follows deterministic text rules
    Given I simulate several non-deterministic AI judge responses
    When I validate each response with deterministic text rules
    Then all simulated responses should be accepted
