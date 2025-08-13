CREATE OR REPLACE FUNCTION sniperok.award_snaps(
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
    v_previous_period_balance integer;
    v_current_period_journal_sum integer;
    v_new_total_quantity integer;
BEGIN
    -- Get current period (YYYYMM) from DB server clock
    SELECT TO_CHAR(NOW(), 'YYYYMM')::INT INTO v_current_period;

    -- Insert into user_boost_journal
    INSERT INTO sniperok.user_boost_journal (
        period,
        transaction_uuid,
        user_uuid,
        boost_type_code,
        quantity,
        reference
    ) VALUES (
        v_current_period,
        v_transaction_uuid,
        p_user_uuid,
        p_boost_type_code,
        p_quantity,
        p_reference
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

CREATE OR REPLACE FUNCTION sniperok.sell_boost(
    p_user_uuid UUID,
    p_boost_type_code VARCHAR,
    p_quantity NUMERIC
)
    returns UUID
    set search_path = ''
AS $$
DECLARE
    K_BOOST_SELL_PRICE CONSTANT INTEGER := 5;    -- 5 snaps per boost sold
    K_BOOST_SNAPS      CONSTANT VARCHAR := 'snaps';
    v_transaction_uuid UUID := gen_random_uuid();
    v_reference VARCHAR := 'Sell boosts - ' || p_boost_type_code || ' : ' || p_quantity || ' /' || TO_CHAR(NOW(), 'YYYYMMDD HH24:MI:SS');
    v_current_period INTEGER;
    v_previous_period INTEGER;
    v_current_period_opening_balance integer;
    v_previous_period_balance integer;
    v_current_period_journal_sum integer;
    v_new_total_quantity integer;
    v_new_total_snaps integer;
BEGIN
    if (p_quantity < 1) then
        raise exception 'Quantity must be greater than zero';
    end if;

    if (p_boost_type_code not in ('bazooka', 'dynamite', 'shotgun')) then
        raise exception 'Invalid boost type for sale : %', p_boost_type_code;
    end if;

    -- Get current period (YYYYMM) from DB server clock
    SELECT TO_CHAR(NOW(), 'YYYYMM')::INT INTO v_current_period;

    -- Lookup the opening balance for the current period
    SELECT ub.quantity
      INTO v_current_period_opening_balance
      FROM sniperok.user_boost_vw ub
     WHERE ub.user_uuid = p_user_uuid
       AND ub.boost_type_code = p_boost_type_code
       AND ub.period = v_current_period;
    
    if (coalesce(v_current_period_opening_balance, 0) < p_quantity) then
        raise exception 'Insufficient quantity of boost % for user %', p_boost_type_code, p_user_uuid;
    end if;

    -- Insert debit boost into user_boost_journal
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
        p_quantity * -1,
        v_current_period,
        v_reference,
        v_transaction_uuid
    );

    -- Insert credit snaps into user_boost_journal
    INSERT INTO sniperok.user_boost_journal (
        user_uuid,
        boost_type_code,
        quantity,
        period,
        reference,
        transaction_uuid
    ) VALUES (
        p_user_uuid,
        K_BOOST_SNAPS,
        p_quantity * K_BOOST_SELL_PRICE,
        v_current_period,
        v_reference,
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

    if (v_new_total_quantity < 0) then
        raise exception 'Insufficient quantity of boost % for user %', p_boost_type_code, p_user_uuid;
    end if;

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
    
    -- Calculate the new total snaps for the current period using UNION
    SELECT COALESCE(SUM(quantity), 0)
    INTO v_new_total_snaps
    FROM (
        -- Previous period's balance
        SELECT ub.quantity
        FROM sniperok.user_boost ub
        WHERE ub.user_uuid = p_user_uuid
          AND ub.boost_type_code = K_BOOST_SNAPS
          AND ub.period = v_previous_period
        UNION ALL
        -- Current period's journal entries
        SELECT ubj.quantity
        FROM sniperok.user_boost_journal ubj
        WHERE ubj.user_uuid = p_user_uuid
          AND ubj.boost_type_code = K_BOOST_SNAPS
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
        K_BOOST_SNAPS,
        v_current_period,
        v_new_total_snaps
    )
    ON CONFLICT (user_uuid, boost_type_code, period) DO UPDATE SET
        quantity = EXCLUDED.quantity; -- Update with the newly calculated total

    return v_transaction_uuid; -- Return the transaction UUID
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sniperok.buy_boost(
    p_user_uuid UUID,
    p_boost_type_code VARCHAR,
    p_quantity NUMERIC
)
    returns UUID
    set search_path = ''
AS $$
DECLARE
    K_BOOST_BUY_PRICE CONSTANT INTEGER := 10;    -- 10 snaps per boost bought
    K_BOOST_SNAPS     CONSTANT VARCHAR := 'snaps';
    v_transaction_uuid UUID := gen_random_uuid();
    v_reference VARCHAR := 'Buy boosts - ' || p_boost_type_code || ' : ' || p_quantity || ' /' || TO_CHAR(NOW(), 'YYYYMMDD HH24:MI:SS');
    v_current_period INTEGER;
    v_previous_period INTEGER;
    v_current_period_opening_balance integer;
    v_previous_period_balance integer;
    v_current_period_journal_sum integer;
    v_new_total_quantity integer;
    v_new_total_snaps integer;
BEGIN
    if (p_quantity < 1) then
        raise exception 'Quantity must be greater than zero';
    end if;

    if (p_boost_type_code not in ('bazooka', 'dynamite', 'shotgun')) then
        raise exception 'Invalid boost type for purchase : %', p_boost_type_code;
    end if;

    -- Get current period (YYYYMM) from DB server clock
    SELECT TO_CHAR(NOW(), 'YYYYMM')::INT INTO v_current_period;

    -- Lookup the opening snaps balance for the current period
    SELECT ub.quantity
      INTO v_current_period_opening_balance
      FROM sniperok.user_boost_vw ub
     WHERE ub.user_uuid = p_user_uuid
       AND ub.boost_type_code = K_BOOST_SNAPS
       AND ub.period = v_current_period;
    
    if (coalesce(v_current_period_opening_balance, 0) < (p_quantity * K_BOOST_BUY_PRICE)) then
        raise exception 'Insufficient quantity of % for user %', K_BOOST_SNAPS, p_user_uuid;
    end if;

    -- Insert debit snaps into user_boost_journal
    INSERT INTO sniperok.user_boost_journal (
        user_uuid,
        boost_type_code,
        quantity,
        period,
        reference,
        transaction_uuid
    ) VALUES (
        p_user_uuid,
        K_BOOST_SNAPS,
        p_quantity * K_BOOST_BUY_PRICE * -1,
        v_current_period,
        v_reference,
        v_transaction_uuid
    );

    -- Insert credit snaps into user_boost_journal
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
        v_reference,
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

    if (v_new_total_quantity < 0) then
        -- Practically this should never happen, but just in case
        raise exception 'Insufficient quantity of boost % for user %', p_boost_type_code, p_user_uuid;
    end if;

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
    
    -- Calculate the new total snaps for the current period using UNION
    SELECT COALESCE(SUM(quantity), 0)
    INTO v_new_total_snaps
    FROM (
        -- Previous period's balance
        SELECT ub.quantity
        FROM sniperok.user_boost ub
        WHERE ub.user_uuid = p_user_uuid
          AND ub.boost_type_code = K_BOOST_SNAPS
          AND ub.period = v_previous_period
        UNION ALL
        -- Current period's journal entries
        SELECT ubj.quantity
        FROM sniperok.user_boost_journal ubj
        WHERE ubj.user_uuid = p_user_uuid
          AND ubj.boost_type_code = K_BOOST_SNAPS
          AND ubj.period = v_current_period
    ) AS combined_quantities;

    if (v_new_total_snaps < 0) then
        raise exception 'Insufficient quantity of % for user %', K_BOOST_SNAPS, p_user_uuid;
    end if;

    -- Merge into user_boost
    INSERT INTO sniperok.user_boost (
        user_uuid,
        boost_type_code,
        period,
        quantity
    ) VALUES (
        p_user_uuid,
        K_BOOST_SNAPS,
        v_current_period,
        v_new_total_snaps
    )
    ON CONFLICT (user_uuid, boost_type_code, period) DO UPDATE SET
        quantity = EXCLUDED.quantity; -- Update with the newly calculated total

    return v_transaction_uuid; -- Return the transaction UUID
END;
$$ LANGUAGE plpgsql;