# Clean App Template

This is a clean, production-ready template extracted from your existing project. It maintains the essential authentication and user profile functionality while removing all app-specific features.

## What's Included

### ✅ Core Features Preserved
- **User Authentication**: Complete `useAuth` hook integration
- **User Profile**: Avatar, username, Telegram ID display with copy functionality
- **TON Wallet Integration**: TonConnect button ready to use
- **Modern UI**: Clean design with Tailwind CSS
- **Navigation**: Bottom tab navigation system
- **Notifications**: Snackbar system for user feedback
- **Responsive Design**: Mobile-first approach
- **Loading & Error States**: Proper state handling

### ❌ Removed App-Specific Features
- Staking/earning system
- Deposit/withdrawal functionality
- Mining components
- Social tasks
- NFT minting
- Referral system
- Activity feeds
- All business logic specific to the original app

## File Structure

```
src/pages/IndexPage/IndexPageTemplate.tsx  # Main template component
```

## How to Use This Template

### 1. Replace Your Main Component
```tsx
// In your App.tsx or main routing file
import { IndexPageTemplate } from '@/pages/IndexPage/IndexPageTemplate';

// Use IndexPageTemplate instead of IndexPage
<IndexPageTemplate />
```

### 2. Customize Navigation Tabs
The template includes 5 navigation tabs that you can customize:

```tsx
const navigationTabs = [
  { id: 'home', text: 'Home', Icon: FaHome },
  { id: 'profile', text: 'Profile', Icon: FaUser },
  { id: 'analytics', text: 'Analytics', Icon: FaChartBar },
  { id: 'notifications', text: 'Alerts', Icon: FaBell },
  { id: 'settings', text: 'Settings', Icon: FaCog },
];
```

### 3. Add Your Content
Each tab has a dedicated content area where you can add your features:

```tsx
{currentTab === 'home' && (
  <div className="p-4 space-y-6">
    {/* Add your home content here */}
  </div>
)}
```

### 4. Utilize Built-in Features

#### User Data Access
```tsx
const { user, isLoading, error, updateUserData } = useAuth();

// Access user properties
user?.username
user?.telegram_id
user?.photoUrl
```

#### Show Notifications
```tsx
showSnackbar({
  message: 'Success!',
  description: 'Your action was completed successfully',
  duration: 5000 // optional
});
```

#### Update User Data
```tsx
const handleUpdateUser = async () => {
  try {
    // Your update logic here
    updateUserData(newUserData);
    showSnackbar({
      message: 'Profile Updated',
      description: 'Your profile has been updated successfully'
    });
  } catch (error) {
    showSnackbar({
      message: 'Update Failed',
      description: 'Please try again later'
    });
  }
};
```

## Dependencies Required

Make sure these dependencies are installed in your project:

```json
{
  "@tonconnect/ui-react": "^2.x.x",
  "@telegram-apps/telegram-ui": "^2.x.x",
  "react-icons": "^4.x.x",
  "tailwindcss": "^3.x.x"
}
```

## Styling

The template uses Tailwind CSS with a modern design system:
- **Colors**: Slate-based color palette
- **Typography**: Clean, readable fonts
- **Spacing**: Consistent spacing system
- **Animations**: Smooth transitions and hover effects
- **Responsive**: Mobile-first design

## Customization Tips

### 1. Change Color Scheme
Update the gradient colors in the navigation:
```tsx
gradient: 'from-your-color-500 to-your-color-600'
```

### 2. Add New Tabs
Simply add new objects to the navigation array and handle the content in the main render section.

### 3. Modify Header
The header section can be customized to match your brand:
- Change the network status badge
- Add additional user info
- Modify the profile section

### 4. Extend User Actions
Add new functions similar to `handleUserAction` for your specific business logic.

## Best Practices

1. **Keep Authentication Logic**: Don't modify the `useAuth` hook integration
2. **Maintain Error Handling**: Use the existing error and loading states
3. **Use Snackbar System**: Leverage the built-in notification system
4. **Follow Mobile-First**: Keep the responsive design approach
5. **Preserve User Profile**: The user profile section is well-designed and functional

## Getting Started

1. Copy the template file to your project
2. Update your routing to use the template
3. Install required dependencies
4. Start building your features in the tab content areas
5. Customize the navigation and styling to match your brand

This template gives you a solid foundation with authentication, user management, and modern UI components, allowing you to focus on building your unique features rather than setting up the basic infrastructure.