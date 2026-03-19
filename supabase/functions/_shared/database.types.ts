export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Functions: {
      cash_out_raid_action: {
        Args: {
          p_cooldown_ms?: number;
          p_raid_id: string;
          p_user_id: string;
        };
        Returns: {
          credited_coins: number;
          credited_shards: number;
          ended_at: string;
          raid_id: string;
          raid_status: "cashed_out";
        }[];
      };
      claim_ad_reward_action: {
        Args: {
          p_cooldown_minutes?: number;
          p_key_reward?: number;
          p_user_id: string;
        };
        Returns: {
          next_claim_at: string;
          reward_label: string;
          reward_type: "keys";
          reward_value: number;
          user_id: string;
        }[];
      };
      claim_daily_reward_action: {
        Args: {
          p_cooldown_hours?: number;
          p_user_id: string;
        };
        Returns: {
          day_index: number;
          next_claim_at: string;
          reward_label: string;
          reward_type: "coins" | "keys" | "shards";
          reward_value: number;
          user_id: string;
        }[];
      };
      apply_referral_bonus_on_signup: {
        Args: {
          p_invitee_user_id: string;
          p_inviter_code: string;
        };
        Returns: {
          applied: boolean;
          inviter_user_id: string | null;
        }[];
      };
      reveal_raid_cell_action: {
        Args: {
          p_cell_index: number;
          p_cooldown_ms?: number;
          p_raid_id: string;
          p_user_id: string;
        };
        Returns: {
          credited_coins: number;
          credited_shards: number;
          ended_at: string | null;
          hit_bomb: boolean;
          multiplier_factor: number;
          opened_cells_count: number;
          raid_id: string;
          raid_status: "active" | "lost" | "won";
          reward_label: string;
          reward_type: "coins" | "shards";
          reward_value: number;
          temporary_coins: number;
          temporary_shards: number;
        }[];
      };
      start_raid_session: {
        Args: {
          p_cells: Json;
          p_user_id: string;
        };
        Returns: {
          consumed_keys: number;
          raid_id: string;
          user_id: string;
        }[];
      };
    };
    Tables: {
      daily_claims: {
        Row: {
          claimed_at: string;
          id: string;
          reward_type: "coins" | "keys" | "shards";
          reward_value: number;
          user_id: string;
        };
        Insert: {
          claimed_at?: string;
          id?: string;
          reward_type: "coins" | "keys" | "shards";
          reward_value: number;
          user_id: string;
        };
      };
      economy_logs: {
        Row: {
          amount: number;
          created_at: string;
          currency: "coins" | "keys" | "shards";
          id: string;
          meta: Json;
          type: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency: "coins" | "keys" | "shards";
          id?: string;
          meta?: Json;
          type: string;
          user_id: string;
        };
      };
      raid_cells: {
        Row: {
          cell_index: number;
          cell_type: "coin" | "multiplier" | "bomb" | "shard";
          id: string;
          raid_id: string;
          revealed: boolean;
          value: number;
        };
        Insert: {
          cell_index: number;
          cell_type: "coin" | "multiplier" | "bomb" | "shard";
          id?: string;
          raid_id: string;
          revealed?: boolean;
          value: number;
        };
      };
      raids: {
        Row: {
          ended_at: string | null;
          id: string;
          last_action_at: string | null;
          multiplier_factor: number;
          opened_cells_count: number;
          started_at: string;
          status: "active" | "lost" | "cashed_out" | "won";
          temporary_coins: number;
          temporary_shards: number;
          user_id: string;
        };
        Insert: {
          ended_at?: string | null;
          id?: string;
          last_action_at?: string | null;
          multiplier_factor?: number;
          opened_cells_count?: number;
          started_at?: string;
          status?: "active" | "lost" | "cashed_out" | "won";
          temporary_coins?: number;
          temporary_shards?: number;
          user_id: string;
        };
      };
      referrals: {
        Row: {
          created_at: string;
          id: string;
          invited_user_id: string;
          inviter_user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          invited_user_id: string;
          inviter_user_id: string;
        };
      };
      users: {
        Row: {
          active_days: number;
          avatar_url: string | null;
          coins: number;
          created_at: string;
          first_name: string | null;
          id: string;
          keys: number;
          last_ad_reward_at: string | null;
          last_daily_claim_at: string | null;
          referral_code: string;
          referred_by: string | null;
          shards: number;
          telegram_id: string;
          total_coins_earned: number;
          total_raids: number;
          total_shards_earned: number;
          updated_at: string;
          username: string | null;
          vault_level: number;
        };
        Insert: {
          active_days?: number;
          avatar_url?: string | null;
          coins?: number;
          created_at?: string;
          first_name?: string | null;
          id?: string;
          keys?: number;
          last_ad_reward_at?: string | null;
          last_daily_claim_at?: string | null;
          referral_code: string;
          referred_by?: string | null;
          shards?: number;
          telegram_id: string;
          total_coins_earned?: number;
          total_raids?: number;
          total_shards_earned?: number;
          updated_at?: string;
          username?: string | null;
          vault_level?: number;
        };
      };
    };
  };
}
