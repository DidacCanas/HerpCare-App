---
name: Terrarium Bio-Minimalism
colors:
  surface: '#101412'
  surface-dim: '#101412'
  surface-bright: '#363a38'
  surface-container-lowest: '#0b0f0d'
  surface-container-low: '#181c1a'
  surface-container: '#1c201e'
  surface-container-high: '#272b29'
  surface-container-highest: '#323633'
  on-surface: '#e0e3df'
  on-surface-variant: '#c2c8c2'
  inverse-surface: '#e0e3df'
  inverse-on-surface: '#2d312f'
  outline: '#8c928c'
  outline-variant: '#424843'
  surface-tint: '#aeceb9'
  primary: '#aeceb9'
  on-primary: '#1a3627'
  primary-container: '#1e3a2b'
  on-primary-container: '#85a490'
  inverse-primary: '#486554'
  secondary: '#ffb59c'
  on-secondary: '#5c1900'
  secondary-container: '#832c07'
  on-secondary-container: '#ffa080'
  tertiary: '#b1cead'
  on-tertiary: '#1d361e'
  tertiary-container: '#223a22'
  on-tertiary-container: '#88a485'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#caead4'
  primary-fixed-dim: '#aeceb9'
  on-primary-fixed: '#042013'
  on-primary-fixed-variant: '#304d3d'
  secondary-fixed: '#ffdbcf'
  secondary-fixed-dim: '#ffb59c'
  on-secondary-fixed: '#390c00'
  on-secondary-fixed-variant: '#802a05'
  tertiary-fixed: '#cdebc8'
  tertiary-fixed-dim: '#b1cead'
  on-tertiary-fixed: '#08200b'
  on-tertiary-fixed-variant: '#344d33'
  background: '#101412'
  on-background: '#e0e3df'
  surface-variant: '#323633'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Outfit
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
  stat-metric:
    fontFamily: Outfit
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  gutter-mobile: 1rem
  margin-mobile: 1rem
  card-pad: 1.25rem
---

## Brand & Style

This design system serves herpetologists, vivarium architects, and reptile keepers who demand clinical precision balanced with organic warmth. The UI evokes the sensation of peering into a lush, controlled bioactive biome: disciplined, humid, tranquil, and vital. It counters the stereotypical neon-and-black "exotic pet" aesthetics with refined Scandinavian minimalism fused with biological field-station instrumentation.

The design movement is **Modern Organic Minimalism with Tactile Precision**. It pairs deep botanical values with calibrated sensor readouts. High-contrast indicators ensure that vital statistics—thermal gradients, humidity fluctuations, shedding cycles, and weight deltas—are immediately scannable without sensory overload. Every element feels deliberate, grounded, and bio-authentic.

## Colors

The palette establishes a baseline dark sanctuary using deep stone and canopy tones, punctuated by warm subterranean clay.

- **Primary (`#1E3A2B`)**: Deep Forest Moss. Acts as structural grounding for app bars, primary containers, and dominant functional surfaces.
- **Secondary (`#D96B43`)**: Warm Terracotta/Clay. Reserved for key calls-to-action, active heat emitter status, critical temperature alerts, and primary feeding milestones.
- **Tertiary (`#7E9A7B`)**: Muted Sage. Utilized for secondary data lines, optimal hygrometer zones, successful health confirmations, and plant balance indicators.
- **Neutral Base (`#121614`)**: Substrate Black/Dark Stone. Provides the ambient canvas, minimizing screen glare in dimly lit animal rooms.
- **Surface Elevation Cards (`#1B221E`)**: Enclosure Deck. Lighter organic charcoal that lifts content layers above the base canvas.
- **Functional Semantics**:
  - Critical/Hypothermic: `#E05345` (Crimson Clay)
  - Bio-Stable/Optimal: `#58B37E` (Emerald Canopy)
  - Heat Lamp Active/Basking: `#E8A248` (Sunstone Amber)
  - Text Primary: `#E5ECE7` (Sandstone High-Light)
  - Text Muted: `#8B9A90` (Weathered Lichen)

## Typography

The type system balances technical data density with expressive vitality. 

- **Outfit** provides sculptural presence in headlines, telemetry figures, and enclosure titles, lending geometric precision that softens clinical tracking.
- **Inter** ensures uncompromised legibility for medical logs, species notes, feeding routines, and micro-metrics under harsh lighting conditions.
- **Telemetry Readouts (`stat-metric`)**: Utilize Outfit with tabular figures (`tnum`) to keep telemetry values (e.g., `32.4°C` or `84%`) uniform across real-time hardware polling.

## Layout & Spacing

The layout runs on an **8pt fluid rhythmic grid** calibrated explicitly for compact, high-utility handheld interaction.

- **Mobile Viewport**: Anchored by a 4-column layout with `16px` (`1rem`) exterior edge safety margins and `12px` gutters.
- **Information Architecture**: Uses vertical stacking for multi-habitat monitors and 2-column micro-dashboards for side-by-side thermal gradients (Cool End vs. Basking Zone).
- **Comfort Zones**: Minimum touch targets are strictly preserved at `48x48px` to allow unhindered one-handed operation during misting or physical specimen handling.

## Elevation & Depth

This system avoids synthetic dropshadows and harsh drop-offs, relying instead on **Tonal Stratification and Micro-Glow Luminescence**:

1. **Substrate Base (`Level 0`)**: `#121614` solid tone.
2. **Habitual Decks / Cards (`Level 1`)**: `#1B221E` with a 1px inner structural border of `rgba(255, 255, 255, 0.05)`.
3. **Floating Controls & Modals (`Level 2`)**: `#242E28` overlaid with an ambient downward wash: `0 8px 32px rgba(0, 0, 0, 0.45)`.
4. **Bio-State Indicator Depth**: Active status indicators (such as UVB alerts, heater states, and critical weight variance) project a subtle 4px ambient chromatic glow using their own semantic color at 20% opacity.

## Shapes

The geometric approach follows an **Ergonomic Organic Radius (`roundedness: 2`)**. Primary cards and status modules feature smooth `16px` (`1rem`) curvatures that replicate tumbled river stone and terrarium glass contouring.

- **Primary Enclosure Cards**: `16px` outer radius.
- **Embedded Metric Panels**: `12px` interior radius.
- **Interactive Action Pills & Status Badges**: `9999px` full round for effortless edge separation.
- **Form Inputs**: `12px` consistent curvature.

## Components

### Buttons
- **Primary**: Terracotta background (`#D96B43`), text in `#FFFFFF`, `12px` radius or full pill. Used for critical workflows (e.g., "Log Feeding", "Misting Trigger").
- **Secondary**: Forest Moss (`#1E3A2B`) surface with `1px` stroke of `#7E9A7B` at 30% opacity; text in Sandstone (`#E5ECE7`).
- **Tertiary / Ghost**: Transparent fill, Lichen green text (`#8B9A90`), zero border.

### Telemetry Cards (Thermal & Moisture Hubs)
- Encapsulated in surface card `#1B221E` with subtle 1px perimeter border.
- Split-cell design featuring the Basking Spot on the left and Ambient/Cool zone on the right.
- High-contrast stat numbers rendered via `stat-metric` paired with color-coded trend indicators (e.g., up/down micro-triangles in `#E05345` or `#58B37E`).

### Chips & Health Filter Pills
- **Active Filter**: Fill `#1E3A2B` with a solid 1px border of `#7E9A7B`. Text in `#E5ECE7`.
- **Inactive Filter**: Fill `#161B18` with no border. Text in `#8B9A90`.

### Weight & Growth Charts
- Minimalist line plots on a canvas of `#141A16`.
- Trend lines: Terracotta `#D96B43` (2.5px width) with an area gradient fill fading to `rgba(217, 107, 67, 0.0)`.
- Data points marked with `#E5ECE7` filled circles bordered with `#D96B43`.
- Upper and lower target boundary corridors rendered as soft `#7E9A7B` horizontal threshold zones.

### Health Alerts & Status Banners
- Surface: `#281A16` for urgent alerts, `#16241D` for stable/routine notes.
- Left-edge accent spine: Solid `4px` indicator strip (`#D96B43` for temperature/humidity breach, `#58B37E` for scheduled misting completed).

### Lists & Activity Logs
- Flat structure with `1px` divider of `#222B25`.
- Leading icon containers feature circular muted green backgrounds (`#1E3A2B`) carrying simplified single-path nature and equipment glyphs.