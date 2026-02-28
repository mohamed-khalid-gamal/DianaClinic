
====================
0 3153e63cbeb38178bc8cdeb171efd878.md
====================
# 0

Actual Result: All links navigates to the Dashboard page
Expected Result: Each link navigates to it’s module
Feature: User Manual
Fixed: No
Retest: not all links work
edit: just num 15 doesn’t work
Select: Bug
Steps: Click all links
Test Case: Table of content links
====================
1 1 3153e63cbeb381d4b460fdc7d8f0f913.md
====================
# 1.1

Actual Result: validation error
Expected Result: validation error
Feature: Add patient
Fixed: No
Select: Pass
Steps: enter part of the data
Test Case: submit partial data
====================
1 2 3153e63cbeb381299838ddd1736b8250.md
====================
# 1.2

Actual Result: added patient
Expected Result: validation error
Feature: Add patient
Fixed: Yes
Select: Fixed
Steps: 1. int in name field
2. just int in email field
3. string in phone field
Test Case: Wrong data types
====================
1 3153e63cbeb381c2bda6d82c8ba023cd.md
====================
# 1

Actual Result: validation error
Expected Result: validation error
Feature: Add patient
Fixed: No
Select: Pass
Steps: click submit
Test Case: submit with no data
====================
10 1 3153e63cbeb381c994cffdaf5b0d5f12.md
====================
# 10.1

Actual Result: navigates to today’s appointment only
Expected Result: navigate to the appointment day in Appointments
Feature: Calender
Fixed: No
Pre-conditions: booked appointment
Select: Bug
Steps: 1. select appointment from calendar in upcoming date
2. click “View in Appointments”
Test Case: navigate to appointment
====================
10 2 3153e63cbeb381ffa7aadacf87dedc0c.md
====================
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
====================
10 3153e63cbeb3817eb388c08f8f2e184e.md
====================
# 10

Actual Result: 1. in calendar : just from 7AM to 9PM appears.
2. in appointments : just from 8AM to 8:30PM appears.
Expected Result: all appointments appear
Feature: Calendar
Fixed: No
Pre-conditions: add appointments
Select: Bug
Steps: 1. add appointments in too early or too late time
2. review the appointments in the calendar (day, week) and in appointments (day) sections
Test Case: review booked appointments
====================
11 3153e63cbeb38145be17c0a9636eede7.md
====================
# 11

Actual Result: service can be booked
Expected Result: service isn’t offered for booking
Feature: Service 
Fixed: No
Pre-conditions: add service category
Select: Bug
Steps: 1. add service with inactive status
2. book the service
Test Case: inactive service
====================
12 1 3153e63cbeb3813e8454d774ac012080.md
====================
# 12.1

Actual Result: pays with no limit until the bell become negative
Attachments: image%2010.png
Expected Result: reject payment and warning message
Feature: Billing
Fixed: Yes
Pre-conditions: complete session
Select: Fixed
Steps: 1. generate invoice
2. add money more than the bell
Test Case: Pay session
====================
12 2 3153e63cbeb3817bb8a1dddab561da7b.md
====================
# 12.2

Actual Result: considers the fixed price base and adds to it the other method price as extra charge
Attachments: image%2011.png
Expected Result: calculate  the price based on the new method
Feature: Billing
Fixed: No
Pre-conditions: add service with multiple price methods
Select: Bug
Steps: 1. add session of this service
2. end session
3. specify price method other than the fixed 
Test Case: multiple price methods
====================
12 3153e63cbeb3812b90a6cf2dc641ac6b.md
====================
# 12

Actual Result: message “Enter a valid payment method and amount” hides the other payments and this part is hard to scroll
Attachments: image%209.png
Expected Result: invalid payment amount with ability to scroll throw the other payments
Feature: Billing
Fixed: No
Pre-conditions: complete session
Select: Bug
Steps: 1. generate invoice
2. add part of the bell
3. add zero
Test Case: Pay session
====================
13 1 3153e63cbeb381b0b530d237a50f89f3.md
====================
# 13.1

Actual Result: they all appear but you can only apply one of them
Expected Result: ability to apply more than one offer on the patient
Feature: Offers
Fixed: No
Pre-conditions: complete session
Select: Bug
Steps: add more than one offer
Test Case: apply more than one offer
====================
13 10 3153e63cbeb381f4a64ed249b31b96b5.md
====================
# 13.10

Actual Result: the offer doesn’t appear at all
Attachments: Screenshot_2026-02-28_020055.png
Expected Result: appears if just one of them exists
Feature: Offers
Fixed: No
Pre-conditions: add more than one service
Select: Bug
Steps: 1. make an offer with Must Include Services constraint from Rules section
2. make the logic exact match one
3. add more than one service or category 
4. end session of one of the services
5. pay the bill
Test Case: exact one in Must Include Services constraint
====================
13 11 3153e63cbeb3814c8a8ae8134265a7af.md
====================
# 13.11

Actual Result: the offer doesn’t appear at all
Attachments: image%2013.png
Expected Result: appears if all specified categories exist
Feature: Offers
Fixed: No
Pre-conditions: add more than one service
Select: Bug
Steps: 1. make an offer with Must Include Services constraint from Rules section
2. make the logic match all
3. add a service and it’s category 
4. end session of that service
5. pay the bill
Test Case: match all in Must Include Services constraint
====================
13 12 3153e63cbeb3813c86b1e3dd6fa53f34.md
====================
# 13.12

Actual Result: appears to all patients
Attachments: image%2014.png
Expected Result: appears to new patients only
Feature: Offers
Fixed: No
Select: Bug
Steps: make an offer with new patients only constraint
Test Case: new patients
====================
13 12 3153e63cbeb38194b88ef87a9fbda986.md
====================
# 13.12

Actual Result: numerical comparison and option “contains” is not useful
Attachments: image%2015.png
Expected Result: male or female
Feature: Offers
Fixed: No
Select: Bug
Steps: make an offer and specify any categorical attribute like gender in patient attributes
Test Case: patient attributes
====================
13 2 3153e63cbeb381f08728d010098df4e9.md
====================
# 13.2

Actual Result: threw an exception when saving the offer
Attachments: Screenshot_2026-02-24_003825.png
Expected Result: error message or invalid input warning
Feature: Offers
Fixed: No
Select: Bug
Steps:   1. add an offer
  2. enter in priority a float
Test Case: priority entry
====================
13 3 3153e63cbeb381fb9f2de6379ab80ad4.md
====================
# 13.3

Actual Result: the priority doesn’t affect, it will choose the one that makes the bill value lower
Expected Result: the offer with higher priority applyes
Feature: Offers
Fixed: No
Pre-conditions:   1. complete session
Select: Bug
Steps:   1. add 2 offers with different discount values
  2. make them cannot combine
  3. set higher priority to the offer with lowest discount value 
Test Case: priority functionality
====================
13 3153e63cbeb3817d857bfeea62a9d779.md
====================
# 13

Actual Result: the offer disappears from the first session, and after reactivating the offer it appeared in all bells
Expected Result: the bell that have been generated still has the offer but the new one not
Feature: Offers
Fixed: No
Select: Bug
Steps: 1. add offer
2. complete session
3. inactivate the offer
4. complete another session
5. activate the offer
Test Case: inactivate offer
====================
13 4 3153e63cbeb38154b53cc255d10b216c.md
====================
# 13.4

Actual Result: when we used the credit in “End session” the credits decremented and became zero, when we try to use it again in the billing it refuses as the credits zero (that means it uses it twice in the end session and in the billing)
Attachments: Screenshot_2026-02-27_133705.png, Screenshot_2026-02-27_133722.png
Expected Result: pay the bill which is zero
Feature: Offers
Fixed: No
Pre-conditions:   1. patient buys package with one session of a service
Select: Bug
Steps:   1. complete a session of this service using “End session” not in the appointments
  2. pay for the session
Test Case: use last credit
====================
13 5 3153e63cbeb3819c8013d7011d6c7bd2.md
====================
# 13.5

Actual Result: it makes the package and the error doesn’t appear until a patient buys it
Attachments: image%2012.png
Expected Result: a warning appears that you can’t make a package without a service
Feature: Offers
Fixed: No
Steps:   1. make package and don’t specify service type
  2. make a patient buy this package
Test Case: make package without specify service type
====================
13 6 3153e63cbeb381deb670e0997a4ab28e.md
====================
# 13.6

Actual Result: refuses to use credit in End session but uses any type of credit when paying the bill
Expected Result: refuses to use credit as the payment method is different
Feature: Offers
Fixed: No
Pre-conditions:   1. add service with specific payment method (like fixed price)
  2. add package includes the same service but with different type (like pulse)
Select: Bug
Steps:   1. make patient buy this package
  2. add appointment to that service
  3. end the session by End session 
  4. pay the bill
Test Case: package service type
====================
13 7 3153e63cbeb381c8b404cbb2ee2bde57.md
====================
# 13.7

Actual Result: the offer doesn’t appear unless the tow time slots are the same
Expected Result: appears in one of the time slots or both
Feature: Offers
Fixed: No
Select: Bug
Steps:   1. make an offer with date constraint from Setup and Rules sections
  2. end session in this time slot 
Test Case: date constraint
====================
13 8 3153e63cbeb38199b18dcdc7409c7cf6.md
====================
# 13.8

Actual Result: the offer doesn’t appear at all
Expected Result: appears in this time slot
Feature: Offers
Fixed: No
Select: Bug
Steps:   1. make an offer with time of day constraint from Rules section
  2. end session of this time slot 
Test Case: time of day constraint
====================
13 9 3153e63cbeb381478997e5d08ef0a839.md
====================
# 13.9

Actual Result: the offer doesn’t appear unless the day is Saturday appears on all days (don’t know if today is Saturday related or not)
Expected Result: appears just in these days
Feature: Offers
Fixed: No
Select: Bug
Steps:   1. make an offer with day of the week constraint from Rules section
  2. end session in one of the days
Test Case: days of the week constraint
====================
14 3153e63cbeb381a990b6c8d5982be5a8.md
====================
# 14

Actual Result: doesn’t add the package cost revenue
Expected Result: adds package cost to the total revenue
Feature: Report
Fixed: No
Pre-conditions:   1. add package
  2. add patient
Select: Bug
Steps: make the patient pay for a package
Test Case: buy package revenue
====================
3 1 3153e63cbeb381c59e72f552e8ffb1db.md
====================
# 3.1

Actual Result: update patient data in patient record and not in patient profile card
Attachments: image%201.png
Expected Result: update patient data in patient record and patient profile card
Feature: Update patient data
Fixed: Yes
Pre-conditions: add patient
Select: Fixed
Steps: 1. click on patient record
2. click Edit Profile button
3. edit data “like number”
Test Case: update data from patient profile card
====================
3 2 3153e63cbeb38124a0f2ddd5604053cc.md
====================
# 3.2

Actual Result: it does nothing with this information
Expected Result: using payment method input or saving it as it’s an imprortant info
Feature: Patients
Fixed: No
Pre-conditions:   1. add patient
  2. add package
Select: not a bug
Steps:   1. buy package
  2. choose payment method
Test Case: buy a package
====================
3 3153e63cbeb38196ab65f502a3073eb9.md
====================
# 3

Actual Result: update patient data
Expected Result: update patient data
Feature: Update patient data
Fixed: No
Pre-conditions: add patient
Select: Pass
Steps: 1. click pen icon in patient record
2. edit data
Test Case: update data from pen icon
====================
4 3153e63cbeb381698c55eb766a7f3d53.md
====================
# 4

Actual Result: delete patient
Expected Result: delete patient
Feature: Delete patient
Fixed: No
Pre-conditions: add patient
Select: Pass
Steps: click bin icon in patient record then delete
Test Case: delete patient
====================
5 3153e63cbeb381d5b43eee7c4910f0ba.md
====================
# 5

Actual Result: add item without even adding it to expiring soon list
Expected Result: reject to add the item
Feature: Inventory
Fixed: Yes
Pre-conditions: 1. add category
2. add item
Select: Fixed
Steps: set expiration date with old date or today
Test Case: expiration date
====================
6 3153e63cbeb381948ca1cedd188c78a1.md
====================
# 6

Actual Result: no items in the list 
Attachments: image%202.png
Expected Result: select item
Feature: Service
Fixed: Yes
Pre-conditions: add item to pharmacy
Select: Fixed
Steps: select item in consumable used
Test Case: add service
====================
7 3153e63cbeb3811ca4f7eedbecf68b7b.md
====================
# 7

Actual Result: still zero
Attachments: image%203.png
Expected Result: Maintenance Due counter increment
Feature: Devices
Fixed: Yes
Select: Fixed
Steps: 1. add device
2. set status maintenance
Test Case: maintenance devices
====================
8 3153e63cbeb381af8efbf1b1b912ff8a.md
====================
# 8

Actual Result: laser and facial types are not in the list and storage type should not be in the list
Attachments: image%204.png
Expected Result: select room type
Feature: Room
Fixed: Yes
Select: Fixed
Steps: 1. add room
2. select laser or facial for room type
Test Case: add room
====================
9 1 3153e63cbeb381eeab35f0510d6a4e80.md
====================
# 9.1

Actual Result: 1. the available slots is not the doctors available slots “can’t even catch the pattern”
2. after selecting the time slot it have been booked 2 hours early
Expected Result: scheduled in the same time we selected when we added the appointment
Feature: Appointment
Fixed: Yes
Pre-conditions: add appointment
Select: Fixed
Steps: 1. add appointment in a specific time
2. review the appointment time
Test Case: review appointment time
====================
9 2 3153e63cbeb381e2ad89e2c724e47261.md
====================
# 9.2

Actual Result: skin type and some important fields are missing (you can find them at add patient form)
Attachments: image%206.png, image%207.png
Expected Result: all required info 
Feature: Appointment
Fixed: No
Select: not a bug
Steps: 1. add appointment
2. enter new patient info
Test Case: adding new patient in appointment
====================
9 3 3153e63cbeb381bb973ec0c3ee2206e6.md
====================
# 9.3

Actual Result: it accepts any thing and at the end appears unknown error
Attachments: image%208.png
Expected Result: error message valid email required
Feature: Appointment
Fixed: No
Select: Bug
Steps: 1. add appointment
2. enter invalid email
Test Case: adding new patient in appointment
====================
9 3153e63cbeb381ab9e31eaf23212daa2.md
====================
# 9

Actual Result: reject booking but adds the patient every time we try a booked slot
Attachments: image%205.png
Expected Result: reject booking and don’t add the patient
Feature: Appointment
Fixed: Yes
Pre-conditions: 1. add service
2. add room
3. add doctor
Select: Fixed
Steps: 1. add appointment to a new patient
2. try already booked time slots and confirm
Test Case: add appointment to new patient
====================
9 4 3153e63cbeb381d3a780cc3d4320f1ae.md
====================
# 9.4

Actual Result: the slots depends only on the doctors and rooms availability not the user (the user doesn’t know the duration of the session)
Expected Result: not offering unavailable slots for the same patient (not only available from the doctors and rooms perspective) 
Feature: Appointment
Fixed: No
Pre-conditions: 1. add multiple doctors
2. add multiple rooms
3. add multiple services
Select: Bug
Steps: 1. add appointment for patient
2. select multiple services
3. select first service that takes more than 30min
4. select second service after the first one by 30min (sessions time will overlap)
Test Case: adding multiple appointments in the same time for the same patient
====================
9 5 3153e63cbeb381949d49cd9e0b48a452.md
====================
# 9.5

Actual Result: slots isn’t available
Expected Result: slots is available
Feature: Appointment
Fixed: No
Pre-conditions: 1. completed session
2. billed session
Select: Bug
Steps: add new appointment in there slots
Test Case: adding appointment in time slot with status “completed” or “billed”
====================
Testing 3153e63cbeb381b4bc1ed93b56d8e09f.md
====================
# Testing

[Test Cases](Test%20Cases%203153e63cbeb381ebb60ecbac3ea70923.csv)

## User Experience Notes:

- [ ]  when opening any dialog disable the background, as it keeps closing the dialog by mistake (especially when selecting text).
- [x]  reject adding an item to the inventory with old or today’s date in expiration date.
- [x]  don’t offer time slots that is already booked when adding an appointment.
- [ ]  when booking more than one session it verifies the time availability at the end, if you offered just the available it will be solved.
- [ ]  make option to pay part of the bell and keep it in pending.
- [ ]  after clicking no show icon add option to cancel it as it can be click by mistake (there is only options book another appointment or not).
- [ ]  set restrictions on time slots of the doctors or make the calendar and appointments view the 24 hours, as the user can add appointment in late time hour and doesn’t appear in the calendar (solves 10).
- [ ]  in the billing make not “using any offer” a choice.
- [ ]  if a patient completes a session for a service during an offer’s time interval, then he should take the offer even if he paid after the expiration time, and if a patient completes a session before an offer added he shouldn’t take the offer (if that’s right according to the business).
- [ ]  when completing an appointment from Appointment’s calendar navigate to “End session” window, that will prevent many conflicts from happening.
- [ ]  offer the type of service when making a package based on the available payment method in that service.
- [ ]  remove date constraint from rules section.
- [ ]  I see that cart property option isn’t useful in our case as there is no cart, each service being paid separately or in package.

![image.png](image.png)