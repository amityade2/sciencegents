
import { supabase } from '@/integrations/supabase/client';
import { FormattedScienceGent } from './types';

export const saveScienceGentToSupabase = async (scienceGentData: any, tokenStats: any): Promise<boolean> => {
  try {
    const {
      name,
      symbol,
      totalSupply,
      creator,
      tradingEnabled,
      isMigrated,
      capabilityCount,
      adminLockAmount,
      adminLockRemainingTime,
      adminLockIsUnlocked
    } = scienceGentData;
    
    const {
      tokenPrice,
      marketCap,
      totalLiquidity,
      totalVolume,
      holders,
      transactions
    } = tokenStats;
    
    const { error } = await supabase
      .from('sciencegents')
      .upsert({
        address: scienceGentData.contractAddress || scienceGentData.address,
        name,
        symbol,
        total_supply: totalSupply,
        creator_address: creator, // Updated to match DB schema
        trading_enabled: tradingEnabled,
        is_migrated: isMigrated,
        capability_count: capabilityCount,
        admin_lock_amount: adminLockAmount,
        admin_lock_remaining_time: adminLockRemainingTime,
        admin_lock_is_unlocked: adminLockIsUnlocked,
        token_price: tokenPrice,
        market_cap: marketCap,
        total_liquidity: totalLiquidity,
        total_volume: totalVolume,
        holders: holders,
        transactions: transactions
      }, { onConflict: 'address' });
    
    if (error) {
      console.error("Error saving sciencegent to Supabase:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in saveScienceGentToSupabase:", error);
    return false;
  }
};

export const fetchScienceGentFromSupabase = async (address: string): Promise<FormattedScienceGent | null> => {
  try {
    const { data, error } = await supabase
      .from('sciencegents')
      .select(`
        *,
        capabilities:sciencegent_capabilities(
          id,
          capability_id,
          capability_name,
          capability_fee,
          capability_creator
        )
      `)
      .eq('address', address)
      .single();

    if (error) {
      console.error("Error fetching sciencegent from Supabase:", error);
      return null;
    }

    // Transform to formatted ScienceGent with correct property names
    const formattedScienceGent: FormattedScienceGent = {
      address: data.address,
      name: data.name,
      symbol: data.symbol,
      totalSupply: data.total_supply,
      creator: data.creator_address, // Mapping from creator_address
      tradingEnabled: data.trading_enabled,
      isMigrated: data.is_migrated,
      maturityProgress: data.maturity_progress,
      virtualEth: data.virtual_eth,
      collectedFees: data.collected_fees,
      tokenPrice: data.token_price,
      marketCap: data.market_cap,
      liquidity: data.total_liquidity,
      holdersCount: data.holders,
      transactions: data.transactions,
      capabilities: data.capabilities || [],
      created_at: data.created_at,
      description: data.description,
      profilePic: data.profile_pic,
      website: data.website,
      socialLinks: data.socials,
      domain: data.domain,
      agentFee: data.agent_fee,
      remainingMaturityTime: data.remaining_maturity_time,
      migrationEligible: data.migration_eligible,
      uniswapPair: data.uniswap_pair,
      capabilityFees: data.capability_fees
    };

    return formattedScienceGent;
  } catch (error) {
    console.error("Error in fetchScienceGentFromSupabase:", error);
    return null;
  }
};
