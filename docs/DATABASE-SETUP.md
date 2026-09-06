# Database Setup (Hostinger MySQL/MariaDB)

This guide covers creating the database on Hostinger and loading the schema. Menu labels are
placeholders - they can differ slightly by hosting plan (Shared, Business, Cloud), so use this as
a guide and match it to whatever your hPanel shows.

## 1. Create a MySQL database

1. Log in to **hPanel**.
2. Go to **Databases -> MySQL Databases**.
3. Under **Create a New MySQL Database**, enter a database name (e.g. `u123456789_rewards`).
   Hostinger typically prefixes it with your account ID automatically.
4. Click **Create**.

## 2. Create a database user

1. On the same page, under **Create New MySQL User**, enter a username and a strong password.
2. Click **Create**.

## 3. Assign the user to the database

1. Under **Add User to Database**, select the user and the database you just created.
2. Grant **All Privileges**.
3. Click **Add**.

Note down: database host (usually `localhost` on shared hosting, or a hostname Hostinger shows
you), database name, username, and password. These go into your `.env` file.

## 4. Open phpMyAdmin

1. In hPanel, go to **Databases -> phpMyAdmin**.
2. Click **Enter phpMyAdmin** next to the database you created.

## 5. Import the schema

1. Select your database in the left sidebar.
2. Click the **Import** tab.
3. Click **Choose File** and select [`database/schema.sql`](../database/schema.sql) from this
   project.
4. Click **Go**.
5. Confirm all tables were created (`users`, `wallets`, `wallet_transactions`, `plans`,
   `user_plans`, `deposits`, `withdrawals`, `referrals`, `referral_commissions`,
   `reward_ledger`, `app_settings`, `audit_logs`).

## 6. Import the seed data

1. Still in the **Import** tab, select [`database/seed.sql`](../database/seed.sql).
2. Click **Go**.
3. Confirm the `plans` table has 5 rows and `app_settings` has the default settings.

The seed file intentionally does **not** create a real admin account with a plaintext password -
see the comment block at the bottom of `seed.sql` for how to add one safely once authentication
(Phase 3) is implemented.

## 7. Configure environment variables

Set the following (see [`.env.example`](../.env.example)) either in a `.env` file on the server
or via Hostinger's Node.js **Environment Variables** panel (see
[HOSTINGER-SETUP.md](./HOSTINGER-SETUP.md)):

```
DB_HOST=<your database host>
DB_PORT=3306
DB_NAME=<your database name>
DB_USER=<your database user>
DB_PASSWORD=<your database password>
```

## 8. Verify the connection

Once the Node.js app is running (see HOSTINGER-SETUP.md), check the application logs for:

```
Database connection established successfully.
```

or call `GET /api/health` to confirm the app itself is up.

## Backups

The database holds the financial ledger (wallets, transactions, deposits, withdrawals). Back it
up regularly using either:

- **hPanel -> Databases -> Backups** (if available on your plan), or
- **phpMyAdmin -> Export** (choose the database, format SQL, click Go) and store the file
  somewhere safe outside of Hostinger.

Never rely on application files alone for recovery - only the database contains the ledger.
