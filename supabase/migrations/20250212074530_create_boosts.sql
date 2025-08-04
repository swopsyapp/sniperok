-- Created with `supabase migration new create_buddy_table`

-- ----------------------------------------------------------------------------
--         BOOST_TYPE
-- ----------------------------------------------------------------------------
create table sniperok.boost_type (
    code text not null,
    icon text not null,
    description text not null,
    CONSTRAINT boost_type_pk
        PRIMARY KEY (code)
);

-- ----------------------------------------------------------------------------
--          USER_BOOST
-- ----------------------------------------------------------------------------
create table sniperok.user_boost (
    period integer not null,
    user_uuid uuid not null,
    boost_type_code text not null,
    quantity bigint not null default 0,
    CONSTRAINT user_boost_pk
        PRIMARY KEY (period, user_uuid, boost_type_code),
    CONSTRAINT user_boost_user_fk
        FOREIGN KEY (user_uuid) REFERENCES auth.users(id),
    CONSTRAINT user_boost_boost_type_fk
        FOREIGN KEY (boost_type_code) REFERENCES sniperok.boost_type(code)
);

create view sniperok.user_boost_vw as 
    select
        TO_CHAR(NOW(), 'YYYYMM')::INT as period,
        u.id as user_uuid,
        bt.code as boost_type_code,
        bt.icon,
        bt.description,
        coalesce(ub.quantity, 0) as quantity
    from sniperok.boost_type bt
    cross join sniperok.user u
    left join sniperok.user_boost ub
      on ub.boost_type_code = bt.code
     and ub.period = TO_CHAR(NOW(), 'YYYYMM')::INT
     and ub.user_uuid = u.id;

-- ----------------------------------------------------------------------------
--          USER_BOOST_JOURNAL
-- ----------------------------------------------------------------------------
create table sniperok.user_boost_journal (
    period integer not null,
    user_uuid uuid not null,
    boost_type_code text not null,
    transaction_uuid uuid not null,
    quantity bigint not null default 0,
    journal_timestamp timestamp with time zone not null default now(),
    reference text not null,
    CONSTRAINT user_boost_journal_pk
        PRIMARY KEY (period, user_uuid, boost_type_code, journal_timestamp),
    CONSTRAINT user_boost_journal_user_fk
        FOREIGN KEY (user_uuid) REFERENCES auth.users(id),
    CONSTRAINT user_boost_journal_boost_type_fk
        FOREIGN KEY (boost_type_code) REFERENCES sniperok.boost_type(code)
);