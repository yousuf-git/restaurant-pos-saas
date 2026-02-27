-- ============================================================
-- SEED DATA
-- ============================================================
-- Creates: 3 restaurants, 6 users, 55 items (50+5+0), 3 sample orders
--
-- IMPORTANT: Before running this, create these 6 users in Supabase Auth
-- (Dashboard → Authentication → Users → Add user) with these exact emails
-- and then replace the UUIDs below with the actual generated auth user IDs.
--
-- Since tables use GENERATED ALWAYS AS IDENTITY, we use
-- OVERRIDING SYSTEM VALUE to set explicit IDs for seeding.
-- ============================================================

-- ============================================================
-- USERS (replace UUIDs with real auth.users IDs)
-- ============================================================
-- Admin
INSERT INTO public.users (id, email, full_name, role, restaurant_id, is_active) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'admin@restpos.com', 'Baba Admin', 'admin', NULL, true);

-- ============================================================
-- RESTAURANTS  (ids: 1, 2, 3)
-- ============================================================
INSERT INTO restaurants (id, name, phone, address, logo_url, receipt_header, receipt_footer, created_by)
OVERRIDING SYSTEM VALUE VALUES
  (1, 'Karachi Kitchen', '021-35831234', 'Block 5, Clifton, Karachi', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop', 'Authentic Karachi Flavors', 'Thank you! Visit again soon.', 'aaaaaaaa-0000-0000-0000-000000000001'),
  (2, 'Lahore Dhaba',    '042-37654321', 'Anarkali Bazaar, Lahore',   'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=300&fit=crop', NULL, 'Shukriya! Phir Aaein.', 'aaaaaaaa-0000-0000-0000-000000000001'),
  (3, 'Islamabad Cafe',  NULL,           NULL,                         'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop', NULL, NULL, 'aaaaaaaa-0000-0000-0000-000000000001');

-- Reset sequence so next auto-generated id starts after our seeds
SELECT setval(pg_get_serial_sequence('restaurants', 'id'), 3);

-- ============================================================
-- OPERATORS (assigned to restaurants)
-- ============================================================
INSERT INTO public.users (id, email, full_name, role, restaurant_id, is_active) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000002', 'ali@restpos.com',    'Ali Hassan',  'operator', 1, true),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'fatima@restpos.com', 'Fatima Noor', 'operator', 1, true),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'usman@restpos.com',  'Usman Ghani', 'operator', 2, true),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'zara@restpos.com',   'Zara Sheikh',  'operator', 2, false),
  ('aaaaaaaa-0000-0000-0000-000000000006', 'hamza@restpos.com',  'Hamza Malik',  'operator', 3, true);

-- ============================================================
-- ITEMS + VARIANTS — Karachi Kitchen (restaurant_id = 1, 50 items)
-- item ids: 1–50
-- ============================================================

INSERT INTO items (id, restaurant_id, name, image_url, is_active, sort_order)
OVERRIDING SYSTEM VALUE VALUES
  (1,  1, 'Chicken Biryani',   'https://foodish-api.com/images/biryani/biryani1.jpg', true,  0),
  (2,  1, 'Mutton Biryani',    'https://foodish-api.com/images/biryani/biryani20.jpg', true,  1),
  (3,  1, 'Beef Nihari',       'https://foodish-api.com/images/butter-chicken/butter-chicken12.jpg', true,  2),
  (4,  1, 'Chicken Karahi',    'https://www.themealdb.com/images/media/meals/wyxwsp1486979827.jpg', true,  3),
  (5,  1, 'Mutton Karahi',     'https://foodish-api.com/images/butter-chicken/butter-chicken5.jpg', true,  4),
  (6,  1, 'Seekh Kebab',       'https://www.themealdb.com/images/media/meals/04axct1763793018.jpg', true,  5),
  (7,  1, 'Chapli Kebab',      'https://www.themealdb.com/images/media/meals/prjve31763486864.jpg', true,  6),
  (8,  1, 'Chicken Tikka',     'https://www.themealdb.com/images/media/meals/qptpvt1487339892.jpg', true,  7),
  (9,  1, 'Malai Boti',        'https://www.themealdb.com/images/media/meals/3um6il1763794322.jpg', true,  8),
  (10, 1, 'Reshmi Kebab',      'https://www.themealdb.com/images/media/meals/kv6hj1598733479.jpg', true,  9),
  (11, 1, 'Chicken Haleem',    'https://foodish-api.com/images/butter-chicken/butter-chicken8.jpg', true,  10),
  (12, 1, 'Beef Haleem',       'https://foodish-api.com/images/butter-chicken/butter-chicken15.jpg', true,  11),
  (13, 1, 'Daal Chawal',       'https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg', true,  12),
  (14, 1, 'Chicken Korma',     'https://www.themealdb.com/images/media/meals/vwrpps1503068729.jpg', true,  13),
  (15, 1, 'Palak Gosht',       'https://www.themealdb.com/images/media/meals/xsurp1511304301.jpg', true,  14),
  (16, 1, 'Aloo Gosht',        'https://www.themealdb.com/images/media/meals/sypxpx1515365095.jpg', true,  15),
  (17, 1, 'Plain Naan',        'https://foodish-api.com/images/dosa/dosa1.jpg', true,  16),
  (18, 1, 'Roghni Naan',       'https://foodish-api.com/images/dosa/dosa10.jpg', true,  17),
  (19, 1, 'Garlic Naan',       'https://foodish-api.com/images/dosa/dosa15.jpg', true,  18),
  (20, 1, 'Tandoori Roti',     'https://foodish-api.com/images/dosa/dosa20.jpg', true,  19),
  (21, 1, 'Paratha',           'https://foodish-api.com/images/dosa/dosa25.jpg', true,  20),
  (22, 1, 'Butter Chicken',    'https://foodish-api.com/images/butter-chicken/butter-chicken1.jpg', true,  21),
  (23, 1, 'Chicken Handi',     'https://www.themealdb.com/images/media/meals/er4d081765186828.jpg', true,  22),
  (24, 1, 'Brain Masala',      'https://foodish-api.com/images/butter-chicken/butter-chicken18.jpg', true,  23),
  (25, 1, 'Paya',              'https://foodish-api.com/images/butter-chicken/butter-chicken20.jpg', true,  24),
  (26, 1, 'Raita',             'https://foodish-api.com/images/rice/rice10.jpg', true,  25),
  (27, 1, 'Green Salad',       'https://www.themealdb.com/images/media/meals/fqpml1764359125.jpg', true,  26),
  (28, 1, 'Russian Salad',     'https://www.themealdb.com/images/media/meals/ebvuir1699013165.jpg', true,  27),
  (29, 1, 'Chicken Shawarma',  'https://www.themealdb.com/images/media/meals/hcg6l91763596970.jpg', true,  28),
  (30, 1, 'Zinger Burger',     'https://foodish-api.com/images/burger/burger1.jpg', true,  29),
  (31, 1, 'Chicken Broast',    'https://www.themealdb.com/images/media/meals/tyywsw1505930373.jpg', true,  30),
  (32, 1, 'French Fries',      'https://foodish-api.com/images/burger/burger40.jpg', true,  31),
  (33, 1, 'Chicken Sandwich',  'https://www.themealdb.com/images/media/meals/sbx7n71587673021.jpg', true,  32),
  (34, 1, 'Club Sandwich',     'https://www.themealdb.com/images/media/meals/xr0n4r1576788363.jpg', true,  33),
  (35, 1, 'Chicken Roll',      'https://www.themealdb.com/images/media/meals/ae6clc1760524712.jpg', true,  34),
  (36, 1, 'Pepsi',             'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=300&fit=crop', true,  35),
  (37, 1, '7UP',               'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop', true,  36),
  (38, 1, 'Mineral Water',     'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop', true,  37),
  (39, 1, 'Fresh Lime Water',  'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&h=300&fit=crop', true,  38),
  (40, 1, 'Lassi',             'https://images.unsplash.com/photo-1587049016823-69ef9d68bd44?w=400&h=300&fit=crop', true,  39),
  (41, 1, 'Chai',              'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&h=300&fit=crop', true,  40),
  (42, 1, 'Kashmiri Chai',     'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=400&h=300&fit=crop', true,  41),
  (43, 1, 'Gulab Jamun',       'https://foodish-api.com/images/dessert/dessert1.jpg', true,  42),
  (44, 1, 'Kheer',             'https://foodish-api.com/images/dessert/dessert10.jpg', true,  43),
  (45, 1, 'Firni',             'https://foodish-api.com/images/dessert/dessert15.jpg', true,  44),
  (46, 1, 'Chicken Chowmein',  'https://www.themealdb.com/images/media/meals/zry07j1763779321.jpg', true,  45),
  (47, 1, 'Fried Rice',        'https://foodish-api.com/images/rice/rice1.jpg', true,  46),
  (48, 1, 'Chana Chaat',       'https://foodish-api.com/images/samosa/samosa1.jpg', false, 47),
  (49, 1, 'Dahi Bhalla',       'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop', true,  48),
  (50, 1, 'Gola Ganda',        'https://images.unsplash.com/photo-1558857563-b371033873b8?w=400&h=300&fit=crop', false, 49);

-- Variants for Karachi Kitchen items (variant ids: 1–80)
INSERT INTO item_variants (id, item_id, label, price, is_active, sort_order)
OVERRIDING SYSTEM VALUE VALUES
  -- 1. Chicken Biryani
  (1,  1, 'Half', 250, true, 0),
  (2,  1, 'Full', 450, true, 1),
  -- 2. Mutton Biryani
  (3,  2, 'Half', 350, true, 0),
  (4,  2, 'Full', 650, true, 1),
  -- 3. Beef Nihari
  (5,  3, 'Single', 350, true, 0),
  (6,  3, 'Double', 600, true, 1),
  -- 4. Chicken Karahi
  (7,  4, 'Half KG', 900,  true, 0),
  (8,  4, 'Full KG', 1700, true, 1),
  -- 5. Mutton Karahi
  (9,  5, 'Half KG', 1400, true, 0),
  (10, 5, 'Full KG', 2600, true, 1),
  -- 6. Seekh Kebab
  (11, 6, 'Default', 80, true, 0),
  -- 7. Chapli Kebab
  (12, 7, 'Default', 120, true, 0),
  -- 8. Chicken Tikka
  (13, 8, 'Half', 350, true, 0),
  (14, 8, 'Full', 650, true, 1),
  -- 9. Malai Boti
  (15, 9, 'Default', 400, true, 0),
  -- 10. Reshmi Kebab
  (16, 10, 'Default', 100, true, 0),
  -- 11. Chicken Haleem
  (17, 11, 'Small', 200, true, 0),
  (18, 11, 'Large', 350, true, 1),
  -- 12. Beef Haleem
  (19, 12, 'Small', 250, true, 0),
  (20, 12, 'Large', 400, true, 1),
  -- 13. Daal Chawal
  (21, 13, 'Default', 180, true, 0),
  -- 14. Chicken Korma
  (22, 14, 'Default', 300, true, 0),
  -- 15. Palak Gosht
  (23, 15, 'Default', 350, true, 0),
  -- 16. Aloo Gosht
  (24, 16, 'Default', 320, true, 0),
  -- 17. Plain Naan
  (25, 17, 'Default', 20, true, 0),
  -- 18. Roghni Naan
  (26, 18, 'Default', 40, true, 0),
  -- 19. Garlic Naan
  (27, 19, 'Default', 50, true, 0),
  -- 20. Tandoori Roti
  (28, 20, 'Default', 15, true, 0),
  -- 21. Paratha
  (29, 21, 'Plain', 30,  true, 0),
  (30, 21, 'Aloo',  60,  true, 1),
  (31, 21, 'Keema', 80,  true, 2),
  -- 22. Butter Chicken
  (32, 22, 'Default', 380, true, 0),
  -- 23. Chicken Handi
  (33, 23, 'Half KG', 850,  true, 0),
  (34, 23, 'Full KG', 1600, true, 1),
  -- 24. Brain Masala
  (35, 24, 'Default', 500, true, 0),
  -- 25. Paya
  (36, 25, 'Single', 300, true, 0),
  (37, 25, 'Double', 550, true, 1),
  -- 26. Raita
  (38, 26, 'Default', 50, true, 0),
  -- 27. Green Salad
  (39, 27, 'Default', 80, true, 0),
  -- 28. Russian Salad
  (40, 28, 'Default', 150, true, 0),
  -- 29. Chicken Shawarma
  (41, 29, 'Regular', 200, true, 0),
  (42, 29, 'Jumbo',   350, true, 1),
  -- 30. Zinger Burger
  (43, 30, 'Single', 350, true, 0),
  (44, 30, 'Double', 550, true, 1),
  -- 31. Chicken Broast
  (45, 31, '2 Piece', 350, true, 0),
  (46, 31, '4 Piece', 650, true, 1),
  -- 32. French Fries
  (47, 32, 'Regular', 150, true, 0),
  (48, 32, 'Large',   250, true, 1),
  -- 33. Chicken Sandwich
  (49, 33, 'Default', 250, true, 0),
  -- 34. Club Sandwich
  (50, 34, 'Default', 350, true, 0),
  -- 35. Chicken Roll
  (51, 35, 'Default', 180, true, 0),
  -- 36. Pepsi
  (52, 36, 'Can',   100, true, 0),
  (53, 36, '500ml', 80,  true, 1),
  (54, 36, '1.5L',  150, true, 2),
  -- 37. 7UP
  (55, 37, 'Can',   100, true, 0),
  (56, 37, '500ml', 80,  true, 1),
  -- 38. Mineral Water
  (57, 38, 'Small', 50,  true, 0),
  (58, 38, '1.5L',  100, true, 1),
  -- 39. Fresh Lime Water
  (59, 39, 'Default', 80, true, 0),
  -- 40. Lassi
  (60, 40, 'Sweet', 120, true, 0),
  (61, 40, 'Salt',  120, true, 1),
  (62, 40, 'Mango', 180, true, 2),
  -- 41. Chai
  (63, 41, 'Regular',     50, true, 0),
  (64, 41, 'Doodh Patti', 80, true, 1),
  -- 42. Kashmiri Chai
  (65, 42, 'Default', 120, true, 0),
  -- 43. Gulab Jamun
  (66, 43, '2 Piece', 80,  true, 0),
  (67, 43, '4 Piece', 150, true, 1),
  -- 44. Kheer
  (68, 44, 'Default', 150, true, 0),
  -- 45. Firni
  (69, 45, 'Default', 120, true, 0),
  -- 46. Chicken Chowmein
  (70, 46, 'Default', 300, true, 0),
  -- 47. Fried Rice
  (71, 47, 'Chicken', 300, true, 0),
  (72, 47, 'Egg',     220, true, 1),
  -- 48. Chana Chaat (inactive)
  (73, 48, 'Default', 100, true, 0),
  -- 49. Dahi Bhalla
  (74, 49, 'Default', 120, true, 0),
  -- 50. Gola Ganda (inactive)
  (75, 50, 'Default', 50, true, 0);

-- ============================================================
-- ITEMS + VARIANTS — Lahore Dhaba (restaurant_id = 2, 5 items)
-- item ids: 51–55
-- ============================================================
INSERT INTO items (id, restaurant_id, name, image_url, is_active, sort_order)
OVERRIDING SYSTEM VALUE VALUES
  (51, 2, 'Siri Paya',     'https://foodish-api.com/images/butter-chicken/butter-chicken3.jpg', true, 0),
  (52, 2, 'Lahori Fish',   'https://www.themealdb.com/images/media/meals/1520084413.jpg', true, 1),
  (53, 2, 'Tawa Chicken',  'https://www.themealdb.com/images/media/meals/pqulvm1763282839.jpg', true, 2),
  (54, 2, 'Naan',          'https://foodish-api.com/images/dosa/dosa5.jpg', true, 3),
  (55, 2, 'Lassi',         'https://images.unsplash.com/photo-1587049016823-69ef9d68bd44?w=400&h=300&fit=crop', true, 4);

INSERT INTO item_variants (id, item_id, label, price, is_active, sort_order)
OVERRIDING SYSTEM VALUE VALUES
  (76, 51, 'Half', 280, true, 0),
  (77, 51, 'Full', 500, true, 1),
  (78, 52, 'Default', 450, true, 0),
  (79, 53, 'Half KG', 750,  true, 0),
  (80, 53, 'Full KG', 1400, true, 1),
  (81, 54, 'Plain',  15, true, 0),
  (82, 54, 'Butter', 30, true, 1),
  (83, 55, 'Default', 100, true, 0);

-- Reset sequences so next auto-generated ids start after seeds
SELECT setval(pg_get_serial_sequence('items', 'id'), 55);
SELECT setval(pg_get_serial_sequence('item_variants', 'id'), 83);

-- ============================================================
-- Islamabad Cafe (restaurant_id = 3): 0 items — empty restaurant
-- ============================================================

-- ============================================================
-- SAMPLE ORDERS for Karachi Kitchen
-- order ids: 1, 2, 3
-- ============================================================
INSERT INTO orders (id, restaurant_id, operator_id, order_number, total_amount, status, note, created_at)
OVERRIDING SYSTEM VALUE VALUES
  (1, 1, 'aaaaaaaa-0000-0000-0000-000000000002', 1, 580,  'confirmed', NULL,               now() - interval '3 hours'),
  (2, 1, 'aaaaaaaa-0000-0000-0000-000000000002', 2, 1850, 'confirmed', 'Extra spicy karahi', now() - interval '2 hours'),
  (3, 1, 'aaaaaaaa-0000-0000-0000-000000000003', 3, 250,  'cancelled', 'Customer left',      now() - interval '1 hour');

-- Order 1 items: Chicken Biryani Full(2) + Raita(38) + Fresh Lime Water(59)
INSERT INTO order_items (id, order_id, item_variant_id, item_name, variant_label, quantity, unit_price, subtotal)
OVERRIDING SYSTEM VALUE VALUES
  (1, 1, 2,  'Chicken Biryani',  'Full',    1, 450, 450),
  (2, 1, 38, 'Raita',            'Default', 1, 50,  50),
  (3, 1, 59, 'Fresh Lime Water', 'Default', 1, 80,  80);

-- Order 2 items: Chicken Karahi Full KG(8) + Plain Naan(25) x5 + Raita(38)
INSERT INTO order_items (id, order_id, item_variant_id, item_name, variant_label, quantity, unit_price, subtotal)
OVERRIDING SYSTEM VALUE VALUES
  (4, 2, 8,  'Chicken Karahi', 'Full KG', 1, 1700, 1700),
  (5, 2, 25, 'Plain Naan',    'Default', 5, 20,   100),
  (6, 2, 38, 'Raita',         'Default', 1, 50,   50);

-- Order 3 items: Chicken Biryani Half(1) — cancelled order
INSERT INTO order_items (id, order_id, item_variant_id, item_name, variant_label, quantity, unit_price, subtotal)
OVERRIDING SYSTEM VALUE VALUES
  (7, 3, 1, 'Chicken Biryani', 'Half', 1, 250, 250);

-- Reset sequences
SELECT setval(pg_get_serial_sequence('orders', 'id'), 3);
SELECT setval(pg_get_serial_sequence('order_items', 'id'), 7);
