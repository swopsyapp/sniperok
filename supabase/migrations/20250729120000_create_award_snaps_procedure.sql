CREATE OR REPLACE FUNCTION sniperok.award_snaps_boost_transaction(
    p_user_uuid UUID,
    p_boost_type_code VARCHAR,
    p_quantity NUMERIC,
    p_reference VARCHAR
)
    returns UUID
    set search_path = ''
AS $$
DECLARE
    v_transaction_uuid UUID := gen_random_uuid();
    v_current_period INTEGER;
    v_previous_period INTEGER;
    v_previous_period_balance bigint;
    v_current_period_journal_sum bigint;
    v_new_total_quantity bigint;
BEGIN
    -- Get current period (YYYYMM) from DB server clock
    SELECT TO_CHAR(NOW(), 'YYYYMM')::INT INTO v_current_period;

    -- Insert into user_boost_journal
    INSERT INTO sniperok.user_boost_journal (
        user_uuid,
        boost_type_code,
        quantity,
        period,
        reference,
        transaction_uuid
    ) VALUES (
        p_user_uuid,
        p_boost_type_code,
        p_quantity,
        v_current_period,
        p_reference,
        v_transaction_uuid
    );

    -- Calculate previous period (YYYYMM)
    SELECT TO_CHAR((NOW() - INTERVAL '1 month'), 'YYYYMM')::INT INTO v_previous_period;

    -- Calculate the new total quantity for the current period using UNION
    SELECT COALESCE(SUM(quantity), 0)
    INTO v_new_total_quantity
    FROM (
        -- Previous period's balance
        SELECT ub.quantity
        FROM sniperok.user_boost ub
        WHERE ub.user_uuid = p_user_uuid
          AND ub.boost_type_code = p_boost_type_code
          AND ub.period = v_previous_period
        UNION ALL
        -- Current period's journal entries
        SELECT ubj.quantity
        FROM sniperok.user_boost_journal ubj
        WHERE ubj.user_uuid = p_user_uuid
          AND ubj.boost_type_code = p_boost_type_code
          AND ubj.period = v_current_period
    ) AS combined_quantities;

    -- Merge into user_boost
    INSERT INTO sniperok.user_boost (
        user_uuid,
        boost_type_code,
        period,
        quantity
    ) VALUES (
        p_user_uuid,
        p_boost_type_code,
        v_current_period,
        v_new_total_quantity
    )
    ON CONFLICT (user_uuid, boost_type_code, period) DO UPDATE SET
        quantity = EXCLUDED.quantity; -- Update with the newly calculated total
    
    return v_transaction_uuid; -- Return the transaction UUID
END;
$$ LANGUAGE plpgsql;