/**
 * Should not use import, because the file used as type helper
 * in an extension code editor
 */

export interface ViewerChannelRelationshipSubscription {
  isGift: boolean;
  purchasedWithPrime: boolean;
  tier: string;
}

export interface ViewerChannelRelationship {
  followedAt: Date | null;
  totalSubscribedMonths: number;
  subscriptionDaysRemaining: number;
  subscription: ViewerChannelRelationshipSubscription | null;
}
