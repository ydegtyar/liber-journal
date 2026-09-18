# Project Guidelines

## Material UI (MUI) Performance

- **Avoid `<Box>` without props**: Never use `<Box>` as a plain wrapper without props. MUI's `Box` component initializes Emotion styling and theme resolution contexts, adding unnecessary runtime overhead.
- **Use plain `<div>`**: Whenever no `sx`, `component`, or styling props are needed, use a native `<div>` (or semantic tags like `<span>`, `<header>`, `<section>`).
- Only use `<Box>` when utilizing `sx` props or MUI system styling attributes.
