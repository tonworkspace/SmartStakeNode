import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Stake {
  id: number;
  user_id: number;
  amount: number;
  daily_rate: number;
  total_earned: number;
  is_active: boolean;
  last_payout: string;
  cycle_progress: number;
  created_at: string;
}

interface User {
  id: number;
  rank: string;
  speed_boost_active: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🚀 Starting daily rewards processing...')

    // Get all active stakes that haven't been paid in the last 24 hours
    const { data: stakes, error: stakesError } = await supabase
      .from('stakes')
      .select(`
        *,
        users!inner(id, rank, speed_boost_active)
      `)
      .eq('is_active', true)
      .lt('last_payout', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (stakesError) {
      throw new Error(`Failed to fetch stakes: ${stakesError.message}`)
    }

    if (!stakes || stakes.length === 0) {
      console.log('✅ No stakes eligible for payout')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No stakes eligible for payout',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📊 Processing ${stakes.length} eligible stakes...`)

    let totalProcessed = 0
    let totalEarnings = 0
    const errors: string[] = []

    // Process each stake
    for (const stake of stakes) {
      try {
        const user = stake.users as User
        const now = new Date()
        const lastPayout = new Date(stake.last_payout)
        const hoursSinceLastPayout = (now.getTime() - lastPayout.getTime()) / (1000 * 60 * 60)

        // Calculate daily ROI based on stake amount
        let baseDailyROI = 0.01 // 1% base daily ROI
        
        if (stake.amount >= 1000) baseDailyROI = 0.03 // 3% daily for 1000+ TON
        else if (stake.amount >= 500) baseDailyROI = 0.025 // 2.5% daily for 500+ TON
        else if (stake.amount >= 100) baseDailyROI = 0.02 // 2% daily for 100+ TON
        else if (stake.amount >= 50) baseDailyROI = 0.015 // 1.5% daily for 50+ TON

        // Duration bonus
        const createdDate = new Date(stake.created_at)
        const daysSinceStart = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
        const durationBonus = Math.min(daysSinceStart * 0.0001, 0.005)
        
        let dailyROI = baseDailyROI + durationBonus

        // Apply rank bonus
        let rankBonus = 0
        switch (user.rank) {
          case 'GUARDIAN': rankBonus = 0.1; break
          case 'SOVEREIGN': rankBonus = 0.15; break
          case 'CELESTIAL': rankBonus = 0.2; break
          default: rankBonus = 0
        }
        dailyROI *= (1 + rankBonus)

        // Calculate daily earning
        let dailyEarning = stake.amount * dailyROI
        
        // Apply speed boost if active
        if (user.speed_boost_active) {
          dailyEarning *= 1.5
        }

        // Cap the daily earning to maximum 3% of stake amount
        const maxDailyEarning = Math.min(stake.amount * 0.03, 1000) // Max 1000 TON per day
        const cappedEarning = Math.min(dailyEarning, maxDailyEarning)

        // Calculate how many days worth of rewards to give (for offline users)
        const daysSinceLastPayout = Math.floor(hoursSinceLastPayout / 24)
        const totalEarning = cappedEarning * Math.min(daysSinceLastPayout, 7) // Max 7 days of offline rewards

        if (totalEarning <= 0) continue

        // Update stake
        const newTotalEarned = stake.total_earned + totalEarning
        const cycleProgress = Math.min((newTotalEarned / stake.amount) * 100, 300)

        const { error: updateError } = await supabase
          .from('stakes')
          .update({
            total_earned: newTotalEarned,
            last_payout: now.toISOString(),
            daily_rate: dailyROI,
            cycle_progress: cycleProgress
          })
          .eq('id', stake.id)

        if (updateError) {
          errors.push(`Stake ${stake.id}: ${updateError.message}`)
          continue
        }

        // Update user's available earnings
        const { error: earningsError } = await supabase.rpc('increment_available_earnings', {
          user_id: stake.user_id,
          amount: totalEarning
        })

        if (earningsError) {
          // Fallback to direct update
          const { data: currentUser } = await supabase
            .from('users')
            .select('available_earnings, total_earned')
            .eq('id', stake.user_id)
            .single()

          if (currentUser) {
            await supabase
              .from('users')
              .update({
                available_earnings: (currentUser.available_earnings || 0) + totalEarning,
                total_earned: (currentUser.total_earned || 0) + totalEarning
              })
              .eq('id', stake.user_id)
          }
        }

        // Record earning history
        await supabase.from('earning_history').insert({
          stake_id: stake.id,
          user_id: stake.user_id,
          amount: totalEarning,
          type: 'daily_roi_cron',
          roi_rate: dailyROI * 100,
          base_rate: baseDailyROI * 100,
          rank_bonus: rankBonus,
          duration_multiplier: 1 + durationBonus,
          days_processed: daysSinceLastPayout,
          created_at: now.toISOString()
        })

        totalProcessed++
        totalEarnings += totalEarning

        console.log(`✅ Processed stake ${stake.id}: ${totalEarning.toFixed(6)} TON (${daysSinceLastPayout} days)`)

      } catch (error) {
        errors.push(`Stake ${stake.id}: ${error.message}`)
        console.error(`❌ Error processing stake ${stake.id}:`, error)
      }
    }

    // Handle cycle completions
    const { data: completedStakes } = await supabase
      .from('stakes')
      .select('*')
      .eq('is_active', true)
      .gte('cycle_progress', 300)

    if (completedStakes && completedStakes.length > 0) {
      for (const stake of completedStakes) {
        await supabase
          .from('stakes')
          .update({ 
            is_active: false, 
            cycle_completed: true,
            cycle_completed_at: new Date().toISOString()
          })
          .eq('id', stake.id)

        // Process cycle completion rewards
        const reinvestAmount = stake.amount * 0.2
        await supabase.rpc('increment_reinvestment_balance', {
          user_id: stake.user_id,
          amount: reinvestAmount
        })

        console.log(`🎯 Completed cycle for stake ${stake.id}`)
      }
    }

    const result = {
      success: true,
      message: `Processed ${totalProcessed} stakes`,
      totalProcessed,
      totalEarnings: totalEarnings.toFixed(6),
      cyclesCompleted: completedStakes?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    }

    console.log('🎉 Daily rewards processing completed:', result)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Fatal error in daily rewards processing:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})