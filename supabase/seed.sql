insert into junowot.league(name, owner)
values ('public', uuid_generate_v4());

insert into junowot.league_member_status(code)
values ('pending'), ('active'), ('banned');