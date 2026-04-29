import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://semqrrxvkmykfvlwjpvh.supabase.co";
const supabaseKey = "sb_publishable_XPzxQmg9TPtxeEzhfCPvHw_3-ZO1jCe";

export const supabase = createClient(supabaseUrl, supabaseKey);