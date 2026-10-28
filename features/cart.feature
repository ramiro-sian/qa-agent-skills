@REQ-002
Feature: Shopping cart
  As a logged-in customer
  I want to add and remove products from my cart
  So that I can review what I am about to buy

  Background:
    Given I am logged in as "qa.user@example.com" with password "Passw0rd!"

  @smoke @AC-002.1
  Scenario: Adding products increases the cart count
    When I add "Trail Backpack" to the cart
    And I add "Water Bottle" to the cart
    Then the cart count is 2

  @regression @AC-002.2
  Scenario: Removing the last product hides the cart count
    Given I have added "Rain Jacket" to the cart
    When I remove "Rain Jacket" from the cart in the catalog
    Then the cart count is hidden

  @smoke @AC-002.3 @AC-002.5
  Scenario: Cart lists the selected products and their total
    Given I have added "Trail Backpack" to the cart
    And I have added "Rain Jacket" to the cart
    When I open the cart
    Then the cart contains "Trail Backpack" priced "$49.99"
    And the cart contains "Rain Jacket" priced "$89.50"
    And the cart total is "$139.49"

  @regression @AC-002.4
  Scenario: Empty cart blocks checkout
    When I open the cart
    Then I see the message "Your cart is empty."
    And checkout is disabled

  @regression @AC-002.5
  Scenario: Cart keeps its items between pages
    Given I have added "Water Bottle" to the cart
    When I open the cart
    And I go back to the catalog
    Then the cart count is 1
