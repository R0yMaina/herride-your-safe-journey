import { env } from "@/config/env";
import { MockChatService, type IChatService } from "./chat.service";
import { SupabaseChatService } from "./supabase-chat.service";

export const chatService: IChatService = env.useMocks
  ? new MockChatService()
  : new SupabaseChatService();

export { QUICK_REPLIES, type IChatService, type RideMessage } from "./chat.service";
