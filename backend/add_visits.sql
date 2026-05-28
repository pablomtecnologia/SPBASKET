-- Script para añadir 658 visitas iniciales
DO $$
BEGIN
    FOR i IN 1..658 LOOP
        INSERT INTO site_visits (ip_address, visited_at) 
        VALUES ('0.0.0.0', NOW() - (random() * interval '30 days'));
    END LOOP;
END $$;
