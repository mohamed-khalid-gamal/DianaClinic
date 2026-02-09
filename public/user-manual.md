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
12. [Services (Detailed)](#12-services)
13. [Offers & Packages (Detailed)](#13-offers--packages)
14. [Billing](#14-billing)
15. [Wallet & Credits System](#15-wallet--credits-system)
16. [Quick Reference](#16-quick-reference)
17. [Feature Map by Page](#17-feature-map-by-page)
18. [Complete System Example](#18-complete-system-example)

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

### Pricing Models (Detailed)

The system supports 4 distinct pricing models. Each service can have ONE primary pricing model.

#### 1. Fixed Price (`fixed`)

**Use Case**: Standard treatments with consistent pricing regardless of time or pulses used.

| Field | Description |
|-------|-------------|
| Base Price | The flat fee charged per session |

**Examples**:
- Consultation: EGP 500/session
- Facial Treatment: EGP 800/session
- Chemical Peel: EGP 1,200/session

**Best For**: Consultations, facials, standard procedures with predictable duration.

**Booking Behavior**: Patient pays the fixed price. One session = one credit if using package credits.

---

#### 2. Pulse-Based Pricing (`pulse`)

**Use Case**: Laser treatments where the number of pulses varies based on treatment area/patient.

| Field | Description |
|-------|-------------|
| Base Price | Minimum fee per session (covers setup, gel, etc.) |
| Price Per Pulse | Additional cost per laser pulse fired |

**Example**:
- Laser Hair Removal
  - Base: EGP 200
  - Per Pulse: EGP 5
  - Total for 500 pulses: EGP 200 + (500 × 5) = EGP 2,700

**Credit System**: 
- Credits are stored as **pulse units**, not sessions
- Package "5,000 Pulses" means patient has 5,000 pulse credits
- Each treatment deducts actual pulses used from balance

**Session End Workflow**:
1. Doctor logs device usage (counter start → counter end)
2. System calculates pulses used
3. If patient has pulse credits: Deduct from wallet
4. If pulses exceed credits: Extra pulses charged at per-pulse rate

---

#### 3. Area-Based Pricing (`area`)

**Use Case**: Treatments where price varies by body area (e.g., Botox, Laser zones).

| Field | Description |
|-------|-------------|
| Areas | List of area names with individual prices |

**Example - Laser Hair Removal**:
| Area | Price |
|------|-------|
| Upper Lip | EGP 300 |
| Underarms | EGP 500 |
| Bikini | EGP 700 |
| Full Legs | EGP 2,000 |
| Full Body | EGP 5,000 |

**Example - Botox**:
| Area | Price |
|------|-------|
| Forehead | EGP 1,500 |
| Crow's Feet | EGP 1,200 |
| Frown Lines | EGP 1,000 |
| Full Upper Face | EGP 3,500 |

**Booking Behavior**:
- During booking, user selects the specific area
- Price adjusts based on selected area
- If using credits: 1 session credit = 1 area treatment

---

#### 4. Time-Based Pricing (`time`)

**Use Case**: Services charged by duration (extended consultations, therapy sessions).

| Field | Description |
|-------|-------------|
| Base Price | Minimum charge (optional) |
| Price Per Minute | Rate per minute of session |

**Example**:
- Extended Consultation
  - Base: EGP 0
  - Per Minute: EGP 10
  - 45-minute session: EGP 450

**Session End Workflow**:
1. System tracks session duration (start time → end time)
2. Calculates total minutes
3. Applies time-based pricing formula

---

### Service Configuration Options

| Option | Description |
|--------|-------------|
| **Required Devices** | Specify which devices are needed (e.g., "Candela Laser") |
| **Consumables** | Default items used (e.g., "Cooling Gel - 50ml") |
| **Required Room Types** | Only allow booking in specific room types |
| **Allowed Doctors** | Restrict service to certified doctors only |

### Tips & Tricks for Services

1. **Multiple Pricing Areas**: Add all possible areas upfront—patients see a dropdown during booking.

2. **Device Tracking**: Link services to devices for automatic pulse counting.

3. **Consumables**: Pre-define consumables to auto-suggest during session end.

4. **Doctor Restrictions**: Use for specialized procedures requiring certification.

5. **Duration Accuracy**: Set realistic durations—system uses this for slot availability.

---

## 13. Offers & Packages

### Overview

The Offers system provides a powerful rule engine for discounts, packages, and promotions.

### Offer Types (Detailed)

#### 1. Percentage Discount (`percentage`)

**Description**: Apply a percentage off the cart total or specific services.

**Configuration**:
| Field | Value |
|-------|-------|
| Type | `percent_off` |
| Percent | 10-50% typically |

**Example**: "20% Off All Services"
- Condition: None (applies to everyone)
- Benefit: 20% off total

**When to Use**: Flash sales, seasonal promotions, loyalty rewards.

---

#### 2. Fixed Amount Discount (`fixed_amount`)

**Description**: Subtract a fixed EGP amount from the total.

**Configuration**:
| Field | Value |
|-------|-------|
| Type | `fixed_amount_off` |
| Fixed Amount | EGP 100, 200, etc. |

**Example**: "EGP 200 Off Your First Visit"
- Condition: New Patient
- Benefit: EGP 200 off

**When to Use**: Welcome discounts, referral bonuses, promotional codes.

---

#### 3. Bundle Pricing (`bundle`)

**Description**: Combine multiple services at a special fixed price.

**Configuration**:
| Field | Value |
|-------|-------|
| Type | `fixed_price` |
| Fixed Price | Bundle total (e.g., EGP 3,000) |
| Condition | Must include specific services |

**Example**: "Bridal Package"
- Required Services: Facial + Hair Removal + Skin Rejuvenation
- Normal Price: EGP 4,500
- Bundle Price: EGP 3,000
- Savings: EGP 1,500

**Booking Behavior**:
- Patient must book ALL required services together
- System auto-applies bundle price
- Works as one appointment or segment

---

#### 4. Buy X Get Y (`buyXgetY`)

**Description**: Purchase a certain quantity and get additional sessions free.

**Configuration**:
| Field | Value |
|-------|-------|
| Buy Quantity | How many to purchase |
| Free Quantity | How many free sessions |
| Target Service | Which service applies |

**Example**: "Buy 5 Laser Sessions, Get 1 Free"
- Buy: 5 sessions
- Get: 1 free session
- Effective discount: ~17%

**Implementation**: When patient books 5 sessions, 6th is granted free in wallet.

---

#### 5. Credit Package (`package`)

**Description**: Sell prepaid credits for services at a discounted rate.

**Configuration**:
| Field | Value |
|-------|-------|
| Type | `grant_package` |
| Fixed Price | Package purchase price |
| Package Service | Which service |
| Package Sessions/Pulses | Quantity granted |
| Validity Days | Optional expiration |

**Example 1 - Session Package**:
- Name: "10 Facial Sessions"
- Price: EGP 6,000 (vs EGP 8,000 individual)
- Grants: 10 session credits for "Facial Treatment"
- Validity: 365 days

**Example 2 - Pulse Package**:
- Name: "5,000 Laser Pulses"
- Price: EGP 15,000
- Grants: 5,000 pulse credits for "Laser Hair Removal"
- Validity: 180 days

**Example 3 - Multi-Service Package**:
- Name: "Ultimate Beauty Package"
- Price: EGP 20,000
- Grants:
  - 10 sessions of "Facial Treatment"
  - 5 sessions of "Chemical Peel"
  - 3,000 pulses of "Laser Hair Removal"
- Validity: 365 days

**Purchase Flow**:
1. Patient → Profile → Buy Package
2. Select package → Confirm
3. Pending bill created (credits NOT active)
4. Patient pays → Credits activated
5. Credits appear in wallet for future bookings

---

#### 6. Conditional Offers (`conditional`)

**Description**: Complex rules with multiple conditions.

**Available Conditions**:

| Condition Type | Description |
|----------------|-------------|
| `service_includes` | Cart must contain specific services |
| `min_spend` | Minimum cart total required |
| `new_patient` | Only for patients registered < 30 days |
| `patient_tag` | Specific patient groups (VIP, etc.) |
| `date_range` | Valid during specific dates |
| `specific_patient` | Only for selected patient IDs |

**Example - Loyalty Discount**:
- Name: "VIP 15% Off"
- Condition: Patient tag = "VIP"
- Benefit: 15% off all services

**Example - Minimum Spend**:
- Name: "Spend EGP 2,000 Get EGP 300 Off"
- Condition: Cart total ≥ EGP 2,000
- Benefit: EGP 300 fixed discount

**Example - Service-Specific**:
- Name: "Botox + Filler Combo"
- Condition: Cart includes "Botox" AND "Filler"
- Benefit: 25% off total

---

### Offer Priority & Exclusivity

| Setting | Description |
|---------|-------------|
| **Priority** | Higher number = applies first |
| **Exclusive** | If true, cannot combine with other offers |

**Stacking Logic**:
1. Sort offers by priority (descending)
2. Apply exclusive offer alone OR stack non-exclusive offers
3. Display total savings to patient

---

### Creating Complex Offers (Step-by-Step)

#### Example: "New Patient Welcome Package"

1. **Go to Offers → + Add Offer**

2. **Step 1 - Basic Info**:
   - Name: "New Patient Welcome Package"
   - Type: Package
   - Description: "3 Sessions for the price of 2!"

3. **Step 2 - Conditions**:
   - Add Condition: "New Patient Only"

4. **Step 3 - Benefits**:
   - Type: Grant Package
   - Fixed Price: EGP 1,600
   - Service: Facial Treatment
   - Sessions: 3
   - Validity: 90 days

5. **Step 4 - Settings**:
   - Valid From: Today
   - Valid Until: (leave empty for no expiry)
   - Active: Yes

6. **Save**

---

## Services + Offers + Credits Integration

### How They Work Together

```
┌─────────────────────────────────────────────────────────────────┐
│                        PATIENT JOURNEY                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. PATIENT BUYS PACKAGE                                        │
│     └── Offer: "10 Laser Sessions - EGP 15,000"                 │
│         └── Creates: 10 session credits in wallet               │
│                                                                 │
│  2. PATIENT BOOKS APPOINTMENT                                   │
│     └── Service: "Laser Hair Removal"                           │
│     └── Step 2: Use Credits                                     │
│         └── System shows: "You have 10 sessions available"      │
│         └── Patient selects: "Use 1 session credit"             │
│                                                                 │
│  3. APPOINTMENT DAY                                             │
│     └── Check-In → Start Session                                │
│     └── Doctor performs treatment                               │
│     └── End Session: Log device usage (500 pulses)              │
│                                                                 │
│  4. BILLING                                                     │
│     └── Service: Laser Hair Removal                             │
│     └── Credit Applied: 1 session                               │
│     └── Amount Due: EGP 0 (fully covered by credit)             │
│     └── Wallet Updated: 9 sessions remaining                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Credit Usage Scenarios

#### Scenario 1: Full Credit Coverage
- Patient has: 5 session credits
- Books: 1 session
- Uses: 1 credit
- Pays: EGP 0

#### Scenario 2: Partial Credit Coverage
- Patient has: 2 session credits
- Books: 3 sessions (different days)
- Uses: 2 credits
- Pays: 1 session at full price

#### Scenario 3: Pulse Overage
- Patient has: 500 pulse credits
- Treatment uses: 700 pulses
- Credits used: 500 pulses
- Billed: 200 pulses × EGP 5 = EGP 1,000

#### Scenario 4: Multiple Services, Mixed Payment
- Patient books:
  - Laser Hair Removal (has 1 session credit)
  - Facial Treatment (no credits)
- Credits used: 1 for Laser
- Cash due: Facial Treatment price

---

## 17. Feature Map by Page

### Dashboard

| Feature | Description | Location |
|---------|-------------|----------|
| Today's Appointments | List of scheduled appointments | Main panel |
| Quick Stats | KPIs (patients, rooms, alerts) | Stat cards |
| Alerts | Low stock, maintenance, expiry | Alert section |
| Quick Actions | New appointment, calendar, etc. | Action buttons |

### Patients

| Feature | Description | Location |
|---------|-------------|----------|
| Patient List | Searchable/sortable table | Main table |
| Add Patient | Register new patient | Header button |
| Patient Profile | Full patient details | Row click |
| Wallet Summary | Cash balance + credits | Profile header |
| Buy Package | Purchase offer packages | Profile tab |
| Pending Bills | Unpaid package purchases | Profile alert |
| Transaction History | All financial activity | Profile tab |
| Appointment History | Past/future appointments | Profile tab |
| Patient Calendar | Visual schedule | Profile tab |

### Appointments

| Feature | Description | Location |
|---------|-------------|----------|
| Day View | Time-slot grid | Main panel |
| Week View | Weekly overview | View toggle |
| Date Navigation | Previous/next day | Header arrows |
| 7-Step Booking | Full appointment wizard | + New Appointment |
| Status Actions | Check-in, Start, Complete | Appointment card |
| No-Show Reschedule | Auto-reschedule prompt | Status action |
| Credit Selection | Use wallet credits | Booking Step 2 |
| Offer Application | Apply discounts | Booking Step 6 |

### Sessions

| Feature | Description | Location |
|---------|-------------|----------|
| Active Sessions | Currently running treatments | Main grid |
| Waiting Queue | Checked-in patients | Secondary list |
| Session Timer | Elapsed time display | Session card |
| Start Session | Begin treatment | Waiting queue |
| End Session | Complete with notes | Session card |
| Device Usage Log | Record pulse counts | End session modal |
| Consumables Log | Record items used | End session modal |
| Extra Charges | Add overage charges | End session modal |
| Clinical Notes | Treatment notes | End session modal |

### Calendar

| Feature | Description | Location |
|---------|-------------|----------|
| All Appointments | Full clinic schedule | Default view |
| Room Filter | View by specific room | Dropdown |
| Doctor Filter | View by specific doctor | Dropdown |
| Patient Filter | View by specific patient | Dropdown |
| Day/Week/Month | Calendar view modes | View selector |
| List View | Agenda-style list | View selector |
| Event Click | View appointment details | Event click |
| Status Legend | Color-coded statuses | Legend bar |

### Doctors

| Feature | Description | Location |
|---------|-------------|----------|
| Doctor List | All staff members | Main grid |
| Add Doctor | Register new doctor | Header button |
| Working Hours | Schedule configuration | Doctor modal |
| Room Assignment | Assign to specific rooms | Doctor modal |
| Specialty | Medical specialty | Doctor card |
| Active Toggle | Enable/disable doctor | Doctor card |

### Rooms

| Feature | Description | Location |
|---------|-------------|----------|
| Room List | All clinic rooms | Main grid |
| Add Room | Create new room | Header button |
| Room Type | Treatment/Consultation/etc. | Room card |
| Equipment | Room equipment list | Room details |
| Capacity | Patient capacity | Room card |
| Active Toggle | Enable/disable room | Room card |

### Devices

| Feature | Description | Location |
|---------|-------------|----------|
| Device Grid | All equipment | Main grid |
| Add Device | Register new device | Header button |
| Counter Display | Current pulse/session count | Device card |
| Maintenance Alert | Near threshold warning | Device card |
| Log Usage | Manual counter update | Device card |
| Status Toggle | Active/Maintenance/Inactive | Device card |
| Lamp Lifetime | Track lamp usage | Device details |

### Inventory

| Feature | Description | Location |
|---------|-------------|----------|
| Item Table | Full inventory list | Main table |
| Add Item | Create new item | Header button |
| Category Filter | Drug/Consumable/Retail | Filter tabs |
| Low Stock Filter | Items below threshold | Filter tabs |
| Expiring Filter | Soon-to-expire items | Filter tabs |
| Stock Adjustment | Edit quantities | Item row |
| Expiry Tracking | Expiration dates | Table column |

### Services

| Feature | Description | Location |
|---------|-------------|----------|
| Service Catalog | All treatments | Main grid |
| Category Filter | Filter by category | Category tabs |
| Add Service | Create new service | Header button |
| Pricing Models | 4 pricing types | Service modal |
| Area Pricing | Add area tiers | Service modal |
| Device Link | Required devices | Service modal |
| Consumables | Default consumables | Service modal |

### Offers

| Feature | Description | Location |
|---------|-------------|----------|
| Offer List | All promotions | Main grid |
| Status Filter | Active/Expired filter | Filter tabs |
| Add Offer | Create new offer | Header button |
| 3-Step Wizard | Offer creation flow | Offer modal |
| Conditions | Rule configuration | Wizard step 2 |
| Benefits | Discount configuration | Wizard step 3 |
| Active Toggle | Enable/disable offer | Offer card |

### Billing

| Feature | Description | Location |
|---------|-------------|----------|
| Pending Tab | Unbilled appointments | Tab panel |
| Completed Tab | Billed appointments | Tab panel |
| Create Invoice | Generate invoice | Appointment row |
| Invoice Items | Service line items | Invoice modal |
| Apply Offers | Select applicable offers | Invoice modal |
| Split Payments | Multiple payment methods | Invoice modal |
| Credit Payment | Use wallet credits | Payment section |
| Invoice Preview | Summary before confirm | Invoice modal |

---

## 18. Complete System Example

This walkthrough demonstrates setting up a clinic from scratch and processing a complete patient journey.

### Phase 1: Initial Setup

#### Step 1.1 - Create Rooms

| Room Name | Type | Capacity |
|-----------|------|----------|
| Room 1 - Laser | Treatment | 1 |
| Room 2 - Facial | Treatment | 1 |
| Room 3 - Consultation | Consultation | 2 |
| Storage Room | Storage | N/A |

**How**:
1. Go to **Rooms** → Click **"+ Add Room"**
2. Enter: Name = "Room 1 - Laser", Type = "Treatment", Capacity = 1
3. Save and repeat for other rooms

---

#### Step 1.2 - Create Doctors

| Doctor Name | Specialty | Working Hours |
|-------------|-----------|---------------|
| Dr. Ahmed Hassan | Dermatology | Sun-Thu 9:00-17:00 |
| Dr. Sara Mohamed | Aesthetics | Sun-Wed 10:00-18:00 |

**How**:
1. Go to **Doctors** → Click **"+ Add Doctor"**
2. Enter: Name = "Dr. Ahmed Hassan", Specialty = "Dermatology"
3. Add Working Hours:
   - Sunday: 09:00 - 17:00, Room: Room 1 - Laser
   - Monday: 09:00 - 17:00, Room: Room 1 - Laser
   - Tuesday: 09:00 - 17:00, Room: Room 2 - Facial
   - (Continue for other days)
4. Save

---

#### Step 1.3 - Add Devices

| Device Name | Model | Counter Type | Room |
|-------------|-------|--------------|------|
| Candela GentleMax | Pro Series | Pulse | Room 1 - Laser |
| Hydrafacial Machine | Elite | Session | Room 2 - Facial |

**How**:
1. Go to **Devices** → Click **"+ Add Device"**
2. Enter:
   - Name: "Candela GentleMax"
   - Model: "Pro Series"
   - Serial: "CND-2024-001"
   - Counter Type: "Pulse"
   - Current Counter: 0
   - Maintenance Threshold: 50,000
   - Room: "Room 1 - Laser"
3. Save

---

#### Step 1.4 - Add Inventory

| Item | Category | Qty | Cost | Price |
|------|----------|-----|------|-------|
| Cooling Gel | Consumable | 50 | EGP 100 | EGP 150 |
| Numbing Cream | Drug | 20 | EGP 200 | EGP 350 |
| Facial Serum | Consumable | 30 | EGP 300 | EGP 500 |
| Disposable Caps | Consumable | 100 | EGP 10 | EGP 25 |

**How**:
1. Go to **Inventory** → Click **"+ Add Item"**
2. Enter all fields for "Cooling Gel"
3. Set Reorder Threshold: 10
4. Save and repeat

---

#### Step 1.5 - Create Services

**Service 1: Laser Hair Removal (Pulse-Based)**
| Field | Value |
|-------|-------|
| Name | Laser Hair Removal |
| Category | Laser Treatments |
| Duration | 45 minutes |
| Pricing Type | Pulse-Based |
| Base Price | EGP 200 |
| Price/Pulse | EGP 5 |
| Required Device | Candela GentleMax |
| Consumables | Cooling Gel (50ml), Disposable Cap (1pc) |
| Required Room | Treatment |
| Allowed Doctors | Dr. Ahmed Hassan |

**Service 2: Hydrafacial (Fixed Price)**
| Field | Value |
|-------|-------|
| Name | Hydrafacial |
| Category | Facial Treatments |
| Duration | 60 minutes |
| Pricing Type | Fixed |
| Base Price | EGP 1,500 |
| Required Device | Hydrafacial Machine |
| Consumables | Facial Serum (1 unit) |
| Required Room | Treatment |
| Allowed Doctors | Dr. Sara Mohamed |

**Service 3: Botox (Area-Based)**
| Field | Value |
|-------|-------|
| Name | Botox Injection |
| Category | Injectables |
| Duration | 30 minutes |
| Pricing Type | Area-Based |
| Areas | Forehead: EGP 1,500, Crow's Feet: EGP 1,200, Full Upper Face: EGP 3,500 |
| Consumables | Numbing Cream (1 unit) |
| Required Room | Consultation |
| Allowed Doctors | Dr. Ahmed Hassan, Dr. Sara Mohamed |

**Service 4: Consultation (Fixed Price)**
| Field | Value |
|-------|-------|
| Name | Initial Consultation |
| Category | Consultation |
| Duration | 30 minutes |
| Pricing Type | Fixed |
| Base Price | EGP 300 |
| Required Room | Consultation |

---

#### Step 1.6 - Create Offers

**Offer 1: 10 Laser Sessions Package**
| Field | Value |
|-------|-------|
| Name | 10 Laser Sessions |
| Type | Package |
| Price | EGP 12,000 |
| Grants | 10 sessions of "Laser Hair Removal" |
| Validity | 365 days |
| Active | Yes |

**Offer 2: New Patient Discount**
| Field | Value |
|-------|-------|
| Name | Welcome Discount |
| Type | Percentage |
| Discount | 20% |
| Condition | New Patient Only |
| Active | Yes |

**Offer 3: Facial + Botox Bundle**
| Field | Value |
|-------|-------|
| Name | Glow Bundle |
| Type | Bundle |
| Condition | Must include Hydrafacial + Botox |
| Regular Price | EGP 5,000 |
| Bundle Price | EGP 3,800 |
| Active | Yes |

---

### Phase 2: Patient Journey

#### Step 2.1 - Register New Patient

1. Go to **Patients** → Click **"+ Add Patient"**
2. Enter:
   - First Name: Nour
   - Last Name: Ibrahim
   - Phone: +20 100 123 4567
   - Email: nour@email.com
   - Date of Birth: 1990-05-15
   - Gender: Female
   - Skin Type: 3 (Fitzpatrick)
   - Allergies: None
3. Save

---

#### Step 2.2 - Patient Buys Package

1. Click on **Nour Ibrahim** to open profile
2. Go to **Packages & Credits** tab
3. Click **"+ Buy Package"**
4. Select: "10 Laser Sessions - EGP 12,000"
5. Click **"Confirm Purchase"**
6. **Pending Bill** appears in profile
7. Click **"Pay Now"**
8. Select Payment: Card - EGP 12,000
9. Confirm Payment
10. ✅ **Credits Activated**: 10 sessions of Laser Hair Removal

---

#### Step 2.3 - Book First Appointment (Using Credits)

1. Go to **Appointments** → Click **"+ New Appointment"**

**Step 1 - Patient**:
- Search: "Nour"
- Select: Nour Ibrahim

**Step 2 - Credits**:
- System shows: "Laser Hair Removal: 10 sessions available"
- Select: Use 1 session credit

**Step 3 - Services**:
- Already pre-selected: Laser Hair Removal
- Add: Hydrafacial (for bundle)

**Step 4 - Group**:
- Keep as separate segments (different rooms/doctors)

**Step 5 - Schedule**:
- Segment 1 (Laser): Tomorrow 10:00 AM, Dr. Ahmed, Room 1
- Segment 2 (Hydrafacial): Tomorrow 11:00 AM, Dr. Sara, Room 2

**Step 6 - Offers**:
- System shows: "New Patient Welcome Discount - 20% Off"
- Apply offer

**Step 7 - Confirm**:
- Laser Hair Removal: EGP 0 (1 credit used)
- Hydrafacial: EGP 1,500 - 20% = EGP 1,200
- Total: EGP 1,200

2. Click **"Confirm Booking"**
3. ✅ Appointment created

---

#### Step 2.4 - Appointment Day: Check-In

1. Go to **Appointments**
2. Find Nour's appointment at 10:00 AM
3. Click **"Check In"**
4. Status changes to **Checked-In** (Amber)

---

#### Step 2.5 - Start Session

1. Go to **Sessions** (or stay on Appointments)
2. Find Nour in **Waiting Queue**
3. Click **"Start Session"**
4. Status changes to **In Progress** (Purple)
5. Session timer starts

---

#### Step 2.6 - End Session

1. In **Sessions**, find active session for Nour
2. Click **"End Session"**
3. **End Session Modal** opens:

**Device Usage**:
- Device: Candela GentleMax
- Counter Start: 45,000
- Counter End: 45,450
- Pulses Used: 450

**Consumables Used**:
- Cooling Gel: 1 unit
- Disposable Cap: 1 pc

**Credits Allocated**:
- Laser Hair Removal: 1 session (from booking)

**Notes**:
- "Full legs treatment, patient tolerated well"

4. Click **"Complete Session"**
5. Status changes to **Completed** (Green)
6. Device counter updated to 45,450
7. Inventory deducted

---

#### Step 2.7 - Complete Second Service

1. Repeat Steps 2.4-2.6 for Hydrafacial session with Dr. Sara
2. No device logging needed (session-based)
3. Log: Facial Serum - 1 unit used

---

#### Step 2.8 - Billing

1. Go to **Billing** → **Pending** tab
2. Find Nour's completed appointments
3. Click **"Create Invoice"**

**Invoice Preview**:
| Item | Price | Credit | Subtotal |
|------|-------|--------|----------|
| Laser Hair Removal | EGP 0 | 1 session | EGP 0 |
| Hydrafacial | EGP 1,500 | - | EGP 1,500 |
| **Subtotal** | | | EGP 1,500 |
| Discount (20% New Patient) | | | -EGP 300 |
| **Total** | | | **EGP 1,200** |

**Payment**:
- Add Payment: Card - EGP 1,200
- Click **"Generate Invoice"**

4. ✅ Status changes to **Billed** (Gray)
5. Transaction recorded in patient history
6. Wallet updated: 9 Laser sessions remaining

---

### Phase 3: Dashboard & Calendar Review

#### Dashboard

After the above journey:
- **Today's Appointments**: Shows completed appointments
- **Total Patients**: 1 (Nour Ibrahim)
- **Alerts**: None (assuming stock is healthy)

#### Calendar

1. Go to **Calendar**
2. View: Week
3. See both appointments color-coded
4. Filter by Room: "Room 1 - Laser" - Shows only laser appointment
5. Filter by Doctor: "Dr. Ahmed" - Shows his appointments
6. Click on Nour's profile → **Calendar** tab → See her personal calendar

---

### Summary: What We Demonstrated

| Feature | Demonstrated |
|---------|--------------|
| Room Setup | ✅ 4 rooms with types |
| Doctor Setup | ✅ 2 doctors with schedules |
| Device Setup | ✅ 2 devices with counters |
| Inventory | ✅ 4 items with categories |
| Services (Fixed) | ✅ Consultation, Hydrafacial |
| Services (Pulse) | ✅ Laser Hair Removal |
| Services (Area) | ✅ Botox |
| Package Offer | ✅ 10 Laser Sessions |
| Discount Offer | ✅ New Patient 20% |
| Bundle Offer | ✅ Glow Bundle |
| Patient Registration | ✅ Full profile |
| Package Purchase | ✅ With pending bill flow |
| Credit Payment | ✅ Pay pending bill |
| Appointment Booking | ✅ 7-step wizard |
| Credit Usage | ✅ During booking |
| Offer Application | ✅ During booking |
| Check-In | ✅ Status transition |
| Session Start | ✅ Active session |
| Device Logging | ✅ Pulse tracking |
| Consumable Logging | ✅ Inventory deduction |
| Session End | ✅ Complete with notes |
| Invoice Creation | ✅ With credits & discounts |
| Split Payment | ✅ Single/multiple methods |
| Billing Completion | ✅ Status to Billed |
| Calendar Views | ✅ All filters |
| Dashboard | ✅ Overview |

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

## 19. Comprehensive Test Flows

This section provides complete end-to-end test flows to verify all system features. Follow these scenarios to test the full functionality of Offers, Patients, Appointments, and Billing.

---

### Test Flow 1: All Offer Types Test Cycle

This flow tests all 6 offer types with a single test patient.

#### Prerequisites
- At least 2 services exist (e.g., "Laser Hair Removal", "Hydrafacial")
- At least 1 doctor and 1 room configured

#### 1.1 Create Test Offers

Go to **Offers** → Create each offer:

| Offer Name | Type | Configuration | Condition |
|------------|------|---------------|-----------|
| Summer Sale 25% | `percentage` | 25% discount | None (all patients) |
| Welcome EGP 300 | `fixed_amount` | EGP 300 off | `new_patient` |
| Beauty Bundle | `bundle` | Facial + Consultation = EGP 1,800 | `service_includes` both |
| Buy 3 Get 1 | `buyXgetY` | Buy 3, Get 1 Free - Hydrafacial | None |
| 10 Sessions Pack | `package` | EGP 8,000 → 10 Laser sessions | None |
| VIP 15% Off | `conditional` | 15% off | `patient_tag` = "VIP" |

**Verification Checklist:**
- [ ] All 6 offers appear in Offers list
- [ ] Filter by "Active" shows all 6
- [ ] Each offer shows correct type badge

---

#### 1.2 Test Percentage Discount

1. Create new patient: "Test Percent"
2. **Appointments** → **+ New Appointment**
3. Select patient → Select "Hydrafacial" service
4. Continue to Step 6 (Offers)
5. **Verify**: "Summer Sale 25%" appears as applicable
6. Select the offer → Continue to Confirm
7. **Verify**: Invoice shows 25% discount on Hydrafacial

---

#### 1.3 Test Fixed Amount Discount (New Patient)

1. Create new patient: "Test Fixed" (registered within 30 days)
2. Book appointment with any service
3. At Step 6 (Offers):
   - **Verify**: "Welcome EGP 300" appears (new patient condition met)
4. Apply offer → Confirm
5. **Verify**: Invoice shows EGP 300 deducted

---

#### 1.4 Test Bundle Offer

1. Patient: Use existing or create "Test Bundle"
2. Book appointment with **both**:
   - Facial treatment
   - Consultation
3. At Step 6:
   - **Verify**: "Beauty Bundle" offer appears
4. Apply offer → Confirm
5. **Verify**: Combined price = EGP 1,800 (not sum of individual prices)

---

#### 1.5 Test Buy X Get Y

1. Patient: "Test BuyGet"
2. Go to **Patient Profile** → **Packages & Credits** → **+ Buy Package**
3. Select "Buy 3 Get 1" offer
4. Pay for the package
5. **Verify**: Patient wallet shows **4 credits** for Hydrafacial (bought 3 + 1 free)

---

#### 1.6 Test Credit Package

1. Patient: "Test Package"
2. Profile → **+ Buy Package** → Select "10 Sessions Pack"
3. Confirm → **Pending Bill** appears
4. Click **Pay Now** → Pay EGP 8,000 (Cash or Card)
5. **Verify**:
   - Pending bill cleared
   - Wallet shows: "Laser Hair Removal: 10 sessions"
   - Transaction history shows payment

---

#### 1.7 Test Conditional Offer (Patient Tag)

1. Patient: "Test VIP"
2. Go to patient profile → Add tag "VIP" (if tag system available, or use backend)
3. Book appointment with any service
4. At Step 6:
   - **Verify**: "VIP 15% Off" appears
5. Apply → Confirm
6. **Verify**: 15% discount applied

---

### Test Flow 2: Complete Patient Journey with Package

Full patient lifecycle from registration to credit usage.

#### 2.1 Setup Test Data

| Entity | Values |
|--------|--------|
| Patient | Name: Nour Test, Phone: +20 100 111 2222, DOB: 1990-01-15, Gender: Female, Skin Type: 3 |
| Service | "Laser Hair Removal" (Pulse-based, EGP 200 base + EGP 5/pulse) |
| Package | "5000 Pulses Pack" - EGP 12,000 → 5000 pulse credits |

---

#### 2.2 Register Patient

1. **Patients** → **+ Add Patient**
2. Fill all fields:
   - First Name: Nour
   - Last Name: Test
   - Phone: +20 100 111 2222
   - DOB: 1990-01-15
   - Gender: Female
   - Skin Type: 3
   - Allergies: "Latex" (enter to test medical info)
   - Chronic Conditions: "None"
   - Contraindications: "None"
3. Save
4. **Verify**: Patient appears in list, age calculated correctly

---

#### 2.3 Purchase Multi-Service Package

1. Click on "Nour Test" → Profile opens
2. Go to **Packages & Credits** tab
3. Click **+ Buy Package**
4. Select "5000 Pulses Pack"
5. Confirm Purchase
6. **Verify**: "Pending Bills" alert appears with package

---

#### 2.4 Pay with Split Payment

1. Click **Pay Now** on pending bill
2. Add Payment 1: Card - EGP 7,000
3. Add Payment 2: Cash - EGP 5,000
4. Confirm Payment
5. **Verify**:
   - Pending bill disappears
   - Wallet shows: "Laser Hair Removal: 5000 pulses"
   - Transaction history shows both payments

---

#### 2.5 Top-Up Wallet Cash Balance

1. In patient profile, find "Top Up" button
2. Enter: EGP 500
3. Confirm
4. **Verify**: Cash balance shows EGP 500

---

#### 2.6 Use Credits During Booking

1. **Appointments** → **+ New Appointment**
2. Select: Nour Test
3. **Step 2 (Credits)**:
   - **Verify**: Shows "Laser Hair Removal: 5000 pulses available"
   - Select: Use 500 pulses for this appointment
4. Continue through wizard → Confirm
5. **Verify**: Booking confirmation shows 500 pulses allocated

---

### Test Flow 3: Complete Appointment Status Workflow

Tests all 7 appointment statuses and transitions.

#### Status Workflow Diagram

```
[Scheduled] → Check-In → [Checked-In] → Start → [In Progress] → End → [Completed] → Bill → [Billed]
     ↓                         ↓
 [No-Show]               [Cancelled]
     ↓
 (Reschedule)
```

---

#### 3.1 Create Scheduled Appointment

1. Book appointment for today, 30 minutes from now
2. Patient: Any test patient
3. Service: Any service
4. **Verify**: Status = "Scheduled" (Blue badge)

---

#### 3.2 Transition: Scheduled → Checked-In

1. Go to **Appointments**
2. Find the scheduled appointment
3. Click **Check In** button
4. **Verify**:
   - Status changes to "Checked-In" (Amber badge)
   - Patient appears in Sessions "Waiting Queue"

---

#### 3.3 Transition: Checked-In → In Progress

1. Go to **Sessions** module
2. Find patient in "Waiting Queue"
3. Click **Start Session**
4. **Verify**:
   - Status changes to "In Progress" (Purple badge)
   - Session card appears with timer running
   - Elapsed time updates every minute

---

#### 3.4 Transition: In Progress → Completed

1. In **Sessions**, find active session
2. Click **End Session**
3. Fill End Session Modal:
   - Device Usage: Select device, log usage (if applicable)
   - Consumables: Add any used items
   - Credits Used: Confirm allocated credits
   - Notes: "Test session completed"
4. Click **Complete Session**
5. **Verify**:
   - Status changes to "Completed" (Green badge)
   - Session disappears from active list
   - Appointment moves to Billing pending

---

#### 3.5 Transition: Completed → Billed

1. Go to **Billing** → **Pending** tab
2. Find completed appointment
3. Click **Create Invoice**
4. Review invoice:
   - Services listed correctly
   - Credits applied if any
   - Subtotal, discount, tax, total correct
5. Add Payment → Click **Generate Invoice**
6. **Verify**:
   - Status changes to "Billed" (Gray badge)
   - Appointment moves to Billing "Completed" tab
   - Transaction appears in patient history

---

#### 3.6 Test No-Show → Reschedule

1. Create new scheduled appointment
2. On appointment card, click **No-Show** icon (user-slash)
3. Confirmation dialog appears: "Mark as No-Show?"
4. Click **Confirm**
5. Dialog asks: "Would you like to reschedule?"
6. Click **Yes, Reschedule**
7. Reschedule Modal opens:
   - **Verify**: Patient name and services pre-filled
   - Select new date
   - Select available time slot
   - Confirm doctor and room
8. Click **Confirm Reschedule**
9. **Verify**:
   - Original appointment shows "No-Show" (Orange badge)
   - New appointment created with "Scheduled" status
   - Notes show "Rescheduled from no-show"

---

#### 3.7 Test Cancellation

1. Create new scheduled appointment
2. Click **Cancel** (X) icon
3. Confirm cancellation
4. **Verify**: Status = "Cancelled" (Red badge)

---

### Test Flow 4: Session Management Deep Test

Tests all session tracking features.

#### Prerequisites
- Device configured with pulse counter (e.g., "Test Laser - 10,000 pulses")
- Inventory items (e.g., "Cooling Gel - 50 units")
- Patient with pulse credits

---

#### 4.1 Start Session with Resources

1. Check-in patient with Laser Hair Removal appointment
2. Start Session
3. Note: Device "Test Laser" current counter value (e.g., 10,000)

---

#### 4.2 Log Device Usage

1. Click **End Session**
2. In **Device Usage** section:
   - Select Device: "Test Laser"
   - Counter Start: 10,000
   - Counter End: 10,450
   - **Verify**: Shows "450 pulses used"

---

#### 4.3 Log Consumables

1. In **Consumables Used** section:
   - Click **+ Add Consumable**
   - Select: "Cooling Gel"
   - Quantity: 2
2. Add another:
   - Select: "Disposable Tip"
   - Quantity: 1

---

#### 4.4 Adjust Credits and Add Overage

1. In **Credits Used** section:
   - Allocated: 400 pulses
   - Used: 450 pulses (adjust if needed)
   - **Verify**: System shows "50 pulse overage"
2. **Extra Charges** section should auto-calculate:
   - 50 pulses × EGP 5/pulse = EGP 250

---

#### 4.5 Add Clinical Notes

1. In **Notes** field:
   - Enter: "Full body treatment, patient tolerated well. Settings: 18J, 15mm spot size."

---

#### 4.6 Upload Photos (if available)

1. Click **Before Photos** → Upload test image
2. Click **After Photos** → Upload test image

---

#### 4.7 Complete Session

1. Click **Complete Session**
2. **Verify Post-Completion**:
   - Device counter updated: 10,450
   - Inventory reduced: Cooling Gel (48 remaining)
   - Patient credits: 400 deducted + 50 overage charged
   - Extra charge: EGP 250 added to pending invoice

---

### Test Flow 5: Billing Complete Feature Test

Tests all billing features with complex scenario.

#### Scenario Setup

| Item | Detail |
|------|--------|
| Patient | Has 2 session credits for "Facial", EGP 300 wallet balance |
| Appointment | Facial + Consultation + Laser (3 services) |
| Applicable Offers | "Summer Sale 25%" |
| Expected | Facial = credit, Consultation = cash, Laser = partial wallet + card |

---

#### 5.1 Create Multi-Service Invoice

1. Complete appointment with 3 services:
   - Facial Treatment (EGP 1,500)
   - Consultation (EGP 500)
   - Laser HR (EGP 2,000)
2. Go to **Billing** → **Create Invoice**

---

#### 5.2 Apply Service Credit

1. In **Invoice Items**, find "Facial Treatment"
2. Click **Use Credit** button
3. **Verify**:
   - Facial shows "Credit Applied" badge
   - Facial line item becomes EGP 0
   - Subtotal recalculated

---

#### 5.3 Apply Discount Offer

1. In **Available Offers** section:
   - Select "Summer Sale 25%"
2. **Verify**:
   - Discount line shows 25% of remaining billable amount
   - Only non-credit items discounted

---

#### 5.4 Split Payment with Wallet

1. **Payment Section**:
   - Add Payment 1: **Wallet** - EGP 300
   - Add Payment 2: **Card** - Remaining amount
2. **Verify**: Total paid = Grand total

---

#### 5.5 Complete and Verify

1. Click **Generate Invoice**
2. Check **Patient Profile** → **Transactions**:
   - [ ] Wallet payment: -EGP 300
   - [ ] Card payment: Remaining amount
   - [ ] Credit usage: 1 Facial session
3. Check **Wallet**:
   - [ ] Cash balance: EGP 0
   - [ ] Facial credits: 1 remaining (had 2, used 1)

---

### Test Data Summary

Use this reference for test data consistency:

| Entity | Test Name | Key Values |
|--------|-----------|------------|
| Doctor | Dr. Test Ahmed | Dermatology, Sun-Thu 9:00-17:00 |
| Room | Test Laser Room | Treatment type, Capacity 1 |
| Device | Test Laser Pro | Pulse counter, Room: Test Laser Room |
| Inventory | Cooling Gel | 50 qty, EGP 100 cost |
| Service | Laser Hair Removal | Pulse-based, EGP 200 + EGP 5/pulse |
| Service | Hydrafacial | Fixed, EGP 1,500 |
| Service | Consultation | Fixed, EGP 500 |
| Patient | Nour Test | +20 100 111 2222, Skin Type 3 |

---

### Master Verification Checklist

After completing all test flows:

#### Offers
- [ ] Percentage discount applied correctly
- [ ] Fixed amount discount applied correctly
- [ ] Bundle pricing works for multiple services
- [ ] Buy X Get Y grants correct credits
- [ ] Package purchase adds credits to wallet
- [ ] Conditional offers respect patient tags
- [ ] Offer activate/deactivate toggle works
- [ ] Offer delete with confirmation works

#### Patients
- [ ] Patient creation with all fields
- [ ] Patient edit and update
- [ ] Patient delete with confirmation
- [ ] Profile tabs all load correctly
- [ ] Wallet shows cash and credits
- [ ] Transaction history is complete
- [ ] Appointment history shows all statuses

#### Appointments
- [ ] 7-step booking wizard completes
- [ ] Credit selection step works
- [ ] Offer application step works
- [ ] Date/time slot selection works
- [ ] Doctor/room assignment works
- [ ] All status transitions work
- [ ] Reschedule from no-show works
- [ ] Cancellation works

#### Sessions
- [ ] Start session from checked-in
- [ ] Timer displays and updates
- [ ] Device usage logging works
- [ ] Consumables logging works
- [ ] Credits tracking works
- [ ] Extra charges for overage
- [ ] Clinical notes saved
- [ ] Session completion updates all resources

#### Billing
- [ ] Invoice items display correctly
- [ ] Credit application works
- [ ] Offer application works
- [ ] Multiple payment methods work
- [ ] Wallet payment deducts balance
- [ ] Invoice generation completes
- [ ] Status changes to billed
- [ ] All transactions recorded

---

## Document Information

| Property | Value |
|----------|-------|
| Version | 1.1 |
| Last Updated | February 2026 |
| System | Merve Aesthetics Management System |
| Platform | Angular 17+ Web Application |

---

*© 2026 Merve Aesthetics Management System. All rights reserved.*

