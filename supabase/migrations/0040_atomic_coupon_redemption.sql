-- Atomic coupon redemption function to prevent race conditions
-- Conditionally increments times_redeemed only if under max_redemptions

create or replace function public.increment_coupon_redemption(p_coupon_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  affected integer;
begin
  update public.coupons
  set times_redeemed = times_redeemed + 1
  where id = p_coupon_id
    and (max_redemptions is null or times_redeemed < max_redemptions);

  get diagnostics affected = row_count;
  return affected;
end;
$$;
