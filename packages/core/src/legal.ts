/*
 * Terms and Privacy, in plain words (V3Behaviour: reading them). Platform-free, so the native apps show the same text.
 * Every line restates a promise the product already makes on screen; legal review comes before launch.
 */
export interface LegalDoc {
  title: string;
  updated: string;
  intro: string;
  /** the short version, before the full text */
  short?: string[];
  sections: { id: string; h: string; p: string[] }[];
}

export const TERMS: LegalDoc = {
  title: 'Terms',
  updated: '1 October 2026',
  intro: 'See is a place to rank anything. These terms are between you and See. Draft words, for legal review.',
  short: [
    'Your lists are yours. Export or delete them any time.',
    'Be decent: no hate, no harassment, nothing illegal.',
    'Ads pay for See. You choose whether they follow you.',
    'We keep only what we need to run See, and we say what that is.',
    'If these terms change, we tell you before they apply.',
  ],
  sections: [
    { id: 'who', h: 'Who we are', p: ['See is a place to rank anything. These terms are between you and See.'] },
    { id: 'account', h: 'Your account', p: ['You sign in with a code sent to your email or with Apple or Google. Keep that inbox safe.'] },
    { id: 'lists', h: 'Your lists', p: ['What you make is yours. You let See show it to the people you share it with.'] },
    { id: 'rules', h: 'Rules for everyone', p: ['No hate, harassment, spam or anything illegal. We can remove things that break these rules.'] },
    { id: 'ads', h: 'Ads', p: ['Ads pay for See. Personal ads are off until you turn them on.'] },
    { id: 'leaving', h: 'Leaving', p: ['Delete your account in Settings. You have 14 days to change your mind.'] },
    { id: 'changes', h: 'Changes', p: ['We tell you before new terms apply, in the app and by email.'] },
    { id: 'contact', h: 'Contact', p: ['Write to us from Help. A person reads it.'] },
  ],
};

export const PRIVACY: LegalDoc = {
  title: 'Privacy',
  updated: '1 November 2026',
  intro: 'See keeps what you rank and who you rank it with. Here is what that means, and everything you can do about it.',
  sections: [
    {
      id: 'what',
      h: 'What See keeps',
      p: [
        'Your account (name, handle, email or phone, picture), your lists, polls and ranks, the people you share them with, and your settings.',
        'A page shows what you made: lists and polls. Never your raw listening history, and never how you voted.',
      ],
    },
    {
      id: 'connections',
      h: 'What you connect',
      p: [
        'When you connect Spotify, Apple Music, YouTube, Netflix, Letterboxd or others, See only reads them, to suggest what to rank. It never posts to them.',
        'Disconnect any of them in Settings › Connected services and See stops reading at once.',
      ],
    },
    {
      id: 'who',
      h: 'Who sees what',
      p: [
        'Each list is as open as you make it: just you, the people on it, or anyone with the link.',
        'When you block someone they can’t find you or see your lists, and you leave any list you shared with them.',
      ],
    },
    {
      id: 'cookies',
      h: 'Cookies',
      p: [
        'Only what See needs to work, unless you allow more. Folding the cookie card is not a yes: nothing extra is set until you choose.',
        'Change your choice any time from Cookies at the foot of the page.',
      ],
    },
    {
      id: 'ads',
      h: 'Ads',
      p: ['Ads pay for one See for everyone. Personal ads are off until you turn them on in Settings › Ads; off, ads follow the page you are on, not you.'],
    },
    {
      id: 'yours',
      h: 'Yours to delete',
      p: ['Delete your account from Settings › Account. Your lists, polls, votes and picture go with it.'],
    },
  ],
};
