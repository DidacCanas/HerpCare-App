-- HERPCARE_RLS_POLICIES.sql
-- Políticas RLS (Row-Level Security) para garantizar que cada usuario solo acceda a sus propios datos

-- Nota: Todas las políticas aseguran que los usuarios solo pueden acceder a los registros
-- que pertenecen a ellos a través de la unión directa con public.profiles(user_id = auth.uid()).

-- 1. Perfiles
-- Los usuarios pueden leer, actualizar y eliminar únicamente su propio registro de perfil
CREATE POLICY allow_own_profiles ON public.profiles
FOR SELECT, INSERT, UPDATE, DELETE USING (id = auth.uid());

-- 2. Reptiles
-- Los dueños solo pueden leer, insertar, actualizar y eliminar sus propios reptiles
CREATE POLICY reptile_access_ownership ON public.reptiles
FOR SELECT, INSERT, UPDATE, DELETE USING (user_id = auth.uid());

-- 3. Tabla weight_logs (logs de peso)
-- Solo se permiten registros pertenecientes a reptiles del usuario
CREATE POLICY weight_logs_access_ownership ON public.weight_logs
FOR SELECT, INSERT, UPDATE, DELETE USING (EXISTS (
  SELECT 1 FROM public.reptiles
  WHERE reptiles.id = weight_logs.reptile_id
  AND reptiles.user_id = auth.uid()
));

-- 4. Tabla length_logs (logs de longitud)
CREATE POLICY length_logs_access_ownership ON public.length_logs
FOR SELECT, INSERT, UPDATE, DELETE USING (EXISTS (
  SELECT 1 FROM public.reptiles
  WHERE reptiles.id = length_logs.reptile_id
  AND reptiles.user_id = auth.uid()
));

-- 5. Tabla feeding_logs (logs de alimentación)
CREATE POLICY feeding_logs_access_ownership ON public.feeding_logs
FOR SELECT, INSERT, UPDATE, DELETE USING (EXISTS (
  SELECT 1 FROM public.reptiles
  WHERE reptiles.id = feeding_logs.reptile_id
  AND reptiles.user_id = auth.uid()
));

-- 6. Tabla shedding_logs (logs de muda)
CREATE POLICY shedding_logs_access_ownership ON public.shedding_logs
FOR SELECT, INSERT, UPDATE, DELETE USING (EXISTS (
  SELECT 1 FROM public.reptiles
  WHERE reptiles.id = shedding_logs.reptile_id
  AND reptiles.user_id = auth.uid()
));

-- 7. Tabla climate_logs (logs climáticos)
CREATE POLICY climate_logs_access_ownership ON public.climate_logs
FOR SELECT, INSERT, UPDATE, DELETE USING (EXISTS (
  SELECT 1 FROM public.reptiles
  WHERE reptiles.id = climate_logs.reptile_id
  AND reptiles.user_id = auth.uid()
));

-- 8. Tabla thermal_incidents (incidentes térmicos)
CREATE POLICY thermal_incidents_access_ownership ON public.thermal_incidents
FOR SELECT, INSERT, UPDATE, DELETE USING (EXISTS (
  SELECT 1 FROM public.reptiles
  WHERE reptiles.id = thermal_incidents.reptile_id
  AND reptiles.user_id = auth.uid()
));

-- 9. Tabla brumation_periods (períodos de brumación)
CREATE POLICY brumation_periods_access_ownership ON public.brumation_periods
FOR SELECT, INSERT, UPDATE, DELETE USING (EXISTS (
  SELECT 1 FROM public.reptiles
  WHERE reptiles.id = brumation_periods.reptile_id
  AND reptiles.user_id = auth.uid()
));

-- 10. Tabla health_diagnoses (diagnósticos de salud)
CREATE POLICY health_diagnoses_access_ownership ON public.health_diagnoses
FOR SELECT, INSERT, UPDATE, DELETE USING (EXISTS (
  SELECT 1 FROM public.reptiles
  WHERE reptiles.id = health_diagnoses.reptile_id
  AND reptiles.user_id = auth.uid()
));

-- 11. Tabla photos (fotografías)
CREATE POLICY photos_access_ownership ON public.photos
FOR SELECT, INSERT, UPDATE, DELETE USING (EXISTS (
  SELECT 1 FROM public.reptiles
  WHERE reptiles.id = photos.reptile_id
  AND reptiles.user_id = auth.uid()
));