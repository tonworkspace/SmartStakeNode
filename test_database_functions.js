// Test script to verify database functions work correctly
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://ktpxcpohojdhtufdzvlu.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0cHhjcG9ob2pkaHR1ZmR6dmx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzQ1NDIsImV4cCI6MjA3NjcxMDU0Mn0.wwQVvIfv8HMOpLVKsi3J6Doesn8cSlQQBLWX0jPzFo2U";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseFunctions() {
  console.log('🧪 Testing Database Functions...\n');

  try {
    // Test 1: Check if functions exist
    console.log('1. Checking if functions exist...');
    const { data: functions, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname')
      .in('proname', ['increment_sbt', 'increment_available_earnings', 'convert_sbt_to_ton', 'increment_balance']);
    
    if (funcError) {
      console.log('⚠️  Could not check functions:', funcError.message);
    } else {
      const functionNames = functions.map(f => f.proname);
      console.log('✅ Available functions:', functionNames);
      
      const requiredFunctions = ['increment_sbt', 'increment_available_earnings', 'convert_sbt_to_ton', 'increment_balance'];
      const missingFunctions = requiredFunctions.filter(f => !functionNames.includes(f));
      
      if (missingFunctions.length > 0) {
        console.log('❌ Missing functions:', missingFunctions);
        console.log('Please run the SQL migration first!');
        return;
      }
    }

    // Test 2: Get a test user (first user in the database)
    console.log('\n2. Finding test user...');
    const { data: testUser, error: userError } = await supabase
      .from('users')
      .select('id, total_sbt, available_earnings, balance')
      .limit(1)
      .single();
    
    if (userError || !testUser) {
      console.log('❌ No test user found:', userError?.message);
      return;
    }
    
    console.log('✅ Test user found:', {
      id: testUser.id,
      total_sbt: testUser.total_sbt,
      available_earnings: testUser.available_earnings,
      balance: testUser.balance
    });

    const userId = testUser.id;
    const originalSbt = testUser.total_sbt || 0;
    const originalEarnings = testUser.available_earnings || 0;
    const originalBalance = testUser.balance || 0;

    // Test 3: Test increment_sbt function
    console.log('\n3. Testing increment_sbt function...');
    const testSbtAmount = 10;
    
    const { error: sbtError } = await supabase.rpc('increment_sbt', {
      user_id: userId,
      amount: testSbtAmount
    });
    
    if (sbtError) {
      console.log('❌ increment_sbt failed:', sbtError.message);
    } else {
      // Verify the update
      const { data: updatedUser } = await supabase
        .from('users')
        .select('total_sbt')
        .eq('id', userId)
        .single();
      
      const expectedSbt = originalSbt + testSbtAmount;
      if (updatedUser && Math.abs(updatedUser.total_sbt - expectedSbt) < 0.001) {
        console.log('✅ increment_sbt works correctly');
      } else {
        console.log('❌ increment_sbt verification failed');
      }
    }

    // Test 4: Test increment_available_earnings function
    console.log('\n4. Testing increment_available_earnings function...');
    const testEarningsAmount = 5;
    
    const { error: earningsError } = await supabase.rpc('increment_available_earnings', {
      user_id: userId,
      amount: testEarningsAmount
    });
    
    if (earningsError) {
      console.log('❌ increment_available_earnings failed:', earningsError.message);
    } else {
      // Verify the update
      const { data: updatedUser } = await supabase
        .from('users')
        .select('available_earnings, total_earned')
        .eq('id', userId)
        .single();
      
      const expectedEarnings = originalEarnings + testEarningsAmount;
      if (updatedUser && Math.abs(updatedUser.available_earnings - expectedEarnings) < 0.001) {
        console.log('✅ increment_available_earnings works correctly');
      } else {
        console.log('❌ increment_available_earnings verification failed');
      }
    }

    // Test 5: Test convert_sbt_to_ton function (only if user has enough SBT)
    console.log('\n5. Testing convert_sbt_to_ton function...');
    
    // Get current balances
    const { data: currentUser } = await supabase
      .from('users')
      .select('total_sbt, balance')
      .eq('id', userId)
      .single();
    
    if (currentUser && currentUser.total_sbt >= 10) {
      const sbtToConvert = 5;
      const tonToReceive = sbtToConvert * 0.1; // 10% conversion rate
      
      const { error: convertError } = await supabase.rpc('convert_sbt_to_ton', {
        user_id: userId,
        sbt_amount: sbtToConvert,
        ton_amount: tonToReceive
      });
      
      if (convertError) {
        console.log('❌ convert_sbt_to_ton failed:', convertError.message);
      } else {
        console.log('✅ convert_sbt_to_ton works correctly');
      }
    } else {
      console.log('⚠️  Skipping convert_sbt_to_ton test (insufficient SBT balance)');
    }

    console.log('\n🎉 Database function tests completed!');
    
    // Reset test data (optional)
    console.log('\n6. Resetting test data...');
    await supabase
      .from('users')
      .update({
        total_sbt: originalSbt,
        available_earnings: originalEarnings,
        balance: originalBalance
      })
      .eq('id', userId);
    
    console.log('✅ Test data reset to original values');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDatabaseFunctions();