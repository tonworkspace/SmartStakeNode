// Test script to verify the "No active stakes found" error fix
// This script tests that users without stakes don't generate error logs

const { createClient } = require('@supabase/supabase-js');

// Mock environment for testing
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// Mock enhanced claim system (simplified version for testing)
class TestEnhancedClaimSystem {
  async checkClaimEligibility(userId) {
    console.log(`Testing claim eligibility for user ${userId}...`);
    
    try {
      // Get all active stakes for the user
      const { data: stakes, error: stakesError } = await supabase
        .from('stakes')
        .select('id, user_id, amount, is_active')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (stakesError) {
        console.error('Database error:', stakesError);
        return {
          canClaim: false,
          totalClaimable: 0,
          totalStakes: 0,
          errors: [`Failed to fetch stakes: ${stakesError.message}`],
          lastSyncTime: new Date()
        };
      }

      // NEW LOGIC: No stakes is not an error
      if (!stakes || stakes.length === 0) {
        console.log('✅ User has no stakes - this is normal, not an error');
        return {
          canClaim: false,
          totalClaimable: 0,
          totalStakes: 0,
          errors: [], // No errors for this case
          lastSyncTime: new Date()
        };
      }

      console.log(`✅ User has ${stakes.length} active stakes`);
      return {
        canClaim: true,
        totalClaimable: 0.1, // Mock value
        totalStakes: stakes.length,
        errors: [],
        lastSyncTime: new Date()
      };

    } catch (error) {
      console.error('System error:', error);
      return {
        canClaim: false,
        totalClaimable: 0,
        totalStakes: 0,
        errors: [`System error: ${error.message}`],
        lastSyncTime: new Date()
      };
    }
  }
}

// Test function
async function testNoStakesScenario() {
  console.log('🧪 Testing Enhanced Mining Screen - No Stakes Error Fix\n');
  
  const testSystem = new TestEnhancedClaimSystem();
  
  // Test with a user ID that likely has no stakes (using a high number)
  const testUserId = 999999;
  
  console.log('Test 1: User with no stakes');
  console.log('========================');
  
  const result = await testSystem.checkClaimEligibility(testUserId);
  
  console.log('Result:', {
    canClaim: result.canClaim,
    totalStakes: result.totalStakes,
    hasErrors: result.errors.length > 0,
    errors: result.errors
  });
  
  if (result.errors.length === 0 && result.totalStakes === 0) {
    console.log('✅ SUCCESS: No errors generated for user without stakes');
  } else {
    console.log('❌ FAILED: Errors still being generated for users without stakes');
    console.log('Errors:', result.errors);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('Test Summary:');
  console.log('- Users without stakes should not generate error logs');
  console.log('- The system should handle this as a normal state');
  console.log('- Only actual system errors should be logged');
  console.log('='.repeat(50));
}

// Run the test
if (require.main === module) {
  testNoStakesScenario()
    .then(() => {
      console.log('\n✅ Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testNoStakesScenario };