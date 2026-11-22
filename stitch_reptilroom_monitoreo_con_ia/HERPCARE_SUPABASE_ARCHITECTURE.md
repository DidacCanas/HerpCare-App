# Arquitectura Definitiva de Supabase — HerpCare

## 1. Visión General y Principios de Diseño
HerpCare está diseñado como una aplicación **Local-First / PWA** en JavaScript Vanilla que funciona de forma fluida tanto online como offline. La incorporación de **Supabase** como backend relacional aporta persistencia en la nube, autenticación segura y sincronización multi-dispositivo sin alterar la ligereza ni la estructura original del frontend.

### Pilares arquitectónicos:
1. **Aislamiento por Usuario (Multi-tenancy):** Cada usuario autenticado gestiona exclusivamente sus propios datos mediante políticas estrictas de seguridad a nivel de fila (**RLS - Row Level Security**).
2. **Modelo Relacional Jerárquico:**
   - `auth.users` (gestionado por Supabase Auth) es la raíz de identidad.
   - `public.profiles` extiende la información del usuario.
   - `public.reptiles` pertenece a un único usuario (`user_id`).
   - Las tablas históricas (`weight_logs`, `feeding_logs`, etc.) y multimedia (`photos`) dependen directamente de `reptile_id` (y por herencia de propiedad del usuario).
3. **Local-First con Sincronización Transparente:** La capa de datos actual (`data_service.js`) puede operar con almacenamiento local (`localStorage` / IndexedDB) como caché y sincronizarse con Supabase mediante identificadores universales (`UUID v4`).

---

## 2. Diagrama de Entidad-Relación (ERD)

```text
auth.users (Supabase Auth)
  │ (1:1)
  ├──► public.profiles (id, full_name, avatar_url, preferences, updated_at)
  │
  └──► public.reptiles (id, user_id, name, species, morph, sex, enclosure, microchip_id, status, birth_date, acquisition_date, notes, photo_url, created_at, updated_at)
         │
         ├── (1:N) ──► public.weight_logs (id, reptile_id, value, unit, weight_date, notes, created_at)
         ├── (1:N) ──► public.length_logs (id, reptile_id, value, unit, length_date, notes, created_at)
         ├── (1:N) ──► public.feeding_logs (id, reptile_id, prey_type, prey_size, quantity, accepted, feeding_date, notes, created_at)
         ├── (1:N) ──► public.shedding_logs (id, reptile_id, complete, shed_date, notes, created_at)
         ├── (1:N) ──► public.climate_logs (id, reptile_id, temp_hot, temp_cool, humidity, timestamp, notes, created_at)
         ├── (1:N) ──► public.thermal_incidents (id, reptile_id, incident_type, severity, timestamp, notes, created_at)
         ├── (1:N) ──► public.brumation_periods (id, reptile_id, start_date, end_date, status, notes, created_at)
         ├── (1:N) ──► public.health_diagnoses (id, reptile_id, symptom_text, diagnosis_result, confidence, recommendations, created_at)
         └── (1:N) ──► public.photos (id, reptile_id, storage_path, caption, uploaded_at)
```

---

## 3. Catálogo de Entidades y Campos

### 3.1. Tabla `profiles`
Extiende el registro de autenticación de Supabase.
- `id` (UUID, PK, FK a `auth.users.id`): Identificador único del usuario.
- `full_name` (TEXT): Nombre completo o alias del cuidador.
- `avatar_url` (TEXT): Enlace a la foto de perfil.
- `preferences` (JSONB): Preferencias de la interfaz (ej. modo oscuro, unidades métricas).
- `updated_at` (TIMESTAMPTZ): Última actualización de perfil.

### 3.2. Tabla `reptiles`
Ficha principal de cada ejemplar en el criadero / terrario.
- `id` (UUID, PK): Identificador universal único.
- `user_id` (UUID, FK a `profiles.id`, NOT NULL): Propietario del animal.
- `name` (TEXT, NOT NULL): Nombre o código del reptil.
- `species` (TEXT, NOT NULL): Especie (ej. *Python regius*, *Correlophus ciliatus*).
- `morph` (TEXT): Fase o morfo genético.
- `sex` (TEXT): 'Macho', 'Hembra' o 'No sexado'.
- `enclosure` (TEXT): Identificador del terrario o rack.
- `microchip_id` (TEXT): Número de microchip identificativo.
- `status` (TEXT): Estado actual (ej. 'Activo', 'En tratamiento', 'Cedido', 'Fallecido').
- `birth_date` (DATE): Fecha de nacimiento aproximada o exacta.
- `acquisition_date` (DATE): Fecha de adquisición.
- `notes` (TEXT): Observaciones generales del ejemplar.
- `photo_url` (TEXT): URL de la fotografía de portada.
- `created_at` / `updated_at` (TIMESTAMPTZ): Trazabilidad temporal.

### 3.3. Tablas Históricas (Registros Periódicos)
Todas vinculadas a `reptiles(id)` con eliminación en cascada (`ON DELETE CASCADE`):
- **`weight_logs`**: Registro de pesos (`value` numérico, `unit` ('g'/'kg'), `weight_date`, `notes`).
- **`length_logs`**: Registro de longitud (`value`, `unit` ('cm'/'mm'), `length_date`, `notes`).
- **`feeding_logs`**: Control de alimentación (`prey_type`, `prey_size`, `quantity`, `accepted` BOOLEAN, `feeding_date`, `notes`).
- **`shedding_logs`**: Control de mudas (`complete` BOOLEAN o calidad, `shed_date`, `notes`).
- **`climate_logs`**: Parámetros ambientales (`temp_hot`, `temp_cool`, `humidity`, `timestamp`, `notes`).
- **`thermal_incidents`**: Alertas de temperatura / anomalías (`incident_type`, `severity`, `timestamp`, `notes`).
- **`brumation_periods`**: Ciclos de brumación (`start_date`, `end_date`, `status`, `notes`).
- **`health_diagnoses`**: Informes de IA y salud (`symptom_text`, `diagnosis_result`, `confidence`, `recommendations`, `created_at`).
- **`photos`**: Galería fotográfica por ejemplar (`storage_path`, `caption`, `uploaded_at`).

---

## 4. Seguridad y Row Level Security (RLS)
El modelo garantiza que:
1. **Aislamiento absoluto:** Ningún usuario puede leer ni modificar los reptiles o historiales de otro usuario.
2. **Validación en Base de Datos:** Las políticas RLS comprueban en cada sentencia `SELECT`, `INSERT`, `UPDATE` y `DELETE` que `user_id = auth.uid()` o que el registro histórico pertenece a un reptil cuyo propietario es `auth.uid()`.
3. **Protección de Identidad:** El campo `user_id` en `reptiles` no puede modificarse de forma arbitraria tras la inserción.

---

## 5. Estrategia Storage
- **Bucket privado:** `reptile-media` (Almacenamiento seguro de fotografías de animales y terrarios).
- Las imágenes solo son accesibles mediante URLs firmadas temporalmente o validando la propiedad del usuario autenticado sobre el reptil correspondiente.
