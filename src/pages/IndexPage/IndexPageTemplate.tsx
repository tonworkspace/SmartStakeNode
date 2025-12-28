// import { FC, useState, useEffect, useRef } from 'react';
// import { FaHome, FaUser, FaCog, FaChartBar, FaBell } from 'react-icons/fa';
// import { TonConnectButton } from '@tonconnect/ui-react';
// import { useAuth } from '@/hooks/useAuth';
// import { Button } from '@telegram-apps/telegram-ui';
// import { Snackbar } from '@telegram-apps/telegram-ui';

// // Snackbar configuration interface
// interface SnackbarConfig {
//   message: string;
//   description?: string;
//   duration?: number;
// }

// // Constants
// const SNACKBAR_DURATION = 5000; // 5 seconds

// export const IndexPage: FC = () => {
//   // Auth hook - keeps user authentication and profile
//   const { user, isLoading, error, updateUserData } = useAuth();
  
//   // Navigation state
//   const [currentTab, setCurrentTab] = useState('home');
  
//   // Snackbar state
//   const [isSnackbarVisible, setSnackbarVisible] = useState(false);
//   const [snackbarMessage, setSnackbarMessage] = useState('');
//   const [snackbarDescription, setSnackbarDescription] = useState('');
//   const snackbarTimeoutRef = useRef<NodeJS.Timeout>();

//   // Utility function to show snackbar notifications
//   const showSnackbar = ({ message, description = '', duration = SNACKBAR_DURATION }: SnackbarConfig) => {
//     if (snackbarTimeoutRef.current) {
//       clearTimeout(snackbarTimeoutRef.current);
//     }

//     setSnackbarMessage(message);
//     setSnackbarDescription(description);
//     setSnackbarVisible(true);

//     snackbarTimeoutRef.current = setTimeout(() => {
//       setSnackbarVisible(false);
//     }, duration);
//   };

//   // Example function to demonstrate user data updates
//   const handleUserAction = async () => {
//     try {
//       // Example: Update user data
//       if (user) {
//         // Your business logic here
//         showSnackbar({
//           message: 'Action Completed',
//           description: 'User action was successful!'
//         });
//       }
//     } catch (error) {
//       console.error('Action failed:', error);
//       showSnackbar({
//         message: 'Action Failed',
//         description: 'Please try again later'
//       });
//     }
//   };

//   // Loading state
//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-slate-50">
//         <div className="text-center">
//           <div className="w-20 h-20 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-blue-600">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   // Error state
//   if (error) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-slate-50">
//         <div className="text-center">
//           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
//             </svg>
//           </div>
//           <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
//           <p className="text-gray-600">{error}</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 antialiased mb-[4rem]">
//       {/* Header with User Profile */}
//       <div className="px-4 py-4 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-md z-50 border-b border-slate-200 shadow-sm">
//         <div className="flex items-center gap-4">
//           {/* User Profile Section */}
//           <div className="flex items-center gap-3">
//             {/* User Avatar */}
//             <div className="relative group">
//               <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 shadow-sm group-hover:shadow-md transition-all duration-200">
//                 {user?.photoUrl ? (
//                   <img 
//                     src={user.photoUrl} 
//                     alt="Profile" 
//                     className="w-full h-full object-cover"
//                   />
//                 ) : (
//                   <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
//                     <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//                     </svg>
//                   </div>
//                 )}
//               </div>
//               {/* Online Status Indicator */}
//               <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
//             </div>

//             {/* User Info */}
//             <div className="flex flex-col">
//               <div className="flex items-center gap-2">
//                 <span className="text-lg font-semibold text-slate-900">
//                   {user?.username ? `@${user.username}` : '@username'}
//                 </span>
//                 {/* Verified Badge */}
//                 <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
//                   <svg className="w-2.5 h-2.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                   </svg>
//                 </div>
//               </div>
//               <div className="flex items-center gap-2">
//                 <button
//                   onClick={async () => {
//                     if (user?.telegram_id) {
//                       try {
//                         await navigator.clipboard.writeText(user.telegram_id.toString());
//                         showSnackbar({
//                           message: 'Telegram ID Copied!',
//                           description: 'Your Telegram ID has been copied to clipboard'
//                         });
//                       } catch (error) {
//                         showSnackbar({
//                           message: 'Copy Failed',
//                           description: 'Please try again or copy manually'
//                         });
//                       }
//                     }
//                   }}
//                   className="text-xs text-blue-600 hover:text-blue-700 truncate max-w-[140px] font-medium transition-colors cursor-pointer"
//                   title="Click to copy Telegram ID"
//                 >
//                   {user?.telegram_id || 'Loading...'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Right Section with Connect Button */}
//         <div className="flex items-center gap-3">
//           {/* Network Status Badge */}
//           <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors duration-200">
//             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
//             <span className="text-xs font-medium text-slate-700">Online</span>
//           </div>

//           {/* TON Connect Button */}
//           <div className="relative">
//             <TonConnectButton />
//           </div>
//         </div>
//       </div>

//       {/* Main Content Area */}
//       <div className="flex-1 overflow-y-auto">
//         {currentTab === 'home' && (
//           <div className="p-4 space-y-6">
//             <div className="text-center">
//               <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Your App</h1>
//               <p className="text-gray-600">This is a clean template ready for your next project</p>
//             </div>

//             {/* Example Content Card */}
//             <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//               <h2 className="text-xl font-semibold text-gray-900 mb-4">Getting Started</h2>
//               <div className="space-y-4">
//                 <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
//                   <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
//                     <span className="text-white text-sm font-bold">1</span>
//                   </div>
//                   <div>
//                     <p className="font-medium text-gray-900">User Authentication</p>
//                     <p className="text-sm text-gray-600">Already integrated with useAuth hook</p>
//                   </div>
//                 </div>
                
//                 <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
//                   <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
//                     <span className="text-white text-sm font-bold">2</span>
//                   </div>
//                   <div>
//                     <p className="font-medium text-gray-900">TON Wallet Integration</p>
//                     <p className="text-sm text-gray-600">TonConnect button ready to use</p>
//                   </div>
//                 </div>
                
//                 <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
//                   <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
//                     <span className="text-white text-sm font-bold">3</span>
//                   </div>
//                   <div>
//                     <p className="font-medium text-gray-900">Clean UI Components</p>
//                     <p className="text-sm text-gray-600">Modern design system with Tailwind CSS</p>
//                   </div>
//                 </div>
//               </div>

//               <button
//                 onClick={handleUserAction}
//                 className="w-full mt-6 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
//               >
//                 Test User Action
//               </button>
//             </div>

//             {/* Comprehensive User Data Display */}
//             {user && (
//               <div className="space-y-4">
//                 {/* Basic Information */}
//                 <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                     <FaUser className="text-blue-600" />
//                     Basic Information
//                   </h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Username:</span>
//                       <span className="font-medium text-gray-900">{user.username || 'Not set'}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">First Name:</span>
//                       <span className="font-medium text-gray-900">{user.first_name || 'Not set'}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Last Name:</span>
//                       <span className="font-medium text-gray-900">{user.last_name || 'Not set'}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Language:</span>
//                       <span className="font-medium text-gray-900">{user.language_code || 'Not set'}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Telegram ID:</span>
//                       <span className="font-medium text-gray-900">{user.telegram_id}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">User ID:</span>
//                       <span className="font-medium text-gray-900">{user.id}</span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Financial Information */}
//                 <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                     <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
//                     </svg>
//                     Financial Data
//                   </h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Balance:</span>
//                       <span className="font-medium text-gray-900">{user.balance?.toFixed(4) || '0.0000'} TON</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Total Deposit:</span>
//                       <span className="font-medium text-gray-900">{user.total_deposit?.toFixed(4) || '0.0000'} TON</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Total Withdrawn:</span>
//                       <span className="font-medium text-gray-900">{user.total_withdrawn?.toFixed(4) || '0.0000'} TON</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Total Earned:</span>
//                       <span className="font-medium text-gray-900">{user.total_earned?.toFixed(4) || '0.0000'} TON</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Available Balance:</span>
//                       <span className="font-medium text-gray-900">{user.available_balance?.toFixed(4) || '0.0000'} TON</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Reinvestment Balance:</span>
//                       <span className="font-medium text-gray-900">{user.reinvestment_balance?.toFixed(4) || '0.0000'} TON</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Payout Balance:</span>
//                       <span className="font-medium text-gray-900">{user.payout_balance?.toFixed(4) || '0.0000'} TON</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Total Payout:</span>
//                       <span className="font-medium text-gray-900">{user.total_payout?.toFixed(4) || '0.0000'} TON</span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Token Information */}
//                 <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                     <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
//                     </svg>
//                     Tokens & Rewards
//                   </h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">TAPPS Tokens:</span>
//                       <span className="font-medium text-gray-900">{user.total_sbt?.toLocaleString() || '0'} TAPPS</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Stake Amount:</span>
//                       <span className="font-medium text-gray-900">{user.stake?.toFixed(4) || '0.0000'} TON</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Available Earnings:</span>
//                       <span className="font-medium text-gray-900">{user.available_earnings?.toFixed(4) || '0.0000'} TON</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Has NFT:</span>
//                       <span className="font-medium text-gray-900">{user.has_nft ? 'Yes' : 'No'}</span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Network & Referral Information */}
//                 <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                     <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
//                     </svg>
//                     Network & Referrals
//                   </h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Rank:</span>
//                       <span className="font-medium text-gray-900">{user.rank || 'Novice'}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Direct Referrals:</span>
//                       <span className="font-medium text-gray-900">{user.direct_referrals || 0}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Team Volume:</span>
//                       <span className="font-medium text-gray-900">{user.team_volume?.toFixed(4) || '0.0000'} TON</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Sponsor ID:</span>
//                       <span className="font-medium text-gray-900">{user.sponsor_id || 'None'}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Sponsor Code:</span>
//                       <span className="font-medium text-gray-900">{user.sponsor_code || 'Not set'}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Referrer Username:</span>
//                       <span className="font-medium text-gray-900">{user.referrer_username || 'None'}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Expected Rank Bonus:</span>
//                       <span className="font-medium text-gray-900">{user.expected_rank_bonus?.toFixed(4) || '0.0000'} TON</span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Wallet & Security Information */}
//                 <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                     <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//                     </svg>
//                     Wallet & Security
//                   </h3>
//                   <div className="space-y-3">
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Wallet Address:</span>
//                       <span className="font-medium text-gray-900 text-xs break-all">
//                         {user.wallet_address || 'Not connected'}
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Payout Wallet:</span>
//                       <span className="font-medium text-gray-900 text-xs break-all">
//                         {user.payout_wallet || 'Not set'}
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Whitelisted Wallet:</span>
//                       <span className="font-medium text-gray-900 text-xs break-all">
//                         {user.whitelisted_wallet || 'Not set'}
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Pending Withdrawal:</span>
//                       <span className="font-medium text-gray-900">{user.pending_withdrawal ? 'Yes' : 'No'}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Pending Withdrawal ID:</span>
//                       <span className="font-medium text-gray-900">{user.pending_withdrawal_id || 'None'}</span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Activity & Dates Information */}
//                 <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                     <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>
//                     Activity & Dates
//                   </h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Login Streak:</span>
//                       <span className="font-medium text-gray-900">{user.login_streak || 0} days</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Is Active:</span>
//                       <span className="font-medium text-gray-900">{user.is_active ? 'Yes' : 'No'}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Last Login:</span>
//                       <span className="font-medium text-gray-900 text-xs">
//                         {user.last_login_date ? new Date(user.last_login_date).toLocaleString() : 'Never'}
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Last Active:</span>
//                       <span className="font-medium text-gray-900 text-xs">
//                         {user.last_active ? new Date(user.last_active).toLocaleString() : 'Never'}
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Created At:</span>
//                       <span className="font-medium text-gray-900 text-xs">
//                         {user.created_at ? new Date(user.created_at).toLocaleString() : 'Unknown'}
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Last Deposit:</span>
//                       <span className="font-medium text-gray-900 text-xs">
//                         {user.last_deposit_date ? new Date(user.last_deposit_date).toLocaleString() : 'Never'}
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Stake Date:</span>
//                       <span className="font-medium text-gray-900 text-xs">
//                         {user.stake_date ? new Date(user.stake_date).toLocaleString() : 'Not set'}
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Current Stake Date:</span>
//                       <span className="font-medium text-gray-900 text-xs">
//                         {user.current_stake_date ? new Date(user.current_stake_date).toLocaleString() : 'Not set'}
//                       </span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Additional Data */}
//                 <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                     <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                     </svg>
//                     Additional Information
//                   </h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Claimed Milestones:</span>
//                       <span className="font-medium text-gray-900">
//                         {user.claimed_milestones?.length || 0} milestones
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Photo URL:</span>
//                       <span className="font-medium text-gray-900">
//                         {user.photoUrl ? 'Set' : 'Not set'}
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Last Deposit Time:</span>
//                       <span className="font-medium text-gray-900 text-xs">
//                         {user.last_deposit_time ? new Date(user.last_deposit_time).toLocaleString() : 'Never'}
//                       </span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Raw Data (for debugging) */}
//                 <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 shadow-sm">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                     <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
//                     </svg>
//                     Raw User Data (Debug)
//                   </h3>
//                   <div className="bg-gray-100 rounded-lg p-4 overflow-auto">
//                     <pre className="text-xs text-gray-700 whitespace-pre-wrap">
//                       {JSON.stringify(user, null, 2)}
//                     </pre>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         )}

//         {currentTab === 'profile' && (
//           <div className="p-4">
//             <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//               <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile</h2>
//               <p className="text-gray-600">Profile content goes here</p>
//             </div>
//           </div>
//         )}

//         {currentTab === 'analytics' && (
//           <div className="p-4">
//             <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//               <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics</h2>
//               <p className="text-gray-600">Analytics content goes here</p>
//             </div>
//           </div>
//         )}

//         {currentTab === 'notifications' && (
//           <div className="p-4">
//             <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//               <h2 className="text-xl font-semibold text-gray-900 mb-4">Notifications</h2>
//               <p className="text-gray-600">Notifications content goes here</p>
//             </div>
//           </div>
//         )}

//         {currentTab === 'settings' && (
//           <div className="p-4">
//             <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
//               <h2 className="text-xl font-semibold text-gray-900 mb-4">Settings</h2>
//               <p className="text-gray-600">Settings content goes here</p>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Bottom Navigation */}
//       <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-2xl">
//         <div className="absolute inset-0 bg-gradient-to-t from-slate-50/80 via-white/20 to-transparent pointer-events-none"></div>
        
//         <div className="max-w-lg mx-auto px-4 relative">
//           <div className="grid grid-cols-5 items-center py-3">
//             {[
//               { 
//                 id: 'home', 
//                 text: 'Home', 
//                 Icon: FaHome,
//                 gradient: 'from-blue-500 to-cyan-500'
//               },
//               { 
//                 id: 'profile', 
//                 text: 'Profile', 
//                 Icon: FaUser,
//                 gradient: 'from-indigo-500 to-purple-500'
//               },
//               { 
//                 id: 'analytics', 
//                 text: 'Analytics', 
//                 Icon: FaChartBar,
//                 gradient: 'from-purple-500 to-pink-500'
//               },
//               { 
//                 id: 'notifications', 
//                 text: 'Alerts', 
//                 Icon: FaBell,
//                 gradient: 'from-green-500 to-emerald-500'
//               },
//               { 
//                 id: 'settings', 
//                 text: 'Settings', 
//                 Icon: FaCog,
//                 gradient: 'from-orange-500 to-red-500'
//               },
//             ].map(({ id, text, Icon, gradient }) => (
//               <button 
//                 key={id} 
//                 onClick={() => setCurrentTab(id)}
//                 className={`group flex flex-col items-center py-3 w-full transition-all duration-300 relative ${
//                   currentTab === id 
//                     ? 'text-blue-600' 
//                     : 'text-slate-500 hover:text-slate-700'
//                 }`}
//               >
//                 {/* Active tab background */}
//                 {currentTab === id && (
//                   <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-cyan-50/60 rounded-2xl mx-1 shadow-lg border border-blue-100/50"></div>
//                 )}
                
//                 <div className={`relative transition-all duration-300 ${
//                   currentTab === id ? 'scale-110' : 'group-hover:scale-105'
//                 }`}>
//                   <div className={`relative p-2 rounded-xl transition-all duration-300 ${
//                     currentTab === id 
//                       ? `bg-gradient-to-br ${gradient} shadow-lg` 
//                       : 'group-hover:bg-slate-100/50'
//                   }`}>
//                     <Icon 
//                       size={currentTab === id ? 22 : 20} 
//                       className={`transition-all duration-300 ${
//                         currentTab === id 
//                           ? 'text-white drop-shadow-sm' 
//                           : 'text-slate-500 group-hover:text-slate-700'
//                       }`} 
//                     />
                    
//                     {/* Animated glow effect for active tab */}
//                     {currentTab === id && (
//                       <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-xl opacity-20 animate-pulse`}></div>
//                     )}
//                   </div>
                  
//                   {/* Active indicator */}
//                   {currentTab === id && (
//                     <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
//                       <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-lg animate-bounce"></div>
//                     </div>
//                   )}
//                 </div>
                
//                 <span className={`text-[10px] font-bold tracking-wide truncate max-w-[70px] text-center mt-1 transition-all duration-300 relative z-10 ${
//                   currentTab === id ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'
//                 }`}>
//                   {text}
//                 </span>
//               </button>
//             ))}
//           </div>
//         </div>
        
//         {/* Bottom glow effect */}
//         <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
//       </div>

//       {/* Snackbar Notifications */}
//       {isSnackbarVisible && (
//         <Snackbar
//           onClose={() => {
//             setSnackbarVisible(false);
//             if (snackbarTimeoutRef.current) {
//               clearTimeout(snackbarTimeoutRef.current);
//             }
//           }}
//           duration={SNACKBAR_DURATION}
//           description={snackbarDescription}
//           after={
//             <Button 
//               size="s" 
//               onClick={() => {
//                 setSnackbarVisible(false);
//                 if (snackbarTimeoutRef.current) {
//                   clearTimeout(snackbarTimeoutRef.current);
//                 }
//               }}
//             >
//               Close
//             </Button>
//           }
//           className="snackbar-top"
//         >
//           {snackbarMessage}
//         </Snackbar>
//       )}
//     </div>
//   );
// };