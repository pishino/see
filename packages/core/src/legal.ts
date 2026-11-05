/*
 * Terms and Privacy, in plain words (V3Behaviour: reading them). Platform-free, so the native apps show the same text.
 * Every line restates a promise the product already makes on screen; legal review comes before launch.
 */
export interface LegalDoc {
  title: string;
  updated: string;
  intro: string;
  sections: { id: string; h: string; p: string[] }[];
}

export const TERMS: LegalDoc = {
  title: 'Terms',
  updated: '1 November 2026',
  intro: 'See is for ranking what you love: songs, films, shows, artists, teams, anything. These are the rules for using it, written to be read.',
  sections: [
    {
      id: 'account',
      h: 'Your account',
      p: [
        'You need an account to make lists. Keep your login to yourself; what happens on your account is yours.',
        'You can change your name, handle and picture in Settings, and delete your account there at any time. Your lists, polls, votes and picture go; lists you share stay with the people on them.',
      ],
    },
    {
      id: 'lists',
      h: 'What you make',
      p: [
        'Your lists, polls and ranks are yours. You let See show them to the people you choose, and nowhere else.',
        'See never posts anything for you, anywhere. Sharing is always something you press.',
      ],
    },
    {
      id: 'sources',
      h: 'Where things play from',
      p: [
        'See never hosts music, films or video. Everything plays from its source, under that source’s own terms.',
        'When something is removed at its source, it stays on your list with a note, and you choose what happens to it.',
      ],
    },
    {
      id: 'people',
      h: 'Other people',
      p: [
        'Be decent. No hate, harassment, threats, impersonation, spam or anything that puts someone at risk.',
        'You can report a person, a list or a poll in one tap, and block anyone. They are never told who reported them.',
        'We may hide what breaks these rules, and close accounts that keep breaking them.',
      ],
    },
    {
      id: 'changes',
      h: 'When these change',
      p: ['We tell you in the app before a change takes effect, and it waits in Settings until you have read it.'],
    },
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
      p: ['Ads pay for one See for everyone. You choose in Settings › Ads whether they use what you rank; off, they follow the page you are on, not you.'],
    },
    {
      id: 'yours',
      h: 'Yours to delete',
      p: ['Delete your account from Settings › Account. Your lists, polls, votes and picture go with it.'],
    },
  ],
};
