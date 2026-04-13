-- Seed: Modelos Avigilon en catalogo global + Camaras para Calimax
-- camera_ip = 32e53342-6128-4436-900f-79ac988fe7bc
-- camera_ptz = f15c2110-84ca-456d-a009-c704aaa58782
-- camera_thermal = b51f1fcc-087b-48b1-b22b-ef3936fef4de
-- Calimax tenant = 7a55360c-232d-43ea-b3f9-830f9f06fcab
-- Site Centro = ca11aa00-0001-4000-8000-000000000001
-- Site Otay   = ca11aa00-0002-4000-8000-000000000002

-- ============ MARCA AVIGILON ============
INSERT INTO inventory.brands (id, name, created_at)
VALUES ('a1b2c3d4-0001-4000-8000-000000000001', 'Avigilon', NOW())
ON CONFLICT DO NOTHING;

-- ============ MODELOS CATALOGO GLOBAL ============
INSERT INTO inventory.models (id, brand_id, equipment_type_id, name, part_number, specifications, is_active, created_at)
VALUES
  ('a1900001-0001-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', '32e53342-6128-4436-900f-79ac988fe7bc',
   'H6 Mini Dome', 'H6M-DO1', '{"resolution":"2/3/5 MP","type":"Minidomo","ir":true,"wdr":true,"poe":true,"analytics":"Avigilon Appearance Search"}', true, NOW()),
  ('a1900001-0002-4000-8000-000000000002', 'a1b2c3d4-0001-4000-8000-000000000001', '32e53342-6128-4436-900f-79ac988fe7bc',
   'H5 Pro', 'H5PRO', '{"resolution":"8/16/26/40/61 MP","type":"Fija alta resolucion","ir":false,"wdr":true,"lightcatcher":true}', true, NOW()),
  ('a1900001-0003-4000-8000-000000000003', 'a1b2c3d4-0001-4000-8000-000000000001', '32e53342-6128-4436-900f-79ac988fe7bc',
   'H5A Dome', 'H5A-DO', '{"resolution":"2/4/5/6/8 MP","type":"Domo","ir":true,"wdr":true,"analytics":"Self-Learning Video Analytics"}', true, NOW()),
  ('a1900001-0004-4000-8000-000000000004', 'a1b2c3d4-0001-4000-8000-000000000001', '32e53342-6128-4436-900f-79ac988fe7bc',
   'H5A Bullet', 'H5A-BU', '{"resolution":"2/4/5/6/8 MP","type":"Bala","ir":true,"wdr":true,"ik10":true}', true, NOW()),
  ('a1900001-0005-4000-8000-000000000005', 'a1b2c3d4-0001-4000-8000-000000000001', '32e53342-6128-4436-900f-79ac988fe7bc',
   'H5A Fisheye', 'H5A-FE', '{"resolution":"8/12 MP","type":"Ojo de pez","ir":true,"dewarping":true,"panoramic":true}', true, NOW()),
  ('a1900001-0006-4000-8000-000000000006', 'a1b2c3d4-0001-4000-8000-000000000001', '32e53342-6128-4436-900f-79ac988fe7bc',
   'H5A Corner', 'H5A-CR', '{"resolution":"3/5 MP","type":"Esquina antivandalica","ir":true,"ik10":true,"ligature_resistant":true}', true, NOW()),
  ('a1900001-0007-4000-8000-000000000007', 'a1b2c3d4-0001-4000-8000-000000000001', '32e53342-6128-4436-900f-79ac988fe7bc',
   'H5A Dual Head', 'H5A-DH', '{"resolution":"2x3/2x5 MP","type":"Doble sensor","ir":true,"dual_imager":true}', true, NOW()),
  ('a1900001-0008-4000-8000-000000000008', 'a1b2c3d4-0001-4000-8000-000000000001', 'f15c2110-84ca-456d-a009-c704aaa58782',
   'H5A PTZ', 'H5A-PTZ', '{"resolution":"2/4/8 MP","type":"PTZ","zoom":"36x optico","ir":false,"wdr":true}', true, NOW()),
  ('a1900001-0009-4000-8000-000000000009', 'a1b2c3d4-0001-4000-8000-000000000001', 'f15c2110-84ca-456d-a009-c704aaa58782',
   'H5A IR PTZ', 'H5A-IRPTZ', '{"resolution":"2/4/8 MP","type":"PTZ IR","zoom":"36x optico","ir":true,"ir_distance":"200m"}', true, NOW()),
  ('a1900001-000a-4000-8000-00000000000a', 'a1b2c3d4-0001-4000-8000-000000000001', 'f15c2110-84ca-456d-a009-c704aaa58782',
   'H5A Rugged PTZ', 'H5A-RPTZ', '{"resolution":"2/4/8 MP","type":"PTZ rugged","zoom":"30x optico","ip67":true,"nema_4x":true}', true, NOW()),
  ('a1900001-000b-4000-8000-00000000000b', 'a1b2c3d4-0001-4000-8000-000000000001', '32e53342-6128-4436-900f-79ac988fe7bc',
   'H5SL', 'H5SL', '{"resolution":"hasta 5 MP","type":"Domo/Bala compacto","ir":true,"cost_effective":true}', true, NOW()),
  ('a1900001-000c-4000-8000-00000000000c', 'a1b2c3d4-0001-4000-8000-000000000001', '32e53342-6128-4436-900f-79ac988fe7bc',
   'H5M', 'H5M', '{"resolution":"hasta 5 MP","type":"Domo exterior compacto","ir":true,"ip66":true,"vandal_resistant":true}', true, NOW()),
  ('a1900001-000d-4000-8000-000000000d0d', 'a1b2c3d4-0001-4000-8000-000000000001', '32e53342-6128-4436-900f-79ac988fe7bc',
   'H4 Multisensor', 'H4-MS', '{"resolution":"9/12/15/20/24/32 MP total","type":"Multisensor","sensors":"3-4 sensores","panoramic":true}', true, NOW()),
  ('a1900001-000e-4000-8000-000000000e0e', 'a1b2c3d4-0001-4000-8000-000000000001', 'b51f1fcc-087b-48b1-b22b-ef3936fef4de',
   'H4 Thermal', 'H4-TH', '{"resolution":"320x256/640x512","type":"Termica","thermal":true,"analytics":"perimeter detection"}', true, NOW()),
  ('a1900001-000f-4000-8000-000000000f0f', 'a1b2c3d4-0001-4000-8000-000000000001', 'b51f1fcc-087b-48b1-b22b-ef3936fef4de',
   'H4 ETD', 'H4-ETD', '{"resolution":"640x512","type":"Termica deteccion temperatura","thermal":true,"temperature_screening":true}', true, NOW()),
  ('a1900001-0010-4000-8000-000000001010', 'a1b2c3d4-0001-4000-8000-000000000001', '32e53342-6128-4436-900f-79ac988fe7bc',
   'H4 Video Intercom', 'H4-VI', '{"resolution":"3 MP","type":"Intercom con video","audio":true,"intercom":true}', true, NOW()),
  ('a1900001-0011-4000-8000-000000001111', 'a1b2c3d4-0001-4000-8000-000000000001', '32e53342-6128-4436-900f-79ac988fe7bc',
   'H4 LPC', 'H4-LPC', '{"resolution":"3 MP","type":"LPR/Matriculas","lpr":true,"analytics":"License Plate Capture"}', true, NOW()),
  ('a1900001-0012-4000-8000-000000001212', 'a1b2c3d4-0001-4000-8000-000000000001', '32e53342-6128-4436-900f-79ac988fe7bc',
   'H5A Modular', 'H5A-MOD', '{"resolution":"3/5 MP","type":"Modular","covert":true,"discreet":true}', true, NOW())
ON CONFLICT DO NOTHING;

-- ============ CAMARAS PARA CALIMAX ============
-- Sucursal Centro: 12 camaras
-- Sucursal Otay: 8 camaras
-- Total: 20 camaras distribuidas

INSERT INTO inventory.cameras (
  id, tenant_id, site_id, model_id, name, camera_model_name, camera_type,
  ip_address, resolution, megapixels, area, status, installation_date,
  specifications, created_at
) VALUES
-- === SUCURSAL CENTRO (12 camaras) ===
-- H6 Mini Dome -> micro_dome
('ca000001-0001-4000-8000-000000000001', '7a55360c-232d-43ea-b3f9-830f9f06fcab', 'ca11aa00-0001-4000-8000-000000000001',
 'a1900001-0001-4000-8000-000000000001', 'CAM-CENTRO-001', 'H6 Mini Dome', 'micro_dome',
 '10.20.1.11', '2560x1920', 5, 'Entrada principal', 'active', '2024-06-15',
 '{"stream":"rtsp://10.20.1.11/live","ir":true}', NOW()),

('ca000001-0002-4000-8000-000000000002', '7a55360c-232d-43ea-b3f9-830f9f06fcab', 'ca11aa00-0001-4000-8000-000000000001',
 'a1900001-0001-4000-8000-000000000001', 'CAM-CENTRO-002', 'H6 Mini Dome', 'micro_dome',
 '10.20.1.12', '2048x1536', 3, 'Pasillo central', 'active', '2024-06-15',
 '{"stream":"rtsp://10.20.1.12/live","ir":true}', NOW()),

-- H5A Dome -> dome
('ca000001-0003-4000-8000-000000000003', '7a55360c-232d-43ea-b3f9-830f9f06fcab', 'ca11aa00-0001-4000-8000-000000000001',
 'a1900001-0003-4000-8000-000000000003', 'CAM-CENTRO-003', 'H5A Dome', 'dome',
 '10.20.1.13', '3072x2048', 6, 'Cajas registradoras', 'active', '2024-06-15',
 '{"stream":"rtsp://10.20.1.13/live","analytics":"SLVA"}', NOW()),

-- H5A Bullet -> bullet
('ca000001-0004-4000-8000-000000000004', '7a55360c-232d-43ea-b3f9-830f9f06fcab', 'ca11aa00-0001-4000-8000-000000000001',
 'a1900001-0004-4000-8000-000000000004', 'CAM-CENTRO-004', 'H5A Bullet', 'bullet',
 '10.20.1.14', '2592x1944', 5, 'Estacionamiento norte', 'active', '2024-07-01',
 '{"stream":"rtsp://10.20.1.14/live","ir":true,"outdoor":true}', NOW()),

('ca000001-0005-4000-8000-000000000005', '7a55360c-232d-43ea-b3f9-830f9f06fcab', 'ca11aa00-0001-4000-8000-000000000001',
 'a1900001-0004-4000-8000-000000000004', 'CAM-CENTRO-005', 'H5A Bullet', 'bullet',
 '10.20.1.15', '2592x1944', 5, 'Estacionamiento sur', 'active', '2024-07-01',
 '{"stream":"rtsp://10.20.1.15/live","ir":true,"outdoor":true}', NOW()),

-- H5A Fisheye -> fisheye
('ca000001-0006-4000-8000-000000000006', '7a55360c-232d-43ea-b3f9-830f9f06fcab', 'ca11aa00-0001-4000-8000-000000000001',
 'a1900001-0005-4000-8000-000000000005', 'CAM-CENTRO-006', 'H5A Fisheye', 'fisheye',
 '10.20.1.16', '4000x3000', 12, 'Piso de ventas central', 'active', '2024-07-01',
 '{"stream":"rtsp://10.20.1.16/live","panoramic":true}', NOW()),

-- H5A PTZ -> ptz
('ca000001-0007-4000-8000-000000000007', '7a55360c-232d-43ea-b3f9-830f9f06fcab', 'ca11aa00-0001-4000-8000-000000000001',
 'a1900001-0008-4000-8000-000000000008', 'CAM-CENTRO-007', 'H5A PTZ', 'ptz',
 '10.20.1.17', '3840x2160', 8, 'Perimetro', 'active', '2024-07-15',
 '{"stream":"rtsp://10.20.1.17/live","zoom":"36x","patrol":true}', NOW()),

-- H5A Corner -> dome (esquina montaje tipo domo)
('ca000001-0008-4000-8000-000000000008', '7a55360c-232d-43ea-b3f9-830f9f06fcab', 'ca11aa00-0001-4000-8000-000000000001',
 'a1900001-0006-4000-8000-000000000006', 'CAM-CENTRO-008', 'H5A Corner', 'dome',
 '10.20.1.18', '2592x1944', 5, 'Bodega esquina', 'active', '2024-07-15',
 '{"stream":"rtsp://10.20.1.18/live","antivandalica":true}', NOW()),

-- H4 Multisensor -> multisensor
('ca000001-0009-4000-8000-000000000009', '7a55360c-232d-43ea-b3f9-830f9f06fcab', 'ca11aa00-0001-4000-8000-000000000001',
 'a1900001-000d-4000-8000-000000000d0d', 'CAM-CENTRO-009', 'H4 Multisensor', 'multisensor',
 '10.20.1.19', '7680x4320', 20, 'Vista panoramica tienda', 'active', '2024-08-01',
 '{"stream":"rtsp://10.20.1.19/live","sensors":4}', NOW()),

-- H4 Thermal -> thermal
('ca000001-000a-4000-8000-00000000000a', '7a55360c-232d-43ea-b3f9-830f9f06fcab', 'ca11aa00-0001-4000-8000-000000000001',
 'a1900001-000e-4000-8000-000000000e0e', 'CAM-CENTRO-010', 'H4 Thermal', 'thermal',
 '10.20.1.20', '640x512', 0, 'Perimetro norte', 'active', '2024-08-01',
 '{"stream":"rtsp://10.20.1.20/live","thermal":true}', NOW()),

-- H4 LPC -> box
('ca000001-000b-4000-8000-00000000000b', '7a55360c-232d-43ea-b3f9-830f9f06fcab', 'ca11aa00-0001-4000-8000-000000000001',
 'a1900001-0011-4000-8000-000000001111', 'CAM-CENTRO-011', 'H4 LPC', 'box',
 '10.20.1.21', '2048x1536', 3, 'Acceso vehicular', 'active', '2024-08-01',
 '{"stream":"rtsp://10.20.1.21/live","lpr":true}', NOW()),

-- H5SL -> dome
('ca000001-000c-4000-8000-00000000000c', '7a55360c-232d-43ea-b3f9-830f9f06fcab', 'ca11aa00-0001-4000-8000-000000000001',
 'a1900001-000b-4000-8000-00000000000b', 'CAM-CENTRO-012', 'H5SL', 'dome',
 '10.20.1.22', '2592x1944', 5, 'Oficinas', 'active', '2024-06-15',
 '{"stream":"rtsp://10.20.1.22/live","compact":true}', NOW()),

-- === SUCURSAL OTAY (8 camaras) ===
('ca000002-0001-4000-8000-000000000001', '7a55360c-232d-43ea-b3f9-830f9f06fcab', 'ca11aa00-0002-4000-8000-000000000002',
 'a1900001-0001-4000-8000-000000000001', 'CAM-OTAY-001', 'H6 Mini Dome', 'micro_dome',
 '10.30.1.11', '2560x1920', 5, 'Entrada principal', 'active', '2024-09-01',
 '{"stream":"rtsp://10.30.1.11/live","ir":true}', NOW()),

('ca000002-0002-4000-8000-000000000002', '7a55360c-232d-43ea-b3f9-830f9f06fcab', 'ca11aa00-0002-4000-8000-000000000002',
 'a1900001-0003-4000-8000-000000000003', 'CAM-OTAY-002', 'H5A Dome', 'dome',
 '10.30.1.12', '3072x2048', 6, 'Cajas', 'active', '2024-09-01',
 '{"stream":"rtsp://10.30.1.12/live","analytics":"SLVA"}', NOW()),

('ca000002-0003-4000-8000-000000000003', '7a55360c-232d-43ea-b3f9-830f9f06fcab', 'ca11aa00-0002-4000-8000-000000000002',
 'a1900001-0004-4000-8000-000000000004', 'CAM-OTAY-003', 'H5A Bullet', 'bullet',
 '10.30.1.13', '2592x1944', 5, 'Estacionamiento', 'active', '2024-09-01',
 '{"stream":"rtsp://10.30.1.13/live","ir":true,"outdoor":true}', NOW()),

-- H5A IR PTZ -> ptz
('ca000002-0004-4000-8000-000000000004', '7a55360c-232d-43ea-b3f9-830f9f06fcab', 'ca11aa00-0002-4000-8000-000000000002',
 'a1900001-0009-4000-8000-000000000009', 'CAM-OTAY-004', 'H5A IR PTZ', 'ptz',
 '10.30.1.14', '3840x2160', 8, 'Perimetro', 'active', '2024-09-15',
 '{"stream":"rtsp://10.30.1.14/live","zoom":"36x","ir_distance":"200m"}', NOW()),

('ca000002-0005-4000-8000-000000000005', '7a55360c-232d-43ea-b3f9-830f9f06fcab', 'ca11aa00-0002-4000-8000-000000000002',
 'a1900001-0005-4000-8000-000000000005', 'CAM-OTAY-005', 'H5A Fisheye', 'fisheye',
 '10.30.1.15', '4000x3000', 12, 'Piso de ventas', 'active', '2024-09-15',
 '{"stream":"rtsp://10.30.1.15/live","panoramic":true}', NOW()),

-- H5M -> dome
('ca000002-0006-4000-8000-000000000006', '7a55360c-232d-43ea-b3f9-830f9f06fcab', 'ca11aa00-0002-4000-8000-000000000002',
 'a1900001-000c-4000-8000-00000000000c', 'CAM-OTAY-006', 'H5M', 'dome',
 '10.30.1.16', '2592x1944', 5, 'Acceso lateral', 'active', '2024-09-15',
 '{"stream":"rtsp://10.30.1.16/live","outdoor":true,"vandal_resistant":true}', NOW()),

-- H5A Modular -> box
('ca000002-0007-4000-8000-000000000007', '7a55360c-232d-43ea-b3f9-830f9f06fcab', 'ca11aa00-0002-4000-8000-000000000002',
 'a1900001-0012-4000-8000-000000001212', 'CAM-OTAY-007', 'H5A Modular', 'box',
 '10.30.1.17', '2592x1944', 5, 'Bodega covert', 'active', '2024-10-01',
 '{"stream":"rtsp://10.30.1.17/live","covert":true}', NOW()),

-- H5A Dual Head -> multisensor
('ca000002-0008-4000-8000-000000000008', '7a55360c-232d-43ea-b3f9-830f9f06fcab', 'ca11aa00-0002-4000-8000-000000000002',
 'a1900001-0007-4000-8000-000000000007', 'CAM-OTAY-008', 'H5A Dual Head', 'multisensor',
 '10.30.1.18', '2592x1944', 5, 'Pasillo doble vista', 'active', '2024-10-01',
 '{"stream":"rtsp://10.30.1.18/live","dual_imager":true}', NOW())
ON CONFLICT DO NOTHING;
