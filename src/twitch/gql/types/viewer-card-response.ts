interface RequestInfo {
  countryCode: string;
  __typename: 'RequestInfo';
}

interface ChannelModerationSettings {
  canAccessViewerCardModLogs: boolean;
  __typename: 'ChannelModerationSettings';
}

interface UserRoles {
  isSiteAdmin: null;
  isStaff: null;
  isGlobalMod: null;
  __typename: 'UserRoles';
}

interface SubscriptionGift {
  isGift: boolean;
  __typename: 'SubscriptionGift';
}

interface SubscriptionTenure {
  daysRemaining: number;
  months: number;
  __typename: 'SubscriptionTenure';
}

interface EmoteModifier {
  code: string;
  name: string;
  __typename: 'EmoteModifier';
}

interface Emote {
  id: string;
  setID: string;
  token: string;
  assetType: string;
  __typename: 'Emote';
}

interface SubscriptionInterval {
  unit: string;
  __typename: 'SubscriptionInterval';
}

interface EligibilityFilter {
  value: string;
  __typename: 'EligibilityFilter';
}

interface PromotionDisplay {
  discountPercent: number;
  discountType: string;
  __typename: 'PromotionDisplay';
}

interface DiscountBreakdown {
  price: number;
  total: number;
  __typename: 'DiscountBreakdown';
}

interface ChargeModelPlanInterval {
  duration: number;
  unit: string;
  __typename: 'ChargeModelPlanInterval';
}

interface Range {
  min: number;
  max: number;
  __typename: 'Range';
}

interface OfferTagBinding {
  key: string;
  value: string;
  __typename: 'OfferTagBinding';
}

interface OfferEligibility {
  benefitsStartAt: string | null;
  isEligible: boolean;
  __typename: 'OfferEligibility';
}

interface ChargeModelPlan {
  interval: ChargeModelPlanInterval;
  renewalPolicy: string;
  __typename: 'ChargeModelPlan';
}

interface PriceInfo {
  id: string;
  currency: string;
  exponent: number;
  price: number;
  total: number;
  discount: DiscountBreakdown | null;
  __typename: 'PriceInfo';
}

interface InternalChargeModel {
  previewPrice: PriceInfo;
  plan: ChargeModelPlan;
  __typename: 'InternalChargeModel';
}

interface ChargeModel {
  internal: InternalChargeModel | null;
  __typename: 'ChargeModel';
}

interface OfferListing {
  chargeModel: ChargeModel;
  __typename: 'OfferListing';
}

interface OfferPromotion {
  id: string;
  name: string;
  promoDisplay: PromotionDisplay;
  eligibilityFilters: EligibilityFilter[] | null;
  priority: number;
  promoType: string;
  endAt: string | null;
  __typename: 'OfferPromotion';
}

interface Offer {
  id: string;
  tplr: string;
  platform: string;
  eligibility: OfferEligibility;
  tagBindings: OfferTagBinding[];
  giftType: string | null;
  listing: OfferListing;
  promotion: OfferPromotion | null;
  quantity: Range;
  __typename: 'Offer';
}

interface SubscriptionProductSelfConnection {
  canGiftInChannel: boolean;
  __typename: 'SubscriptionProductSelfConnection';
}

interface SubscriptionStandardGifting {
  offer: Offer | null;
  __typename: 'SubscriptionStandardGifting';
}

interface SubscriptionCommunityGifting {
  offer: Offer | null;
  __typename: 'SubscriptionCommunityGifting';
}

interface SubscriptionGifting {
  standard: SubscriptionStandardGifting[];
  community: SubscriptionCommunityGifting[];
  __typename: 'SubscriptionGifting';
}

interface UserSelfConnection {
  banStatus: null;
  isModerator: boolean;
  __typename: 'UserSelfConnection';
}

interface Badge {
  id: string;
  setID: string;
  version: string;
  title: string;
  image1x: string;
  image2x: string;
  image4x: string;
  clickAction: string;
  clickURL: string | null;
  __typename: 'Badge';
  description: string;
}

interface SubscriptionBenefit {
  id: string;
  tier: string;
  purchasedWithPrime: boolean;
  gift: SubscriptionGift;
  __typename: 'SubscriptionBenefit';
}

interface UserRelationship {
  cumulativeTenure: SubscriptionTenure;
  followedAt: string;
  subscriptionBenefit: SubscriptionBenefit;
  __typename: 'UserRelationship';
}

interface SubscriptionProduct {
  id: string;
  price: string;
  url: string;
  emoteSetID: string;
  displayName: string;
  name: string;
  tier: string;
  type: string;
  hasAdFree: boolean;
  emotes: Emote[];
  emoteModifiers: EmoteModifier[];
  interval: SubscriptionInterval;
  self: SubscriptionProductSelfConnection;
  offers: Offer[];
  gifting: SubscriptionGifting;
  __typename: 'SubscriptionProduct';
}

interface User {
  id: string;
  __typename: 'User';
}

interface ChannelViewer {
  id: string;
  earnedBadges: Badge[];
  __typename: 'ChannelViewer';
}

interface Channel {
  id: string;
  moderationSettings: ChannelModerationSettings;
  __typename: 'Channel';
}

interface CurrentUser extends User {
  login: string;
  roles: UserRoles;
  blockedUsers: User[];
}

interface TargetUser extends User {
  login: string;
  bannerImageURL: string;
  displayName: string;
  displayBadges: Badge[];
  profileImageURL: string;
  createdAt: string;
  relationship: UserRelationship;
}

interface ChannelUser extends User {
  login: string;
  displayName: string;
  subscriptionProducts: SubscriptionProduct[];
  self: UserSelfConnection;
}

export interface ViewerCardResponse {
  activeTargetUser: User;
  targetUser: TargetUser;
  channelUser: ChannelUser;
  currentUser: CurrentUser;
  channelViewer: ChannelViewer;
  channel: Channel;
  requestInfo: RequestInfo;
}
