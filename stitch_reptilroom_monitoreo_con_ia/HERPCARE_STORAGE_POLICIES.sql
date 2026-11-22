-- HERPCARE_STORAGE_POLICIES.sql
-- Configuración y políticas de seguridad para los buckets de Storage en Supabase

-- 1. Crear el bucket privado 'reptile-media' para fotos de reptiles y terrarios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reptile-media',
  'reptile-media',
  FALSE, -- Bucket privado por defecto
  10485760, -- Límite de 10 MB por archivo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

-- 2. Políticas RLS para el bucket 'reptile-media' en storage.objects

-- 2.1. Permitir lectura de objetos solo al propietario del reptil asociado
CREATE POLICY "Private Read Reptile Media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'reptile-media' AND
  auth.role() = 'authenticated' AND
  (
    -- El nombre del archivo/ruta contiene o está asociado a un reptil del usuario
    EXISTS (
      SELECT 1 FROM public.reptiles
      WHERE reptiles.user_id = auth.uid()
      AND (storage.objects.name LIKE '%' || reptiles.id || '%')
    )
  )
);

-- 2.2. Permitir inserción de objetos solo a usuarios autenticados para sus propios reptiles
CREATE POLICY "Private Insert Reptile Media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'reptile-media' AND
  auth.role() = 'authenticated' AND
  (
    EXISTS (
      SELECT 1 FROM public.reptiles
      WHERE reptiles.user_id = auth.uid()
      AND (storage.objects.name LIKE '%' || reptiles.id || '%')
    )
  )
);

-- 2.3. Permitir borrado de objetos solo al propietario
CREATE POLICY "Private Delete Reptile Media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'reptile-media' AND
  auth.role() = 'authenticated' AND
  (
    EXISTS (
      SELECT 1 FROM public.reptiles
      WHERE reptiles.user_id = auth.uid()
      AND (storage.objects.name LIKE '%' || reptiles.id || '%')
    )
  )
);