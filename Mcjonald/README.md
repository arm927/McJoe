# McJoe Cafe

React + Vite cafe ordering application.

## Run
```bash
npm install
npm run dev
npm run build
```

## Account roles

- **Customer**: created through Sign up; can browse the menu, add items to the cart, check out, and view only orders placed by that account.
- **Employee**: can manage menu items and view/update/manage all orders.
- **Admin**: same staff permissions as Employee.

Public sign-up always creates a Customer account. Staff roles are assigned through the built-in staff accounts, not selected on the public sign-up form.

### Demo staff accounts
- Admin: `admin` / `admin123`
- Employee: `staff` / `staff123`

## Important implementation note
This project currently uses browser `localStorage` for its data layer. Passwords for newly registered users are SHA-256 hashed before storage, but this is a front-end demo, not production-grade authentication or authorization. For deployment, move user storage, password hashing (use a password-hashing algorithm such as Argon2 or bcrypt), sessions, and role checks to the Express backend and a database. Never rely on client-side route guards as the only security boundary.
