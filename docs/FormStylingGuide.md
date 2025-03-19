# Form Styling Guide
*Last updated: March 13, 2025*

## Dark Mode Text Visibility

This guide addresses the issue of text visibility in form inputs when using dark mode, and provides standardized approaches to ensure consistent styling across the application.

## Recent Fixes

We've addressed text visibility issues in the following components:

1. `EventForm.tsx` - Changed all input fields from `text-black` to `text-foreground` to ensure text is visible in dark mode
2. `ReminderDialog.tsx` - Updated input fields to use `text-foreground` instead of hardcoded `text-black`
3. `RecurringDialog.tsx` - Changed dialog background from hardcoded `bg-white text-black` to theme-aware `bg-background text-foreground`

## Global Solution

To prevent similar issues in the future, we've added a utility class in `globals.css`:

```css
.form-input {
    @apply w-full rounded-md border px-3 py-2 bg-background text-foreground;
}
```

## Best Practices for Form Elements

### 1. Use Theme Variables

Always use theme-aware color variables instead of hardcoded colors:

✅ **DO**:
```jsx
<input className="bg-background text-foreground" />
```

❌ **DON'T**:
```jsx
<input className="bg-white text-black" />
```

### 2. Use the Form Input Utility Class

For consistent styling across the application, use the `.form-input` utility class:

```jsx
<input 
  type="text"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  className="form-input"
  required
/>
```

### 3. Dialog Content

When creating dialogs, ensure they use theme-aware background and text colors:

```jsx
<DialogContent className="sm:max-w-md bg-background text-foreground">
  {/* Dialog content */}
</DialogContent>
```

### 4. Placeholders

For placeholders, use the muted foreground color:

```jsx
<input 
  className="form-input placeholder:text-muted-foreground"
  placeholder="Enter text..."
/>
```

## Testing Dark Mode

Always test your components in both light and dark modes to ensure proper visibility. You can toggle dark mode using the theme switcher in the application.

## Existing Theme Variables

The application defines the following theme variables that you can use:

- `--background`: Background color
- `--foreground`: Text color
- `--card`: Card background color
- `--card-foreground`: Card text color
- `--popover`: Popover background color
- `--popover-foreground`: Popover text color
- `--primary`: Primary accent color
- `--primary-foreground`: Text color on primary backgrounds
- `--secondary`: Secondary accent color
- `--secondary-foreground`: Text color on secondary backgrounds
- `--muted`: Muted background color
- `--muted-foreground`: Muted text color
- `--accent`: Accent background color
- `--accent-foreground`: Text color on accent backgrounds
- `--destructive`: Destructive action color
- `--destructive-foreground`: Text color on destructive backgrounds
- `--border`: Border color
- `--input`: Input border color
- `--ring`: Focus ring color

These variables are automatically adjusted based on the current theme.
