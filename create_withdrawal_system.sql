-- Create Withdrawal System Database Schema
-- This migration creates the withdrawal requests table and related functions

-- Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(20, 6) NOT NULL CHECK (amount > 0),
    withdrawal_address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by INTEGER REFERENCES users(id),
    tx_hash TEXT,
    rejection_reason TEXT,
    network_fee NUMERIC(20, 6) DEFAULT 0.1,
    
    -- Indexes for performance
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    CONSTRAINT valid_amount CHECK (amount >= 1.0), -- Minimum 1 TON
    CONSTRAINT valid_address CHECK (LENGTH(withdrawal_address) > 10)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON withdrawal_requests(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own withdrawal requests
CREATE POLICY "Users can view own withdrawal requests" ON withdrawal_requests
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can only insert their own withdrawal requests
CREATE POLICY "Users can create own withdrawal requests" ON withdrawal_requests
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Only admins can update withdrawal requests (for processing)
CREATE POLICY "Admins can update withdrawal requests" ON withdrawal_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND (is_admin = true OR role = 'admin')
        )
    );

-- Function to create a withdrawal request
CREATE OR REPLACE FUNCTION create_withdrawal_request(
    p_user_id INTEGER,
    p_amount NUMERIC,
    p_withdrawal_address TEXT
)
RETURNS UUID AS $$
DECLARE
    v_available_balance NUMERIC;
    v_daily_requests INTEGER;
    v_total_with_fee NUMERIC;
    v_request_id UUID;
    v_network_fee NUMERIC := 0.1;
BEGIN
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Validate minimum amount
    IF p_amount < 1.0 THEN
        RAISE EXCEPTION 'Minimum withdrawal amount is 1 TON';
    END IF;
    
    -- Get user's available balance
    SELECT COALESCE(available_earnings, 0) INTO v_available_balance
    FROM users WHERE id = p_user_id;
    
    -- Calculate total amount including fee
    v_total_with_fee := p_amount + v_network_fee;
    
    -- Check if user has sufficient balance
    IF v_available_balance < v_total_with_fee THEN
        RAISE EXCEPTION 'Insufficient balance. Available: % TON, Required: % TON (including % TON fee)', 
            v_available_balance, v_total_with_fee, v_network_fee;
    END IF;
    
    -- Check daily withdrawal limit (3 per day)
    SELECT COUNT(*) INTO v_daily_requests
    FROM withdrawal_requests
    WHERE user_id = p_user_id
    AND created_at >= CURRENT_DATE
    AND status != 'rejected';
    
    IF v_daily_requests >= 3 THEN
        RAISE EXCEPTION 'Daily withdrawal limit exceeded. Maximum 3 requests per day.';
    END IF;
    
    -- Create withdrawal request
    INSERT INTO withdrawal_requests (
        user_id,
        amount,
        withdrawal_address,
        network_fee,
        status
    ) VALUES (
        p_user_id,
        p_amount,
        p_withdrawal_address,
        v_network_fee,
        'pending'
    ) RETURNING id INTO v_request_id;
    
    -- Deduct the amount from user's available earnings
    UPDATE users 
    SET available_earnings = available_earnings - v_total_with_fee
    WHERE id = p_user_id;
    
    -- Record activity
    INSERT INTO activities (
        user_id,
        type,
        amount,
        status,
        created_at,
        metadata
    ) VALUES (
        p_user_id,
        'withdrawal_request',
        p_amount,
        'completed',
        NOW(),
        jsonb_build_object(
            'withdrawal_id', v_request_id,
            'withdrawal_address', p_withdrawal_address,
            'network_fee', v_network_fee,
            'total_deducted', v_total_with_fee
        )
    );
    
    RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process withdrawal request (admin only)
CREATE OR REPLACE FUNCTION process_withdrawal_request(
    p_request_id UUID,
    p_new_status TEXT,
    p_tx_hash TEXT DEFAULT NULL,
    p_rejection_reason TEXT DEFAULT NULL,
    p_processed_by INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_request withdrawal_requests%ROWTYPE;
    v_refund_amount NUMERIC;
BEGIN
    -- Get the withdrawal request
    SELECT * INTO v_request
    FROM withdrawal_requests
    WHERE id = p_request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Withdrawal request not found';
    END IF;
    
    -- Validate status transition
    IF v_request.status = 'completed' THEN
        RAISE EXCEPTION 'Cannot modify completed withdrawal request';
    END IF;
    
    -- Update the request
    UPDATE withdrawal_requests
    SET 
        status = p_new_status,
        processed_at = NOW(),
        processed_by = p_processed_by,
        tx_hash = p_tx_hash,
        rejection_reason = p_rejection_reason
    WHERE id = p_request_id;
    
    -- If rejected, refund the amount to user's available earnings
    IF p_new_status = 'rejected' THEN
        v_refund_amount := v_request.amount + v_request.network_fee;
        
        UPDATE users 
        SET available_earnings = COALESCE(available_earnings, 0) + v_refund_amount
        WHERE id = v_request.user_id;
        
        -- Record refund activity
        INSERT INTO activities (
            user_id,
            type,
            amount,
            status,
            created_at,
            metadata
        ) VALUES (
            v_request.user_id,
            'withdrawal_refund',
            v_refund_amount,
            'completed',
            NOW(),
            jsonb_build_object(
                'withdrawal_id', p_request_id,
                'reason', p_rejection_reason,
                'original_amount', v_request.amount,
                'network_fee', v_request.network_fee
            )
        );
    END IF;
    
    -- Record processing activity
    INSERT INTO activities (
        user_id,
        type,
        amount,
        status,
        created_at,
        metadata
    ) VALUES (
        v_request.user_id,
        'withdrawal_' || p_new_status,
        v_request.amount,
        'completed',
        NOW(),
        jsonb_build_object(
            'withdrawal_id', p_request_id,
            'tx_hash', p_tx_hash,
            'processed_by', p_processed_by,
            'rejection_reason', p_rejection_reason
        )
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's withdrawal statistics
CREATE OR REPLACE FUNCTION get_user_withdrawal_stats(p_user_id INTEGER)
RETURNS TABLE (
    total_requests INTEGER,
    pending_requests INTEGER,
    completed_requests INTEGER,
    total_withdrawn NUMERIC,
    daily_requests_today INTEGER,
    available_balance NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_requests,
        COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_requests,
        COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_requests,
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_withdrawn,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE AND status != 'rejected')::INTEGER as daily_requests_today,
        COALESCE((SELECT available_earnings FROM users WHERE id = p_user_id), 0) as available_balance
    FROM withdrawal_requests
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_withdrawal_request(INTEGER, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION process_withdrawal_request(UUID, TEXT, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_withdrawal_stats(INTEGER) TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT ON withdrawal_requests TO authenticated;
GRANT UPDATE ON withdrawal_requests TO authenticated; -- For admin processing

COMMENT ON TABLE withdrawal_requests IS 'Stores user withdrawal requests for staking rewards';
COMMENT ON FUNCTION create_withdrawal_request IS 'Creates a new withdrawal request and deducts balance';
COMMENT ON FUNCTION process_withdrawal_request IS 'Processes withdrawal request (admin function)';
COMMENT ON FUNCTION get_user_withdrawal_stats IS 'Gets withdrawal statistics for a user';