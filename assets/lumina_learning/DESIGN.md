---
name: Lumina Learning
colors:
  surface: '#faf9f8'
  surface-dim: '#dadad9'
  surface-bright: '#faf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f2'
  surface-container: '#eeeeec'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e3e2e1'
  on-surface: '#1a1c1b'
  on-surface-variant: '#3f4a36'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1ef'
  outline: '#6f7b64'
  outline-variant: '#becbb1'
  surface-tint: '#2b6c00'
  primary: '#2b6c00'
  on-primary: '#ffffff'
  primary-container: '#58cc02'
  on-primary-container: '#1e5000'
  inverse-primary: '#6be026'
  secondary: '#006590'
  on-secondary: '#ffffff'
  secondary-container: '#2fb8ff'
  on-secondary-container: '#004666'
  tertiary: '#755b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#ddad00'
  on-tertiary-container: '#574300'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#87fe45'
  primary-fixed-dim: '#6be026'
  on-primary-fixed: '#082100'
  on-primary-fixed-variant: '#1f5100'
  secondary-fixed: '#c8e6ff'
  secondary-fixed-dim: '#88ceff'
  on-secondary-fixed: '#001e2e'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#ffdf92'
  tertiary-fixed-dim: '#f4bf00'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#594400'
  background: '#faf9f8'
  on-background: '#1a1c1b'
  surface-variant: '#e3e2e1'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '800'
    lineHeight: 30px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 22px
  label-bold:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '800'
    lineHeight: 18px
    letterSpacing: 0.05em
  display-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '800'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  depth-sm: 2px
  depth-md: 4px
---

## Brand & Style
The design system is built on a foundation of **Tactile Playfulness**. It aims to evoke a sense of progress, optimism, and approachability, transforming educational tasks into a gamified experience. The style avoids traditional corporate sterility, opting instead for a "soft-3D" aesthetic where elements feel physical and interactable.

The visual language is characterized by:
- **Chunky Geometry:** Thick strokes and generous padding to make the UI feel substantial.
- **Physical Feedback:** Interaction is communicated through vertical displacement (mimicking physical buttons) rather than abstract light/shadow.
- **High Clarity:** Information is distilled into bite-sized, high-contrast chunks to prevent cognitive overload.

## Colors
The palette uses high-chroma "Vibrant" tones to maintain energy. Every core color is paired with a darker "Shade" (defined as 15-20% lower brightness) to create the signature 3D depth effect on the bottom of elements.

- **Primary (Duolingo Green):** Used for "Correct" states, primary actions, and major progress milestones.
- **Secondary (Feather Blue):** Reserved for AI interactions, tips, and secondary navigation.
- **Tertiary (Sunglow Yellow):** Used exclusively for rewards, currency, and achievement highlights.
- **Lava Orange:** For high-urgency warnings, streaks, and "Incorrect" states.
- **Neutrals:** A range of cool grays starting from #E5E5E5 (borders) to #4B4B4B (text). Avoid pure black; use deep grays to keep the interface friendly.

## Typography
The system uses **Plus Jakarta Sans** for its friendly, open apertures and geometric clarity. 

- **Weight Strategy:** Headings must be "Extra Bold" (800) to stand up against the thick borders of the UI. Body text uses "Medium" (500) or "SemiBold" (600) to ensure legibility against vibrant backgrounds.
- **Letter Spacing:** Headlines use a slight negative tracking to feel more "logo-like" and impactful. Labels use increased tracking and uppercase styling for a clear, instructional feel.

## Layout & Spacing
This design system utilizes a **Fixed-Width Content** model for desktop (centered max-width of 1024px) to keep focus tight. On mobile, it transitions to a fluid grid with generous 24px side margins.

- **Vertical Rhythm:** Spacing is strictly based on 4px increments.
- **The "Depth" Unit:** A critical spacing rule is the offset for 3D effects. Buttons have a `depth-md` (4px) bottom border. When pressed, the element translates down by 2px, and the border shrinks to `depth-sm` (2px).
- **Safe Zones:** Cards and containers use `lg` (24px) padding to ensure content doesn't feel cramped against the heavy borders.

## Elevation & Depth
Elevation is expressed through **Layered Solids** rather than shadows. 
- **Surface Level:** The background is usually a very light gray (#F7F7F7) or white.
- **Object Level:** Interactive elements use a solid 2px stroke (color: #E5E5E5) and a thick bottom border (shades of the primary color) to simulate a physical button height.
- **No Shadows:** Soft ambient shadows are strictly avoided. All depth must be conveyed through color-filled strokes and offsets.
- **The "Press" Effect:** Interaction is shown by the "active" state physically lowering the y-axis of the element, making the user feel like they are pushing a real button.

## Shapes
The shape language is "Hyper-Rounded." 
- **Standard Radius:** All buttons and cards use a 16px to 20px radius.
- **Input Fields:** Use the same 16px radius for consistency.
- **Progress Bars:** Fully pill-shaped (100px radius) to emphasize the fluid, "liquid" nature of the progress fill.
- **Selection States:** When an item is selected, the border thickness increases from 2px to 4px, reinforcing the tactile nature of the choice.

## Components
- **Buttons:** Feature a primary color background with a 4px darker bottom border. Text is centered and bold. On hover, no change. On active/press, the button moves 2px down.
- **Chunky Progress Bars:** A container with a light gray background and a 16px height. The inner "fill" has a highlight "sheen" on its top half and a pill shape.
- **Lesson Cards:** Large white surfaces with a 2px gray border and a 4px bottom border. They include large, expressive icons or illustrations.
- **Floating Action Labels:** Small "tooltips" that appear above characters or icons, using a "speech bubble" tail, maintaining the 20px roundedness.
- **Toggle Switches:** Oversized and pill-shaped, using the Primary Green for "On" and Neutral Gray for "Off", with a circular white "knob" that also features the 3D depth effect.
- **Feedback Toasts:** Full-width bars that slide up from the bottom, colored in Green (Success) or Orange (Error), containing a single bold line of text and a large "Continue" button.