@portal
Feature: Nossa Senhora Rainha da Paz parish portal
  Visitors and administrators use the public site and admin panel.

  @public
  Scenario: Home page shows main navigation
    Given I am on the home page
    Then I should see the "Avisos" link in the menu
    And I should see the "Notícias" link in the menu

  @public
  Scenario: Public notices listing
    When I navigate to "/avisos"
    Then I should see the text "Avisos" on the page

  @public
  Scenario: Public news listing
    When I navigate to "/noticias"
    Then I should see the text "Notícias" on the page

  @public
  Scenario: Virtual candles page
    When I navigate to "/velas"
    Then I should see the virtual candle intention field

  @public
  Scenario: Saints raffle page
    When I navigate to "/rifas"
    Then I should see the text "Rifa dos Santos" on the page

  @public
  Scenario: Mass schedule page
    When I navigate to "/horarios"
    Then I should see the text "Horários de missa" on the page

  @public
  Scenario: Contact page
    When I navigate to "/contato"
    Then I should see the text "Contato" on the page

  @admin @login
  Scenario: Admin login with invalid credentials
    Given I am on the admin login page
    When I submit invalid admin credentials
    Then I should see a login failure message

  @admin @login
  Scenario: Admin login with valid credentials
    Given I am on the admin login page
    When I submit valid admin credentials
    Then I should be on the admin dashboard

  @admin
  Scenario: Create a parish notice
    Given I am logged in as administrator
    When I create a published parish notice
    Then the notice should appear on the public listing

  @admin
  Scenario: Create a news post
    Given I am logged in as administrator
    When I create a published news post
    Then the news post should appear on the public news page

  @admin
  Scenario: Admin candles management
    Given I am logged in as administrator
    When I open admin "candles" management
    Then I should see the candles admin page

  @admin
  Scenario: Admin raffles management
    Given I am logged in as administrator
    When I open admin "raffles" management
    Then I should see the raffles list in admin

  @admin
  Scenario: Site general information
    Given I am logged in as administrator
    When I open admin "site info" management
    Then I should see the general information form

  @admin
  Scenario: Create a mass location
    Given I am logged in as administrator
    When I create a mass location
    Then the mass location should appear on the schedule page

  @admin
  Scenario: Online rosary in admin
    Given I am logged in as administrator
    When I open admin "online rosary" management
    Then I should see the online rosary schedule form

  @public @candles
  Scenario: Light a virtual candle in free mode
    When I light a virtual candle in free mode
    Then I should see candle success confirmation

  @public @raffles
  Scenario: Bulk purchase on active raffle
    Given I open the page "/rifas"
    When I open the first active raffle if any
    Then I should see bulk name purchase or empty raffles list

  @admin @login
  Scenario: Admin panel logout
    Given I am logged in as administrator
    When I log out from the admin panel
    Then I should see the admin login screen
