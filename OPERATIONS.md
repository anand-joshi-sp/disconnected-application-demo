# User Administration Demo Fixture

**Archetype:** legacy health-system user administration portal
**File:** `user-admin.html` — one static file, no dependencies or build
**Purpose:** disconnected-application capture and RPA replay testing

This is a synthetic, non-production test application.

## Access

| Field | Value |
|---|---|
| User name | `admin` |
| Password | `admin` |
| Department | `T001_JS TEST DEPARTMENT` |

Open `user-admin.html`, sign in, select the department, and click **Go**.
State is stored in browser `localStorage` and survives reloads.

## Supported connector operations

| Connector operation | Fixture workflow |
|---|---|
| Source login | User name → password → Sign On → department → Go |
| Account aggregation | Users → Search; table has 3,361 seeded rows and 20 rows/page |
| Account read | Search by username/last name/first name → update |
| Account create | Users → Add user → Profile → Save |
| Account update | update → Profile/Security → Save |
| Enable/disable | Security → Block account = No/Yes |
| Entitlement aggregation | Local Roles or User Groups |
| Add/remove entitlement | Account → Roles, Departments, or Providers → Edit |
| Logout | Log out → confirmation → Yes |

## Operation 1 — Aggregate users

1. Sign in with `admin` / `admin`.
2. Keep `T001_JS TEST DEPARTMENT` and click **Go**.
3. The Users screen opens automatically with an empty results table.
4. Click **Search** with blank criteria to load all users.
5. The table exposes Username, Last Name, First Name, Organization, Department,
   Position, Phone, Blocked, Expired, and Identity Mapping.
6. Use the paginator controls above the table. The seeded list spans 169 pages.

The first column contains an **update** link for account read/update capture.

## Operation 2 — Create a user

1. Users → **Add user**.
2. Enter required yellow fields:
   - Last name
   - First name
   - Organization
   - Position
   - Email
3. Optionally enter date of birth, phone, department, and notes.
4. Click **Save**.
5. The fixture generates a unique username and temporary password, then opens
   the Security tab.

## Operation 3 — Read or update a user

1. On Users, set Last name to `Miron` and click **Search**.
2. Click **update** for Ivan Miron (`imiron`).
3. Edit Profile fields and click **Save**, or open Security and change
   **Block account**.
4. Roles, Departments, and Providers each have an **Edit** workflow.

## Operation 4 — Roles and groups

- Click **Local Roles** to aggregate six seeded role entitlements.
- Click **User Groups** to aggregate five seeded group entitlements.
- Open a user → Roles → Edit to replace the assigned role.
- Open a user → Departments/Providers → Edit to add or remove values.

## Reset

In browser developer tools:

```js
localStorage.removeItem("user-admin-demo-fixture-v1");
sessionStorage.removeItem("user-admin-demo-session");
location.reload();
```

## Recorded-layout correspondence

The fixture includes the major UI details visible in the supplied recording:

- purple product header and legacy practice-links rail
- Valley Health System sign-on card and password-reset text
- post-login department selector
- Users search form and paginated alternating-row table
- Profile, Security, Roles, Departments, and Providers tabs
- yellow required fields, generated credentials, account block state
- provider access edit screen
- modal logout confirmation

The fixed **NON-PRODUCTION TEST FIXTURE** marker prevents the replica from
being mistaken for the real application.
