# Merve Aesthetics Management System
## User Manual v1.0

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Dashboard](#3-dashboard)
4. [Patient Management](#4-patient-management)
5. [Appointments](#5-appointments)
6. [Sessions](#6-sessions)
7. [Calendar](#7-calendar)
8. [Doctors](#8-doctors)
9. [Rooms](#9-rooms)
10. [Devices](#10-devices)
11. [Inventory](#11-inventory)
12. [Services](#12-services)
13. [Offers & Packages](#13-offers--packages)
14. [Billing](#14-billing)
15. [Wallet & Credits System](#15-wallet--credits-system)
16. [Quick Reference](#16-quick-reference)

---

## 1. Introduction

**Merve Aesthetics Management System** is a comprehensive solution designed specifically for cosmetic and dermatology clinics. It provides end-to-end management of patients, appointments, sessions, billing, inventory, and more.

### Key Features

- **Patient Management**: Complete patient profiles with medical history, skin type, allergies, and contraindications
- **Appointment Scheduling**: Multi-step booking wizard with doctor/room assignment
- **Package & Credit System**: Sell packages with session/pulse credits that patients can redeem
- **Session Management**: Real-time session tracking with device usage and consumables
- **Device Tracking**: Monitor laser devices with pulse counters and maintenance schedules
- **Inventory Management**: Track consumables, drugs, and retail products
- **Billing & Invoicing**: Generate invoices with offer/discount support
- **Calendar Views**: Comprehensive scheduling views by room, doctor, or patient
- **Offers Engine**: Create flexible discounts, packages, and promotional offers

---

## 2. Getting Started

### Navigation

The main navigation sidebar on the left provides access to all modules:

| Icon | Module | Description |
|------|--------|-------------|
| 📊 | Dashboard | Overview and quick actions |
| 👥 | Patients | Patient records and profiles |
| 📅 | Appointments | Schedule and manage appointments |
| ▶️ | Sessions | Active treatment sessions |
| 📆 | Calendar | Visual schedule views |
| 👨‍⚕️ | Doctors | Doctor management |
| 🚪 | Rooms | Room configuration |
| 🔌 | Devices | Device tracking |
| 📦 | Inventory | Stock management |
| 💆 | Services | Treatment catalog |
| 🏷️ | Offers | Discounts and packages |
| 💰 | Billing | Invoicing and payments |

### Mobile Support

On mobile devices, tap the hamburger menu (☰) to access the navigation sidebar.

---

## 3. Dashboard

The Dashboard provides a real-time overview of your clinic's operations.

### Key Performance Indicators (KPIs)

- **Today's Appointments**: Number of appointments scheduled for today
- **Total Patients**: Total registered patients in the system
- **Rooms in Use**: Currently occupied rooms vs. total available
- **Pending Alerts**: Unread notifications requiring attention

### Today's Schedule

View all appointments for the current day with:
- Time slot
- Patient information
- Assigned doctor and room
- Appointment status (color-coded)
- Quick check-in action

### Alerts & Notifications

The system generates automatic alerts for:
- **Low Stock**: Inventory items below reorder threshold
- **Expiring Items**: Products expiring within 30 days
- **Device Maintenance**: Devices nearing maintenance threshold
- **Credit Expiry**: Patient credits about to expire

### Quick Actions

- **New Appointment**: Quickly book a new appointment
- **Open Calendar**: Access the full calendar view
- **Add Patient**: Register a new patient
- **Check Inventory**: View stock status
- **Create Invoice**: Start a new invoice

---

## 4. Patient Management

### Patient List

The Patients module displays all registered patients in a searchable, sortable table:

| Column | Description |
|--------|-------------|
| Name | Full name (clickable for profile) |
| Phone | Contact number |
| Age | Calculated from date of birth |
| Gender | Male/Female |
| Skin Type | Fitzpatrick scale (1-6) |
| Last Visit | Most recent appointment |

### Adding a New Patient

1. Click **"+ Add Patient"** button
2. Fill in required fields:
   - First Name, Last Name
   - Phone number
   - Date of Birth
   - Gender
3. Optional medical information:
   - Skin Type (Fitzpatrick 1-6)
   - Allergies
   - Chronic Conditions
   - Contraindications
   - Notes
4. Click **"Save"**

### Patient Profile

Click on any patient name to view their complete profile:

#### Profile Header
- Avatar with initials
- Contact information (phone, email)
- Date of birth and gender
- Wallet summary (cash balance, credits remaining)

#### Stat Cards
- Next upcoming appointment
- Last visit date
- Active credits count
- Pending bills (if any)

#### Pending Bills Alert
If the patient has pending package purchases, a prominent alert displays with **"Pay Now"** buttons.

#### Profile Tabs

**Overview Tab**
- Upcoming appointments list
- Recent activity/transactions

**Packages & Credits Tab**
- List of all active service credits
- Progress bars showing remaining vs. total units
- Expiration dates
- **"+ Buy Package"** button

**Appointments Tab**
- Complete appointment history table
- Date, services, and status

**Calendar Tab**
- Visual calendar showing patient's appointment history
- Day, week, month, and list views

**Transactions Tab**
- Complete financial history
- Payments, refunds, credit purchases, credit usage

### Wallet Top-Up

1. Open patient profile
2. Click **"Top Up"** or access via wallet section
3. Enter amount
4. Confirm to add cash balance

---

## 5. Appointments

### Calendar View

The Appointments page displays a daily/weekly schedule with:
- Time slots from 8 AM to 8 PM (30-minute increments)
- Appointments color-coded by status
- Day/Week view toggle
- Date navigation

### Appointment Statuses & Workflow

| Status | Color | Description | Actions / Controls |
|--------|-------|-------------|----------|
| **Scheduled** | Blue | Confirmed future appointment | Switch to **Checked-In**, **Cancelled**, or **No-Show** |
| **Checked-In** | Amber | Patient has arrived | Switch to **In Progress** or **Cancelled** |
| **In Progress** | Purple | Session is active | Switch to **Completed** |
| **Completed** | Green | Treatment finished | Ready for **Billing** |
| **Billed** | Gray | Invoice generated | (Final State) |
| **Cancelled** | Red | Appointment cancelled | (Final State) |
| **No-Show** | Orange | Patient didn't attend | (Final State) |

#### How to Switch Statuses

The status is controlled via action buttons on the **Appointments** and **Sessions** pages:

1. **Check-In**: On the Appointments page, click the **Check-In** button on the appointment card when the patient arrives.
2. **Start Session**: Once the patient is ready for treatment, click **Start Session**. This activates the session timer and clinical tracking.
3. **Complete**: When treatment is finished, click **Complete**. This stops the session and marks it ready for payment.
4. **Billing**: Go to the **Billing** module. Completed appointments will appear in the "Pending Billing" list. Generate and pay the invoice to move the status to **Billed**.
5. **Cancel**: Use the (X) icon on the appointment card for patients who cancel.
6. **No-Show**: Use the (User-Slash) icon when a patient doesn't attend. The system will prompt you to reschedule.

### Rescheduling No-Show Appointments

When you mark an appointment as **No-Show**, the system automatically offers to reschedule:

1. Click the **No-Show** icon on the appointment card
2. A confirmation dialog appears asking "Would you like to schedule a new appointment?"
3. Click **"Yes, Reschedule"** to open the Reschedule Modal
4. The modal shows:
   - **Patient Name** and **Services** from the original appointment
   - **Date Picker** to select a new date
   - **Available Time Slots** grid filtered by doctor/room availability
   - **Doctor** and **Room** dropdowns for the selected slot
5. Select your preferred date, time, doctor, and room
6. Click **"Confirm Reschedule"**
7. A new appointment is created with the same patient and services, marked as "Rescheduled from no-show"

### Booking an Appointment (7-Step Wizard)

1. **Patient**: Select existing or create new.
2. **Credits**: Use available session credits from the wallet.
3. **Services**: Choose treatments.
4. **Group**: Organize into sessions.
5. **Schedule**: Set date, time, doctor, and room.
6. **Offers**: Apply discounts or promotions.
7. **Confirm**: Review and finalize.

---

## 6. Sessions

### Overview

The Sessions module manages active treatment sessions - appointments that are currently in progress.

### Active Sessions View

Displays cards for each active session showing:
- Patient name and initials avatar
- Assigned doctor
- Room location
- Services being performed
- Elapsed time (auto-updating)
- Progress indicator

### Starting a Session

1. From Appointments, find a "Checked-In" appointment
2. Click **"Start Session"**
3. Session appears in the Sessions module

### Managing an Active Session

Click on an active session card to:
- View full session details
- Add notes
- Track consumables used
- Monitor device usage

### Ending a Session

1. Click **"End Session"** on the session card
2. **End Session Modal** appears with tracking fields:

#### Credits Used
- Table showing allocated credits from booking
- Adjust actual units used (can differ from allocated)
- Overage automatically creates extra charges

#### Device Usage
- Add device usage records
- Select device from room's available devices
- Enter units used (pulses, minutes, etc.)
- Updates device counter automatically

#### Consumables Used
- Add inventory items consumed
- Select from available consumables
- Enter quantity used
- Deducts from inventory

#### Extra Charges
- Add any additional charges
- Description and amount
- Applied to final invoice

3. Click **"Complete Session"**
4. Session ends, appointment status updates to "Completed"
5. Extra charges flow to Billing

---

## 7. Calendar

### Overview

The Calendar module provides comprehensive visual scheduling with multiple view types and filtering options.

### View Types

- **Month**: Monthly overview with appointment dots
- **Week**: Detailed weekly time grid
- **Day**: Single day with time slots
- **List**: Agenda-style list view

### Filter Tabs

#### All Appointments
Shows complete clinic schedule across all resources.

#### By Room
1. Click **"By Room"** tab
2. Select a room card from the grid
3. Calendar filters to show only that room's schedule
4. Useful for room utilization planning

#### By Doctor
1. Click **"By Doctor"** tab
2. Select a doctor card from the grid
3. View doctor's complete schedule
4. Plan doctor availability

#### By Patient
1. Click **"By Patient"** tab
2. Search for patient by name or phone
3. Select from search results
4. View patient's appointment history and upcoming visits

### Event Details

Click on any calendar event to view:
- Appointment status badge
- Patient name
- Doctor name
- Room
- Start and end time
- Services included
- Quick links to Appointments and Billing

### Status Legend

Color-coded legend at top of calendar:
- Scheduled (Blue)
- Confirmed (Green)
- In Progress (Purple)
- Completed (Emerald)
- Cancelled (Red)
- No-Show (Orange)

---

## 8. Doctors

### Doctor List

Displays all doctors with:
- Name
- Specialty
- Phone and email
- Active/Inactive status

### Adding a Doctor

1. Click **"+ Add Doctor"**
2. Enter details:
   - Name
   - Specialty (e.g., Dermatologist, Plastic Surgeon)
   - Phone number
   - Email (optional)
   - Active status toggle
3. Configure working hours:
   - Add shifts by day of week
   - Set start and end times
   - Optionally assign to specific room
4. Click **"Save"**

### Working Hours Configuration

Each doctor can have multiple shifts:

| Day | Start Time | End Time | Room |
|-----|------------|----------|------|
| Monday | 09:00 | 17:00 | Room 1 |
| Tuesday | 09:00 | 17:00 | Room 2 |
| Thursday | 14:00 | 20:00 | Room 1 |

The system uses this for availability checking during booking.

### Editing a Doctor

1. Click on doctor row or edit button
2. Modify information
3. Add/remove shifts
4. Save changes

---

## 9. Rooms

### Room List

Displays all clinic rooms with:
- Room name
- Type (Treatment, Consultation, Surgery, Storage)
- Floor location
- Capacity
- Status (Available/Unavailable)

### Room Types

| Type | Use Case |
|------|----------|
| Treatment | Laser, facial, body treatments |
| Consultation | Initial consultations, follow-ups |
| Surgery | Minor surgical procedures |
| Storage | Inventory and equipment storage |

### Adding a Room

1. Click **"+ Add Room"**
2. Enter:
   - Room name
   - Type
   - Floor (optional)
   - Capacity
   - Equipment list (optional)
   - Active status
3. Click **"Save"**

### Room Assignment

Rooms are assigned during:
- Doctor working hours configuration
- Appointment booking
- Device placement

---

## 10. Devices

### Overview

The Devices module tracks medical equipment, particularly laser and pulse-based devices that require counter monitoring.

### Device List

Displays device cards showing:
- Device name and model
- Serial number
- Current counter value
- Maintenance threshold progress
- Assigned room
- Status indicator

### Device Statuses

| Status | Description |
|--------|-------------|
| Active | Normal operation |
| Maintenance | Under maintenance |
| Inactive | Not in use |

### Counter Types

| Type | Use Case |
|------|----------|
| Pulse | Laser devices counting pulses |
| Session | Devices counting sessions/uses |
| Time | Equipment tracking usage minutes |

### Adding a Device

1. Click **"+ Add Device"**
2. Enter details:
   - Name
   - Model
   - Serial number
   - Counter type
   - Current counter value
   - Maintenance threshold
   - Lamp lifetime (for laser devices)
   - Purchase date
   - Assigned room
3. Click **"Save"**

### Logging Usage

1. Click **"Log Usage"** on device card
2. Enter counter start and end values
3. Add notes if needed
4. Click **"Save"**

Counter updates automatically during session end as well.

### Maintenance Alerts

When a device's counter approaches the maintenance threshold:
- Warning indicator appears on card
- Alert generated on Dashboard
- Status can be changed to "Maintenance"

---

## 11. Inventory

### Overview

Manage all clinic consumables, drugs, retail products, and equipment.

### Inventory Table

| Column | Description |
|--------|-------------|
| Product Name | Item description |
| SKU | Stock keeping unit code |
| Category | Drug, Consumable, Retail, Equipment |
| Qty | Current stock level |
| Cost | Purchase price |
| Price | Selling price |
| Expiry | Expiration date |
| Status | Stock status indicator |

### Stock Statuses

| Status | Condition |
|--------|-----------|
| In Stock | Quantity above reorder threshold |
| Low Stock | Quantity at or below reorder threshold |
| Out of Stock | Zero quantity |
| Expiring | Expires within 30 days |

### Filter Options

- **All Items**: Complete inventory
- **Low Stock**: Items needing reorder
- **Expiring**: Soon-to-expire items
- **By Category**: Drug, Consumable, Retail, Equipment

### Adding an Item

1. Click **"+ Add Item"**
2. Enter:
   - Name and SKU
   - Category
   - Current quantity
   - Unit (pcs, ml, box, etc.)
   - Cost price
   - Selling price
   - Reorder threshold
   - Expiry date (optional)
   - Batch number
   - Supplier
   - Storage location
3. Click **"Save"**

### Stock Adjustments

Items are automatically deducted when:
- Used as consumables during sessions
- Sold as retail products
- Manual adjustment via edit

---

## 12. Services

### Overview

Define the treatments and procedures your clinic offers with flexible pricing models.

### Service Catalog

Services are organized by category with:
- Service name
- Duration (minutes)
- Pricing display
- Active/Inactive status

### Pricing Models

#### Fixed Price
Simple flat fee per session.
- Example: Consultation - EGP 500

#### Pulse-Based
Base fee plus per-pulse charge.
- Example: Laser Hair Removal
- Base: EGP 200 + EGP 5/pulse

#### Area-Based
Different prices for different treatment areas.
- Example: Botox
- Forehead: EGP 1,500
- Crow's Feet: EGP 1,200
- Full Face: EGP 4,000

#### Time-Based
Charged per minute.
- Example: Extended Consultation
- EGP 10/minute

### Adding a Service

1. Click **"+ Add Service"**
2. Enter:
   - Name and description
   - Category
   - Duration (minutes)
   - Pricing model and prices
   - Required devices (optional)
   - Consumables used (optional)
   - Required room types (optional)
   - Allowed doctors (optional)
   - Active status
3. Click **"Save"**

### Service Consumables

Define default consumables used per service:
- Inventory item
- Quantity per session

These are suggested during session end for tracking.

---

## 13. Offers & Packages

### Overview

Create flexible promotional offers, discounts, and treatment packages.

### Offer Types

| Type | Description |
|------|-------------|
| Percentage | % discount off total |
| Fixed Amount | Fixed EGP discount |
| Bundle | Combined service pricing |
| Buy X Get Y | Free sessions with purchase |
| Package | Credit packages for prepayment |
| Conditional | Discount based on conditions |

### Creating a Package Offer

Packages allow patients to prepay for multiple sessions/pulses:

1. Click **"+ Add Offer"**
2. Select type: **Package**
3. Enter:
   - Offer name (e.g., "Laser 10-Session Package")
   - Description
   - Valid date range (optional)
4. Configure benefits:
   - **Fixed Price**: Package purchase price
   - **Package Credits**: 
     - Select service(s)
     - Set quantity per service
     - Choose unit type (session, pulse, unit)
5. Set conditions (optional):
   - Specific patients
   - Minimum spend
   - Date range
6. Click **"Save"**

### Multi-Service Packages

Packages can include credits for multiple services:

**Example: "Full Body Package"**
- 10 sessions of Laser Hair Removal - Legs
- 5 sessions of Laser Hair Removal - Underarms
- 2 sessions of Skin Rejuvenation
- Price: EGP 15,000

### Creating a Percentage Discount

1. Click **"+ Add Offer"**
2. Select type: **Percentage**
3. Enter discount percentage
4. Add conditions:
   - Minimum spend amount
   - Specific services required
   - New patient only
5. Set usage limits (optional)
6. Click **"Save"**

### Offer Conditions

| Condition | Description |
|-----------|-------------|
| Service Includes | Cart must contain specific services |
| Minimum Spend | Minimum cart total required |
| New Patient | Only for newly registered patients |
| Patient Tags | Specific patient groups |
| Date Range | Valid during specific dates |
| Specific Patient | Only for selected patients |

### Offer Priority

When multiple offers apply:
- Higher priority number applies first
- Exclusive offers prevent stacking
- Non-exclusive offers can combine

---

## 14. Billing

### Overview

Generate invoices and process payments for completed appointments.

### Billing Tabs

#### Pending
Appointments with status "Completed" or "In Progress" awaiting billing.

#### Completed
Appointments with status "Billed" (invoices generated).

### Creating an Invoice

1. Navigate to **Billing**
2. Find appointment in **Pending** tab
3. Click **"Create Invoice"**
4. Invoice modal opens with:

#### Invoice Items
- Services from the appointment
- Pricing based on service configuration
- Extra charges from session (if any)
- Credit usage indicated

#### Available Offers
- System evaluates applicable offers
- Select offer to apply discount

#### Patient Credits
- Shows available credits for services
- Can apply credits as payment method

#### Pricing Summary
- Subtotal
- Discount (from offers)
- Tax (14% default)
- **Total Due**

### Payment Methods

Add one or more payments:

| Method | Description |
|--------|-------------|
| Cash | Cash payment |
| Card | Credit/debit card |
| Wallet | Patient wallet balance |
| Credits | Service credits (for applicable services) |

### Split Payments

Payments can be split across methods:
1. Add first payment (e.g., Card - EGP 500)
2. Add second payment (e.g., Cash - EGP 300)
3. Add third payment (e.g., Wallet - EGP 200)
4. Total must equal amount due

### Completing the Invoice

1. Verify all items and pricing
2. Add payments totaling the due amount
3. Click **"Generate Invoice"**
4. Appointment status changes to "Billed"
5. Transaction recorded in patient history
6. If credits used, wallet balance updated

### Package Purchase Flow

When a patient buys a package:

1. **From Patient Profile**:
   - Click **"Buy Package"**
   - Select package offer
   - Click **"Confirm Purchase"**

2. **Pending Bill Created**:
   - Package appears in patient's pending bills
   - Credits not yet active

3. **Payment**:
   - Click **"Pay Now"** on pending bill
   - Select payment method
   - Complete payment

4. **Credits Activated**:
   - Credits added to patient wallet
   - Transaction recorded
   - Patient can now use credits for bookings

---

## 15. Wallet & Credits System

### Patient Wallet

Each patient has a wallet containing:
- **Cash Balance**: Prepaid money for services
- **Service Credits**: Prepaid sessions/pulses for specific services

### Cash Balance

#### Adding Balance
- Top-up from patient profile
- Refunds add to balance
- Package overpayment adds to balance

#### Using Balance
- Payment method during billing
- Deducted automatically when selected

### Service Credits

Credits are service-specific and can have:
- **Quantity**: Number of units (sessions, pulses)
- **Unit Type**: Session, Pulse, or Unit
- **Expiration Date**: Optional expiry
- **Package Reference**: Which package granted them

### Credit Usage Flow

#### During Booking (Step 6)
1. System shows available credits matching selected services
2. User selects which services to pay with credits
3. Specifies units to use
4. Remaining balance for cash payment calculated

#### During Session
1. Credits tracked in session
2. Can adjust actual usage vs. allocated
3. Overage creates extra charges

#### After Session
1. Credits deducted from wallet
2. If more used than allocated, extra charged in billing
3. Transaction recorded

### Credit Types

| Unit Type | Use Case | Example |
|-----------|----------|---------|
| Session | Per-treatment count | 10 Facial Sessions |
| Pulse | Per-pulse count | 5,000 Laser Pulses |
| Unit | Generic count | 20 Injection Units |

### Credit Expiration

- Credits can have expiration dates
- Alerts generated before expiry
- Expired credits cannot be used
- No automatic refund (clinic policy)

---

## 16. Quick Reference

### Keyboard Shortcuts

Currently, the system is fully mouse/touch operated.

### Status Color Coding

| Color | Meaning |
|-------|---------|
| 🔵 Blue | Scheduled, Information |
| 🟡 Amber | Checked-in, Warning |
| 🟣 Purple | In Progress |
| 🟢 Green | Completed, Success |
| 🔴 Red | Cancelled, Error |
| 🟠 Orange | No-Show, Alert |
| ⚪ Gray | Billed, Inactive |

### Common Workflows

#### New Patient Visit
1. Add Patient → Book Appointment → Check In → Start Session → End Session → Bill

#### Package Purchase
1. Patient Profile → Buy Package → Pay Now → Credits Active

#### Using Credits
1. Book Appointment → Select Services → Use Credits Step → Confirm

#### Device Maintenance
1. Dashboard Alert → Devices → Update Status → Log Maintenance

#### Handling No-Shows
1. Mark as No-Show → Click "Yes, Reschedule" → Select new date/time → Confirm

### Support

For technical support or feature requests, contact your system administrator.

---

## Document Information

| Property | Value |
|----------|-------|
| Version | 1.0 |
| Last Updated | January 2026 |
| System | Merve Aesthetics Management System |
| Platform | Angular 17+ Web Application |

---

*© 2026 Merve Aesthetics Management System. All rights reserved.*
