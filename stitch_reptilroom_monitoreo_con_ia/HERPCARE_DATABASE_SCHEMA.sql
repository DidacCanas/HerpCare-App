-- HERPCARE_DATABASE_SCHEMA.sql
-- Definición completa del modelo de datos para HerpCare en PostgreSQL (Supabase)

-- 1. Esquema principal: public
CREATE SCHEMA IF NOT EXISTS public;

-- 2. Tabla de perfiles (extiende usuarios de Supabase)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Tabla de reptiles (entidad principal)
CREATE TABLE public.reptiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  morph TEXT,
  sex TEXT CHECK (sex IN ('Macho', 'Hembra', 'No sexado')),
  enclosure TEXT,
  microchip_id TEXT,
  status TEXT DEFAULT 'Activo' CHECK (status IN ('Activo', 'En tratamiento', 'Cedido', 'Fallecido')),
  birth_date DATE,
  acquisition_date DATE,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Tablas históricas (registro de eventos periódicos)
-- 4.1. Peso
CREATE TABLE public.weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reptile_id UUID NOT NULL REFERENCES public.reptiles (id) ON DELETE CASCADE,
  value NUMERIC NOT NULL CHECK (value > 0),
  unit TEXT NOT NULL CHECK (unit IN ('g', 'kg')),
  weight_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4.2. Longitud
CREATE TABLE public.length_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reptile_id UUID NOT NULL REFERENCES public.reptiles (id) ON DELETE CASCADE,
  value NUMERIC NOT NULL CHECK (value > 0),
  unit TEXT NOT NULL CHECK (unit IN ('mm', 'cm')),
  length_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4.3. Alimentación
CREATE TABLE public.feeding_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reptile_id UUID NOT NULL REFERENCES public.reptiles (id) ON DELETE CASCADE,
  prey_type TEXT NOT NULL,
  prey_size TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  accepted BOOLEAN NOT NULL DEFAULT FALSE,
  feeding_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4.4. Muda
CREATE TABLE public.shedding_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reptile_id UUID NOT NULL REFERENCES public.reptiles (id) ON DELETE CASCADE,
  complete BOOLEAN NOT NULL DEFAULT FALSE,
  shed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4.5. Clima
CREATE TABLE public.climate_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reptile_id UUID NOT NULL REFERENCES public.reptiles (id) ON DELETE CASCADE,
  temp_hot REAL,
  temp_cool REAL,
  humidity REAL,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4.5. Incidentes térmicos
CREATE TABLE public.thermal_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reptile_id UUID NOT NULL REFERENCES public.reptiles (id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('Overheat', 'Overcool', 'Humidity', 'Power', 'Other')),
  severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High')),
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4.6. Períodos de brumación
CREATE TABLE public.brumation_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reptile_id UUID NOT NULL REFERENCES public.reptiles (id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL CHECK (end_date >= start_date),
  status TEXT DEFAULT 'En brumación' CHECK (status IN ('En brumación', 'Comenzado', 'Terminado', 'Cancelado')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4.7. Diagnósticos de salud
CREATE TABLE public.health_diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reptile_id UUID NOT NULL REFERENCES public.reptiles (id) ON DELETE CASCADE,
  symptom_text TEXT NOT NULL,
  diagnosis_result TEXT,
  confidence REAL CHECK (confidence BETWEEN 0 AND 1),
  recommendations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4.8. Fotos
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reptile_id UUID NOT NULL REFERENCES public.reptiles (id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Índices recomendados
CREATE INDEX idx_reptiles_user_id ON public.reptiles (user_id);
CREATE INDEX idx_reptiles_status ON public.reptiles (status);
CREATE INDEX idx_weight_logs_reptile_date ON public.weight_logs (reptile_id, weight_date);
CREATE INDEX idx_length_logs_reptile_date ON public.length_logs (reptile_id, length_date);
CREATE INDEX idx_feeding_logs_reptile_date ON public.feeding_logs (reptile_id, feeding_date);
CREATE INDEX idx_climate_logs_reptile_time ON public.climate_logs (reptile_id, timestamp);
CREATE INDEX idx_thermal_incidents_reptile_time ON public.thermal_incidents (reptile_id, timestamp);
CREATE INDEX idx_brumation_periods_reptile ON public.brumation_periods (reptile_id, start_date, end_date);
CREATE INDEX idx_health_diagnoses_reptile_time ON public.health_diagnoses (reptile_id, created_at);
CREATE INDEX idx_photos_reptile_time ON public.photos (reptile_id, uploaded_at);

-- 6. Triggers para actualización automática de timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reptiles_timestamp
BEFORE UPDATE ON public.reptiles
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_weight_logs_timestamp
BEFORE UPDATE ON public.weight_logs
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_length_logs_timestamp
BEFORE UPDATE ON public.length_logs
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_feeding_logs_timestamp
BEFORE UPDATE ON public.feeding_logs
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_shedding_logs_timestamp
BEFORE UPDATE ON public.shedding_logs
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_climate_logs_timestamp
BEFORE UPDATE ON public.climate_logs
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_thermal_incidents_timestamp
BEFORE UPDATE ON public.thermal_incidents
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_brumation_periods_timestamp
BEFORE UPDATE ON public.brumation_periods
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_health_diagnoses_timestamp
BEFORE UPDATE ON public.health_diagnoses
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_photos_timestamp
BEFORE UPDATE ON public.photos
FOR EACH ROW EXECUTE FUNCTION update_timestamp();