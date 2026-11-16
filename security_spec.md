# Security Specification — Prime Look India Backend

## 1. Data Invariants
1. **Catalog Integrity (`/products/{productId}`)**:
   - Public shoppers can read products (`get`, `list`), but ONLY a verified Store Owner (`isAdmin()`) can create, update, or delete products.
   - `productId` must match `^[a-zA-Z0-9_\-]+$` (max 128 chars).
   - `category` must be one of `['Shirts', 'T-Shirts', 'Polo T-Shirts']`.
   - `priceInr` must be a positive number (`> 0` and `<= 1000000`).
   - `sizes` (`<= 12`) and `colors` (`<= 12`) are strictly bounded arrays.
   - `createdAt` is immutable on update; `updatedAt == request.time` on writes.
2. **Storefront Settings (`/storefront/{docId}`)**:
   - Only `docId == 'settings'` is valid; public read for storefront rendering; writes restricted strictly to `isAdmin()`.
3. **Order PII Isolation (`/orders/{orderId}`)**:
   - Customer orders contain PII (`customerName`, `phone`, `email`, `address`, `pinCode`).
   - Shoppers can `create` an order only when all required fields pass `isValidOrder`, `status == 'placed'`, `items.size() >= 1 && items.size() <= 50`, and `createdAt == request.time && updatedAt == request.time`.
   - Shoppers can NEVER `get`, `list`, `update`, or `delete` `/orders/{orderId}` (Zero PII leak).
   - Only `isAdmin()` can read, list, update status, or delete orders.
4. **Admin RBAC Isolation (`/admins/{adminId}`)**:
   - Only `isAdmin()` can manage `/admins/{adminId}`. Regular users cannot self-assign admin privileges.

## 2. Adversarial "Dirty Dozen" Payloads (All Must Return PERMISSION_DENIED)
1. Unauthenticated or non-admin user attempting `setDoc` / `updateDoc` / `deleteDoc` on `/products/pl-in-01`.
2. Unauthenticated or non-admin user attempting `getDoc` or `getDocs` on `/orders` (PII exfiltration attempt).
3. Unauthenticated or non-admin user attempting to set `status: 'delivered'` when creating an order (`status != 'placed'`).
4. Shadow field injection on `/orders` create (adding `isPaid: true` or `discount: 5000` outside allowed keys).
5. Oversized string DoS on `/orders` (`customerName` > 120 chars or `address` > 300 chars).
6. Negative or zero `totalInr` / `subtotalInr` in `/orders` create payload.
7. Empty or oversized `items` list (`items.size() == 0` or `items.size() > 50`) in `/orders`.
8. Non-admin user attempting to write `/admins/{myUid}` to escalate privilege.
9. Spoofed `request.time` (`createdAt` set to past/future client timestamp on `/orders` or `/products`).
10. Admin email spoofing with `email_verified: false`.
11. Document ID poisoning (`productId` with `1.5KB` junk string or invalid symbols).
12. Non-admin modifying `storefront/settings` (e.g., changing `shippingChargeInr` to `0` or injecting phishing contact phone).
