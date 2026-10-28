@REQ-001
Feature: Customer login
  As a registered customer
  I want to log in with my email and password
  So that I can browse products and manage my cart

  Background:
    Given I am on the login page

  @smoke @AC-001.1
  Scenario: Customer logs in with valid credentials
    When I log in as "qa.user@example.com" with password "Passw0rd!"
    Then I see the product catalog

  @regression @AC-001.2 @AC-001.3 @AC-001.4
  Scenario Outline: Login is rejected with a clear message
    When I log in as "<email>" with password "<password>"
    Then I see the login error "<message>"
    And I remain on the login page

    Examples:
      | case             | email                   | password  | message                                  |
      | wrong password   | qa.user@example.com     | Wrong123! | Email or password is incorrect.          |
      | unknown email    | nobody@example.com      | Passw0rd! | Email or password is incorrect.          |
      | locked account   | locked.user@example.com | Passw0rd! | This account is locked. Contact support. |
      | missing email    |                         | Passw0rd! | Email is required.                       |
      | missing password | qa.user@example.com     |           | Password is required.                    |

  @regression @AC-001.5
  Scenario: Visitor without a session is sent to the login page
    When I open the product catalog without logging in
    Then I am on the login page
    And I see the notice "Please log in to continue."

  @smoke @AC-001.6
  Scenario: Customer logs out and loses access to the catalog
    Given I am logged in as "qa.user@example.com" with password "Passw0rd!"
    When I log out
    Then I am on the login page
    And I cannot open the product catalog without logging in again
