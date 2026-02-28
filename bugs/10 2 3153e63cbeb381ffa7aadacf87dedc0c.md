# 10.2

Actual Result:   1. the first session didn’t affect the inventory
  2. the second session decreases the amount
Expected Result: both work the same and decrease the amount of the product in the inventory
Feature: Calender
Fixed: No
Pre-conditions:   1. add product in inventory
  2. add service that uses this product
Select: Bug
Steps:   1. add 2 appointments for this service
  2. complete the first session in the calendar
  3. complete the second session using End session in sessions
Test Case: end session