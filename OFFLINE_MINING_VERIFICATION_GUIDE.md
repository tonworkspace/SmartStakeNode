# Offline Mining Verification Guide

## 🧪 How to Test Offline Mining in Your Browser

### Step 1: Open Developer Tools
1. Open your app in the browser
2. Press `F12` or right-click → "Inspect"
3. Go to the **Console** tab

### Step 2: Check localStorage Implementation
Run this in the console:
```javascript
// Check if mining data is being saved to localStorage
Object.keys(localStorage).filter(key => key.includes('mining'))
```

Expected output: Should show keys like `mining_earnings_[userId]`

### Step 3: Test Connection Status
```javascript
// Check if earningsPersistence is available
if (window.earningsPersistence) {
  console.log('✅ EarningsPersistence available');
  console.log('Connection status:', window.earningsPersistence.getConnectionStatus());
} else {
  console.log('❌ EarningsPersistence not found');
}
```

### Step 4: Simulate Offline Mode
1. In Developer Tools, go to **Network** tab
2. Check "Offline" checkbox (or use throttling dropdown)
3. Watch the mining screen - it should show "Offline Mode"
4. Mining should continue with localStorage backup

### Step 5: Test Page Refresh Recovery
1. Start mining (make sure you have stakes)
2. Let it run for 30 seconds
3. Refresh the page (`F5`)
4. Check if earnings are preserved

### Step 6: Test Network Recovery
1. Go offline (Network tab → Offline)
2. Mine for 1 minute
3. Go back online
4. Check console for "Processing offline queue" messages

## 🔍 Console Commands for Testing

### Check Current Mining State
```javascript
// Get current earnings from localStorage
const userId = 12345; // Replace with actual user ID
const key = `mining_earnings_${userId}`;
const data = localStorage.getItem(key);
if (data) {
  console.log('Stored earnings:', JSON.parse(data));
} else {
  console.log('No mining data found');
}
```

### Check Offline Queue
```javascript
// Check if there are pending offline updates
const offlineQueue = localStorage.getItem('mining_offline_queue');
if (offlineQueue) {
  console.log('Offline queue:', JSON.parse(offlineQueue));
} else {
  console.log('No offline queue');
}
```

### Force Offline Mode
```javascript
// Manually trigger offline event
window.dispatchEvent(new Event('offline'));
console.log('Offline event triggered');
```

### Force Online Mode
```javascript
// Manually trigger online event
window.dispatchEvent(new Event('online'));
console.log('Online event triggered');
```

## 📊 Expected Behavior

### ✅ **Working Correctly:**
- Mining continues when offline
- "Offline Mode" badge appears
- localStorage updates every second
- Page refresh preserves earnings
- Network recovery processes queued updates

### ❌ **Issues to Watch For:**
- Mining stops when offline
- Earnings reset on page refresh
- No localStorage entries created
- Console errors about network failures

## 🛠️ Troubleshooting

### Issue: No localStorage Entries
**Solution:** Check if user is logged in and has active stakes

### Issue: Mining Stops Offline
**Solution:** Check console for JavaScript errors

### Issue: Data Lost on Refresh
**Solution:** Verify localStorage permissions in browser

### Issue: Network Recovery Fails
**Solution:** Check if online/offline events are firing

## 🎯 Success Indicators

1. **localStorage Keys Present:**
   - `mining_earnings_[userId]`
   - `mining_offline_queue` (when offline)

2. **UI Status Changes:**
   - "Mining Active" → "Offline Mode" → "Mining Active"
   - Connection status indicators update

3. **Console Messages:**
   - "Network connection lost - switching to offline mode"
   - "Network connection restored"
   - "Processing offline queue"

4. **Data Persistence:**
   - Earnings survive page refresh
   - Offline mining accumulates properly
   - No data loss during network issues

## 🚀 Performance Verification

### Check localStorage Size
```javascript
// Calculate localStorage usage
let totalSize = 0;
for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key)) {
    totalSize += localStorage[key].length + key.length;
  }
}
console.log(`localStorage usage: ${totalSize} characters`);
```

### Monitor Update Frequency
```javascript
// Watch localStorage updates
let lastUpdate = Date.now();
setInterval(() => {
  const userId = 12345; // Replace with actual user ID
  const data = localStorage.getItem(`mining_earnings_${userId}`);
  if (data) {
    const parsed = JSON.parse(data);
    if (parsed.savedAt > lastUpdate) {
      console.log('localStorage updated:', parsed.realTimeEarnings);
      lastUpdate = parsed.savedAt;
    }
  }
}, 1000);
```

## 📈 Real-World Testing Scenarios

### Scenario 1: Commuter Mining
1. Start mining on WiFi
2. Disconnect WiFi (simulate leaving home)
3. Mine for 10 minutes offline
4. Reconnect WiFi (simulate arriving at work)
5. Verify all earnings are preserved

### Scenario 2: Unstable Connection
1. Start mining
2. Toggle WiFi on/off every 30 seconds
3. Continue for 5 minutes
4. Check that no earnings are lost

### Scenario 3: Browser Crash Recovery
1. Start mining
2. Force close browser tab
3. Reopen app
4. Verify earnings are recovered

---

## 🎉 Conclusion

If all tests pass, your offline mining system is working perfectly! Users can now:
- Mine without internet connection
- Never lose progress on page refresh
- Automatically recover from network issues
- See clear status indicators

The system provides a bulletproof mining experience regardless of technical issues.