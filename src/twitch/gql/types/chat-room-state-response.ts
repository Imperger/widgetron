interface PartialVerificationConfig {
  minimumAccountAgeInMinutes: number;
  minimumFollowerAgeInMinutes: number;
  shouldRestrictBasedOnAccountAge: boolean;
  shouldRestrictFirstTimeChatters: boolean;
  shouldRestrictBasedOnFollowerAge: boolean;
  __typename: 'ChatPartialVerificationConfig';
}

interface AccountVerificationOptions {
  emailVerificationMode: 'NONE' | string;
  partialEmailVerificationConfig: PartialVerificationConfig;
  phoneVerificationMode: 'NONE' | string;
  partialPhoneVerificationConfig: PartialVerificationConfig;
  isSubscriberExempt: boolean;
  isVIPExempt: boolean;
  isModeratorExempt: boolean;
  __typename: 'ChatAccountVerificationOptions';
}

interface ChatSettings {
  isEmoteOnlyModeEnabled: boolean;
  followersOnlyDurationMinutes: number | null;
  slowModeDurationSeconds: number | null;
  accountVerificationOptions: AccountVerificationOptions;
  __typename: 'ChatSettings';
}

interface SubscriptionProduct {
  id: string;
  hasSubOnlyChat: boolean;
  __typename: 'SubscriptionProduct';
}

interface Channel {
  id: string;
  chatSettings: ChatSettings;
  subscriptionProducts: SubscriptionProduct[];
  __typename: 'User';
}

export interface ChatRoomStateResponse {
  channel: Channel;
}
