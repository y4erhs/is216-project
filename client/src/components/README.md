# UI Components Guide

## General Rules
* Boxes:
  * `border-radius: 25px`(outer)
  * `border-radius: 15px`(inner)
  * `padding: 15px`
* Page title: `font-size: 25px`
* Default text `font-size: 11px`

---

## 1. `theme.css` Styles
MUST IMPORT FIRST:  
`import '../assets/theme.css'`

### In `<style>`
```css
.my-card {
  background-color: var(--color-grey);
  color: var(--color-black);
}
.title { font-family: 'HeaderFont', sans-serif; }
.body-text { font-family: 'TextFont', sans-serif; }
```

### In `<template>`
```html
<!-- Static Classes -->
<div class="theme-blue"></div>
<span class="header-style">Pill Header</span>

<!-- Dynamic Classes -->
<div :class="{ 'theme-green': isActive }"></div>
<div :class="[selectedTheme]"></div>
```

---

## 2. `BaseInput.vue`

`src/components/BaseInput.vue`

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `v-model` | `String` / `Number` | `''` | Value binding |
| `type` | `String` | `'text'` | `'text'`, `'email'`, `'password'`, `'number'`, `'select'`, `'textarea'` |
| `label` | `String` | `''` | Optional field label |
| `placeholder` | `String` | `''` | Placeholder text |
| `options` | `Array` | `[]` | For `select`: `['opt1', 'opt2']` or `[{ label, value }]` |
| `rows` | `Number` / `String` | `3` | Line height for `textarea` |
| `disabled` | `Boolean` | `false` | Disables input |

### Examples
```html
<!-- Text & Email -->
<BaseInput label="Name" v-model="name" placeholder="Enter name" />
<BaseInput type="email" label="Email" v-model="email" />

<!-- Select (Dropdown) -->
<BaseInput 
  type="select" 
  label="Category" 
  v-model="category" 
  :options="['Workshops', 'Social', 'Career']" 
/>

<!-- Textarea -->
<BaseInput type="textarea" label="Bio" v-model="bio" rows="4" />
```

---

## 3. `Navbar.vue`

`src/components/Navbar.vue`

| Attribute | Type | Description |
| :--- | :--- | :--- |
| `:is-open` | `Boolean` | Toggles mobile drawer |
| `@close` | `Event` | Emitted when closing mobile drawer |

### Example (`App.vue`)
```html
<Sidebar :is-open="isMobileNavOpen" @close="isMobileNavOpen = false" />
```

---

## 4. `BaseButton.vue`

`src/components/BaseButton.vue`

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `variant` | `String` | `'primary'` | `'primary'` or `'outline-main'` |
| `type` | `String` | `'button'` | `'button'`, `'submit'`, or `'reset'` |
| `disabled` | `Boolean` | `false` | Disables interaction |
| `@click` | `Event` | — | Emitted on click |

### Examples
```html
<!-- Primary, Outline, Small -->
<BaseButton @click="save">Save</BaseButton>
<BaseButton variant="outline-main" @click="cancel">Cancel</BaseButton>
<BaseButton variant="small">Cancel</BaseButton>

<!-- Submit / Disabled -->
<BaseButton type="submit" :disabled="isLoading">
  {{ isLoading ? 'Loading...' : 'Submit' }}
</BaseButton>
```


## 5. `FolderTabs.vue`

`src/components/FolderTabs.vue`

| Prop / Event | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `tabs` | `Array` | *required* | Array of tab objects: `[{ id, label, theme }]` |
| `defaultActive` | `String` | `''` | Initial active tab `id` (defaults to first item) |
| `@tab-change` | `Event` | — | Emitted with new `tabId` when active tab changes |
| `#[tab.id]` | `Slot` | — | Named slot for tab-specific body content |

### Examples
```html
<!-- Basic Usage with Array -->
<script setup>
const categories = [
  { id: 'cultural', label: 'CULTURAL CLUBS', theme: 'theme-green' },
  { id: 'workshops', label: 'WORKSHOPS', theme: 'theme-orange' },
  { id: 'career', label: 'CAREER', theme: 'theme-purple' }
]
</script>

<template>
  <!-- Multi-tab Folder with Named Slots -->
  <FolderTabs :tabs="categories" defaultActive="cultural">
    <template #cultural>
      <div class="cards-list">
        <!-- Cultural event cards -->
      </div>
    </template>

    <template #workshops>
      <div class="cards-list">
        <!-- Workshops event cards -->
      </div>
    </template>

    <template #career>
      <div class="cards-list">
        <!-- Career event cards -->
      </div>
    </template>
  </FolderTabs>
</template>
```