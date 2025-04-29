-- Created with `supabase migration new create_buddy_table`

-- ----------------------------------------------------------------------------
--         BOOST_TYPE
-- ----------------------------------------------------------------------------
create table sniperok.boost_type (
    code text not null,
    description text not null,
    CONSTRAINT boost_type_pk
        PRIMARY KEY (code)
);

-- ----------------------------------------------------------------------------
--          USER_BOOST
-- ----------------------------------------------------------------------------
create table sniperok.user_boost (
    period smallint not null,
    user_uuid uuid not null,
    boost_type_code text not null,
    quantity decimal(20, 8) not null default 0,
    CONSTRAINT user_boost_pk
        PRIMARY KEY (period, user_uuid, boost_type_code),
    CONSTRAINT user_boost_user_fk
        FOREIGN KEY (user_uuid) REFERENCES auth.users(id),
    CONSTRAINT user_boost_boost_type_fk
        FOREIGN KEY (boost_type_code) REFERENCES sniperok.boost_type(code)
);

-- ----------------------------------------------------------------------------
--          USER_BOOST_JOURNAL
-- ----------------------------------------------------------------------------
create table sniperok.user_boost_journal (
    period smallint not null,
    user_uuid uuid not null,
    boost_type_code text not null,
    transaction_uuid uuid not null,
    quantity decimal(20, 8) not null default 0,
    journal_timestamp timestamp with time zone not null default now(),
    CONSTRAINT user_boost_journal_pk
        PRIMARY KEY (period, user_uuid, boost_type_code, journal_timestamp),
    CONSTRAINT user_boost_journal_user_fk
        FOREIGN KEY (user_uuid) REFERENCES auth.users(id),
    CONSTRAINT user_boost_journal_boost_type_fk
        FOREIGN KEY (boost_type_code) REFERENCES sniperok.boost_type(code)
);